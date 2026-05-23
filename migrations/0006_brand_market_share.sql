-- Migration 0006: brand_market_share table
-- Stores actual market share data per brand, platform, and month.
-- Rows are seeded via scripts/seed_market_share.py (run against the Market Share Base sheet).

CREATE TABLE IF NOT EXISTS brand_market_share (
  id               TEXT PRIMARY KEY,          -- e.g. "paste|amazon_pharmacy|2026-04"
  brand_id         TEXT NOT NULL,
  platform         TEXT NOT NULL,
  period           TEXT NOT NULL,             -- "YYYY-MM"
  gmv_inr          INTEGER,                   -- Haleon brand GMV for the period (optional, for future use)
  share_pct        REAL NOT NULL,             -- l2_brand_share% (MRP) value from the source file
  category_gmv_inr INTEGER,                   -- estimated total category GMV (optional)
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX IF NOT EXISTS idx_bms_period   ON brand_market_share(period);
CREATE INDEX IF NOT EXISTS idx_bms_brand    ON brand_market_share(brand_id, platform);
CREATE INDEX IF NOT EXISTS idx_bms_platform ON brand_market_share(platform, period);
