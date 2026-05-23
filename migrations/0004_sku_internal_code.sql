-- Migration 0004: Add internal_code + brand_name_raw to skus; seed fallback category/brand

ALTER TABLE skus ADD COLUMN internal_code TEXT;
ALTER TABLE skus ADD COLUMN brand_name_raw TEXT;

-- Unique index so we can look up (and upsert) by internal_code efficiently.
-- WHERE clause keeps NULLs out of the index (existing rows won't collide).
CREATE UNIQUE INDEX IF NOT EXISTS idx_skus_internal_code
  ON skus(internal_code) WHERE internal_code IS NOT NULL;

-- Fallback category + brand used when an uploaded SKU's brand is unrecognised.
INSERT OR IGNORE INTO categories (id, name) VALUES ('other', 'Other');
INSERT OR IGNORE INTO brands (id, name, category_id) VALUES ('unknown', 'Unknown', 'other');
