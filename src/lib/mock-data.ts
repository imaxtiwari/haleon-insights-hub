// Deterministic mock data store for Haleon E-Pharm Tracker.
// All numbers are derived once and frozen so scores/charts stay consistent.

export type Platform = "pharmeasy" | "tata_1mg" | "zepto" | "amazon_pharmacy";
export const PLATFORMS: Platform[] = ["pharmeasy", "tata_1mg", "zepto", "amazon_pharmacy"];
export const PLATFORM_LABEL: Record<Platform, string> = {
  pharmeasy: "PharmEasy",
  tata_1mg: "Tata 1mg",
  zepto: "Zepto Pharmacy",
  amazon_pharmacy: "Amazon Pharmacy",
};

export type Category = { id: string; name: string };
export type Brand = { id: string; name: string; categoryId: string };
export type SKU = {
  id: string;
  brandId: string;
  name: string;
  packSize: string;
  mrp: number;
  internalCode: string;
  ids: Record<Platform, string | null>;
};
export type CompetitorSKU = { id: string; brandName: string; name: string; categoryId: string };

export const categories: Category[] = [
  { id: "oral", name: "Oral Care" },
  { id: "pain", name: "Pain Relief" },
  { id: "mvm", name: "Multivitamins" },
  { id: "cold", name: "Cold & Flu" },
  { id: "antacid", name: "Antacids" },
];

export const brands: Brand[] = [
  { id: "brush",       name: "Sensodyne Brush",    categoryId: "oral" },
  { id: "centrum",     name: "Centrum",             categoryId: "mvm" },
  { id: "crocin",      name: "Crocin",              categoryId: "pain" },
  { id: "eno",         name: "ENO",                 categoryId: "antacid" },
  { id: "iodex",       name: "Iodex",               categoryId: "pain" },
  { id: "mouthwash",   name: "Sensodyne Mouthwash", categoryId: "oral" },
  { id: "ostocalcium", name: "Ostocalcium",          categoryId: "mvm" },
  { id: "otrivin",     name: "Otrivin",              categoryId: "cold" },
  { id: "parodontax",  name: "Parodontax",           categoryId: "oral" },
  { id: "paste",       name: "Sensodyne Paste",      categoryId: "oral" },
  { id: "polident",    name: "Polident",             categoryId: "oral" },
  { id: "pronamel",    name: "Pronamel",             categoryId: "oral" },
  { id: "voltaren",    name: "Voltaren",             categoryId: "pain" },
];

export const skus: SKU[] = [
  // Sensodyne Brush (Oral Care) — 20 SKUs
  { id: "ygbbar1", brandId: "brush", name: "SENSODYNE BRUSH SENSITIVE 1BRUSH_REL", packSize: "Basil po1", mrp: 149, internalCode: "YGBBAR1", ids: pIds("YGBBAR1") },
  { id: "ygbbcr1", brandId: "brush", name: "SENSODYNE BRUSH SENSITIVE 3BRUSH_REL", packSize: "Basil po3", mrp: 399, internalCode: "YGBBCR1", ids: pIds("YGBBCR1") },
  { id: "ygbbfr1", brandId: "brush", name: "SENSODYNE BRUSH SENSITIVE 4BRUSH_REL", packSize: "Basil po4", mrp: 499, internalCode: "YGBBFR1", ids: pIds("YGBBFR1") },
  { id: "ygbdar1", brandId: "brush", name: "SENSODYNE BRUSH DEEPCLEAN 1BRUSH_REL", packSize: "DC Po1", mrp: 149, internalCode: "YGBDAR1", ids: pIds("YGBDAR1") },
  { id: "ygbdbr1", brandId: "brush", name: "SENSODYNE BRUSH DEEPCLEAN 3BRUSH_REL", packSize: "DC Po3", mrp: 399, internalCode: "YGBDBR1", ids: pIds("YGBDBR1") },
  { id: "ygbpar1", brandId: "brush", name: "SENSODYNE BRUSH EXPERT 1BRUSH_REL", packSize: "Exp Po1", mrp: 149, internalCode: "YGBPAR1", ids: pIds("YGBPAR1") },
  { id: "ygbpbr1", brandId: "brush", name: "SENSODYNE BRUSH EXPERT 3BRUSH_REL", packSize: "Exp Po3", mrp: 399, internalCode: "YGBPBR1", ids: pIds("YGBPBR1") },
  { id: "ygbsa00", brandId: "brush", name: "SENSODYNE SENSITIVITY&GUM TB SOFT 12X1", packSize: "S&G po1", mrp: 1199, internalCode: "YGBSA00", ids: pIds("YGBSA00") },
  { id: "ygbsb00", brandId: "brush", name: "SENSODYNE SENSITIVITY&GUM TB SOFT 12X3", packSize: "S&G po3", mrp: 3199, internalCode: "YGBSB00", ids: pIds("YGBSB00") },
  { id: "ygbxa00", brandId: "brush", name: "SENSODYNE BRUSH COMPLETE PROTECT 1BRUSH", packSize: "CP Po1", mrp: 149, internalCode: "YGBXA00", ids: pIds("YGBXA00") },
  { id: "ygbxb00", brandId: "brush", name: "SENSODYNEBRUSH COMPLETE PROTECT 2+1BRUSH", packSize: "CP po3", mrp: 349, internalCode: "YGBXB00", ids: pIds("YGBXB00") },
  { id: "ygbqf00", brandId: "brush", name: "Aquafresh Clean and Flex Toothbrush", packSize: "Flex po3", mrp: 299, internalCode: "YGBQF00", ids: pIds("YGBQF00") },
  { id: "ygbqb00", brandId: "brush", name: "Aquafresh Little Teeth Toothbrush - Bunny", packSize: "Bunny", mrp: 149, internalCode: "YGBQB00", ids: pIds("YGBQB00") },
  { id: "ygbqs00", brandId: "brush", name: "Aquafresh Little Teeth Toothbrush - Shark", packSize: "Shark", mrp: 149, internalCode: "YGBQS00", ids: pIds("YGBQS00") },
  { id: "ygbqt00", brandId: "brush", name: "Aquafresh Little Teeth Toothbrush - Tiger", packSize: "Tiger", mrp: 149, internalCode: "YGBQT00", ids: pIds("YGBQT00") },
  { id: "ygbqa00", brandId: "brush", name: "Aquafresh Little Teeth Toothbrush - Alligator", packSize: "Alligator", mrp: 149, internalCode: "YGBQA00", ids: pIds("YGBQA00") },
  { id: "ygbma00", brandId: "brush", name: "Multicare single", packSize: "Multicare po1", mrp: 179, internalCode: "YGBMA00", ids: pIds("YGBMA00") },
  { id: "ygbmb00", brandId: "brush", name: "Multicare 2+1", packSize: "Multicare po3", mrp: 349, internalCode: "YGBMB00", ids: pIds("YGBMB00") },
  { id: "ygbgc00", brandId: "brush", name: "Gentlecare brush 1+1", packSize: "GC po2", mrp: 299, internalCode: "YGBGC00", ids: pIds("YGBGC00") },
  { id: "ygbeai1", brandId: "brush", name: "SENSODYNE BRUSH ECONOMY 1BRUSH_(12)", packSize: "Eco po12", mrp: 1049, internalCode: "YGBEAI1", ids: pIds("YGBEAI1") },

  // Centrum (Multivitamins) — 30 SKUs
  { id: "ygmad00", brandId: "centrum", name: "CENTRUM SILVER TABLET ADULT 1X30_BOTTLE", packSize: "Adult  30", mrp: 499, internalCode: "YGMAD00", ids: pIds("YGMAD00") },
  { id: "ygmae00", brandId: "centrum", name: "CENTRUM SILVER TABLET ADULT 1X50_BOTTLE", packSize: "Adult 50", mrp: 749, internalCode: "YGMAE00", ids: pIds("YGMAE00") },
  { id: "ygmkd00", brandId: "centrum", name: "CENTRUM KIDS GUMMIES 1X30_BOTTLE", packSize: "Kids 30", mrp: 599, internalCode: "YGMKD00", ids: pIds("YGMKD00") },
  { id: "ygmke00", brandId: "centrum", name: "CENTRUM KIDS GUMMIES 1X50_BOTTLE", packSize: "Kids 50", mrp: 879, internalCode: "YGMKE00", ids: pIds("YGMKE00") },
  { id: "ygmmd00", brandId: "centrum", name: "CENTRUM MEN TABLET ADULT 1X30_BOTTLE", packSize: "Men 30", mrp: 499, internalCode: "YGMMD00", ids: pIds("YGMMD00") },
  { id: "ygmme00", brandId: "centrum", name: "CENTRUM MEN TABLET ADULT 1X50_BOTTLE", packSize: "Men 50", mrp: 749, internalCode: "YGMME00", ids: pIds("YGMME00") },
  { id: "ygmwd00", brandId: "centrum", name: "CENTRUM WOMEN TABLET ADULT 1X30_BOTTLE", packSize: "Women 30", mrp: 499, internalCode: "YGMWD00", ids: pIds("YGMWD00") },
  { id: "ygmwe00", brandId: "centrum", name: "CENTRUM WOMEN TABLET ADULT 1X50_BOTTLE", packSize: "Women 50", mrp: 749, internalCode: "YGMWE00", ids: pIds("YGMWE00") },
  { id: "ygmdf00", brandId: "centrum", name: "CENTRUM ADULT DIG GUMMIES 1X30_BOTTLE", packSize: "Dig gummies", mrp: 599, internalCode: "YGMDF00", ids: pIds("YGMDF00") },
  { id: "ygmgf00", brandId: "centrum", name: "CENTRUM KIDS GROWTH GUMMIES 1X30_BOTTLE", packSize: "Growth Gummies", mrp: 599, internalCode: "YGMGF00", ids: pIds("YGMGF00") },
  { id: "ygmnf00", brandId: "centrum", name: "CENTRUM KIDS IMMUNITY GUMMIES 1X30_BOT", packSize: "Immunity Gummies", mrp: 599, internalCode: "YGMNF00", ids: pIds("YGMNF00") },
  { id: "ygmif00", brandId: "centrum", name: "CENTRUM ADULT IMMUNITY GUMMIES 1X30_BOT", packSize: "Adult Gummies", mrp: 599, internalCode: "YGMIF00", ids: pIds("YGMIF00") },
  { id: "ygmrf00", brandId: "centrum", name: "CENTRUM ADULT SLEEP GUMMIES 1X30_BOTTLE", packSize: "Sleep Gummies", mrp: 599, internalCode: "YGMRF00", ids: pIds("YGMRF00") },
  { id: "ygmod00", brandId: "centrum", name: "CENTRUM OMEGA 3 FISH OIL 1X60_BOTTLE", packSize: "Omega", mrp: 649, internalCode: "YGMOD00", ids: pIds("YGMOD00") },
  { id: "ygmhd00", brandId: "centrum", name: "Biotin", packSize: "Biotin", mrp: 399, internalCode: "YGMHD00", ids: pIds("YGMHD00") },
  { id: "ygmcb00", brandId: "centrum", name: "Women Powder 400", packSize: "wmn pwdr 400", mrp: 649, internalCode: "YGMCB00", ids: pIds("YGMCB00") },
  { id: "ygmtd00", brandId: "centrum", name: "Centrum Men Gummies", packSize: "Men Gummies", mrp: 649, internalCode: "YGMTD00", ids: pIds("YGMTD00") },
  { id: "ygmxb00", brandId: "centrum", name: "Men Powder 400", packSize: "Men pwdr 400", mrp: 649, internalCode: "YGMXB00", ids: pIds("YGMXB00") },
  { id: "ygmyb00", brandId: "centrum", name: "Kids Powder 400", packSize: "Kids pwdr 400", mrp: 649, internalCode: "YGMYB00", ids: pIds("YGMYB00") },
  { id: "ygmud00", brandId: "centrum", name: "Centrum Women Gummies", packSize: "Women Gummies", mrp: 649, internalCode: "YGMUD00", ids: pIds("YGMUD00") },
  { id: "ygmxa00", brandId: "centrum", name: "Men Powder 200", packSize: "Men pwdr 200", mrp: 399, internalCode: "YGMXA00", ids: pIds("YGMXA00") },
  { id: "ygmca00", brandId: "centrum", name: "Women Powder 200", packSize: "wmn pwdr 200", mrp: 399, internalCode: "YGMCA00", ids: pIds("YGMCA00") },
  { id: "ygmya00", brandId: "centrum", name: "Kids Powder 200", packSize: "Kids pwdr 200", mrp: 399, internalCode: "YGMYA00", ids: pIds("YGMYA00") },
  { id: "ygmeb00", brandId: "centrum", name: "CENTRUM ENERGY DE-STRESS GUMMIES1X30_BOT", packSize: "Stress Gummies", mrp: 649, internalCode: "YGMEB00", ids: pIds("YGMEB00") },
  { id: "ygmmc00", brandId: "centrum", name: "CENTRUM MEN TABLET ADULT 1X10_BLISTER", packSize: "Men 10", mrp: 185, internalCode: "YGMMC00", ids: pIds("YGMMC00") },
  { id: "ygmja00", brandId: "centrum", name: "Centrum Joint and Mobility", packSize: "Joint&Mob", mrp: 799, internalCode: "YGMJA00", ids: pIds("YGMJA00") },
  { id: "ygmwc00", brandId: "centrum", name: "CENTRUM WOMEN TABLET ADULT 1X10_BLISTER", packSize: "Women 10", mrp: 185, internalCode: "YGMWC00", ids: pIds("YGMWC00") },
  { id: "ygm2k00", brandId: "centrum", name: "Centrum Recharg Pwdr Kids Orange6X5G_Sac", packSize: "Rechg Kids Orange sixer", mrp: 99, internalCode: "YGM2K00", ids: pIds("YGM2K00") },
  { id: "ygm2o00", brandId: "centrum", name: "Centrum Recharge Pwdr Orange 6X5G Sachet", packSize: "Rechg Adult Orange sixer", mrp: 99, internalCode: "YGM2O00", ids: pIds("YGM2O00") },
  { id: "ygm2m00", brandId: "centrum", name: "CENTRUM RECHARGE PWDR ORANGE1X5G SACT_30", packSize: "Rechg Adult Orange x30", mrp: 399, internalCode: "YGM2M00", ids: pIds("YGM2M00") },

  // Crocin (Pain Relief) — 11 SKUs
  { id: "ygcab00", brandId: "crocin", name: "CROCIN ADVANCE 500MG 20TABLETS", packSize: "Advance 500", mrp: 32, internalCode: "YGCAB00", ids: pIds("YGCAB00") },
  { id: "ygcbb00", brandId: "crocin", name: "CROCIN T 650MG 15TABLETS", packSize: "Tab 650mg", mrp: 55, internalCode: "YGCBB00", ids: pIds("YGCBB00") },
  { id: "ygcdb00", brandId: "crocin", name: "CROCIN LIQUID 240MG/5ML 1X100ML", packSize: "Susp 240mg", mrp: 120, internalCode: "YGCDB00", ids: pIds("YGCDB00") },
  { id: "ygcoa00", brandId: "crocin", name: "CROCIN DROPS 100MG/1ML 1X15ML", packSize: "Drops 100mg", mrp: 85, internalCode: "YGCOA00", ids: pIds("YGCOA00") },
  { id: "ygcpa00", brandId: "crocin", name: "CROCIN TABLET 650+50MG 15TABS PAIN REL", packSize: "Pain relief 650mg", mrp: 75, internalCode: "YGCPA00", ids: pIds("YGCPA00") },
  { id: "ygcsa00", brandId: "crocin", name: "CROCIN SUSPENSION 24MG/ML 1X60ML SINGLE", packSize: "Susp 24mg", mrp: 80, internalCode: "YGCSA00", ids: pIds("YGCSA00") },
  { id: "ygcsb00", brandId: "crocin", name: "CROCIN 120 SUSPENSION 24MG/ML 1X100ML", packSize: "Susp 24mg", mrp: 125, internalCode: "YGCSB00", ids: pIds("YGCSB00") },
  { id: "ygcta00", brandId: "crocin", name: "CROCIN LOZENGS ORNG18+4 FREE_BLSTR_JARPK", packSize: "Lozenges Orange", mrp: 85, internalCode: "YGCTA00", ids: pIds("YGCTA00") },
  { id: "ygctg00", brandId: "crocin", name: "CROCIN LOZENG GINGR MULETHI18+4_STRP_JAR", packSize: "Lozenges Ginger", mrp: 85, internalCode: "YGCTG00", ids: pIds("YGCTG00") },
  { id: "ygcfai1", brandId: "crocin", name: "CROCIN COLDFLU 500MG 15TABLETS", packSize: "ColdFlu 500mg", mrp: 78, internalCode: "YGCFAI1", ids: pIds("YGCFAI1") },
  { id: "ygcrn00", brandId: "crocin", name: "CROCIN NATURAL COUGH SYRUP 1X100ML_BOT", packSize: "Crocin Naturals", mrp: 155, internalCode: "YGCRN00", ids: pIds("YGCRN00") },

  // ENO (Antacids) — 19 SKUs
  { id: "ygeaa00", brandId: "eno", name: "ENO POWDER AJWAIN 1X5G SACHET_30", packSize: "Ajwain5g", mrp: 155, internalCode: "YGEAA00", ids: pIds("YGEAA00") },
  { id: "ygeca00", brandId: "eno", name: "ENO Cola 1X5G SACHET", packSize: "Cola 5g", mrp: 8, internalCode: "YGECA00", ids: pIds("YGECA00") },
  { id: "ygela00", brandId: "eno", name: "ENO POWDER LEMON 1X5G SACHET_30", packSize: "Lemon 5g", mrp: 155, internalCode: "YGELA00", ids: pIds("YGELA00") },
  { id: "ygelb00", brandId: "eno", name: "Eno Powder Lemon 5g", packSize: "Lemon 5g", mrp: 8, internalCode: "YGELB00", ids: pIds("YGELB00") },
  { id: "ygelc00", brandId: "eno", name: "ENO POWDER LEMON 6X5G SACHET MULTIPACK", packSize: "Lemon sixer", mrp: 45, internalCode: "YGELC00", ids: pIds("YGELC00") },
  { id: "ygelcr1", brandId: "eno", name: "ENO POWDER LEMON 6X5G SIX SACHET PACK", packSize: "Lemon sixer", mrp: 45, internalCode: "YGELCR1", ids: pIds("YGELCR1") },
  { id: "ygeldr1", brandId: "eno", name: "ENO POWDER LEMON 100G BOTTLE_REL", packSize: "Lemon 100g", mrp: 115, internalCode: "YGELDR1", ids: pIds("YGELDR1") },
  { id: "ygema00", brandId: "eno", name: "ENO POWDER MAUSAMBI 1X5G SACHET_30", packSize: "Mausambi 5g", mrp: 155, internalCode: "YGEMA00", ids: pIds("YGEMA00") },
  { id: "ygeoa00", brandId: "eno", name: "ENO POWDER Orange 1X5G SACHET", packSize: "Orange 5g", mrp: 155, internalCode: "YGEOA00", ids: pIds("YGEOA00") },
  { id: "ygeodr1", brandId: "eno", name: "ENO POWDER ORANGE 100G BOTTLE_REL", packSize: "Orange 100g", mrp: 115, internalCode: "YGEODR1", ids: pIds("YGEODR1") },
  { id: "ygera00", brandId: "eno", name: "ENO POWDER Regular 1X5G SACHET", packSize: "Regular 5g", mrp: 155, internalCode: "YGERA00", ids: pIds("YGERA00") },
  { id: "ygerdr1", brandId: "eno", name: "ENO POWDER REGULAR 100G BOTTLE_REL", packSize: "Regular 100g", mrp: 115, internalCode: "YGERDR1", ids: pIds("YGERDR1") },
  { id: "ygeja00", brandId: "eno", name: "ENO POWDER JALJEERA 1X5G SACHET_30", packSize: "Jaljeera5g", mrp: 155, internalCode: "YGEJA00", ids: pIds("YGEJA00") },
  { id: "ygeka00", brandId: "eno", name: "Eno Nimbu Masala Digestive Antacid(Box)", packSize: "Nimbu Masala 5g", mrp: 155, internalCode: "YGEKA00", ids: pIds("YGEKA00") },
  { id: "ygebl00", brandId: "eno", name: "ENO CHEWY BITES TANGY LEMON 1X10_BOTTLE", packSize: "ECB Lemon 10", mrp: 115, internalCode: "YGEBL00", ids: pIds("YGEBL00") },
  { id: "ygebm00", brandId: "eno", name: "ENO CHEWY BITES TANGY LEMON 1X30_BOTTLE", packSize: "ECB Lemon 30", mrp: 295, internalCode: "YGEBM00", ids: pIds("YGEBM00") },
  { id: "ygebo00", brandId: "eno", name: "ENO CHEWY BITES ZESTY ORANGE 1X10_BOTTLE", packSize: "ECB Orange 10", mrp: 115, internalCode: "YGEBO00", ids: pIds("YGEBO00") },
  { id: "ygebr00", brandId: "eno", name: "ENO CHEWY BITES ZESTY ORANGE 1X30_BOTTLE", packSize: "ECB Orange 30", mrp: 295, internalCode: "YGEBR00", ids: pIds("YGEBR00") },
  { id: "ygeza00", brandId: "eno", name: "Eno Jeera Ajwain", packSize: "3in1 sixer", mrp: 55, internalCode: "YGEZA00", ids: pIds("YGEZA00") },
  { id: "ygers00", brandId: "eno", name: "ENO POWDER Regular 6X5G SACHET", packSize: "Regular sixer", mrp: 45, internalCode: "YGERS00", ids: pIds("YGERS00") },
  { id: "ygeos00", brandId: "eno", name: "ENO POWDER ORANGE 6X5G SIX_SAC PACK", packSize: "Orange sixer", mrp: 45, internalCode: "YGEOS00", ids: pIds("YGEOS00") },
  { id: "ygecs00", brandId: "eno", name: "ENO Cola 1X5G SACHET", packSize: "Cola sixer", mrp: 45, internalCode: "YGECS00", ids: pIds("YGECS00") },
  { id: "ygezc00", brandId: "eno", name: "Eno Powder Jeera&Ajwain 1X5G Sachet_27+3", packSize: "Eno jeera ajwain", mrp: 155, internalCode: "YGEZC00", ids: pIds("YGEZC00") },

  // Iodex (Pain Relief) — 14 SKUs
  { id: "ygibb00", brandId: "iodex", name: "IODEX BALM REGULAR 1X8G BOTTLE", packSize: "Balm 8g", mrp: 55, internalCode: "YGIBB00", ids: pIds("YGIBB00") },
  { id: "ygisb00", brandId: "iodex", name: "IODEX RAPID ACTION SPRAY 1X35G_SRP", packSize: "Spray 35G", mrp: 175, internalCode: "YGISB00", ids: pIds("YGISB00") },
  { id: "ygybb00", brandId: "iodex", name: "IODEX BALM REGULAR 1X8G BOTTLE", packSize: "Balm 8g", mrp: 55, internalCode: "YGYBB00", ids: pIds("YGYBB00") },
  { id: "ygybc00", brandId: "iodex", name: "IODEX BALM REGULAR 1X16G BOTTLE", packSize: "Balm 16g", mrp: 95, internalCode: "YGYBC00", ids: pIds("YGYBC00") },
  { id: "ygybd00", brandId: "iodex", name: "IODEX BALM REGULAR 1X40G BOTTLE", packSize: "Balm 40g", mrp: 199, internalCode: "YGYBD00", ids: pIds("YGYBD00") },
  { id: "ygygd00", brandId: "iodex", name: "IODEX POWER GEL 1X30G", packSize: "Power Gel 30g", mrp: 245, internalCode: "YGYGD00", ids: pIds("YGYGD00") },
  { id: "ygygf00", brandId: "iodex", name: "IODEX POWER GEL 1X10G", packSize: "Power Gel 10g", mrp: 115, internalCode: "YGYGF00", ids: pIds("YGYGF00") },
  { id: "ygysb00", brandId: "iodex", name: "IODEX RAPID ACTION SPRAY 1X60G_CAN", packSize: "Spray 60g", mrp: 285, internalCode: "YGYSB00", ids: pIds("YGYSB00") },
  { id: "ygysc00", brandId: "iodex", name: "IODEX RAPID ACTION SPRAY 3X35G", packSize: "Spray 35GPO3", mrp: 499, internalCode: "YGYSC00", ids: pIds("YGYSC00") },
  { id: "ygyub00", brandId: "iodex", name: "Iodex Ultragel 30g", packSize: "IUG 30G", mrp: 315, internalCode: "YGYUB00", ids: pIds("YGYUB00") },
  { id: "ygyuc00", brandId: "iodex", name: "Iodex Ultragel 50g", packSize: "IUG 50G", mrp: 445, internalCode: "YGYUC00", ids: pIds("YGYUC00") },
  { id: "ygyud00", brandId: "iodex", name: "Iodex Ultragel 15g", packSize: "IUG 15G", mrp: 179, internalCode: "YGYUD00", ids: pIds("YGYUD00") },
  { id: "ygylb00", brandId: "iodex", name: "IODEX ULTRAGEL 1.16% 1X30G", packSize: "IUG 30G_New", mrp: 315, internalCode: "YGYLB00", ids: pIds("YGYLB00") },
  { id: "ygyld00", brandId: "iodex", name: "IODEX ULTRAGEL+ 2% 1X15G_SRP", packSize: "IUG 15G_New", mrp: 179, internalCode: "YGYLD00", ids: pIds("YGYLD00") },
  { id: "ygylc00", brandId: "iodex", name: "IODEX ULTRAGEL+ 2% 1X50G", packSize: "IUG 50G_New", mrp: 445, internalCode: "YGYLC00", ids: pIds("YGYLC00") },
  { id: "ygiud00", brandId: "iodex", name: "Iodex Ultragel 1.16% 1X30G", packSize: "IUG 30G_New", mrp: 315, internalCode: "YGIUD00", ids: pIds("YGIUD00") },
  { id: "ygyac00", brandId: "iodex", name: "Iodex Gel Non Medicated 1X16G", packSize: "Mbalm_16", mrp: 115, internalCode: "YGYAC00", ids: pIds("YGYAC00") },
  { id: "ygysa00", brandId: "iodex", name: "IODEX RAPID ACTION SPRAY 1X35G", packSize: "Spray 35G", mrp: 175, internalCode: "YGYSA00", ids: pIds("YGYSA00") },
  { id: "ygibc00", brandId: "iodex", name: "Iodex Balm Regular 1X16G Bottle", packSize: "Balm 16g", mrp: 95, internalCode: "YGIBC00", ids: pIds("YGIBC00") },

  // Sensodyne Mouthwash (Oral Care) — 2 SKUs
  { id: "ygsox00", brandId: "mouthwash", name: "Sensodyne Mouthwash", packSize: "MW 250ML", mrp: 365, internalCode: "YGSOX00", ids: pIds("YGSOX00") },
  { id: "ygsoy00", brandId: "mouthwash", name: "SENSODYNE COMP PROT MOUTHWASH 100ML", packSize: "MW 100ML", mrp: 215, internalCode: "YGSOY00", ids: pIds("YGSOY00") },

  // Ostocalcium (Multivitamins) — 7 SKUs
  { id: "ygzpar1", brandId: "ostocalcium", name: "OSTOCALCIUM CHEW ORANGE 30TAB BOTTLE_REL", packSize: "Oscal 30", mrp: 299, internalCode: "YGZPAR1", ids: pIds("YGZPAR1") },
  { id: "ygzsa00", brandId: "ostocalcium", name: "OSTOCALCIUM SUSPENSION BANANA 1X200ML", packSize: "Susp Banana 200", mrp: 225, internalCode: "YGZSA00", ids: pIds("YGZSA00") },
  { id: "ygzsb00", brandId: "ostocalcium", name: "OSTOCALCIUM SUSP LEMON AND LIME 1X200ML", packSize: "Susp Lemon 200", mrp: 225, internalCode: "YGZSB00", ids: pIds("YGZSB00") },
  { id: "ygmpa00", brandId: "ostocalcium", name: "CENTRUM OSTOCAL TTL CHEWABLE 60TAB_BOT", packSize: "Oscal 60", mrp: 549, internalCode: "YGMPA00", ids: pIds("YGMPA00") },
  { id: "ygmpd00", brandId: "ostocalcium", name: "CENTRUM OSTOCAL TTL CHEWABLE 30TAB_BOT", packSize: "Oscal 30", mrp: 299, internalCode: "YGMPD00", ids: pIds("YGMPD00") },
  { id: "ygmsb00", brandId: "ostocalcium", name: "CENTRUM OSTO TTL SUSP BANANA B12 1X200ML", packSize: "Susp B12 200", mrp: 249, internalCode: "YGMSB00", ids: pIds("YGMSB00") },
  { id: "ygmpc00", brandId: "ostocalcium", name: "Centrum Ostocalcium Ccm 1X15S_Blister", packSize: "CCM", mrp: 189, internalCode: "YGMPC00", ids: pIds("YGMPC00") },

  // Otrivin (Cold & Flu) — 11 SKUs
  { id: "ygoacr1", brandId: "otrivin", name: "OTRIVIN AD NASAL SOL MOI 0.1% 1X10ML_REL", packSize: "Nasal AD 10", mrp: 135, internalCode: "YGOACR1", ids: pIds("YGOACR1") },
  { id: "ygobar1", brandId: "otrivin", name: "OTRIVIN SL NASAL SOL MOI 0.74%1X10ML_REL", packSize: "Nasal SL 10", mrp: 135, internalCode: "YGOBAR1", ids: pIds("YGOBAR1") },
  { id: "ygoca00", brandId: "otrivin", name: "OTRIVIN NASAL SOL 0.74% 1X100ML BRTHCLN", packSize: "OBC", mrp: 275, internalCode: "YGOCA00", ids: pIds("YGOCA00") },
  { id: "ygofa00", brandId: "otrivin", name: "OTRIVIN FR NASAL SOL 0.05% 1X10ML", packSize: "Nasal FR 10", mrp: 135, internalCode: "YGOFA00", ids: pIds("YGOFA00") },
  { id: "ygomar1", brandId: "otrivin", name: "OTRIVIN PD NASAL SOL MOIST 0.1% 1X10ML", packSize: "Nasal PD 10", mrp: 125, internalCode: "YGOMAR1", ids: pIds("YGOMAR1") },
  { id: "ygopb00", brandId: "otrivin", name: "OTRIVIN PD NASAL SOL 0.1% 1X10ML", packSize: "Nasal PD 10", mrp: 125, internalCode: "YGOPB00", ids: pIds("YGOPB00") },
  { id: "ygosb00", brandId: "otrivin", name: "OTRIVIN NR NASAL SOL 0.1% 1X10ML", packSize: "Nasal NR 10", mrp: 125, internalCode: "YGOSB00", ids: pIds("YGOSB00") },
  { id: "ygoea00", brandId: "otrivin", name: "OTRIVN ADVNCE OXYMETAZOLIN.05%1X10ML_SAM", packSize: "Metered dose", mrp: 175, internalCode: "YGOEA00", ids: pIds("YGOEA00") },
  { id: "ygopx00", brandId: "otrivin", name: "OTRIVIN PD OXY NASAL SOL 0.025% 1X10ML", packSize: "Otr_pd_0.025", mrp: 135, internalCode: "YGOPX00", ids: pIds("YGOPX00") },
  { id: "ygobb00", brandId: "otrivin", name: "OTRIVIN SL NASAL SOL MOI 0.74% 1X20ML", packSize: "Otr_nsl_0.74", mrp: 225, internalCode: "YGOBB00", ids: pIds("YGOBB00") },
  { id: "ygoac00", brandId: "otrivin", name: "OTRIVIN AD NASAL SOL MOIST 0.1% 1X10ML", packSize: "Nasal AD 10", mrp: 135, internalCode: "YGOAC00", ids: pIds("YGOAC00") },

  // Parodontax (Oral Care) — 8 SKUs
  { id: "ygxfb00", brandId: "parodontax", name: "PARODONTAX TOOTHPASTE FLUORIDE 1X75G", packSize: "Daily Flouride 75", mrp: 235, internalCode: "YGXFB00", ids: pIds("YGXFB00") },
  { id: "ygxfc00", brandId: "parodontax", name: "Parodontax Daily Fluoride 75g (pack of 2)", packSize: "Daily Flouride 75 po2", mrp: 449, internalCode: "YGXFC00", ids: pIds("YGXFC00") },
  { id: "ygxub00", brandId: "parodontax", name: "PARODONTAX TOOTHPASTE ULTRACLEAN 1X75G", packSize: "Ultra clean 75", mrp: 235, internalCode: "YGXUB00", ids: pIds("YGXUB00") },
  { id: "ygxuc00", brandId: "parodontax", name: "Parodontax Ultra Clean 75g (pack of 2)", packSize: "Ultra clean 75 po2", mrp: 449, internalCode: "YGXUC00", ids: pIds("YGXUC00") },
  { id: "ygxba00", brandId: "parodontax", name: "PARODONTAX BRUSH 1 BRUSH", packSize: "Paro Brush po1", mrp: 169, internalCode: "YGXBA00", ids: pIds("YGXBA00") },
  { id: "ygxbb00", brandId: "parodontax", name: "PARODONTAX BRUSH 2+1 BRUSH_FREE", packSize: "Paro Brush 2+1", mrp: 449, internalCode: "YGXBB00", ids: pIds("YGXBB00") },
  { id: "ygxma00", brandId: "parodontax", name: "PARODONTAX MW MOUTHWASH 1X100ML", packSize: "Paro MW", mrp: 249, internalCode: "YGXMA00", ids: pIds("YGXMA00") },
  { id: "ygxfba1", brandId: "parodontax", name: "Parodontax Paste Fluoride 1X75G_Tbfree", packSize: "Daily Flouride 75 po2", mrp: 235, internalCode: "YGXFBA1", ids: pIds("YGXFBA1") },

  // Sensodyne Paste (Oral Care) — 34 SKUs
  { id: "ygsder1", brandId: "paste", name: "SENSODYNE DEEP CLEAN 40 GM", packSize: "DC 40g", mrp: 105, internalCode: "YGSDER1", ids: pIds("YGSDER1") },
  { id: "ygsdfr1", brandId: "paste", name: "SENSODYNE DEEP CLEAN 70 GM", packSize: "DC 70g", mrp: 175, internalCode: "YGSDFR1", ids: pIds("YGSDFR1") },
  { id: "ygseo00", brandId: "paste", name: "SENSODYNE PASTE EXTRA FRESH GEL 3X75G", packSize: "FG 3X150", mrp: 799, internalCode: "YGSEO00", ids: pIds("YGSEO00") },
  { id: "ygsfer1", brandId: "paste", name: "SENSODYNE 40G FRESHMINT", packSize: "FM 40g", mrp: 105, internalCode: "YGSFER1", ids: pIds("YGSFER1") },
  { id: "ygsfgr1", brandId: "paste", name: "SENSODYNE FRESHMINT 75G TUBE", packSize: "FM 75g", mrp: 175, internalCode: "YGSFGR1", ids: pIds("YGSFGR1") },
  { id: "ygsfjr1", brandId: "paste", name: "SENSODYNE TOOTHPASTE FRESHMINT1X150G_REL", packSize: "FM 150g", mrp: 339, internalCode: "YGSFJR1", ids: pIds("YGSFJR1") },
  { id: "ygsfkr1", brandId: "paste", name: "SENSODYNE PASTE FRESHMINT 3X150G", packSize: "FM B2G1", mrp: 799, internalCode: "YGSFKR1", ids: pIds("YGSFKR1") },
  { id: "ygsfp00", brandId: "paste", name: "Sensodyne Fresh Mint Pack of 3", packSize: "FM 3x150", mrp: 799, internalCode: "YGSFP00", ids: pIds("YGSFP00") },
  { id: "ygsger1", brandId: "paste", name: "SENSODYNE 40G FRESHGEL", packSize: "FG 40g", mrp: 105, internalCode: "YGSGER1", ids: pIds("YGSGER1") },
  { id: "ygsggr1", brandId: "paste", name: "SENSODYNE FRESH GEL 75G TUBE", packSize: "FG 75g", mrp: 175, internalCode: "YGSGGR1", ids: pIds("YGSGGR1") },
  { id: "ygsgjr1", brandId: "paste", name: "SENSODYNE 150GM FRESHGEL TUBE", packSize: "FG 150g", mrp: 339, internalCode: "YGSGJR1", ids: pIds("YGSGJR1") },
  { id: "ygsgkr1", brandId: "paste", name: "SENSODYNE PASTE FRESHGEL 3X150G", packSize: "FG B2G1", mrp: 799, internalCode: "YGSGKR1", ids: pIds("YGSGKR1") },
  { id: "ygsgp00", brandId: "paste", name: "Sensodyne Fresh Gel Pack of 3", packSize: "FG 3X150", mrp: 799, internalCode: "YGSGP00", ids: pIds("YGSGP00") },
  { id: "ygsit00", brandId: "paste", name: "SENSODYNE PASTE RAPID 3X80G", packSize: "RR 240", mrp: 620, internalCode: "YGSIT00", ids: pIds("YGSIT00") },
  { id: "ygspfr2", brandId: "paste", name: "SENSODYNE REPAIR & PROTECT TP 72X70G", packSize: "R&P 70g", mrp: 11520, internalCode: "YGSPFR2", ids: pIds("YGSPFR2") },
  { id: "ygspir2", brandId: "paste", name: "SENSODYNE REPAIR & PROTECT TP 72X100G", packSize: "R&P 100g", mrp: 14400, internalCode: "YGSPIR2", ids: pIds("YGSPIR2") },
  { id: "ygspm00", brandId: "paste", name: "Sensodyne Toothpaste Repair & Protect Combo pack, tooth paste for deep repair of sensitive teeth, 140 gm multi-pack (70 gm x 2)", packSize: "R&P 140", mrp: 339, internalCode: "YGSPM00", ids: pIds("YGSPM00") },
  { id: "ygsrer1", brandId: "paste", name: "SENSODYNE PASTE RAPRELIEF 1X40G", packSize: "RR 40g", mrp: 105, internalCode: "YGSRER1", ids: pIds("YGSRER1") },
  { id: "ygsrhr1", brandId: "paste", name: "SENSODYNE PASTE RAPRELIEF 1X80G", packSize: "RR 80g", mrp: 219, internalCode: "YGSRHR1", ids: pIds("YGSRHR1") },
  { id: "ygsrq00", brandId: "paste", name: "Sensodyne Toothpaste Rapid Relief Combo pack, Sensitive tooth paste to help beat sensitivity fast, 160 gm multi-pack (80 gm x 2)", packSize: "RR 160", mrp: 419, internalCode: "YGSRQ00", ids: pIds("YGSRQ00") },
  { id: "ygssf00", brandId: "paste", name: "SENSODYNE PASTE SENSTIVITYGUM 1X70G", packSize: "S&G 70", mrp: 175, internalCode: "YGSSF00", ids: pIds("YGSSF00") },
  { id: "ygssg00", brandId: "paste", name: "Sensodyne Toothpaste Sensitivity & Gum Combo pack, Dual action tooth paste for sensitive teeth and healthy gums, 140 gm multi-pack (70 gm x 2)", packSize: "S&G 140", mrp: 339, internalCode: "YGSSG00", ids: pIds("YGSSG00") },
  { id: "ygswfr1", brandId: "paste", name: "Sensodyne Whitening 70g Tube", packSize: "WT 70g", mrp: 175, internalCode: "YGSWFR1", ids: pIds("YGSWFR1") },
  { id: "ygsxf00", brandId: "paste", name: "SENSODYNE PASTE COMPLETE PROTECT+ 1X70G", packSize: "CP 70g", mrp: 175, internalCode: "YGSXF00", ids: pIds("YGSXF00") },
  { id: "ygsxm00", brandId: "paste", name: "Sensodyne Toothpaste Complete Protection+ Combo pack, All in One daily oral care tooth paste for sensitive teeth, 140 gm multi-pack (70 gm x 2)", packSize: "CP 140", mrp: 339, internalCode: "YGSXM00", ids: pIds("YGSXM00") },
  { id: "ygsfs00", brandId: "paste", name: "SENSODYNE FRESH MINT TP 72X150G", packSize: "FM B2G50", mrp: 23040, internalCode: "YGSFS00", ids: pIds("YGSFS00") },
  { id: "ygsgs00", brandId: "paste", name: "SENSODYNE FRESH GEL TOOTHPASTE 72X150G", packSize: "FG B2G50", mrp: 23040, internalCode: "YGSGS00", ids: pIds("YGSGS00") },
  { id: "ygsxfa1", brandId: "paste", name: "Sensodyne Complete Protect+ 1X70G Tbfree", packSize: "CP 70g", mrp: 175, internalCode: "YGSXFA1", ids: pIds("YGSXFA1") },
  { id: "ygsgq00", brandId: "paste", name: "Sensodyne Toothpaste Fresh Gel 2X125G", packSize: "FG 2x125", mrp: 619, internalCode: "YGSGQ00", ids: pIds("YGSGQ00") },
  { id: "ygsfq00", brandId: "paste", name: "Sensodyne Toothpaste Fresh Mint 2X125G", packSize: "FM 2x125", mrp: 619, internalCode: "YGSFQ00", ids: pIds("YGSFQ00") },
  { id: "ygsps00", brandId: "paste", name: "Sensodyne Paste Repair Protct2X100G_Tube", packSize: "R&P 200g", mrp: 499, internalCode: "YGSPS00", ids: pIds("YGSPS00") },
  { id: "ygsgj1a", brandId: "paste", name: "SENSODYNE PASTE FRESHGEL 1X150G TBFREE", packSize: "FG 150g_TB", mrp: 339, internalCode: "YGSGJ1A", ids: pIds("YGSGJ1A") },
  { id: "ygshf00", brandId: "paste", name: "SENSODYNE PASTE HERBAL 1X70G TUBE", packSize: "paste_herbal", mrp: 175, internalCode: "YGSHF00", ids: pIds("YGSHF00") },
  { id: "ygsbb00", brandId: "paste", name: "Sensodyne Expert White", packSize: "Expert white", mrp: 175, internalCode: "YGSBB00", ids: pIds("YGSBB00") },
  { id: "ygsgea1", brandId: "paste", name: "SENSODYNE PASTE FRESHGEL 1X40G_25%EXTRA", packSize: "FG 40g", mrp: 105, internalCode: "YGSGEA1", ids: pIds("YGSGEA1") },
  { id: "ygsfea1", brandId: "paste", name: "SENSODYNE PASTE FRESHMINT 1X40G_25%EXTRA", packSize: "FM 40g", mrp: 105, internalCode: "YGSFEA1", ids: pIds("YGSFEA1") },
  { id: "ygsrh1a", brandId: "paste", name: "Sensodyne Paste Raprelief 1X80G 1Tbfree", packSize: "RR 80g", mrp: 219, internalCode: "YGSRH1A", ids: pIds("YGSRH1A") },
  { id: "ygsat00", brandId: "paste", name: "Sensodyne Daily Protection Tp 288 X 20G", packSize: "DP 12x20g", mrp: 16640, internalCode: "YGSAT00", ids: pIds("YGSAT00") },
  { id: "ygsav00", brandId: "paste", name: "Sensodyne Daily Protection Access12X20G", packSize: "DA 12x20g", mrp: 16640, internalCode: "YGSAV00", ids: pIds("YGSAV00") },

  // Polident (Oral Care) — 1 SKU
  { id: "ygpfa00", brandId: "polident", name: "POLIDENT FIX CR 1 X 20 G_IN", packSize: "Polident", mrp: 335, internalCode: "YGPFA00", ids: pIds("YGPFA00") },

  // Pronamel (Oral Care) — 6 SKUs
  { id: "ygslr00", brandId: "pronamel", name: "SENSODYNE PRONAMEL DAILYPROTECTION 2X70G", packSize: "Pronamel DP Po2", mrp: 499, internalCode: "YGSLR00", ids: pIds("YGSLR00") },
  { id: "ygsls00", brandId: "pronamel", name: "SENSODYNE PRONAMEL FRESH BREATH 2X70G", packSize: "Pronamel FB Po2", mrp: 499, internalCode: "YGSLS00", ids: pIds("YGSLS00") },
  { id: "ygslp00", brandId: "pronamel", name: "SENSODYNE PRONAMEL DAILYPROTECTION 1X70G", packSize: "Pronamel DP 70g", mrp: 279, internalCode: "YGSLP00", ids: pIds("YGSLP00") },
  { id: "ygslf00", brandId: "pronamel", name: "SENSODYNE PRONAMEL FRESH BREATH 1X70G", packSize: "Pronamel FB 70g", mrp: 279, internalCode: "YGSLF00", ids: pIds("YGSLF00") },
  { id: "ygslm00", brandId: "pronamel", name: "SENSODYNE PRONAMEL KIDS BUBBLE MINT1X70G", packSize: "Pronamel kids BM 70", mrp: 279, internalCode: "YGSLM00", ids: pIds("YGSLM00") },
  { id: "ygslt00", brandId: "pronamel", name: "SENSODYNE PRONAMEL KIDS STRAWBERRY 1X70G", packSize: "Pronamel kids SB 70", mrp: 279, internalCode: "YGSLT00", ids: pIds("YGSLT00") },

  // Voltaren (Pain Relief) — 1 SKU
  { id: "ygvga00", brandId: "voltaren", name: "VOLTAREN TOPICAL GEL 2.32% 1X30G", packSize: "Voltaren", mrp: 479, internalCode: "YGVGA00", ids: pIds("YGVGA00") },
];

function pIds(code: string): Record<Platform, string | null> {
  return { pharmeasy: code, tata_1mg: code, zepto: code, amazon_pharmacy: code };
}

export const competitorSkus: CompetitorSKU[] = [
  { id: "c-or-1", brandName: "Colgate", name: "Colgate Sensitive Pro Relief 80g", categoryId: "oral" },
  { id: "c-or-2", brandName: "Vantej", name: "Vantej 75g", categoryId: "oral" },
  { id: "c-or-3", brandName: "Closeup", name: "Closeup Sensitive Expert 75g", categoryId: "oral" },
  { id: "c-pa-1", brandName: "Saridon", name: "Saridon 10 tabs", categoryId: "pain" },
  { id: "c-pa-2", brandName: "Combiflam", name: "Combiflam 20 tabs", categoryId: "pain" },
  { id: "c-pa-3", brandName: "Disprin", name: "Disprin 10 tabs", categoryId: "pain" },
  { id: "c-pa-4", brandName: "Volini", name: "Volini Gel 50g", categoryId: "pain" },
  { id: "c-mv-1", brandName: "Revital H", name: "Revital H 30 caps", categoryId: "mvm" },
  { id: "c-mv-2", brandName: "Supradyn", name: "Supradyn Daily 15 tabs", categoryId: "mvm" },
  { id: "c-mv-3", brandName: "A to Z", name: "A to Z Gold 15 tabs", categoryId: "mvm" },
  { id: "c-co-1", brandName: "Nasivion", name: "Nasivion Adult 10ml", categoryId: "cold" },
  { id: "c-co-2", brandName: "Vicks", name: "Vicks Inhaler", categoryId: "cold" },
  { id: "c-co-3", brandName: "D-Cold", name: "D-Cold Total 10 tabs", categoryId: "cold" },
  { id: "c-an-1", brandName: "Digene", name: "Digene Mint 200ml", categoryId: "antacid" },
  { id: "c-an-2", brandName: "Gelusil", name: "Gelusil MPS 200ml", categoryId: "antacid" },
  { id: "c-an-3", brandName: "Pudin Hara", name: "Pudin Hara 30 caps", categoryId: "antacid" },
];

export const brandKeywords: Record<string, string[]> = {
  paste:       ["sensitive toothpaste", "sensodyne", "toothpaste for sensitive teeth", "tooth pain toothpaste", "whitening toothpaste"],
  brush:       ["sensodyne toothbrush", "sensitive toothbrush", "deep clean toothbrush"],
  parodontax:  ["parodontax", "bleeding gums toothpaste", "gum care toothpaste"],
  pronamel:    ["pronamel", "enamel protection toothpaste", "acid erosion toothpaste"],
  mouthwash:   ["sensodyne mouthwash", "mouthwash for sensitive teeth"],
  polident:    ["polident", "denture adhesive", "denture fixative cream"],
  crocin:      ["crocin", "paracetamol tablet", "fever tablet", "headache medicine", "body pain relief"],
  iodex:       ["iodex", "pain relief balm", "muscle pain relief", "joint pain gel"],
  voltaren:    ["voltaren", "diclofenac gel", "knee pain gel", "back pain relief gel"],
  centrum:     ["centrum", "multivitamin tablet", "daily vitamin supplement", "centrum women", "centrum men"],
  ostocalcium: ["ostocalcium", "calcium supplement", "calcium chewable"],
  eno:         ["eno", "antacid", "acidity relief", "gas relief", "eno lemon"],
  otrivin:     ["otrivin", "nasal spray", "blocked nose relief", "nasal decongestant"],
};

// --- Deterministic RNG ---
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngFor(key: string) { return mulberry32(hashStr(key)); }
function pick<T>(r: () => number, arr: T[]): T { return arr[Math.floor(r() * arr.length)]; }
function between(r: () => number, lo: number, hi: number): number { return lo + (hi - lo) * r(); }

// --- Weeks: 12 consecutive Sundays ending on the most recent past Sunday ---
function lastSunday(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 = Sun
  x.setDate(x.getDate() - day);
  return x;
}
export const weeks: string[] = (() => {
  const end = lastSunday();
  const arr: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i * 7);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
})();
export const latestWeek = weeks[weeks.length - 1];

// --- Periods: last 12 months in YYYY-MM format ---
export const periods: string[] = (() => {
  const arr: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return arr;
})();
export const latestPeriod = periods[periods.length - 1];

export function prevPeriod(period: string): string | null {
  const i = periods.indexOf(period);
  if (i <= 0) return null;
  return periods[i - 1];
}

// --- Uploads (history) ---
export type Upload = {
  id: string;
  weekEnding: string;
  platform: Platform;
  uploadedBy: string;
  uploadedAt: string;
  rowCount: number;
  status: "committed" | "processing" | "failed";
};
export const uploads: Upload[] = (() => {
  const users = ["priya.shah@haleon.com", "amit.r@haleon.com", "neha.k@haleon.com"];
  const out: Upload[] = [];
  weeks.forEach((w, wi) => {
    PLATFORMS.forEach((p) => {
      const r = rngFor(`upload-${w}-${p}`);
      out.push({
        id: `up-${w}-${p}`,
        weekEnding: w,
        platform: p,
        uploadedBy: pick(r, users),
        uploadedAt: new Date(new Date(w).getTime() + 86400_000 * (1 + Math.floor(r() * 2))).toISOString(),
        rowCount: Math.floor(between(r, 800, 2400)),
        status: wi === weeks.length - 1 && p === "amazon_pharmacy" && r() < 0.3 ? "processing" : "committed",
      });
    });
  });
  return out.reverse();
})();

// --- Platform metrics ---
export type PlatformMetricRow = { platform: Platform; weekEnding: string; period?: string; gmv: number; mau: number; aov: number; reach: number };
function platformBase(p: Platform): { gmv: number; mau: number; aov: number; reach: number } {
  if (p === "pharmeasy") return { gmv: 18_00_00_000, mau: 280_000, aov: 520, reach: 0.28 };
  if (p === "tata_1mg") return { gmv: 16_00_00_000, mau: 250_000, aov: 500, reach: 0.26 };
  if (p === "zepto") return { gmv: 9_00_00_000, mau: 180_000, aov: 380, reach: 0.18 };
  return { gmv: 14_00_00_000, mau: 240_000, aov: 460, reach: 0.24 };
}
export const platformMetrics: PlatformMetricRow[] = (() => {
  const out: PlatformMetricRow[] = [];
  PLATFORMS.forEach((p) => {
    const base = platformBase(p);
    weeks.forEach((w, i) => {
      const r = rngFor(`pm-${p}-${w}`);
      const trend = 1 + (i - 6) * 0.012;
      const noise = 0.92 + r() * 0.16;
      out.push({
        platform: p,
        weekEnding: w,
        period: w.slice(0, 7),
        gmv: Math.round(base.gmv * trend * noise),
        mau: Math.round(base.mau * trend * (0.95 + r() * 0.1)),
        aov: Math.round(base.aov * (0.96 + r() * 0.08)),
        reach: +(base.reach * (0.9 + r() * 0.2)).toFixed(3),
      });
    });
  });
  return out;
})();

// --- Per-brand per-platform per-week offtakes (aggregated to brand) ---
// We generate at SKU level then expose helpers.
export type OfftakeRow = { skuId: string; platform: Platform; weekEnding: string; period?: string; units: number; gmv: number };
function brandPlatformBias(brandId: string, p: Platform): number {
  // Some brands skew toward certain platforms.
  const h = (hashStr(brandId + p) % 100) / 100;
  return 0.7 + h * 0.8; // 0.7..1.5
}
export const offtakes: OfftakeRow[] = (() => {
  const out: OfftakeRow[] = [];
  skus.forEach((s) => {
    PLATFORMS.forEach((p) => {
      const bias = brandPlatformBias(s.brandId, p);
      weeks.forEach((w, i) => {
        const r = rngFor(`off-${s.id}-${p}-${w}`);
        // Per-SKU units scaled so brand-week-platform GMV ~ ₹25L – 2Cr.
        // Lower MRP -> higher units.
        const baseUnits = (15000 / Math.max(s.mrp, 30)) * bias * (0.85 + r() * 0.4);
        const trend = 1 + (i - 6) * 0.01;
        const units = Math.max(50, Math.round(baseUnits * trend * 1000));
        const price = s.mrp * (0.78 + r() * 0.08); // selling price ~ 78–86% of MRP
        out.push({ skuId: s.id, platform: p, weekEnding: w, period: w.slice(0, 7), units, gmv: Math.round(units * price) });
      });
    });
  });
  return out;
})();

// --- Listings ---
export type ListingRow = { skuId: string; platform: Platform; weekEnding: string; period?: string; status: "listed" | "unlisted" | "oos" };
export const listings: ListingRow[] = (() => {
  const out: ListingRow[] = [];
  skus.forEach((s) => {
    PLATFORMS.forEach((p) => {
      weeks.forEach((w) => {
        const r = rngFor(`lst-${s.id}-${p}-${w}`);
        const x = r();
        const status: ListingRow["status"] = x < 0.05 ? "unlisted" : x < 0.1 ? "oos" : "listed";
        out.push({ skuId: s.id, platform: p, weekEnding: w, period: w.slice(0, 7), status });
      });
    });
  });
  return out;
})();

// --- Visibility (keyword rank) ---
export type VisibilityRow = { brandId: string; keyword: string; platform: Platform; weekEnding: string; period?: string; rank: number | null };
export const visibility: VisibilityRow[] = (() => {
  const out: VisibilityRow[] = [];
  Object.entries(brandKeywords).forEach(([brandId, kws]) => {
    kws.forEach((kw) => {
      PLATFORMS.forEach((p) => {
        // Anchor rank per (kw, platform)
        const anchorR = rngFor(`vk-${kw}-${p}`);
        const anchor = Math.max(1, Math.round(between(anchorR, 2, 28)));
        weeks.forEach((w, i) => {
          const r = rngFor(`vis-${brandId}-${kw}-${p}-${w}`);
          let rank: number | null = Math.max(1, Math.round(anchor + (r() - 0.5) * 8 + (i - 6) * 0.4));
          if (rank > 50) rank = null;
          if (r() < 0.04) rank = null;
          out.push({ brandId, keyword: kw, platform: p, weekEnding: w, period: w.slice(0, 7), rank });
        });
      });
    });
  });
  return out;
})();

// --- Prices (per-SKU, per-competitor) ---
export type PriceRow = { skuId?: string; competitorSkuId?: string; platform: Platform; weekEnding: string; period?: string; price: number };

function generateForcedShocks(): Map<string, number> {
  // Force ≥8 ≥5% drops and ≥8 ≥5% increases distributed across SKU+platform+week.
  const map = new Map<string, number>(); // key: skuId|platform|weekIndex -> multiplier
  const r = mulberry32(424242);
  const targets = [...skus.slice(0, 10), ...competitorSkus.slice(0, 6).map((c) => ({ id: c.id }))];
  for (let i = 0; i < 10; i++) {
    const t = targets[Math.floor(r() * targets.length)];
    const p = PLATFORMS[Math.floor(r() * PLATFORMS.length)];
    const wi = 2 + Math.floor(r() * 9);
    map.set(`${t.id}|${p}|${wi}`, 0.9 + r() * 0.04); // -6% to -10%
  }
  for (let i = 0; i < 10; i++) {
    const t = targets[Math.floor(r() * targets.length)];
    const p = PLATFORMS[Math.floor(r() * PLATFORMS.length)];
    const wi = 2 + Math.floor(r() * 9);
    map.set(`${t.id}|${p}|${wi}`, 1.06 + r() * 0.04); // +6% to +10%
  }
  return map;
}
const priceShocks = generateForcedShocks();

export const prices: PriceRow[] = (() => {
  const out: PriceRow[] = [];
  const allItems: Array<{ id: string; mrp: number; kind: "sku" | "comp" }> = [
    ...skus.map((s) => ({ id: s.id, mrp: s.mrp, kind: "sku" as const })),
    ...competitorSkus.map((c) => ({
      id: c.id,
      // approximate MRP from category averages
      mrp: c.categoryId === "oral" ? 200 : c.categoryId === "pain" ? 60 : c.categoryId === "mvm" ? 400 : c.categoryId === "cold" ? 130 : 140,
      kind: "comp" as const,
    })),
  ];
  allItems.forEach((it) => {
    PLATFORMS.forEach((p) => {
      let prev = it.mrp * 0.82;
      weeks.forEach((w, wi) => {
        const r = rngFor(`pr-${it.id}-${p}-${w}`);
        const wobble = 0.98 + r() * 0.04; // ±2%
        const shock = priceShocks.get(`${it.id}|${p}|${wi}`);
        let price = prev * wobble * (shock ?? 1);
        price = Math.max(it.mrp * 0.55, Math.min(it.mrp * 0.98, price));
        prev = price;
        out.push({
          [it.kind === "sku" ? "skuId" : "competitorSkuId"]: it.id,
          platform: p,
          weekEnding: w,
          period: w.slice(0, 7),
          price: Math.round(price),
        } as PriceRow);
      });
    });
  });
  return out;
})();

// --- Fair share targets (mutable in-app via setFairShare) ---
const fairShareDefault: Record<string, number> = {
  paste: 22, brush: 8, parodontax: 6, pronamel: 5, mouthwash: 4, polident: 3,
  crocin: 18, iodex: 10, voltaren: 14, centrum: 24, ostocalcium: 8, eno: 28, otrivin: 20,
};
const fairShareMap = new Map<string, number>();
brands.forEach((b) => PLATFORMS.forEach((p) => fairShareMap.set(`${b.id}|${p}`, fairShareDefault[b.id])));

export function getFairShare(brandId: string, platform: Platform): number {
  return fairShareMap.get(`${brandId}|${platform}`) ?? 20;
}
export function setFairShare(brandId: string, platform: Platform, value: number) {
  fairShareMap.set(`${brandId}|${platform}`, Math.max(0, Math.min(100, value)));
}

// ==== Aggregation helpers ====
export function skuById(id: string) { return skus.find((s) => s.id === id)!; }
export function brandById(id: string) { return brands.find((b) => b.id === id)!; }
export function categoryById(id: string) { return categories.find((c) => c.id === id)!; }

/** Match a data row's time dimension against a YYYY-MM period string. */
function mp(rowPeriod: string | undefined, weekEnding: string, period: string): boolean {
  return (rowPeriod ?? weekEnding.slice(0, 7)) === period;
}

export function brandGMV(brandId: string, platform: Platform, period: string, offtakeData?: OfftakeRow[]): number {
  const data = offtakeData ?? offtakes;
  const brandSkuIds = new Set(skus.filter((s) => s.brandId === brandId).map((s) => s.id));
  return data
    .filter((o) => o.platform === platform && mp(o.period, o.weekEnding, period) && brandSkuIds.has(o.skuId))
    .reduce((a, b) => a + b.gmv, 0);
}
export function brandUnits(brandId: string, platform: Platform, period: string, offtakeData?: OfftakeRow[]): number {
  const data = offtakeData ?? offtakes;
  const brandSkuIds = new Set(skus.filter((s) => s.brandId === brandId).map((s) => s.id));
  return data
    .filter((o) => o.platform === platform && mp(o.period, o.weekEnding, period) && brandSkuIds.has(o.skuId))
    .reduce((a, b) => a + b.units, 0);
}
export function categoryGMV(categoryId: string, platform: Platform, period: string, offtakeData?: OfftakeRow[]): number {
  const haleonInCat = brands.filter((b) => b.categoryId === categoryId);
  const haleonGMV = haleonInCat.reduce((a, b) => a + brandGMV(b.id, platform, period, offtakeData), 0);
  const r = rngFor(`cat-${categoryId}-${platform}-${period}`);
  const haleonShare = 0.35 + r() * 0.2;
  return Math.round(haleonGMV / haleonShare);
}
export function brandMarketShare(brandId: string, platform: Platform, period: string, offtakeData?: OfftakeRow[]): number {
  const b = brandById(brandId);
  const cat = categoryGMV(b.categoryId, platform, period, offtakeData);
  if (!cat) return 0;
  return +((brandGMV(brandId, platform, period, offtakeData) / cat) * 100).toFixed(2);
}

export function deltaPct(curr: number, prev: number): number {
  if (!prev) return 0;
  return +(((curr - prev) / prev) * 100).toFixed(1);
}
/** @deprecated prefer prevPeriod for monthly periods */
export function prevWeek(week: string): string | null {
  const i = weeks.indexOf(week);
  if (i <= 0) return null;
  return weeks[i - 1];
}

// ==== Score helpers for /brand-health ====
// Each accepts an optional data array; falls back to mock data when omitted.

export function visibilityScore(brandId: string, platform: Platform | "all", period: string, visData?: VisibilityRow[]): number {
  const data = visData ?? visibility;
  const kws = brandKeywords[brandId] ?? [];
  const plats = platform === "all" ? PLATFORMS : [platform];
  let total = 0, n = 0;
  kws.forEach((kw) => {
    plats.forEach((p) => {
      const row = data.find((v) => v.brandId === brandId && v.keyword === kw && v.platform === p && mp(v.period, v.weekEnding, period));
      if (!row) return;
      n++;
      if (row.rank == null) total += 0;
      else if (row.rank <= 3) total += 100;
      else if (row.rank <= 10) total += 80;
      else if (row.rank <= 20) total += 55;
      else total += 25;
    });
  });
  return n ? Math.round(total / n) : 0;
}
export function listingScore(brandId: string, platform: Platform | "all", period: string, listData?: ListingRow[]): number {
  const data = listData ?? listings;
  const sIds = skus.filter((s) => s.brandId === brandId).map((s) => s.id);
  const plats = platform === "all" ? PLATFORMS : [platform];
  let listed = 0, total = 0;
  sIds.forEach((id) => {
    plats.forEach((p) => {
      const row = data.find((l) => l.skuId === id && l.platform === p && mp(l.period, l.weekEnding, period));
      if (!row) return;
      total++;
      if (row.status === "listed") listed++;
    });
  });
  return total ? Math.round((listed / total) * 100) : 0;
}
export function priceCompetitivenessScore(brandId: string, platform: Platform | "all", period: string, priceData?: PriceRow[]): number {
  const data = priceData ?? prices;
  const brandSkus = skus.filter((s) => s.brandId === brandId);
  const plats = platform === "all" ? PLATFORMS : [platform];
  let total = 0, n = 0;
  brandSkus.forEach((s) => {
    plats.forEach((p) => {
      const pr = data.find((x) => x.skuId === s.id && x.platform === p && mp(x.period, x.weekEnding, period));
      if (!pr) return;
      const disc = 1 - pr.price / s.mrp;
      n++;
      total += Math.min(100, Math.round(disc * 250));
    });
  });
  return n ? Math.round(total / n) : 0;
}
export function marketShareScore(
  brandId: string,
  platform: Platform | "all",
  period: string,
  offtakeData?: OfftakeRow[],
  fsMap?: Map<string, number>,
): number {
  const plats = platform === "all" ? PLATFORMS : [platform];
  let total = 0;
  plats.forEach((p) => {
    const ms = brandMarketShare(brandId, p, period, offtakeData);
    const fs = fsMap ? (fsMap.get(`${brandId}|${p}`) ?? 20) : getFairShare(brandId, p);
    const gap = ms - fs;
    const sc = Math.max(0, Math.min(100, 100 + gap * 5));
    total += sc;
  });
  return Math.round(total / plats.length);
}

export type ScoreData = {
  offtakes?: OfftakeRow[];
  listings?: ListingRow[];
  visibility?: VisibilityRow[];
  prices?: PriceRow[];
  fairShares?: Map<string, number>;
};

export function overallBrandHealth(brandId: string, platform: Platform | "all", period: string, data?: ScoreData): number {
  return Math.round(
    (visibilityScore(brandId, platform, period, data?.visibility) +
      listingScore(brandId, platform, period, data?.listings) +
      priceCompetitivenessScore(brandId, platform, period, data?.prices) +
      marketShareScore(brandId, platform, period, data?.offtakes, data?.fairShares)) /
      4,
  );
}
