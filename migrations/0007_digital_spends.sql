-- Migration 0007: digital_spends table
-- Stores paid media performance data per brand, platform, and month.
-- Rows are seeded via scripts/seed_digital_spends.py (run against the Tata 1mg file).

CREATE TABLE IF NOT EXISTS digital_spends (
  id               TEXT PRIMARY KEY,            -- e.g. "paste|tata_1mg|2026-01"
  brand_id         TEXT NOT NULL,
  platform         TEXT NOT NULL,
  period           TEXT NOT NULL,               -- "YYYY-MM"
  paid_spend_inr   INTEGER NOT NULL DEFAULT 0,
  paid_sales_inr   INTEGER NOT NULL DEFAULT 0,
  paid_roas        REAL    NOT NULL DEFAULT 0,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX IF NOT EXISTS idx_ds_period   ON digital_spends(period);
CREATE INDEX IF NOT EXISTS idx_ds_brand    ON digital_spends(brand_id, platform);
CREATE INDEX IF NOT EXISTS idx_ds_platform ON digital_spends(platform, period);
