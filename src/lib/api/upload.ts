import { createServerFn } from "@tanstack/react-start";
import { parseCSV, isHaleonRow, isLegacyRow } from "@/lib/csv-parser";

export type UploadInput = {
  csvText: string;
  platform: string;
  weekEnding: string;
};

export type UploadResult = {
  committed: number;
  skipped: number;
  autoCreated: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Stable slug from a free-text string: lower-case, collapse non-alphanum to "-". */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Month-name → zero-padded number ("January" → "01"). */
const MONTH_NUM: Record<string, string> = {
  january: "01", february: "02", march: "03",    april: "04",
  may: "05",     june: "06",     july: "07",      august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

function monthToNum(name: string): string {
  return MONTH_NUM[name.toLowerCase()] ?? "01";
}

// ── Server function ────────────────────────────────────────────────────────────

export const processUpload = createServerFn({ method: "POST" })
  .inputValidator((input: UploadInput) => input)
  .handler(async ({ data }): Promise<UploadResult> => {
    const { env } = await import("cloudflare:workers");
    const db = env.haleon_insights_db;

    // ── Parse CSV (auto-detects Haleon vs legacy format) ──────────────────
    const { rows, skipped: parseSkipped, errors, format } = parseCSV(data.csvText);
    if (errors.length > 0) throw new Error(errors[0]);
    if (rows.length === 0) throw new Error("No usable rows found in file");

    // ── Shared D1 types ────────────────────────────────────────────────────
    type IdRow      = { sku_id: string; external_id: string; brand_id: string };
    type SkuRow     = { id: string; brand_id: string };
    type BrandRow   = { id: string };

    const stmts: D1PreparedStatement[] = [];
    let committed   = 0;
    let skipped     = parseSkipped;
    let autoCreated = 0;

    // ════════════════════════════════════════════════════════════════════════
    // HALEON FORMAT  (Internal Code, Quantity, Offtake_MRP, Platform, Period…)
    // ════════════════════════════════════════════════════════════════════════
    if (format === "haleon") {
      const haleonRows = rows.filter(isHaleonRow);

      // Group by normalised platform so we batch D1 lookups per platform
      const byPlatform = new Map<string, typeof haleonRows>();
      for (const row of haleonRows) {
        const p = row.platformNorm;
        if (!byPlatform.has(p)) byPlatform.set(p, []);
        byPlatform.get(p)!.push(row);
      }

      for (const [platform, pRows] of byPlatform) {
        // ── 1. Try to resolve existing SKUs by internal_code ──────────────
        const internalCodes = [...new Set(pRows.map((r) => r.internalCode))];
        const placeholders  = internalCodes.map(() => "?").join(",");

        const existingResult = (await db
          .prepare(
            `SELECT s.id AS sku_id, s.id AS external_id, b.id AS brand_id
             FROM skus s
             JOIN brands b ON b.id = s.brand_id
             WHERE s.internal_code IN (${placeholders})`
          )
          .bind(...internalCodes)
          .all()) as D1Result<IdRow>;

        const skuMap = new Map<string, { skuId: string; brandId: string }>();
        for (const r of existingResult.results) {
          skuMap.set(r.external_id, { skuId: r.sku_id, brandId: r.brand_id });
        }

        // ── 2. For unknown internal codes, auto-create SKU + brand ─────────
        const missingCodes = internalCodes.filter((c) => !skuMap.has(c));

        if (missingCodes.length > 0) {
          // Fetch all brand ids upfront (small table — fine to fetch all)
          const brandResult = (await db
            .prepare("SELECT id FROM brands")
            .all()) as D1Result<BrandRow>;
          const knownBrandIds = new Set(brandResult.results.map((r) => r.id));

          // Pre-build a lookup: internalCode → first matching HaleonRow (for metadata)
          const rowForCode = new Map<string, (typeof haleonRows)[number]>();
          for (const row of pRows) {
            if (!rowForCode.has(row.internalCode)) rowForCode.set(row.internalCode, row);
          }

          for (const code of missingCodes) {
            const sample = rowForCode.get(code);
            if (!sample) continue;

            // Resolve or auto-create brand
            const rawBrand   = sample.brand?.trim() ?? "";
            const brandSlug  = rawBrand ? slugify(rawBrand) : "unknown";
            let   brandId    = knownBrandIds.has(brandSlug) ? brandSlug : "unknown";

            if (rawBrand && brandId === "unknown" && !knownBrandIds.has(brandSlug)) {
              // Brand doesn't exist — create it under 'other' category
              stmts.push(
                db.prepare(
                  `INSERT OR IGNORE INTO brands (id, name, category_id) VALUES (?,?,'other')`
                ).bind(brandSlug, rawBrand)
              );
              knownBrandIds.add(brandSlug);
              brandId = brandSlug;
            }

            // Create SKU
            const skuId  = slugify(sample.internalCode) || slugify(sample.skuDesc);
            const skuMrp = sample.offtakeMrp ?? 0;
            stmts.push(
              db.prepare(
                `INSERT OR IGNORE INTO skus
                   (id, brand_id, name, pack_size, mrp, internal_code, brand_name_raw)
                 VALUES (?,?,?,?,?,?,?)`
              ).bind(skuId, brandId, sample.skuDesc, "", skuMrp,
                     sample.internalCode, rawBrand || null)
            );

            // Register platform external ID
            stmts.push(
              db.prepare(
                `INSERT OR IGNORE INTO sku_platform_ids (sku_id, platform, external_id)
                 VALUES (?,?,?)`
              ).bind(skuId, platform, sample.internalCode)
            );

            skuMap.set(code, { skuId, brandId });
            autoCreated++;
          }

          // Flush the CREATE statements before writing offtakes so FK constraints hold
          if (stmts.length > 0) {
            for (let i = 0; i < stmts.length; i += 100) {
              await db.batch(stmts.splice(i, i + 100));
            }
          }
        }

        // ── 3. Write offtakes using period column ─────────────────────────
        const offtakeStmts: D1PreparedStatement[] = [];

        for (const row of pRows) {
          const mapped = skuMap.get(row.internalCode);
          if (!mapped) { skipped++; continue; }

          if (row.quantity == null && row.offtakeMrp == null) { skipped++; continue; }

          const qty = row.quantity ?? 0;
          const gmv = qty * (row.offtakeMrp ?? 0);

          // period comes from the row itself (derived from Year + Month in CSV)
          // weekEnding is kept for backward compat (first day of that month)
          const [yr, mo] = row.period.split("-");
          const weekEndingCompat = `${yr}-${mo}-01`;

          offtakeStmts.push(
            db.prepare(
              `INSERT INTO offtakes (sku_id, platform, week_ending, period, units, gmv)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT(sku_id, platform, week_ending)
               DO UPDATE SET units=excluded.units, gmv=excluded.gmv, period=excluded.period`
            ).bind(mapped.skuId, platform, weekEndingCompat, row.period, qty, Math.round(gmv))
          );
          committed++;
        }

        for (let i = 0; i < offtakeStmts.length; i += 100) {
          await db.batch(offtakeStmts.slice(i, i + 100));
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // LEGACY FORMAT  (sku_code, units_sold, gross_sales, …)
    // ════════════════════════════════════════════════════════════════════════
    if (format === "legacy") {
      const legacyRows   = rows.filter(isLegacyRow);
      const externalIds  = [...new Set(legacyRows.map((r) => r.platformExternalId))];
      const placeholders = externalIds.map(() => "?").join(",");

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
      for (const r of idResult.results) {
        idMap.set(r.external_id, { skuId: r.sku_id, brandId: r.brand_id });
      }

      const legacyStmts: D1PreparedStatement[] = [];

      for (const row of legacyRows) {
        const mapped = idMap.get(row.platformExternalId);
        if (!mapped) { skipped++; continue; }
        const { skuId, brandId } = mapped;

        if (row.units != null && row.gmv != null) {
          legacyStmts.push(
            db.prepare(
              `INSERT INTO offtakes (sku_id, platform, week_ending, units, gmv) VALUES (?,?,?,?,?)
               ON CONFLICT(sku_id, platform, week_ending)
               DO UPDATE SET units=excluded.units, gmv=excluded.gmv`
            ).bind(skuId, data.platform, data.weekEnding, row.units, row.gmv)
          );
        }
        if (row.price != null) {
          legacyStmts.push(
            db.prepare(
              `INSERT INTO prices (item_id, item_kind, platform, week_ending, price) VALUES (?,'sku',?,?,?)
               ON CONFLICT(item_id, item_kind, platform, week_ending)
               DO UPDATE SET price=excluded.price`
            ).bind(skuId, data.platform, data.weekEnding, row.price)
          );
        }
        if (row.listingStatus != null) {
          legacyStmts.push(
            db.prepare(
              `INSERT INTO listings (sku_id, platform, week_ending, status) VALUES (?,?,?,?)
               ON CONFLICT(sku_id, platform, week_ending)
               DO UPDATE SET status=excluded.status`
            ).bind(skuId, data.platform, data.weekEnding, row.listingStatus)
          );
        }
        if (row.keyword != null) {
          legacyStmts.push(
            db.prepare(
              `INSERT INTO visibility (brand_id, keyword, platform, week_ending, rank) VALUES (?,?,?,?,?)
               ON CONFLICT(brand_id, keyword, platform, week_ending)
               DO UPDATE SET rank=excluded.rank`
            ).bind(brandId, row.keyword, data.platform, data.weekEnding, row.rank ?? null)
          );
        }
        committed++;
      }

      for (let i = 0; i < legacyStmts.length; i += 100) {
        await db.batch(legacyStmts.slice(i, i + 100));
      }
    }

    // ── Record the upload ──────────────────────────────────────────────────
    const uploadId = `up-${data.weekEnding}-${data.platform}-${Date.now()}`;
    await db
      .prepare(
        `INSERT INTO uploads (id, week_ending, platform, uploaded_by, uploaded_at, row_count, status)
         VALUES (?,?,?,'analyst',?,?,'committed') ON CONFLICT(id) DO NOTHING`
      )
      .bind(uploadId, data.weekEnding, data.platform, new Date().toISOString(), committed)
      .run();

    return { committed, skipped, autoCreated };
  });
