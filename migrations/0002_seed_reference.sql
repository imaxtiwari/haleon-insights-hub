-- Seed all slow-changing reference data.
-- Safe to re-run: INSERT OR IGNORE throughout.

-- Platforms
INSERT OR IGNORE INTO platforms (id, label) VALUES
  ('pharmeasy',       'PharmEasy'),
  ('tata_1mg',        'Tata 1mg'),
  ('zepto',           'Zepto Pharmacy'),
  ('amazon_pharmacy', 'Amazon Pharmacy');

-- Categories
INSERT OR IGNORE INTO categories (id, name) VALUES
  ('oral',    'Oral Care'),
  ('pain',    'Pain Relief'),
  ('mvm',     'Multivitamins'),
  ('cold',    'Cold & Flu'),
  ('antacid', 'Antacids');

-- Brands
INSERT OR IGNORE INTO brands (id, name, category_id) VALUES
  ('sensodyne', 'Sensodyne', 'oral'),
  ('crocin',    'Crocin',    'pain'),
  ('panadol',   'Panadol',   'pain'),
  ('voltaren',  'Voltaren',  'pain'),
  ('centrum',   'Centrum',   'mvm'),
  ('otrivin',   'Otrivin',   'cold'),
  ('eno',       'ENO',       'antacid');

-- SKUs
INSERT OR IGNORE INTO skus (id, brand_id, name, pack_size, mrp) VALUES
  ('sk-sen-1','sensodyne','Sensodyne Rapid Relief 75g','75g',220),
  ('sk-sen-2','sensodyne','Sensodyne Fresh Mint 70g','70g',165),
  ('sk-sen-3','sensodyne','Sensodyne Repair & Protect 70g','70g',240),
  ('sk-sen-4','sensodyne','Sensodyne Original 70g','70g',155),
  ('sk-sen-5','sensodyne','Sensodyne Whitening 70g','70g',180),
  ('sk-sen-6','sensodyne','Sensodyne Sensitivity & Gum 75g','75g',230),
  ('sk-sen-7','sensodyne','Sensodyne Deep Clean 70g','70g',175),
  ('sk-cro-1','crocin','Crocin Advance 500mg 15 tabs','15 tabs',40),
  ('sk-cro-2','crocin','Crocin Pain Relief 650mg 15 tabs','15 tabs',65),
  ('sk-cro-3','crocin','Crocin Cold & Flu Max 10 tabs','10 tabs',90),
  ('sk-cro-4','crocin','Crocin Cold Max 10 tabs','10 tabs',85),
  ('sk-cro-5','crocin','Crocin Quick Cool Strip 10 tabs','10 tabs',70),
  ('sk-cro-6','crocin','Crocin 500mg 20 tabs','20 tabs',50),
  ('sk-pan-1','panadol','Panadol Extra 500mg 10 tabs','10 tabs',55),
  ('sk-pan-2','panadol','Panadol Cold + Flu All-in-One 10 tabs','10 tabs',95),
  ('sk-pan-3','panadol','Panadol Advance 500mg 16 tabs','16 tabs',75),
  ('sk-pan-4','panadol','Panadol Actifast 500mg 14 tabs','14 tabs',80),
  ('sk-vol-1','voltaren','Voltaren Emulgel 50g','50g',280),
  ('sk-vol-2','voltaren','Voltaren Emulgel 30g','30g',195),
  ('sk-vol-3','voltaren','Voltaren Emulgel 100g','100g',520),
  ('sk-vol-4','voltaren','Voltaren Plus 20 tabs','20 tabs',140),
  ('sk-vol-5','voltaren','Voltaren Rapid 25mg 10 tabs','10 tabs',110),
  ('sk-cen-1','centrum','Centrum Adults 30 tabs','30 tabs',420),
  ('sk-cen-2','centrum','Centrum Women 30 tabs','30 tabs',440),
  ('sk-cen-3','centrum','Centrum Men 30 tabs','30 tabs',440),
  ('sk-cen-4','centrum','Centrum Adults 50+ 30 tabs','30 tabs',460),
  ('sk-cen-5','centrum','Centrum Kids Gummies 30 count','30 count',480),
  ('sk-cen-6','centrum','Centrum Adults 60 tabs','60 tabs',780),
  ('sk-otr-1','otrivin','Otrivin Adult Nasal Spray 10ml','10ml',125),
  ('sk-otr-2','otrivin','Otrivin Plus 10ml','10ml',155),
  ('sk-otr-3','otrivin','Otrivin Baby Drops 10ml','10ml',110),
  ('sk-otr-4','otrivin','Otrivin Saline Drops 10ml','10ml',95),
  ('sk-otr-5','otrivin','Otrivin Menthol Plus 10ml','10ml',165),
  ('sk-eno-1','eno','ENO Lemon 5g sachet x30','5g x30',150),
  ('sk-eno-2','eno','ENO Orange 5g sachet x30','5g x30',150),
  ('sk-eno-3','eno','ENO Regular 100g bottle','100g',110),
  ('sk-eno-4','eno','ENO Cool Lemon 5g sachet x30','5g x30',155),
  ('sk-eno-5','eno','ENO Lemon 100g bottle','100g',115),
  ('sk-eno-6','eno','ENO Masala Lime 5g sachet x10','5g x10',55);

-- SKU platform external IDs (PE-*, TM-*, ZP-*, AM-*)
INSERT OR IGNORE INTO sku_platform_ids (sku_id, platform, external_id) VALUES
  ('sk-sen-1','pharmeasy','PE-SEN1'),('sk-sen-1','tata_1mg','TM-SEN1'),('sk-sen-1','zepto','ZP-SEN1'),('sk-sen-1','amazon_pharmacy','AM-SEN1'),
  ('sk-sen-2','pharmeasy','PE-SEN2'),('sk-sen-2','tata_1mg','TM-SEN2'),('sk-sen-2','zepto','ZP-SEN2'),('sk-sen-2','amazon_pharmacy','AM-SEN2'),
  ('sk-sen-3','pharmeasy','PE-SEN3'),('sk-sen-3','tata_1mg','TM-SEN3'),('sk-sen-3','zepto','ZP-SEN3'),('sk-sen-3','amazon_pharmacy','AM-SEN3'),
  ('sk-sen-4','pharmeasy','PE-SEN4'),('sk-sen-4','tata_1mg','TM-SEN4'),('sk-sen-4','zepto','ZP-SEN4'),('sk-sen-4','amazon_pharmacy','AM-SEN4'),
  ('sk-sen-5','pharmeasy','PE-SEN5'),('sk-sen-5','tata_1mg','TM-SEN5'),('sk-sen-5','zepto','ZP-SEN5'),('sk-sen-5','amazon_pharmacy','AM-SEN5'),
  ('sk-sen-6','pharmeasy','PE-SEN6'),('sk-sen-6','tata_1mg','TM-SEN6'),('sk-sen-6','zepto','ZP-SEN6'),('sk-sen-6','amazon_pharmacy','AM-SEN6'),
  ('sk-sen-7','pharmeasy','PE-SEN7'),('sk-sen-7','tata_1mg','TM-SEN7'),('sk-sen-7','zepto','ZP-SEN7'),('sk-sen-7','amazon_pharmacy','AM-SEN7'),
  ('sk-cro-1','pharmeasy','PE-CRO1'),('sk-cro-1','tata_1mg','TM-CRO1'),('sk-cro-1','zepto','ZP-CRO1'),('sk-cro-1','amazon_pharmacy','AM-CRO1'),
  ('sk-cro-2','pharmeasy','PE-CRO2'),('sk-cro-2','tata_1mg','TM-CRO2'),('sk-cro-2','zepto','ZP-CRO2'),('sk-cro-2','amazon_pharmacy','AM-CRO2'),
  ('sk-cro-3','pharmeasy','PE-CRO3'),('sk-cro-3','tata_1mg','TM-CRO3'),('sk-cro-3','zepto','ZP-CRO3'),('sk-cro-3','amazon_pharmacy','AM-CRO3'),
  ('sk-cro-4','pharmeasy','PE-CRO4'),('sk-cro-4','tata_1mg','TM-CRO4'),('sk-cro-4','zepto','ZP-CRO4'),('sk-cro-4','amazon_pharmacy','AM-CRO4'),
  ('sk-cro-5','pharmeasy','PE-CRO5'),('sk-cro-5','tata_1mg','TM-CRO5'),('sk-cro-5','zepto','ZP-CRO5'),('sk-cro-5','amazon_pharmacy','AM-CRO5'),
  ('sk-cro-6','pharmeasy','PE-CRO6'),('sk-cro-6','tata_1mg','TM-CRO6'),('sk-cro-6','zepto','ZP-CRO6'),('sk-cro-6','amazon_pharmacy','AM-CRO6'),
  ('sk-pan-1','pharmeasy','PE-PAN1'),('sk-pan-1','tata_1mg','TM-PAN1'),('sk-pan-1','zepto','ZP-PAN1'),('sk-pan-1','amazon_pharmacy','AM-PAN1'),
  ('sk-pan-2','pharmeasy','PE-PAN2'),('sk-pan-2','tata_1mg','TM-PAN2'),('sk-pan-2','zepto','ZP-PAN2'),('sk-pan-2','amazon_pharmacy','AM-PAN2'),
  ('sk-pan-3','pharmeasy','PE-PAN3'),('sk-pan-3','tata_1mg','TM-PAN3'),('sk-pan-3','zepto','ZP-PAN3'),('sk-pan-3','amazon_pharmacy','AM-PAN3'),
  ('sk-pan-4','pharmeasy','PE-PAN4'),('sk-pan-4','tata_1mg','TM-PAN4'),('sk-pan-4','zepto','ZP-PAN4'),('sk-pan-4','amazon_pharmacy','AM-PAN4'),
  ('sk-vol-1','pharmeasy','PE-VOL1'),('sk-vol-1','tata_1mg','TM-VOL1'),('sk-vol-1','zepto','ZP-VOL1'),('sk-vol-1','amazon_pharmacy','AM-VOL1'),
  ('sk-vol-2','pharmeasy','PE-VOL2'),('sk-vol-2','tata_1mg','TM-VOL2'),('sk-vol-2','zepto','ZP-VOL2'),('sk-vol-2','amazon_pharmacy','AM-VOL2'),
  ('sk-vol-3','pharmeasy','PE-VOL3'),('sk-vol-3','tata_1mg','TM-VOL3'),('sk-vol-3','zepto','ZP-VOL3'),('sk-vol-3','amazon_pharmacy','AM-VOL3'),
  ('sk-vol-4','pharmeasy','PE-VOL4'),('sk-vol-4','tata_1mg','TM-VOL4'),('sk-vol-4','zepto','ZP-VOL4'),('sk-vol-4','amazon_pharmacy','AM-VOL4'),
  ('sk-vol-5','pharmeasy','PE-VOL5'),('sk-vol-5','tata_1mg','TM-VOL5'),('sk-vol-5','zepto','ZP-VOL5'),('sk-vol-5','amazon_pharmacy','AM-VOL5'),
  ('sk-cen-1','pharmeasy','PE-CEN1'),('sk-cen-1','tata_1mg','TM-CEN1'),('sk-cen-1','zepto','ZP-CEN1'),('sk-cen-1','amazon_pharmacy','AM-CEN1'),
  ('sk-cen-2','pharmeasy','PE-CEN2'),('sk-cen-2','tata_1mg','TM-CEN2'),('sk-cen-2','zepto','ZP-CEN2'),('sk-cen-2','amazon_pharmacy','AM-CEN2'),
  ('sk-cen-3','pharmeasy','PE-CEN3'),('sk-cen-3','tata_1mg','TM-CEN3'),('sk-cen-3','zepto','ZP-CEN3'),('sk-cen-3','amazon_pharmacy','AM-CEN3'),
  ('sk-cen-4','pharmeasy','PE-CEN4'),('sk-cen-4','tata_1mg','TM-CEN4'),('sk-cen-4','zepto','ZP-CEN4'),('sk-cen-4','amazon_pharmacy','AM-CEN4'),
  ('sk-cen-5','pharmeasy','PE-CEN5'),('sk-cen-5','tata_1mg','TM-CEN5'),('sk-cen-5','zepto','ZP-CEN5'),('sk-cen-5','amazon_pharmacy','AM-CEN5'),
  ('sk-cen-6','pharmeasy','PE-CEN6'),('sk-cen-6','tata_1mg','TM-CEN6'),('sk-cen-6','zepto','ZP-CEN6'),('sk-cen-6','amazon_pharmacy','AM-CEN6'),
  ('sk-otr-1','pharmeasy','PE-OTR1'),('sk-otr-1','tata_1mg','TM-OTR1'),('sk-otr-1','zepto','ZP-OTR1'),('sk-otr-1','amazon_pharmacy','AM-OTR1'),
  ('sk-otr-2','pharmeasy','PE-OTR2'),('sk-otr-2','tata_1mg','TM-OTR2'),('sk-otr-2','zepto','ZP-OTR2'),('sk-otr-2','amazon_pharmacy','AM-OTR2'),
  ('sk-otr-3','pharmeasy','PE-OTR3'),('sk-otr-3','tata_1mg','TM-OTR3'),('sk-otr-3','zepto','ZP-OTR3'),('sk-otr-3','amazon_pharmacy','AM-OTR3'),
  ('sk-otr-4','pharmeasy','PE-OTR4'),('sk-otr-4','tata_1mg','TM-OTR4'),('sk-otr-4','zepto','ZP-OTR4'),('sk-otr-4','amazon_pharmacy','AM-OTR4'),
  ('sk-otr-5','pharmeasy','PE-OTR5'),('sk-otr-5','tata_1mg','TM-OTR5'),('sk-otr-5','zepto','ZP-OTR5'),('sk-otr-5','amazon_pharmacy','AM-OTR5'),
  ('sk-eno-1','pharmeasy','PE-ENO1'),('sk-eno-1','tata_1mg','TM-ENO1'),('sk-eno-1','zepto','ZP-ENO1'),('sk-eno-1','amazon_pharmacy','AM-ENO1'),
  ('sk-eno-2','pharmeasy','PE-ENO2'),('sk-eno-2','tata_1mg','TM-ENO2'),('sk-eno-2','zepto','ZP-ENO2'),('sk-eno-2','amazon_pharmacy','AM-ENO2'),
  ('sk-eno-3','pharmeasy','PE-ENO3'),('sk-eno-3','tata_1mg','TM-ENO3'),('sk-eno-3','zepto','ZP-ENO3'),('sk-eno-3','amazon_pharmacy','AM-ENO3'),
  ('sk-eno-4','pharmeasy','PE-ENO4'),('sk-eno-4','tata_1mg','TM-ENO4'),('sk-eno-4','zepto','ZP-ENO4'),('sk-eno-4','amazon_pharmacy','AM-ENO4'),
  ('sk-eno-5','pharmeasy','PE-ENO5'),('sk-eno-5','tata_1mg','TM-ENO5'),('sk-eno-5','zepto','ZP-ENO5'),('sk-eno-5','amazon_pharmacy','AM-ENO5'),
  ('sk-eno-6','pharmeasy','PE-ENO6'),('sk-eno-6','tata_1mg','TM-ENO6'),('sk-eno-6','zepto','ZP-ENO6'),('sk-eno-6','amazon_pharmacy','AM-ENO6');

-- Competitor SKUs
INSERT OR IGNORE INTO competitor_skus (id, brand_name, name, category_id) VALUES
  ('c-or-1','Colgate','Colgate Sensitive Pro Relief 80g','oral'),
  ('c-or-2','Vantej','Vantej 75g','oral'),
  ('c-or-3','Closeup','Closeup Sensitive Expert 75g','oral'),
  ('c-pa-1','Saridon','Saridon 10 tabs','pain'),
  ('c-pa-2','Combiflam','Combiflam 20 tabs','pain'),
  ('c-pa-3','Disprin','Disprin 10 tabs','pain'),
  ('c-pa-4','Volini','Volini Gel 50g','pain'),
  ('c-mv-1','Revital H','Revital H 30 caps','mvm'),
  ('c-mv-2','Supradyn','Supradyn Daily 15 tabs','mvm'),
  ('c-mv-3','A to Z','A to Z Gold 15 tabs','mvm'),
  ('c-co-1','Nasivion','Nasivion Adult 10ml','cold'),
  ('c-co-2','Vicks','Vicks Inhaler','cold'),
  ('c-co-3','D-Cold','D-Cold Total 10 tabs','cold'),
  ('c-an-1','Digene','Digene Mint 200ml','antacid'),
  ('c-an-2','Gelusil','Gelusil MPS 200ml','antacid'),
  ('c-an-3','Pudin Hara','Pudin Hara 30 caps','antacid');

-- Default fair-share targets (editable in the UI)
INSERT OR IGNORE INTO fair_shares (brand_id, platform, target_pct) VALUES
  ('sensodyne','pharmeasy',22),('sensodyne','tata_1mg',22),('sensodyne','zepto',22),('sensodyne','amazon_pharmacy',22),
  ('crocin','pharmeasy',18),('crocin','tata_1mg',18),('crocin','zepto',18),('crocin','amazon_pharmacy',18),
  ('panadol','pharmeasy',12),('panadol','tata_1mg',12),('panadol','zepto',12),('panadol','amazon_pharmacy',12),
  ('voltaren','pharmeasy',14),('voltaren','tata_1mg',14),('voltaren','zepto',14),('voltaren','amazon_pharmacy',14),
  ('centrum','pharmeasy',24),('centrum','tata_1mg',24),('centrum','zepto',24),('centrum','amazon_pharmacy',24),
  ('otrivin','pharmeasy',20),('otrivin','tata_1mg',20),('otrivin','zepto',20),('otrivin','amazon_pharmacy',20),
  ('eno','pharmeasy',28),('eno','tata_1mg',28),('eno','zepto',28),('eno','amazon_pharmacy',28);
