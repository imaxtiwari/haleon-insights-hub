// Pure CSV parsing — no D1 or framework deps. Handles quoted fields.
// Supports two formats:
//   1. Real Haleon offtakes export (default_1 sheet): Date, Internal Code, Platform,
//      SKU Desc, SKU name short, Brand, Quantity, Offtake_MRP, Offtake_NSV, Year, Month (name), …
//   2. Legacy upload format (kept for backward compat): sku_code, units_sold, gross_sales, …

// ── Types ──────────────────────────────────────────────────────────────────────

/** Row produced from the real Haleon offtakes export. */
export type HaleonRow = {
  internalCode: string;   // Internal Code column
  skuDesc: string;        // SKU Desc (full description)
  skuShort?: string;      // SKU name short
  brand?: string;
  platform: string;       // raw value from file: "1MG", "Pharmeasy", "Amazon", "Zepto", …
  platformNorm: string;   // normalised: "tata_1mg" | "pharmeasy" | "amazon_pharmacy" | "zepto" | (passthrough)
  quantity?: number;
  offtakeMrp?: number;
  offtakeNsv?: number;
  month: string;          // month name, e.g. "January"
  year: number;
  period: string;         // "YYYY-MM" computed from year + month
};

/** Row produced from the legacy sku_code / units_sold format. */
export type LegacyRow = {
  platformExternalId: string;
  units?: number;
  gmv?: number;
  price?: number;
  listingStatus?: "listed" | "unlisted" | "oos";
  keyword?: string;
  rank?: number | null;
};

/** Union: the format is detected automatically from the header row. */
export type ParsedRow = HaleonRow | LegacyRow;

export type ParseResult<T extends ParsedRow = ParsedRow> = {
  format: "haleon" | "legacy";
  rows: T[];
  skipped: number;
  errors: string[];
};

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORM_NORM: Record<string, string> = {
  "1mg":         "tata_1mg",
  "1MG":         "tata_1mg",
  tata_1mg:      "tata_1mg",
  "Tata 1mg":    "tata_1mg",
  "tata 1mg":    "tata_1mg",
  Pharmeasy:     "pharmeasy",
  pharmeasy:     "pharmeasy",
  PHARMEASY:     "pharmeasy",
  Amazon:        "amazon_pharmacy",
  amazon:        "amazon_pharmacy",
  AMAZON:        "amazon_pharmacy",
  "Amazon Pharmacy": "amazon_pharmacy",
  amazon_pharmacy:   "amazon_pharmacy",
  Zepto:         "zepto",
  zepto:         "zepto",
  ZEPTO:         "zepto",
};

const MONTH_NUM: Record<string, string> = {
  january: "01", february: "02", march: "03",     april: "04",
  may: "05",     june: "06",     july: "07",       august: "08",
  september: "09", october: "10", november: "11", december: "12",
  // 3-letter abbreviations as a fallback
  jan: "01", feb: "02", mar: "03", apr: "04", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const LISTING_MAP: Record<string, "listed" | "unlisted" | "oos"> = {
  active: "listed",   listed: "listed",    available: "listed",
  inactive: "unlisted", unlisted: "unlisted", delisted: "unlisted",
  "out of stock": "oos", out_of_stock: "oos", oos: "oos",
};

// ── CSV tokeniser ──────────────────────────────────────────────────────────────

function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function numOrUndef(cells: string[], colIdx: number): number | undefined {
  if (colIdx === -1 || !cells[colIdx]) return undefined;
  const n = Number(cells[colIdx].replace(/,/g, "").trim());
  return isNaN(n) ? undefined : n;
}

// ── Format detection ───────────────────────────────────────────────────────────

/** Returns "haleon" when the header contains real Haleon offtakes columns. */
function detectFormat(normalised: string[]): "haleon" | "legacy" {
  const has = (s: string) => normalised.includes(s);
  if (has("internal_code") || (has("sku_desc") && has("offtake_mrp"))) return "haleon";
  return "legacy";
}

// Normalise a raw header string to a lookup key: lower-case, whitespace → "_"
function normHeader(h: string): string {
  return h.toLowerCase().replace(/[\s()]+/g, "_").replace(/_+$/, "");
}

// ── Haleon offtakes parser ─────────────────────────────────────────────────────

export function parseHaleonCSV(text: string): ParseResult<HaleonRow> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { format: "haleon", rows: [], skipped: 0, errors: ["File is empty or has no data rows"] };
  }

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map(normHeader);
  const idx = (name: string) => headers.indexOf(name);

  // Required column indexes
  const internalCodeIdx = idx("internal_code");
  const skuDescIdx      = idx("sku_desc");
  const platformIdx     = idx("platform");
  const quantityIdx     = idx("quantity");
  const mrpIdx          = idx("offtake_mrp");
  const nsvIdx          = idx("offtake_nsv");
  const monthIdx        = idx("month_name_");  // "Month (name)" normalises to "month_name_"
  const yearIdx         = idx("year");
  const brandIdx        = idx("brand");
  const skuShortIdx     = idx("sku_name_short");

  // Validate required columns
  const errors: string[] = [];
  const identifierPresent = internalCodeIdx !== -1 || skuDescIdx !== -1;
  if (!identifierPresent) errors.push("Missing required column: 'Internal Code' or 'SKU Desc'");
  if (platformIdx === -1) errors.push("Missing required column: Platform");
  if (monthIdx   === -1) errors.push("Missing required column: Month (name)");
  if (yearIdx    === -1) errors.push("Missing required column: Year");
  if (errors.length) return { format: "haleon", rows: [], skipped: 0, errors };

  const rows: HaleonRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);

    const internalCode = internalCodeIdx !== -1 ? (cells[internalCodeIdx] ?? "").trim() : "";
    const skuDesc      = skuDescIdx      !== -1 ? (cells[skuDescIdx] ?? "").trim() : internalCode;

    if (!internalCode && !skuDesc) { skipped++; continue; }

    const rawPlatform = platformIdx !== -1 ? (cells[platformIdx] ?? "").trim() : "";
    const platformNorm = PLATFORM_NORM[rawPlatform] ?? rawPlatform.toLowerCase().replace(/\s+/g, "_");

    const monthRaw = (cells[monthIdx] ?? "").trim();
    const monthNum = MONTH_NUM[monthRaw.toLowerCase()];
    if (!monthNum) { skipped++; continue; }  // unparseable month → skip

    const yearRaw = numOrUndef(cells, yearIdx);
    if (!yearRaw) { skipped++; continue; }

    const period = `${yearRaw}-${monthNum}`;

    const row: HaleonRow = {
      internalCode: internalCode || skuDesc,
      skuDesc,
      platform: rawPlatform,
      platformNorm,
      month: monthRaw,
      year: yearRaw,
      period,
    };

    if (brandIdx    !== -1 && cells[brandIdx])    row.brand    = cells[brandIdx].trim();
    if (skuShortIdx !== -1 && cells[skuShortIdx]) row.skuShort = cells[skuShortIdx].trim();

    row.quantity   = numOrUndef(cells, quantityIdx);
    row.offtakeMrp = numOrUndef(cells, mrpIdx);
    row.offtakeNsv = numOrUndef(cells, nsvIdx);

    // Skip rows that carry no numeric data
    if (row.quantity == null && row.offtakeMrp == null && row.offtakeNsv == null) {
      skipped++;
      continue;
    }

    rows.push(row);
  }

  return { format: "haleon", rows, skipped, errors };
}

// ── Legacy parser (sku_code / units_sold / gross_sales) ───────────────────────

export function parseLegacyCSV(text: string): ParseResult<LegacyRow> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { format: "legacy", rows: [], skipped: 0, errors: ["File is empty or has no data rows"] };
  }

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const idx = (name: string) => headers.indexOf(name);

  const skuIdx    = idx("sku_code");
  if (skuIdx === -1) {
    return { format: "legacy", rows: [], skipped: 0, errors: ["Missing required column: sku_code"] };
  }

  const unitsIdx  = idx("units_sold");
  const gmvIdx    = idx("gross_sales");
  const priceIdx  = idx("selling_price");
  const statusIdx = idx("listing_status");
  const kwIdx     = idx("keyword_query");
  const rankIdx   = idx("search_position");

  const rows: LegacyRow[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const platformExternalId = cells[skuIdx]?.trim();
    if (!platformExternalId) { skipped++; continue; }

    const row: LegacyRow = { platformExternalId };

    row.units = numOrUndef(cells, unitsIdx);
    row.gmv   = numOrUndef(cells, gmvIdx);
    row.price = numOrUndef(cells, priceIdx);

    if (statusIdx !== -1 && cells[statusIdx]) {
      const raw = cells[statusIdx].toLowerCase().trim();
      row.listingStatus = LISTING_MAP[raw] ?? "listed";
    }
    if (kwIdx !== -1 && cells[kwIdx]) {
      row.keyword = cells[kwIdx];
      row.rank = rankIdx !== -1 && cells[rankIdx] ? Number(cells[rankIdx]) || null : null;
    }

    if (row.units == null && row.price == null && row.listingStatus == null && row.keyword == null) {
      skipped++;
      continue;
    }

    rows.push(row);
  }

  return { format: "legacy", rows, skipped, errors };
}

// ── Auto-detect entry point ────────────────────────────────────────────────────

/**
 * Parses a CSV string, auto-detecting whether it is the real Haleon offtakes
 * format or the legacy sku_code format.
 */
export function parseCSV(text: string): ParseResult {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const normHeaders = splitLine(firstLine).map(normHeader);
  const format = detectFormat(normHeaders);
  return format === "haleon"
    ? (parseHaleonCSV(text) as ParseResult)
    : (parseLegacyCSV(text) as ParseResult);
}

// ── Type guards ────────────────────────────────────────────────────────────────

export function isHaleonRow(row: ParsedRow): row is HaleonRow {
  return "internalCode" in row;
}
export function isLegacyRow(row: ParsedRow): row is LegacyRow {
  return "platformExternalId" in row;
}

// ── Platform normalisation helper (exported for use in upload server fn) ───────

export function normalisePlatform(raw: string): string {
  return PLATFORM_NORM[raw] ?? PLATFORM_NORM[raw.trim()] ?? raw.toLowerCase().replace(/\s+/g, "_");
}
