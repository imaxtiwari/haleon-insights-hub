#!/usr/bin/env python3
"""
Parse the Tata 1mg Digital Spends Excel file and emit INSERT OR IGNORE SQL
for migrations/0007_digital_spends.sql.

Usage:
    python scripts/seed_digital_spends.py <path_to_tata1mg.xlsx> \
        [>> migrations/0007_digital_spends.sql]

Output is written to stdout so you can review before appending.
Diagnostics are written to stderr.

Expected sheet layout (auto-detected):
    Rows  = brand-category (e.g. "Sensodyne Paste", "Centrum MVM", ...)
    Cols  = months (Jan-26, Feb-26, Mar-26, Apr-26, ...)
    Each month has 3 sub-columns: Paid Spends (INR), Paid Sales (INR), Paid ROAS

Platform = tata_1mg for all rows.
"""

import sys
import re
from pathlib import Path

try:
    import pandas as pd
    import openpyxl
except ImportError:
    print("Required: pip install pandas openpyxl", file=sys.stderr)
    sys.exit(1)

PLATFORM = "tata_1mg"

# ── Brand-category → brand_id mapping ─────────────────────────────────────────
# Keys are lowercase tokens; first match wins.
BRAND_MAP: list[tuple[list[str], str]] = [
    # Oral care
    (["sensodyne paste", "senso paste", "s/dyne paste", "paste"],         "paste"),
    (["sensodyne brush", "senso brush", "s/dyne brush", "brush"],         "brush"),
    (["parodontax", "paradontax"],                                         "parodontax"),
    (["pronamel"],                                                          "pronamel"),
    (["listerine", "mouthwash", "mouth wash", "mouthrinse"],               "mouthwash"),
    (["polident"],                                                          "polident"),
    # Pain / topical
    (["crocin"],                                                            "crocin"),
    (["iodex"],                                                             "iodex"),
    (["voltaren", "voltarol"],                                              "voltaren"),
    # Nutrition / health
    (["centrum", "centr"],                                                  "centrum"),
    (["ostocalcium", "osto"],                                               "ostocalcium"),
    # Gastrointestinal / ENT
    (["eno"],                                                               "eno"),
    (["otrivin", "otri"],                                                   "otrivin"),
]

# ── Month-label → YYYY-MM mapping ─────────────────────────────────────────────
MONTH_ABBR: dict[str, str] = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}


def normalise(s: str) -> str:
    return re.sub(r"\s+", " ", str(s).strip().lower())


def brand_id_for(raw: str) -> str | None:
    n = normalise(raw)
    for tokens, bid in BRAND_MAP:
        if any(tok in n for tok in tokens):
            return bid
    return None


def parse_month_label(label: str) -> str | None:
    """
    Convert 'Jan-26', 'January 2026', 'Jan 26', 'Jan-2026' → '2026-01'.
    """
    n = normalise(str(label))
    # Short: "jan-26", "jan 26"
    m = re.match(r"([a-z]{3})[-\s](\d{2})$", n)
    if m:
        mo = MONTH_ABBR.get(m.group(1))
        yr = "20" + m.group(2)
        if mo:
            return f"{yr}-{mo}"
    # Long: "jan-2026", "january 2026"
    m = re.match(r"([a-z]{3,9})[-\s](\d{4})$", n)
    if m:
        mo = MONTH_ABBR.get(m.group(1)[:3])
        if mo:
            return f"{m.group(2)}-{mo}"
    return None


def to_int(val) -> int:
    if val is None or (isinstance(val, float) and str(val) == "nan"):
        return 0
    try:
        return int(float(str(val).replace(",", "").replace("₹", "").strip()))
    except (ValueError, TypeError):
        return 0


def to_float(val) -> float:
    if val is None or (isinstance(val, float) and str(val) == "nan"):
        return 0.0
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


def find_spends_sheet(xl: pd.ExcelFile) -> str:
    for name in xl.sheet_names:
        n = normalise(name)
        if any(k in n for k in ["spend", "digital", "roas", "paid", "media", "1mg", "tata"]):
            return name
    return xl.sheet_names[0]


def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <tata1mg.xlsx>", file=sys.stderr)
        sys.exit(1)

    xlsx_path = Path(sys.argv[1])
    if not xlsx_path.exists():
        print(f"File not found: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    print(f"-- Reading: {xlsx_path}", file=sys.stderr)
    xl = pd.ExcelFile(xlsx_path)
    print(f"-- Sheets: {xl.sheet_names}", file=sys.stderr)

    sheet = find_spends_sheet(xl)
    print(f"-- Using sheet: {sheet}", file=sys.stderr)

    # Read with no header to inspect raw structure
    raw = pd.read_excel(xlsx_path, sheet_name=sheet, header=None)
    print(f"-- Shape: {raw.shape}", file=sys.stderr)
    print("-- First 6 rows:", file=sys.stderr)
    for _, row in raw.head(6).iterrows():
        print(f"   {list(row)}", file=sys.stderr)

    # ── Detect structure ───────────────────────────────────────────────────────
    # Strategy: find header row by locating a row that contains at least 2 month-like labels.
    header_row_idx = 0
    for i, row in raw.iterrows():
        month_hits = sum(1 for v in row if parse_month_label(str(v)) is not None)
        if month_hits >= 2:
            header_row_idx = i
            break

    print(f"-- Header row index: {header_row_idx}", file=sys.stderr)

    # Re-read with detected header
    df = pd.read_excel(xlsx_path, sheet_name=sheet, header=header_row_idx)
    cols = list(df.columns)
    print(f"-- Columns: {cols}", file=sys.stderr)

    # ── Find brand column (first column with non-month text labels) ────────────
    brand_col_idx = 0  # default: first column

    # ── Build (month, metric) → column index mapping ──────────────────────────
    # Expected pattern: header row has merged cells like "Jan-26" spanning 3 sub-columns
    # The sub-columns are: Paid Spends (INR), Paid Sales (INR), Paid ROAS
    # After read_excel, pandas fills merged cells with Unnamed: N for subsequent cols.
    # We'll use a fallback approach: scan columns left-to-right, track current month.

    month_blocks: list[dict] = []  # [{period, spend_idx, sales_idx, roas_idx}]

    current_period: str | None = None
    current_block: dict = {}

    for ci, col in enumerate(cols):
        col_str = str(col)
        # Check if this is a month header
        period = parse_month_label(col_str)
        if period:
            current_period = period
            current_block = {"period": period}
            month_blocks.append(current_block)
            continue

        if current_period is None:
            continue

        n = normalise(col_str)

        # Identify sub-columns by keyword
        if "spend" in n and "spend_idx" not in current_block:
            current_block["spend_idx"] = ci
        elif "sale" in n and "sales_idx" not in current_block:
            current_block["sales_idx"] = ci
        elif "roas" in n and "roas_idx" not in current_block:
            current_block["roas_idx"] = ci
        # Handle Unnamed columns: assign in order spend→sales→roas if unlabelled
        elif col_str.startswith("Unnamed"):
            if "spend_idx" not in current_block:
                current_block["spend_idx"] = ci
            elif "sales_idx" not in current_block:
                current_block["sales_idx"] = ci
            elif "roas_idx" not in current_block:
                current_block["roas_idx"] = ci

    # Filter to blocks that have at least spend_idx
    month_blocks = [b for b in month_blocks if "spend_idx" in b]
    print(f"-- Detected {len(month_blocks)} month blocks: {[b['period'] for b in month_blocks]}", file=sys.stderr)

    if not month_blocks:
        print("ERROR: Could not detect any month columns. Check the file structure.", file=sys.stderr)
        sys.exit(1)

    # ── Emit SQL ───────────────────────────────────────────────────────────────
    print("-- Auto-generated by scripts/seed_digital_spends.py")
    print(f"-- Source: {xlsx_path.name}, sheet: {sheet}")
    print()

    rows_emitted = 0
    rows_skipped = 0
    seen: set[str] = set()
    brand_col = df.columns[brand_col_idx]

    for _, row in df.iterrows():
        brand_raw = str(row[brand_col]).strip()
        if not brand_raw or brand_raw.lower() in ("nan", "none", "brand", "category"):
            rows_skipped += 1
            continue

        brand_id = brand_id_for(brand_raw)
        if brand_id is None:
            print(f"  -- WARN: unrecognised brand '{brand_raw}' — skipped", file=sys.stderr)
            rows_skipped += 1
            continue

        for block in month_blocks:
            period = block["period"]
            row_id = f"{brand_id}|{PLATFORM}|{period}"

            # Skip duplicate (multiple source rows map to same brand_id + period)
            if row_id in seen:
                continue
            seen.add(row_id)

            col_names = list(df.columns)
            spend = to_int(row[col_names[block["spend_idx"]]] if "spend_idx" in block else None)
            sales = to_int(row[col_names[block["sales_idx"]]] if "sales_idx" in block else None)
            roas  = to_float(row[col_names[block["roas_idx"]]] if "roas_idx" in block else None)

            # Derive ROAS if not given or zero
            if roas == 0.0 and spend > 0:
                roas = round(sales / spend, 4)

            print(
                f"INSERT OR IGNORE INTO digital_spends "
                f"(id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas) VALUES "
                f"('{row_id}', '{brand_id}', '{PLATFORM}', '{period}', {spend}, {sales}, {roas:.4f});"
            )
            rows_emitted += 1

    print(f"\n-- Done: {rows_emitted} rows inserted, {rows_skipped} skipped", file=sys.stderr)


if __name__ == "__main__":
    main()
