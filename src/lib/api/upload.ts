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

// ════════════════════════════════════════════════════════════════════════════
// OFFTAKES UPLOAD  (Amazon Pharmacy invoice-line CSV format)
// ════════════════════════════════════════════════════════════════════════════

export type OfftakesUploadInput = { csvText: string };

export type OfftakesUploadResult = {
  committed: number;
  skipped:   number;
  unmatched: string[];   // product_name values that couldn't be resolved to a SKU
};

/** Score how similar two product name strings are (0–1) using token overlap. */
function tokenSimilarity(a: string, b: string): number {
  const tok = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
  const ta = new Set(tok(a));
  const tb = new Set(tok(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  ta.forEach((t) => { if (tb.has(t)) overlap++; });
  return overlap / Math.max(ta.size, tb.size);
}

export const processOfftakesUpload = createServerFn({ method: "POST" })
  .inputValidator((input: OfftakesUploadInput) => input)
  .handler(async ({ data }): Promise<OfftakesUploadResult> => {
    const { env } = await import("cloudflare:workers");
    const db = env.haleon_insights_db;

    // ── Parse CSV ─────────────────────────────────────────────────────────
    const lines = data.csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

    const rawHeaders = splitCsvLine(lines[0]);
    const headers    = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""));

    const col = (candidates: string[]): number => {
      for (const c of candidates) {
        const i = headers.findIndex((h) => h === c || h.startsWith(c));
        if (i >= 0) return i;
      }
      return -1;
    };

    const iProduct  = col(["product_name", "product", "name"]);
    const iAsin     = col(["asin"]);
    const iQty      = col(["qty", "quantity", "units"]);
    const iMrp      = col(["mrp", "price", "unit_price"]);
    const iDate     = col(["invoice_date", "date", "order_date"]);
    const iLocation = col(["location", "city"]);
    const iEdCode   = col(["ed_code", "ed"]);

    if (iProduct < 0 || iQty < 0 || iMrp < 0) {
      throw new Error("CSV must contain columns: product_name, qty, mrp (or equivalents)");
    }

    // ── Collect all ASINs from file for bulk DB lookup ─────────────────────
    type ParsedLine = {
      product: string; asin: string; qty: number; mrp: number;
      invoiceDate: string; location: string; edCode: string;
    };

    const parsed: ParsedLine[] = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const f = splitCsvLine(lines[i]);
      if (f.length < 2) { skipped++; continue; }

      const product = f[iProduct]?.trim() ?? "";
      if (!product || product.toLowerCase() === "nan") { skipped++; continue; }

      const qty = parseInt((f[iQty] ?? "0").replace(",", ""), 10);
      const mrp = parseFloat((f[iMrp] ?? "0").replace(",", "").replace("₹", ""));
      if (isNaN(qty) || isNaN(mrp) || qty <= 0) { skipped++; continue; }

      const rawDate    = iDate >= 0 ? (f[iDate] ?? "") : "";
      const invoiceDate = rawDate ? parseInvoiceDate(rawDate) : new Date().toISOString().slice(0, 10);
      const asin        = iAsin     >= 0 ? (f[iAsin]?.trim()     ?? "") : "";
      const location    = iLocation >= 0 ? (f[iLocation]?.trim() ?? "") : "";
      const edCode      = iEdCode   >= 0 ? (f[iEdCode]?.trim()   ?? "") : "";

      parsed.push({
        product,
        asin:     asin     === "nan" ? "" : asin,
        qty,
        mrp,
        invoiceDate,
        location: location === "nan" ? "" : location,
        edCode:   edCode   === "nan" ? "" : edCode,
      });
    }

    if (parsed.length === 0) throw new Error("No valid data rows found in CSV");

    // ── Step 1: resolve by ASIN via sku_platform_ids ──────────────────────
    const PLATFORM = "amazon_pharmacy";

    const asinSet = [...new Set(parsed.map((r) => r.asin).filter(Boolean))];
    const asinMap = new Map<string, string>(); // asin → sku_id

    if (asinSet.length > 0) {
      const placeholders = asinSet.map(() => "?").join(",");
      type AsinRow = { sku_id: string; external_id: string };
      const asinResult = (await db
        .prepare(
          `SELECT sku_id, external_id FROM sku_platform_ids
           WHERE platform = ? AND external_id IN (${placeholders})`
        )
        .bind(PLATFORM, ...asinSet)
        .all()) as D1Result<AsinRow>;
      for (const r of asinResult.results) {
        asinMap.set(r.external_id, r.sku_id);
      }
    }

    // ── Step 2: fuzzy product-name lookup for unresolved rows ─────────────
    const unmatchedProducts = new Set(
      parsed.filter((r) => !asinMap.has(r.asin)).map((r) => r.product)
    );
    const nameMap = new Map<string, string>(); // product_name → sku_id

    if (unmatchedProducts.size > 0) {
      type SkuNameRow = { id: string; name: string };
      const skuNames = (await db
        .prepare("SELECT id, name FROM skus")
        .all()) as D1Result<SkuNameRow>;

      for (const product of unmatchedProducts) {
        let bestId    = "";
        let bestScore = 0;
        for (const sku of skuNames.results) {
          const score = tokenSimilarity(product, sku.name);
          if (score > bestScore) { bestScore = score; bestId = sku.id; }
        }
        if (bestScore >= 0.4) nameMap.set(product, bestId);
      }
    }

    // ── Step 3: aggregate into (sku_id, platform, period) buckets ─────────
    type Bucket = { units: number; gmv: number };
    const buckets = new Map<string, Bucket>();  // key = "skuId|period"
    const unmatchedSet = new Set<string>();

    for (const r of parsed) {
      const skuId = asinMap.get(r.asin) ?? nameMap.get(r.product) ?? "";
      if (!skuId) { unmatchedSet.add(r.product); skipped++; continue; }

      const period = r.invoiceDate.slice(0, 7);
      const key    = `${skuId}|${period}`;
      const bucket = buckets.get(key) ?? { units: 0, gmv: 0 };
      bucket.units += r.qty;
      bucket.gmv   += r.qty * r.mrp;
      buckets.set(key, bucket);
    }

    // ── Step 4: upsert into offtakes ──────────────────────────────────────
    const stmts: D1PreparedStatement[] = [];

    for (const [key, bucket] of buckets) {
      const [skuId, period] = key.split("|");
      const weekEnding = `${period}-01`;

      stmts.push(
        db.prepare(
          `INSERT INTO offtakes (sku_id, platform, week_ending, period, units, gmv)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT(sku_id, platform, week_ending)
           DO UPDATE SET units=excluded.units, gmv=excluded.gmv, period=excluded.period`
        ).bind(skuId, PLATFORM, weekEnding, period, bucket.units, Math.round(bucket.gmv))
      );
    }

    for (let i = 0; i < stmts.length; i += 100) {
      await db.batch(stmts.slice(i, i + 100));
    }

    // ── Record the upload ─────────────────────────────────────────────────
    const period    = parsed[0]?.invoiceDate.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
    const uploadId  = `up-${period}-${PLATFORM}-${Date.now()}`;
    await db
      .prepare(
        `INSERT INTO uploads (id, week_ending, platform, uploaded_by, uploaded_at, row_count, status)
         VALUES (?,?,?,'analyst',?,?,'committed') ON CONFLICT(id) DO NOTHING`
      )
      .bind(uploadId, `${period}-01`, PLATFORM, new Date().toISOString(), buckets.size)
      .run();

    return {
      committed: buckets.size,
      skipped,
      unmatched: [...unmatchedSet].slice(0, 50),  // cap at 50 to keep toast readable
    };
  });

// ════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS UPLOAD
// ════════════════════════════════════════════════════════════════════════════

export type POUploadInput = { csvText: string; platform?: string };
export type POUploadResult = { committed: number; skipped: number };

// ════════════════════════════════════════════════════════════════════════════
// PLATFORM METRICS UPLOAD  (platform, period, mau, aov)
// Updates ONLY mau + aov; leaves gmv and reach untouched.
// ════════════════════════════════════════════════════════════════════════════

export type MetricsUploadInput = { csvText: string };

export type MetricsParsedRow = {
  platform: string;
  period: string;      // YYYY-MM
  mau: number;
  aov: number;
};

export type MetricsUploadResult = {
  upserted: number;
  skipped:  number;
  preview:  MetricsParsedRow[];  // first 10 rows for UI confirmation
};

const METRICS_PLATFORM_MAP: Record<string, string> = {
  "1mg": "tata_1mg", tata1mg: "tata_1mg", "tata 1mg": "tata_1mg", "tata_1mg": "tata_1mg",
  pharmeasy: "pharmeasy", "pharm easy": "pharmeasy",
  zepto: "zepto",
  amazon: "amazon_pharmacy", "amazon pharmacy": "amazon_pharmacy",
  amazon_pharmacy: "amazon_pharmacy",
};

function normMetricsPlatform(raw: string): string {
  return METRICS_PLATFORM_MAP[raw.toLowerCase().trim()] ?? raw.toLowerCase().trim().replace(/\s+/g, "_");
}

/** Parse the MAU/AOV CSV on the client side (no DB) — returns rows + errors. */
export function parseMetricsCsv(csvText: string): { rows: MetricsParsedRow[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] };

  const rawHeaders = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""));
  const iPlatform = rawHeaders.findIndex((h) => ["platform", "plat"].includes(h));
  const iPeriod   = rawHeaders.findIndex((h) => ["period", "month", "year_month"].includes(h));
  const iMau      = rawHeaders.findIndex((h) => ["mau", "monthly_active_users", "active_users"].includes(h));
  const iAov      = rawHeaders.findIndex((h) => ["aov", "avg_order_value", "average_order_value"].includes(h));

  if (iPlatform < 0) return { rows: [], errors: ["Missing required column: platform"] };
  if (iPeriod   < 0) return { rows: [], errors: ["Missing required column: period (YYYY-MM)"] };
  if (iMau      < 0) return { rows: [], errors: ["Missing required column: mau"] };
  if (iAov      < 0) return { rows: [], errors: ["Missing required column: aov"] };

  const rows: MetricsParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const platform = normMetricsPlatform(f[iPlatform] ?? "");
    const period   = (f[iPeriod] ?? "").trim();
    const mau      = parseInt((f[iMau] ?? "").replace(/[^0-9]/g, ""), 10);
    const aov      = parseFloat((f[iAov] ?? "").replace(/[^0-9.]/g, ""));

    if (!platform || !/^\d{4}-\d{2}$/.test(period)) {
      errors.push(`Row ${i + 1}: invalid platform or period — skipped`);
      continue;
    }
    if (isNaN(mau) || isNaN(aov)) {
      errors.push(`Row ${i + 1}: mau/aov not numeric — skipped`);
      continue;
    }
    rows.push({ platform, period, mau, aov });
  }

  return { rows, errors };
}

export const processMetricsUpload = createServerFn({ method: "POST" })
  .inputValidator((input: MetricsUploadInput) => input)
  .handler(async ({ data }): Promise<MetricsUploadResult> => {
    const { env } = await import("cloudflare:workers");
    const db = env.haleon_insights_db;

    const { rows, errors } = parseMetricsCsv(data.csvText);
    if (rows.length === 0) throw new Error(errors[0] ?? "No valid rows found");

    let upserted = 0;
    let skipped  = errors.length;
    const stmts: D1PreparedStatement[] = [];

    for (const row of rows) {
      const weekEnding = `${row.period}-01`;
      // Upsert: if the row exists update mau + aov only; if it doesn't exist create with 0 gmv/reach
      stmts.push(
        db.prepare(
          `INSERT INTO platform_metrics (platform, week_ending, gmv, mau, aov, reach)
           VALUES (?, ?, 0, ?, ?, 0)
           ON CONFLICT(platform, week_ending)
           DO UPDATE SET mau = excluded.mau, aov = excluded.aov`
        ).bind(row.platform, weekEnding, row.mau, row.aov)
      );
      upserted++;
    }

    for (let i = 0; i < stmts.length; i += 100) {
      await db.batch(stmts.slice(i, i + 100));
    }

    return { upserted, skipped, preview: rows.slice(0, 10) };
  });

/** Split a single CSV line respecting quoted fields. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/** Parse DD-MM-YYYY, YYYY-MM-DD or DD/MM/YYYY → YYYY-MM-DD. Falls back to raw string. */
function parseInvoiceDate(raw: string): string {
  const s = raw.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD-MM-YYYY or DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s;
}

/** Deterministic row-id from content (djb2 + index). */
function poRowHash(fields: string[], idx: number): string {
  let h = 5381;
  const s = fields.join("|") + idx;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `po-${h.toString(36)}-${idx}`;
}

/** Derive period (YYYY-MM) from an invoice-date string (YYYY-MM-DD). */
function periodFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

const PO_PLATFORM_MAP: Record<string, string> = {
  "1mg": "tata_1mg", "tata1mg": "tata_1mg", "tata 1mg": "tata_1mg", "tata_1mg": "tata_1mg",
  pharmeasy: "pharmeasy", "pharm easy": "pharmeasy",
  zepto: "zepto",
  amazon: "amazon_pharmacy", "amazon pharmacy": "amazon_pharmacy", amazon_pharmacy: "amazon_pharmacy",
};

function normPOPlatform(raw: string, fallback?: string): string {
  return PO_PLATFORM_MAP[raw.toLowerCase().trim()] ?? fallback ?? raw.toLowerCase().trim();
}

export const processPOUpload = createServerFn({ method: "POST" })
  .inputValidator((input: POUploadInput) => input)
  .handler(async ({ data }): Promise<POUploadResult> => {
    const { env } = await import("cloudflare:workers");
    const db = env.haleon_insights_db;

    const lines = data.csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

    // Normalise header: lowercase + collapse spaces/special chars to _
    const rawHeaders = splitCsvLine(lines[0]);
    const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""));

    // Column index helpers
    const col = (candidates: string[]): number => {
      for (const c of candidates) {
        const i = headers.findIndex((h) => h === c || h.startsWith(c));
        if (i >= 0) return i;
      }
      return -1;
    };

    const iProduct   = col(["product_name", "product", "sku_name", "name"]);
    const iQty       = col(["qty", "quantity", "units"]);
    const iMrp       = col(["mrp", "price", "unit_price"]);
    const iDate      = col(["invoice_date", "date", "order_date"]);
    const iPlatform  = col(["platform"]);
    const iAsin      = col(["asin"]);
    const iLocation  = col(["location", "city", "state"]);
    const iStockist  = col(["stockist_name", "stockist", "distributor"]);
    const iEdCode    = col(["ed_code", "ed"]);

    if (iProduct < 0 || iQty < 0 || iMrp < 0) {
      throw new Error("CSV must contain columns: product_name, qty, mrp (or equivalents)");
    }

    let committed = 0;
    let skipped   = 0;
    const stmts: D1PreparedStatement[] = [];

    for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
      const fields = splitCsvLine(lines[lineIdx]);
      if (fields.length < 2) { skipped++; continue; }

      const productName = fields[iProduct]?.trim();
      const qty         = parseInt(fields[iQty] ?? "0", 10);
      const mrp         = parseFloat(fields[iMrp] ?? "0");

      if (!productName || isNaN(qty) || isNaN(mrp)) { skipped++; continue; }

      const rawDate    = iDate >= 0 ? (fields[iDate] ?? "") : "";
      const invoiceDate = rawDate ? parseInvoiceDate(rawDate) : new Date().toISOString().slice(0, 10);
      const period     = periodFromDate(invoiceDate);
      const rawPlat    = iPlatform >= 0 ? (fields[iPlatform] ?? "") : "";
      const platform   = normPOPlatform(rawPlat, data.platform);
      const asin       = iAsin      >= 0 ? (fields[iAsin]?.trim()     || null) : null;
      const location   = iLocation  >= 0 ? (fields[iLocation]?.trim() || null) : null;
      const stockist   = iStockist  >= 0 ? (fields[iStockist]?.trim() || null) : null;
      const edCode     = iEdCode    >= 0 ? (fields[iEdCode]?.trim()   || null) : null;

      const id = poRowHash(fields, lineIdx);

      stmts.push(
        db.prepare(
          `INSERT INTO purchase_orders
             (id, platform, period, product_name, asin, location, stockist_name, ed_code, qty, mrp, invoice_date)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET
             qty=excluded.qty, mrp=excluded.mrp, invoice_date=excluded.invoice_date`
        ).bind(id, platform, period, productName, asin, location, stockist, edCode, qty, mrp, invoiceDate)
      );
      committed++;
    }

    for (let i = 0; i < stmts.length; i += 100) {
      await db.batch(stmts.slice(i, i + 100));
    }

    return { committed, skipped };
  });
