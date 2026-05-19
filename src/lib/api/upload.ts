import { createServerFn } from "@tanstack/react-start";
import { parseCSV } from "@/lib/csv-parser";

export type UploadInput = {
  csvText: string;
  platform: string;
  weekEnding: string;
};

export type UploadResult = {
  committed: number;
  skipped: number;
  unrecognised: number;
};

export const processUpload = createServerFn({ method: "POST" })
  .inputValidator((input: UploadInput) => input)
  .handler(async ({ data }): Promise<UploadResult> => {
    // D1 is available via the cloudflare:workers virtual module at runtime.
    const { env } = await import("cloudflare:workers");
    const db = env.haleon_insights_db;

    // ── Parse CSV ────────────────────────────────────────────────────────
    const { rows, skipped, errors } = parseCSV(data.csvText);
    if (errors.length > 0) throw new Error(errors[0]);
    if (rows.length === 0) throw new Error("No usable rows found in file");

    // ── Resolve external IDs → internal SKU IDs ──────────────────────────
    const externalIds = [...new Set(rows.map((r) => r.platformExternalId))];
    const placeholders = externalIds.map(() => "?").join(",");
    type IdRow = { sku_id: string; external_id: string; brand_id: string };
    const idResult = (await db
      .prepare(
        `SELECT spi.sku_id, spi.external_id, b.id AS brand_id
         FROM sku_platform_ids spi
         JOIN skus s ON s.id = spi.sku_id
         JOIN brands b ON b.id = s.brand_id
         WHERE spi.platform = ? AND spi.external_id IN (${placeholders})`
      )
      .bind(data.platform, ...externalIds)
      .all()) as D1Result<IdRow>;

    const idMap = new Map<string, { skuId: string; brandId: string }>();
    for (const row of idResult.results) {
      idMap.set(row.external_id, { skuId: row.sku_id, brandId: row.brand_id });
    }

    // ── Build D1 statements ──────────────────────────────────────────────
    const stmts: D1PreparedStatement[] = [];
    let committed = 0;
    let unrecognised = 0;

    for (const row of rows) {
      const mapped = idMap.get(row.platformExternalId);
      if (!mapped) { unrecognised++; continue; }
      const { skuId, brandId } = mapped;

      if (row.units != null && row.gmv != null) {
        stmts.push(
          db.prepare(
            `INSERT INTO offtakes (sku_id, platform, week_ending, units, gmv) VALUES (?,?,?,?,?)
             ON CONFLICT(sku_id, platform, week_ending) DO UPDATE SET units=excluded.units, gmv=excluded.gmv`
          ).bind(skuId, data.platform, data.weekEnding, row.units, row.gmv)
        );
      }
      if (row.price != null) {
        stmts.push(
          db.prepare(
            `INSERT INTO prices (item_id, item_kind, platform, week_ending, price) VALUES (?,'sku',?,?,?)
             ON CONFLICT(item_id, item_kind, platform, week_ending) DO UPDATE SET price=excluded.price`
          ).bind(skuId, data.platform, data.weekEnding, row.price)
        );
      }
      if (row.listingStatus != null) {
        stmts.push(
          db.prepare(
            `INSERT INTO listings (sku_id, platform, week_ending, status) VALUES (?,?,?,?)
             ON CONFLICT(sku_id, platform, week_ending) DO UPDATE SET status=excluded.status`
          ).bind(skuId, data.platform, data.weekEnding, row.listingStatus)
        );
      }
      if (row.keyword != null) {
        stmts.push(
          db.prepare(
            `INSERT INTO visibility (brand_id, keyword, platform, week_ending, rank) VALUES (?,?,?,?,?)
             ON CONFLICT(brand_id, keyword, platform, week_ending) DO UPDATE SET rank=excluded.rank`
          ).bind(brandId, row.keyword, data.platform, data.weekEnding, row.rank ?? null)
        );
      }
      committed++;
    }

    // ── Execute in batches of 100 (D1 limit) ────────────────────────────
    for (let i = 0; i < stmts.length; i += 100) {
      await db.batch(stmts.slice(i, i + 100));
    }

    // ── Record the upload ────────────────────────────────────────────────
    const uploadId = `up-${data.weekEnding}-${data.platform}-${Date.now()}`;
    await db
      .prepare(
        `INSERT INTO uploads (id, week_ending, platform, uploaded_by, uploaded_at, row_count, status)
         VALUES (?,?,?,'analyst',?,?,'committed') ON CONFLICT(id) DO NOTHING`
      )
      .bind(uploadId, data.weekEnding, data.platform, new Date().toISOString(), committed)
      .run();

    return { committed, skipped: skipped + unrecognised, unrecognised };
  });
