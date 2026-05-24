-- Migration 0011: update AOV values across all platform_metrics rows
-- from the Platform Snapshot deck (Tata 1mg=1200, PharmEasy=2500, Amazon=900, Zepto=400)
UPDATE platform_metrics SET aov = 1200 WHERE platform = 'tata_1mg';
UPDATE platform_metrics SET aov = 2500 WHERE platform = 'pharmeasy';
UPDATE platform_metrics SET aov =  900 WHERE platform = 'amazon_pharmacy';
UPDATE platform_metrics SET aov =  400 WHERE platform = 'zepto';
