-- Migration 0012: seed actual digital spends from Haleon Tata 1MG Data Jan-Apr 2026
-- Source: "Copy of Haleon - Tata 1MG Data - Jan-26 - Apr-26.xlsx", sheet "Tata 1MG"
-- Brand mapping: Sensodyne→paste, Parodontax→parodontax, Centrum→centrum,
--                Eno→eno, Iodex→iodex (zeros omitted), Otrivin+Crocin→otrivin

-- Clear existing mock / seed rows for tata_1mg so we start clean
DELETE FROM digital_spends WHERE platform = 'tata_1mg';

-- ── Sensodyne (paste) ────────────────────────────────────────────────────────
INSERT INTO digital_spends (id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas)
VALUES
  ('paste|tata_1mg|2026-01', 'paste', 'tata_1mg', '2026-01',  98404, 126494, 1.2855),
  ('paste|tata_1mg|2026-02', 'paste', 'tata_1mg', '2026-02',  80637,  98513, 1.2217),
  ('paste|tata_1mg|2026-03', 'paste', 'tata_1mg', '2026-03',  93977,  97650, 1.0391),
  ('paste|tata_1mg|2026-04', 'paste', 'tata_1mg', '2026-04', 118020,  78868, 0.6683);

-- ── Parodontax ───────────────────────────────────────────────────────────────
INSERT INTO digital_spends (id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas)
VALUES
  ('parodontax|tata_1mg|2026-01', 'parodontax', 'tata_1mg', '2026-01', 53437, 22469, 0.4205),
  ('parodontax|tata_1mg|2026-02', 'parodontax', 'tata_1mg', '2026-02', 30388, 14966, 0.4925),
  ('parodontax|tata_1mg|2026-03', 'parodontax', 'tata_1mg', '2026-03', 30969, 13026, 0.4206),
  ('parodontax|tata_1mg|2026-04', 'parodontax', 'tata_1mg', '2026-04', 27846, 12250, 0.4399);

-- ── Centrum ──────────────────────────────────────────────────────────────────
INSERT INTO digital_spends (id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas)
VALUES
  ('centrum|tata_1mg|2026-01', 'centrum', 'tata_1mg', '2026-01', 497652, 341833, 0.6869),
  ('centrum|tata_1mg|2026-02', 'centrum', 'tata_1mg', '2026-02', 646767, 506104, 0.7825),
  ('centrum|tata_1mg|2026-03', 'centrum', 'tata_1mg', '2026-03', 459092, 540658, 1.1777),
  ('centrum|tata_1mg|2026-04', 'centrum', 'tata_1mg', '2026-04', 647682, 372823, 0.5756);

-- ── Eno ──────────────────────────────────────────────────────────────────────
INSERT INTO digital_spends (id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas)
VALUES
  ('eno|tata_1mg|2026-01', 'eno', 'tata_1mg', '2026-01', 18480, 33243, 1.7989);

-- ── Otrivin + Crocin (combined; stored under otrivin) ────────────────────────
INSERT INTO digital_spends (id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas)
VALUES
  ('otrivin|tata_1mg|2026-04', 'otrivin', 'tata_1mg', '2026-04', 9610, 4525, 0.4709);
