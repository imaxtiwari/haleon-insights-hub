#!/usr/bin/env python3
"""
Convert Amazon Pharmacy "Haleon Sales" Excel sheet to a clean CSV.

Usage:
    python scripts/convert_amazon_pharma.py <path_to_xlsx> [output.csv]

Defaults:
    output = /tmp/amazon_pharma_apr2026_offtakes.csv

Output columns:
    product_name, asin, qty, mrp, invoice_date, platform, location, ed_code
"""

import sys
import re
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("pandas not installed. Run: pip install pandas openpyxl", file=sys.stderr)
    sys.exit(1)

DEFAULT_OUTPUT = "/tmp/amazon_pharma_apr2026_offtakes.csv"
PLATFORM = "amazon_pharmacy"


def normalise_col(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(s).strip().lower()).strip("_")


def find_col(headers: list[str], candidates: list[str]) -> int:
    for c in candidates:
        for i, h in enumerate(headers):
            if c in h:
                return i
    return -1


def parse_date(val) -> str:
    """Return YYYY-MM-DD string from whatever pandas gives us."""
    if pd.isna(val):
        return ""
    try:
        return pd.Timestamp(val).strftime("%Y-%m-%d")
    except Exception:
        s = str(val).strip()
        # Try DD-MM-YYYY or DD/MM/YYYY
        m = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$", s)
        if m:
            return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
        return s


def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <haleon_amazon_pharma.xlsx> [output.csv]", file=sys.stderr)
        sys.exit(1)

    xlsx_path = Path(sys.argv[1])
    out_path  = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(DEFAULT_OUTPUT)

    if not xlsx_path.exists():
        print(f"File not found: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading: {xlsx_path}", file=sys.stderr)

    xl = pd.ExcelFile(xlsx_path)
    print(f"Sheets: {xl.sheet_names}", file=sys.stderr)

    # Find "Haleon Sales" sheet (case-insensitive)
    sheet_name = None
    for name in xl.sheet_names:
        if "haleon" in name.lower() and "sale" in name.lower():
            sheet_name = name
            break
    if sheet_name is None:
        # Fallback: first sheet
        sheet_name = xl.sheet_names[0]
        print(f"'Haleon Sales' sheet not found; using: {sheet_name}", file=sys.stderr)
    else:
        print(f"Using sheet: {sheet_name}", file=sys.stderr)

    df = pd.read_excel(xlsx_path, sheet_name=sheet_name, header=0)
    print(f"Raw shape: {df.shape}", file=sys.stderr)
    print(f"Columns: {list(df.columns)}", file=sys.stderr)

    # Normalise column names for detection
    norm_cols = [normalise_col(c) for c in df.columns]

    def fc(*candidates: str) -> str | None:
        idx = find_col(norm_cols, list(candidates))
        return df.columns[idx] if idx >= 0 else None

    col_location    = fc("location", "city", "state")
    col_asin        = fc("asin")
    col_pincode     = fc("pincode", "pin")
    col_company     = fc("companyname", "company_name", "company")
    col_ed_code     = fc("ed_code", "edcode", "ed")
    col_product     = fc("product_name", "productname", "product")
    col_qty         = fc("qty", "quantity", "units")
    col_gst         = fc("gst")
    col_mrp         = fc("mrp", "price", "unit_price")
    col_date        = fc("invoice_date", "invoicedate", "date", "order_date")

    missing = [name for name, col in [
        ("product_name", col_product),
        ("qty",          col_qty),
        ("mrp",          col_mrp),
        ("invoice_date", col_date),
    ] if col is None]

    if missing:
        print(f"ERROR: Could not detect required columns: {missing}", file=sys.stderr)
        print(f"Available: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)

    out_rows = []
    skipped  = 0

    for _, row in df.iterrows():
        product = str(row[col_product]).strip() if col_product else ""
        if not product or product.lower() in ("nan", "none", ""):
            skipped += 1
            continue

        try:
            qty = int(float(str(row[col_qty]).replace(",", ""))) if col_qty else 0
        except (ValueError, TypeError):
            skipped += 1
            continue

        try:
            mrp = float(str(row[col_mrp]).replace(",", "").replace("₹", "")) if col_mrp else 0.0
        except (ValueError, TypeError):
            skipped += 1
            continue

        invoice_date = parse_date(row[col_date]) if col_date else ""
        asin         = str(row[col_asin]).strip()  if col_asin  else ""
        location     = str(row[col_location]).strip() if col_location else ""
        ed_code      = str(row[col_ed_code]).strip()  if col_ed_code  else ""

        # Sanitise "nan" → empty string
        asin     = "" if asin.lower()     in ("nan", "none") else asin
        location = "" if location.lower() in ("nan", "none") else location
        ed_code  = "" if ed_code.lower()  in ("nan", "none") else ed_code

        out_rows.append({
            "product_name":  product,
            "asin":          asin,
            "qty":           qty,
            "mrp":           mrp,
            "invoice_date":  invoice_date,
            "platform":      PLATFORM,
            "location":      location,
            "ed_code":       ed_code,
        })

    out_df = pd.DataFrame(out_rows, columns=[
        "product_name", "asin", "qty", "mrp", "invoice_date", "platform", "location", "ed_code"
    ])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(out_path, index=False)

    print(f"\nWrote {len(out_df):,} rows → {out_path}  ({skipped} skipped)", file=sys.stderr)
    print(str(out_path))  # stdout: just the path, easy to pipe


if __name__ == "__main__":
    main()
