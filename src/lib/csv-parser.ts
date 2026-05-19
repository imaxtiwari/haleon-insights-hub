// Pure CSV parsing — no D1 or framework deps. Handles quoted fields.

export type ParsedRow = {
  platformExternalId: string;
  units?: number;
  gmv?: number;
  price?: number;
  listingStatus?: "listed" | "unlisted" | "oos";
  keyword?: string;
  rank?: number | null;
};

export type ParseResult = {
  rows: ParsedRow[];
  skipped: number;
  errors: string[];
};

const LISTING_MAP: Record<string, "listed" | "unlisted" | "oos"> = {
  active: "listed",
  listed: "listed",
  available: "listed",
  inactive: "unlisted",
  unlisted: "unlisted",
  delisted: "unlisted",
  "out of stock": "oos",
  out_of_stock: "oos",
  oos: "oos",
};

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

export function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], skipped: 0, errors: ["File is empty or has no data rows"] };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const idx = (name: string) => headers.indexOf(name);

  const skuIdx = idx("sku_code");
  if (skuIdx === -1) return { rows: [], skipped: 0, errors: ['Missing required column: sku_code'] };

  const unitsIdx   = idx("units_sold");
  const gmvIdx     = idx("gross_sales");
  const priceIdx   = idx("selling_price");
  const statusIdx  = idx("listing_status");
  const kwIdx      = idx("keyword_query");
  const rankIdx    = idx("search_position");

  const rows: ParsedRow[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const platformExternalId = cells[skuIdx];
    if (!platformExternalId) { skipped++; continue; }

    const row: ParsedRow = { platformExternalId };

    const numOrUndef = (colIdx: number) => {
      if (colIdx === -1 || !cells[colIdx]) return undefined;
      const n = Number(cells[colIdx].replace(/,/g, ""));
      return isNaN(n) ? undefined : n;
    };

    row.units = numOrUndef(unitsIdx);
    row.gmv   = numOrUndef(gmvIdx);
    row.price = numOrUndef(priceIdx);

    if (statusIdx !== -1 && cells[statusIdx]) {
      const raw = cells[statusIdx].toLowerCase().trim();
      row.listingStatus = LISTING_MAP[raw] ?? "listed";
    }

    if (kwIdx !== -1 && cells[kwIdx]) {
      row.keyword = cells[kwIdx];
      row.rank = rankIdx !== -1 && cells[rankIdx] ? Number(cells[rankIdx]) || null : null;
    }

    // Skip rows that carry no useful data
    if (row.units == null && row.price == null && row.listingStatus == null && row.keyword == null) {
      skipped++;
      continue;
    }

    rows.push(row);
  }

  return { rows, skipped, errors };
}
