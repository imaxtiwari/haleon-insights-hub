-- ============================================================
-- Haleon E-Pharm Tracker — D1 schema
-- ============================================================

-- ------------------------------------------------------------
-- Reference tables (slow-changing catalog data)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platforms (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS brands (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS skus (
  id        TEXT PRIMARY KEY,
  brand_id  TEXT NOT NULL REFERENCES brands(id),
  name      TEXT NOT NULL,
  pack_size TEXT NOT NULL,
  mrp       INTEGER NOT NULL
);

-- Per-platform external IDs for each SKU (one row per SKU × platform).
-- Normalised so adding a 5th platform never requires a schema change.
CREATE TABLE IF NOT EXISTS sku_platform_ids (
  sku_id      TEXT NOT NULL REFERENCES skus(id),
  platform    TEXT NOT NULL REFERENCES platforms(id),
  external_id TEXT,
  PRIMARY KEY (sku_id, platform)
);

CREATE TABLE IF NOT EXISTS competitor_skus (
  id          TEXT PRIMARY KEY,
  brand_name  TEXT NOT NULL,
  name        TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id)
);

-- ------------------------------------------------------------
-- Upload tracking
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS uploads (
  id          TEXT PRIMARY KEY,
  week_ending TEXT    NOT NULL,
  platform    TEXT    NOT NULL REFERENCES platforms(id),
  uploaded_by TEXT    NOT NULL,
  uploaded_at TEXT    NOT NULL,
  row_count   INTEGER NOT NULL,
  status      TEXT    NOT NULL CHECK(status IN ('committed', 'processing', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_uploads_week ON uploads(week_ending, platform);

-- ------------------------------------------------------------
-- Platform-level weekly metrics
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_metrics (
  platform    TEXT    NOT NULL REFERENCES platforms(id),
  week_ending TEXT    NOT NULL,
  gmv         INTEGER NOT NULL,
  mau         INTEGER NOT NULL,
  aov         INTEGER NOT NULL,
  reach       REAL    NOT NULL,
  PRIMARY KEY (platform, week_ending)
);

-- ------------------------------------------------------------
-- SKU-level weekly offtakes
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS offtakes (
  sku_id      TEXT    NOT NULL REFERENCES skus(id),
  platform    TEXT    NOT NULL REFERENCES platforms(id),
  week_ending TEXT    NOT NULL,
  units       INTEGER NOT NULL,
  gmv         INTEGER NOT NULL,
  PRIMARY KEY (sku_id, platform, week_ending)
);

CREATE INDEX IF NOT EXISTS idx_offtakes_platform_week ON offtakes(platform, week_ending);

-- ------------------------------------------------------------
-- SKU listing status
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS listings (
  sku_id      TEXT NOT NULL REFERENCES skus(id),
  platform    TEXT NOT NULL REFERENCES platforms(id),
  week_ending TEXT NOT NULL,
  status      TEXT NOT NULL CHECK(status IN ('listed', 'unlisted', 'oos')),
  PRIMARY KEY (sku_id, platform, week_ending)
);

CREATE INDEX IF NOT EXISTS idx_listings_platform_week ON listings(platform, week_ending);

-- ------------------------------------------------------------
-- Keyword visibility / search rank
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS visibility (
  brand_id    TEXT    NOT NULL REFERENCES brands(id),
  keyword     TEXT    NOT NULL,
  platform    TEXT    NOT NULL REFERENCES platforms(id),
  week_ending TEXT    NOT NULL,
  rank        INTEGER,          -- NULL = not ranked in top 50
  PRIMARY KEY (brand_id, keyword, platform, week_ending)
);

CREATE INDEX IF NOT EXISTS idx_visibility_brand_week ON visibility(brand_id, week_ending);

-- ------------------------------------------------------------
-- Prices (Haleon SKUs + competitor SKUs in one table)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prices (
  item_id     TEXT    NOT NULL,
  item_kind   TEXT    NOT NULL CHECK(item_kind IN ('sku', 'comp')),
  platform    TEXT    NOT NULL REFERENCES platforms(id),
  week_ending TEXT    NOT NULL,
  price       INTEGER NOT NULL,
  PRIMARY KEY (item_id, item_kind, platform, week_ending)
);

CREATE INDEX IF NOT EXISTS idx_prices_platform_week ON prices(platform, week_ending);

-- ------------------------------------------------------------
-- Fair-share targets (editable by analyst in the UI)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fair_shares (
  brand_id   TEXT NOT NULL REFERENCES brands(id),
  platform   TEXT NOT NULL REFERENCES platforms(id),
  target_pct REAL NOT NULL,
  PRIMARY KEY (brand_id, platform)
);
