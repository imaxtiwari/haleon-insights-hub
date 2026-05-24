-- Migration 0010: category-level market share from Market Share Grid screenshot
-- Replaces brand-level estimates with actuals per category × platform

CREATE TABLE IF NOT EXISTS category_market_share (
  id         TEXT PRIMARY KEY,  -- "oral|tata_1mg|2026-04"
  category_id TEXT NOT NULL,
  platform   TEXT NOT NULL REFERENCES platforms(id),
  period     TEXT NOT NULL,
  share_pct  REAL,              -- NULL = data not available (Amazon)
  gap_cr     REAL               -- NULL = "Track" (no Rs Cr figure yet)
);

CREATE INDEX IF NOT EXISTS idx_cat_ms_period ON category_market_share(period, category_id);

-- ── Apr 2026 actuals ────────────────────────────────────────────────────────
-- Oral Care  (brands: Brush, Mouthwash, Parodontax, Paste, Polident, Pronamel)
INSERT OR REPLACE INTO category_market_share VALUES ('oral|tata_1mg|2026-04',        'oral',    'tata_1mg',        '2026-04',  5.0,   5.7);
INSERT OR REPLACE INTO category_market_share VALUES ('oral|pharmeasy|2026-04',        'oral',    'pharmeasy',       '2026-04', 24.5,   5.7);
INSERT OR REPLACE INTO category_market_share VALUES ('oral|zepto|2026-04',            'oral',    'zepto',           '2026-04', 60.3,   5.7);
INSERT OR REPLACE INTO category_market_share VALUES ('oral|amazon_pharmacy|2026-04',  'oral',    'amazon_pharmacy', '2026-04', NULL,  NULL);

-- VMS  (brands: Centrum, Ostocalcium)
INSERT OR REPLACE INTO category_market_share VALUES ('mvm|tata_1mg|2026-04',          'mvm',     'tata_1mg',        '2026-04',  6.0,   1.0);
INSERT OR REPLACE INTO category_market_share VALUES ('mvm|pharmeasy|2026-04',          'mvm',     'pharmeasy',       '2026-04',  2.76,  1.0);
INSERT OR REPLACE INTO category_market_share VALUES ('mvm|zepto|2026-04',              'mvm',     'zepto',           '2026-04', 13.4,   1.0);
INSERT OR REPLACE INTO category_market_share VALUES ('mvm|amazon_pharmacy|2026-04',    'mvm',     'amazon_pharmacy', '2026-04', NULL,  NULL);

-- Pain Relief  (brands: Crocin, Iodex, Voltaren)
INSERT OR REPLACE INTO category_market_share VALUES ('pain|tata_1mg|2026-04',         'pain',    'tata_1mg',        '2026-04',  3.0,  NULL);
INSERT OR REPLACE INTO category_market_share VALUES ('pain|pharmeasy|2026-04',         'pain',    'pharmeasy',       '2026-04',  3.0,  NULL);
INSERT OR REPLACE INTO category_market_share VALUES ('pain|zepto|2026-04',             'pain',    'zepto',           '2026-04',  7.4,  NULL);
INSERT OR REPLACE INTO category_market_share VALUES ('pain|amazon_pharmacy|2026-04',   'pain',    'amazon_pharmacy', '2026-04', NULL,  NULL);

-- Respiratory  (brand: Otrivin)
INSERT OR REPLACE INTO category_market_share VALUES ('cold|tata_1mg|2026-04',         'cold',    'tata_1mg',        '2026-04',  8.0,   8.9);
INSERT OR REPLACE INTO category_market_share VALUES ('cold|pharmeasy|2026-04',         'cold',    'pharmeasy',       '2026-04', 47.6,   8.9);
INSERT OR REPLACE INTO category_market_share VALUES ('cold|zepto|2026-04',             'cold',    'zepto',           '2026-04',  9.0,   8.9);
INSERT OR REPLACE INTO category_market_share VALUES ('cold|amazon_pharmacy|2026-04',   'cold',    'amazon_pharmacy', '2026-04', NULL,  NULL);

-- Digestive  (brand: ENO)
INSERT OR REPLACE INTO category_market_share VALUES ('antacid|tata_1mg|2026-04',      'antacid', 'tata_1mg',        '2026-04', 12.0,   0.5);
INSERT OR REPLACE INTO category_market_share VALUES ('antacid|pharmeasy|2026-04',      'antacid', 'pharmeasy',       '2026-04',  4.73,  0.5);
INSERT OR REPLACE INTO category_market_share VALUES ('antacid|zepto|2026-04',          'antacid', 'zepto',           '2026-04', 14.9,   0.5);
INSERT OR REPLACE INTO category_market_share VALUES ('antacid|amazon_pharmacy|2026-04','antacid', 'amazon_pharmacy', '2026-04', NULL,  NULL);

-- ── Update fair shares to match category actuals ────────────────────────────
-- Fair share = best observed platform share for that category
UPDATE fair_shares SET target_pct = 60.3 WHERE brand_id IN ('brush','mouthwash','parodontax','paste','polident','pronamel');
UPDATE fair_shares SET target_pct = 13.4 WHERE brand_id IN ('centrum','ostocalcium');
UPDATE fair_shares SET target_pct =  7.4 WHERE brand_id IN ('crocin','iodex','voltaren');
UPDATE fair_shares SET target_pct = 47.6 WHERE brand_id = 'otrivin';
UPDATE fair_shares SET target_pct = 14.9 WHERE brand_id = 'eno';
