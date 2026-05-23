#!/usr/bin/env python3
"""
Extract brand market share data from the Market Share report Base sheet
and emit INSERT OR IGNORE SQL for migrations/0006_brand_market_share.sql.

Usage:
    python scripts/seed_market_share.py <path_to_market_share.xlsx> [>> migrations/0006_brand_market_share.sql]

The script reads all rows where Channel is "Amazon" or "Zepto",
maps brand names to Haleon brand IDs, and emits rows for Jan-2023 to Apr-2026.

Output is written to stdout so you can review before appending to the migration.
"""

import sys
import re
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("pandas not installed. Run: pip install pandas openpyxl", file=sys.stderr)
    sys.exit(1)

# ── Brand name → brand_id mapping ─────────────────────────────────────────────
BRAND_MAP: dict[str, str] = {
    # oral care
    "paste":          "paste",
    "toothpaste":     "paste",
    "brush":          "brush",
    "toothbrush":     "brush",
    "parodontax":     "parodontax",
    "pronamel":       "pronamel",
    "mouthwash":      "mouthwash",
    "polident":       "polident",
    # pain / topical
    "crocin":         "crocin",
    "iodex":          "iodex",
    "voltaren":       "voltaren",
    # health / nutrition
    "centrum":        "centrum",
    "ostocalcium":    "ostocalcium",
    # gast / ent
    "eno":            "eno",
    "otrivin":        "otrivin",
}

# ── Channel → platform_id mapping ─────────────────────────────────────────────
PLATFORM_MAP: dict[str, str] = {
    "amazon":          "amazon_pharmacy",
    "amazon pharmacy": "amazon_pharmacy",
    "zepto":           "zepto",
}

# Channels to skip (not in our app)
SKIP_CHANNELS = {"blinkit", "bigbasket", "big basket", "fk", "flipkart", "swiggy", "myntra"}


def normalise(s: str) -> str:
    return re.sub(r"\s+", " ", str(s).strip().lower())


def brand_to_id(raw: str) -> str | None:
    n = normalise(raw)
    for key, bid in BRAND_MAP.items():
        if key in n:
            return bid
    return None


def channel_to_platform(raw: str) -> str | None:
    n = normalise(raw)
    if any(skip in n for skip in SKIP_CHANNELS):
        return None
    for key, pid in PLATFORM_MAP.items():
        if key in n:
            return pid
    return None


def period_from_month(month_val) -> str | None:
    """Convert various month representations to YYYY-MM string."""
    if pd.isna(month_val):
        return None
    if isinstance(month_val, str):
        # Try "Jan-2023", "January 2023", "2023-01", etc.
        for fmt in ("%b-%Y", "%B-%Y", "%b %Y", "%B %Y", "%Y-%m", "%m-%Y"):
            try:
                import datetime
                d = datetime.datetime.strptime(month_val.strip(), fmt)
                return d.strftime("%Y-%m")
            except ValueError:
                continue
        return None
    # pandas Timestamp or datetime
    try:
        return pd.Timestamp(month_val).strftime("%Y-%m")
    except Exception:
        return None


def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <market_share.xlsx>", file=sys.stderr)
        sys.exit(1)

    xlsx_path = Path(sys.argv[1])
    if not xlsx_path.exists():
        print(f"File not found: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    print(f"-- Reading: {xlsx_path}", file=sys.stderr)

    # Try to find the Base sheet
    xl = pd.ExcelFile(xlsx_path)
    base_sheet = None
    for name in xl.sheet_names:
        if "base" in name.lower():
            base_sheet = name
            break
    if base_sheet is None:
        print(f"No 'Base' sheet found. Available: {xl.sheet_names}", file=sys.stderr)
        print("Using first sheet instead.", file=sys.stderr)
        base_sheet = xl.sheet_names[0]

    print(f"-- Using sheet: {base_sheet}", file=sys.stderr)
    df = pd.read_excel(xlsx_path, sheet_name=base_sheet, header=0)
    print(f"-- Columns: {list(df.columns)}", file=sys.stderr)
    print(f"-- Rows: {len(df)}", file=sys.stderr)

    # Detect column names flexibly
    col_map: dict[str, str] = {}
    for col in df.columns:
        n = normalise(str(col))
        if "month" in n and "col_month" not in col_map:
            col_map["month"] = col
        elif ("brand" in n or "l2" in n) and "col_brand" not in col_map and "share" not in n:
            col_map["brand"] = col
        elif "share" in n and ("%" in n or "pct" in n or "share" in n):
            col_map["share"] = col
        elif "channel" in n:
            col_map["channel"] = col

    print(f"-- Detected columns: {col_map}", file=sys.stderr)

    required = ["month", "brand", "share", "channel"]
    missing = [k for k in required if k not in col_map]
    if missing:
        print(f"Could not detect columns: {missing}. Please check column headers.", file=sys.stderr)
        print("Available columns:", list(df.columns), file=sys.stderr)
        sys.exit(1)

    rows_emitted = 0
    rows_skipped = 0
    seen: set[str] = set()

    print("-- Generating SQL...\n", file=sys.stderr)
    print("-- Auto-generated by scripts/seed_market_share.py")
    print("-- Source: Market Share report, Base sheet")
    print()

    for _, row in df.iterrows():
        period = period_from_month(row[col_map["month"]])
        if period is None:
            rows_skipped += 1
            continue
        # Only Jan-2023 to Apr-2026
        if period < "2023-01" or period > "2026-04":
            rows_skipped += 1
            continue

        platform = channel_to_platform(str(row[col_map["channel"]]))
        if platform is None:
            rows_skipped += 1
            continue

        brand_id = brand_to_id(str(row[col_map["brand"]]))
        if brand_id is None:
            print(f"  -- WARN: unrecognised brand '{row[col_map['brand']]}' — skipped", file=sys.stderr)
            rows_skipped += 1
            continue

        share_raw = row[col_map["share"]]
        try:
            share_pct = float(share_raw)
            # If stored as fraction (0–1) rather than percent, convert
            if share_pct <= 1.0:
                share_pct = share_pct * 100.0
        except (ValueError, TypeError):
            rows_skipped += 1
            continue

        row_id = f"{brand_id}|{platform}|{period}"
        if row_id in seen:
            rows_skipped += 1
            continue
        seen.add(row_id)

        print(
            f"INSERT OR IGNORE INTO brand_market_share (id, brand_id, platform, period, share_pct) VALUES "
            f"('{row_id}', '{brand_id}', '{platform}', '{period}', {share_pct:.4f});"
        )
        rows_emitted += 1

    print(f"\n-- Done: {rows_emitted} rows inserted, {rows_skipped} skipped", file=sys.stderr)


if __name__ == "__main__":
    main()
