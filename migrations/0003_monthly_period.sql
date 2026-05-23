-- Migration 0003: Add monthly period columns and purchase_orders table
-- period is stored as YYYY-MM (e.g. "2026-04")
-- week_ending columns are kept for backward compatibility

ALTER TABLE offtakes   ADD COLUMN period TEXT;
ALTER TABLE listings   ADD COLUMN period TEXT;
ALTER TABLE prices     ADD COLUMN period TEXT;
ALTER TABLE visibility ADD COLUMN period TEXT;

-- Indexes for period-based queries
CREATE INDEX IF NOT EXISTS idx_offtakes_period   ON offtakes(platform, period);
CREATE INDEX IF NOT EXISTS idx_listings_period   ON listings(platform, period);
CREATE INDEX IF NOT EXISTS idx_prices_period     ON prices(platform, period);
CREATE INDEX IF NOT EXISTS idx_visibility_period ON visibility(brand_id, period);

-- Purchase orders (from Amazon pharma / stockist invoice format)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id             TEXT PRIMARY KEY,
  platform       TEXT NOT NULL REFERENCES platforms(id),
  period         TEXT NOT NULL,
  sku_id         TEXT REFERENCES skus(id),
  product_name   TEXT NOT NULL,
  asin           TEXT,
  location       TEXT,
  stockist_name  TEXT,
  ed_code        TEXT,
  qty            INTEGER NOT NULL,
  mrp            REAL    NOT NULL,
  invoice_date   TEXT    NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_po_platform_period ON purchase_orders(platform, period);
