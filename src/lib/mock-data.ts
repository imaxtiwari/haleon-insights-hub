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
  { id: "sensodyne", name: "Sensodyne", categoryId: "oral" },
  { id: "crocin", name: "Crocin", categoryId: "pain" },
  { id: "panadol", name: "Panadol", categoryId: "pain" },
  { id: "voltaren", name: "Voltaren", categoryId: "pain" },
  { id: "centrum", name: "Centrum", categoryId: "mvm" },
  { id: "otrivin", name: "Otrivin", categoryId: "cold" },
  { id: "eno", name: "ENO", categoryId: "antacid" },
];

export const skus: SKU[] = [
  // Sensodyne (Oral Care) — 7 SKUs
  { id: "sk-sen-1", brandId: "sensodyne", name: "Sensodyne Rapid Relief 75g", packSize: "75g", mrp: 220, ids: pIds("PE-SEN1", "TM-SEN1", "ZP-SEN1", "AM-SEN1") },
  { id: "sk-sen-2", brandId: "sensodyne", name: "Sensodyne Fresh Mint 70g", packSize: "70g", mrp: 165, ids: pIds("PE-SEN2", "TM-SEN2", "ZP-SEN2", "AM-SEN2") },
  { id: "sk-sen-3", brandId: "sensodyne", name: "Sensodyne Repair & Protect 70g", packSize: "70g", mrp: 240, ids: pIds("PE-SEN3", "TM-SEN3", "ZP-SEN3", "AM-SEN3") },
  { id: "sk-sen-4", brandId: "sensodyne", name: "Sensodyne Original 70g", packSize: "70g", mrp: 155, ids: pIds("PE-SEN4", "TM-SEN4", "ZP-SEN4", "AM-SEN4") },
  { id: "sk-sen-5", brandId: "sensodyne", name: "Sensodyne Whitening 70g", packSize: "70g", mrp: 180, ids: pIds("PE-SEN5", "TM-SEN5", "ZP-SEN5", "AM-SEN5") },
  { id: "sk-sen-6", brandId: "sensodyne", name: "Sensodyne Sensitivity & Gum 75g", packSize: "75g", mrp: 230, ids: pIds("PE-SEN6", "TM-SEN6", "ZP-SEN6", "AM-SEN6") },
  { id: "sk-sen-7", brandId: "sensodyne", name: "Sensodyne Deep Clean 70g", packSize: "70g", mrp: 175, ids: pIds("PE-SEN7", "TM-SEN7", "ZP-SEN7", "AM-SEN7") },

  // Crocin (Pain Relief) — 6 SKUs
  { id: "sk-cro-1", brandId: "crocin", name: "Crocin Advance 500mg 15 tabs", packSize: "15 tabs", mrp: 40, ids: pIds("PE-CRO1", "TM-CRO1", "ZP-CRO1", "AM-CRO1") },
  { id: "sk-cro-2", brandId: "crocin", name: "Crocin Pain Relief 650mg 15 tabs", packSize: "15 tabs", mrp: 65, ids: pIds("PE-CRO2", "TM-CRO2", "ZP-CRO2", "AM-CRO2") },
  { id: "sk-cro-3", brandId: "crocin", name: "Crocin Cold & Flu Max 10 tabs", packSize: "10 tabs", mrp: 90, ids: pIds("PE-CRO3", "TM-CRO3", "ZP-CRO3", "AM-CRO3") },
  { id: "sk-cro-4", brandId: "crocin", name: "Crocin Cold Max 10 tabs", packSize: "10 tabs", mrp: 85, ids: pIds("PE-CRO4", "TM-CRO4", "ZP-CRO4", "AM-CRO4") },
  { id: "sk-cro-5", brandId: "crocin", name: "Crocin Quick Cool Strip 10 tabs", packSize: "10 tabs", mrp: 70, ids: pIds("PE-CRO5", "TM-CRO5", "ZP-CRO5", "AM-CRO5") },
  { id: "sk-cro-6", brandId: "crocin", name: "Crocin 500mg 20 tabs", packSize: "20 tabs", mrp: 50, ids: pIds("PE-CRO6", "TM-CRO6", "ZP-CRO6", "AM-CRO6") },

  // Panadol (Pain Relief) — 4 SKUs
  { id: "sk-pan-1", brandId: "panadol", name: "Panadol Extra 500mg 10 tabs", packSize: "10 tabs", mrp: 55, ids: pIds("PE-PAN1", "TM-PAN1", "ZP-PAN1", "AM-PAN1") },
  { id: "sk-pan-2", brandId: "panadol", name: "Panadol Cold + Flu All-in-One 10 tabs", packSize: "10 tabs", mrp: 95, ids: pIds("PE-PAN2", "TM-PAN2", "ZP-PAN2", "AM-PAN2") },
  { id: "sk-pan-3", brandId: "panadol", name: "Panadol Advance 500mg 16 tabs", packSize: "16 tabs", mrp: 75, ids: pIds("PE-PAN3", "TM-PAN3", "ZP-PAN3", "AM-PAN3") },
  { id: "sk-pan-4", brandId: "panadol", name: "Panadol Actifast 500mg 14 tabs", packSize: "14 tabs", mrp: 80, ids: pIds("PE-PAN4", "TM-PAN4", "ZP-PAN4", "AM-PAN4") },

  // Voltaren (Pain Relief) — 5 SKUs
  { id: "sk-vol-1", brandId: "voltaren", name: "Voltaren Emulgel 50g", packSize: "50g", mrp: 280, ids: pIds("PE-VOL1", "TM-VOL1", "ZP-VOL1", "AM-VOL1") },
  { id: "sk-vol-2", brandId: "voltaren", name: "Voltaren Emulgel 30g", packSize: "30g", mrp: 195, ids: pIds("PE-VOL2", "TM-VOL2", "ZP-VOL2", "AM-VOL2") },
  { id: "sk-vol-3", brandId: "voltaren", name: "Voltaren Emulgel 100g", packSize: "100g", mrp: 520, ids: pIds("PE-VOL3", "TM-VOL3", "ZP-VOL3", "AM-VOL3") },
  { id: "sk-vol-4", brandId: "voltaren", name: "Voltaren Plus 20 tabs", packSize: "20 tabs", mrp: 140, ids: pIds("PE-VOL4", "TM-VOL4", "ZP-VOL4", "AM-VOL4") },
  { id: "sk-vol-5", brandId: "voltaren", name: "Voltaren Rapid 25mg 10 tabs", packSize: "10 tabs", mrp: 110, ids: pIds("PE-VOL5", "TM-VOL5", "ZP-VOL5", "AM-VOL5") },

  // Centrum (Multivitamins) — 6 SKUs
  { id: "sk-cen-1", brandId: "centrum", name: "Centrum Adults 30 tabs", packSize: "30 tabs", mrp: 420, ids: pIds("PE-CEN1", "TM-CEN1", "ZP-CEN1", "AM-CEN1") },
  { id: "sk-cen-2", brandId: "centrum", name: "Centrum Women 30 tabs", packSize: "30 tabs", mrp: 440, ids: pIds("PE-CEN2", "TM-CEN2", "ZP-CEN2", "AM-CEN2") },
  { id: "sk-cen-3", brandId: "centrum", name: "Centrum Men 30 tabs", packSize: "30 tabs", mrp: 440, ids: pIds("PE-CEN3", "TM-CEN3", "ZP-CEN3", "AM-CEN3") },
  { id: "sk-cen-4", brandId: "centrum", name: "Centrum Adults 50+ 30 tabs", packSize: "30 tabs", mrp: 460, ids: pIds("PE-CEN4", "TM-CEN4", "ZP-CEN4", "AM-CEN4") },
  { id: "sk-cen-5", brandId: "centrum", name: "Centrum Kids Gummies 30 count", packSize: "30 count", mrp: 480, ids: pIds("PE-CEN5", "TM-CEN5", "ZP-CEN5", "AM-CEN5") },
  { id: "sk-cen-6", brandId: "centrum", name: "Centrum Adults 60 tabs", packSize: "60 tabs", mrp: 780, ids: pIds("PE-CEN6", "TM-CEN6", "ZP-CEN6", "AM-CEN6") },

  // Otrivin (Cold & Flu) — 5 SKUs
  { id: "sk-otr-1", brandId: "otrivin", name: "Otrivin Adult Nasal Spray 10ml", packSize: "10ml", mrp: 125, ids: pIds("PE-OTR1", "TM-OTR1", "ZP-OTR1", "AM-OTR1") },
  { id: "sk-otr-2", brandId: "otrivin", name: "Otrivin Plus 10ml", packSize: "10ml", mrp: 155, ids: pIds("PE-OTR2", "TM-OTR2", "ZP-OTR2", "AM-OTR2") },
  { id: "sk-otr-3", brandId: "otrivin", name: "Otrivin Baby Drops 10ml", packSize: "10ml", mrp: 110, ids: pIds("PE-OTR3", "TM-OTR3", "ZP-OTR3", "AM-OTR3") },
  { id: "sk-otr-4", brandId: "otrivin", name: "Otrivin Saline Drops 10ml", packSize: "10ml", mrp: 95, ids: pIds("PE-OTR4", "TM-OTR4", "ZP-OTR4", "AM-OTR4") },
  { id: "sk-otr-5", brandId: "otrivin", name: "Otrivin Menthol Plus 10ml", packSize: "10ml", mrp: 165, ids: pIds("PE-OTR5", "TM-OTR5", "ZP-OTR5", "AM-OTR5") },

  // ENO (Antacids) — 6 SKUs
  { id: "sk-eno-1", brandId: "eno", name: "ENO Lemon 5g sachet x30", packSize: "5g x30", mrp: 150, ids: pIds("PE-ENO1", "TM-ENO1", "ZP-ENO1", "AM-ENO1") },
  { id: "sk-eno-2", brandId: "eno", name: "ENO Orange 5g sachet x30", packSize: "5g x30", mrp: 150, ids: pIds("PE-ENO2", "TM-ENO2", "ZP-ENO2", "AM-ENO2") },
  { id: "sk-eno-3", brandId: "eno", name: "ENO Regular 100g bottle", packSize: "100g", mrp: 110, ids: pIds("PE-ENO3", "TM-ENO3", "ZP-ENO3", "AM-ENO3") },
  { id: "sk-eno-4", brandId: "eno", name: "ENO Cool Lemon 5g sachet x30", packSize: "5g x30", mrp: 155, ids: pIds("PE-ENO4", "TM-ENO4", "ZP-ENO4", "AM-ENO4") },
  { id: "sk-eno-5", brandId: "eno", name: "ENO Lemon 100g bottle", packSize: "100g", mrp: 115, ids: pIds("PE-ENO5", "TM-ENO5", "ZP-ENO5", "AM-ENO5") },
  { id: "sk-eno-6", brandId: "eno", name: "ENO Masala Lime 5g sachet x10", packSize: "5g x10", mrp: 55, ids: pIds("PE-ENO6", "TM-ENO6", "ZP-ENO6", "AM-ENO6") },
];

function pIds(pe: string, tm: string, zp: string, am: string): Record<Platform, string | null> {
  return { pharmeasy: pe, tata_1mg: tm, zepto: zp, amazon_pharmacy: am };
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
  sensodyne: ["sensitive toothpaste", "sensodyne", "toothpaste for sensitive teeth", "tooth pain toothpaste", "best toothpaste sensitive teeth"],
  crocin: ["crocin", "paracetamol 500", "fever tablet", "headache medicine", "body pain tablet"],
  panadol: ["panadol", "paracetamol", "headache tablet"],
  voltaren: ["voltaren", "knee pain gel", "muscle pain relief gel", "back pain gel"],
  centrum: ["centrum", "multivitamin", "daily vitamin tablet", "centrum women", "centrum men"],
  otrivin: ["otrivin", "nasal spray", "blocked nose spray", "nasal decongestant"],
  eno: ["eno", "antacid", "acidity relief", "gas problem", "eno lemon"],
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
export type PlatformMetricRow = { platform: Platform; weekEnding: string; gmv: number; mau: number; aov: number; reach: number };
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
export type OfftakeRow = { skuId: string; platform: Platform; weekEnding: string; units: number; gmv: number };
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
        out.push({ skuId: s.id, platform: p, weekEnding: w, units, gmv: Math.round(units * price) });
      });
    });
  });
  return out;
})();

// --- Listings ---
export type ListingRow = { skuId: string; platform: Platform; weekEnding: string; status: "listed" | "unlisted" | "oos" };
export const listings: ListingRow[] = (() => {
  const out: ListingRow[] = [];
  skus.forEach((s) => {
    PLATFORMS.forEach((p) => {
      weeks.forEach((w) => {
        const r = rngFor(`lst-${s.id}-${p}-${w}`);
        const x = r();
        const status: ListingRow["status"] = x < 0.05 ? "unlisted" : x < 0.1 ? "oos" : "listed";
        out.push({ skuId: s.id, platform: p, weekEnding: w, status });
      });
    });
  });
  return out;
})();

// --- Visibility (keyword rank) ---
export type VisibilityRow = { brandId: string; keyword: string; platform: Platform; weekEnding: string; rank: number | null };
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
          out.push({ brandId, keyword: kw, platform: p, weekEnding: w, rank });
        });
      });
    });
  });
  return out;
})();

// --- Prices (per-SKU, per-competitor) ---
export type PriceRow = { skuId?: string; competitorSkuId?: string; platform: Platform; weekEnding: string; price: number };

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
          price: Math.round(price),
        } as PriceRow);
      });
    });
  });
  return out;
})();

// --- Fair share targets (mutable in-app via setFairShare) ---
const fairShareDefault: Record<string, number> = {
  sensodyne: 22, crocin: 18, panadol: 12, voltaren: 14, centrum: 24, otrivin: 20, eno: 28,
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

export function brandGMV(brandId: string, platform: Platform, week: string): number {
  const brandSkuIds = new Set(skus.filter((s) => s.brandId === brandId).map((s) => s.id));
  return offtakes
    .filter((o) => o.platform === platform && o.weekEnding === week && brandSkuIds.has(o.skuId))
    .reduce((a, b) => a + b.gmv, 0);
}
export function brandUnits(brandId: string, platform: Platform, week: string): number {
  const brandSkuIds = new Set(skus.filter((s) => s.brandId === brandId).map((s) => s.id));
  return offtakes
    .filter((o) => o.platform === platform && o.weekEnding === week && brandSkuIds.has(o.skuId))
    .reduce((a, b) => a + b.units, 0);
}
export function categoryGMV(categoryId: string, platform: Platform, week: string): number {
  // Approximate category GMV = Haleon brand GMV in category + an inflated competitor share.
  const haleonInCat = brands.filter((b) => b.categoryId === categoryId);
  const haleonGMV = haleonInCat.reduce((a, b) => a + brandGMV(b.id, platform, week), 0);
  // Assume Haleon = ~35-55% of category depending on category.
  const r = rngFor(`cat-${categoryId}-${platform}-${week}`);
  const haleonShare = 0.35 + r() * 0.2;
  return Math.round(haleonGMV / haleonShare);
}
export function brandMarketShare(brandId: string, platform: Platform, week: string): number {
  const b = brandById(brandId);
  const cat = categoryGMV(b.categoryId, platform, week);
  if (!cat) return 0;
  return +((brandGMV(brandId, platform, week) / cat) * 100).toFixed(2);
}

export function deltaPct(curr: number, prev: number): number {
  if (!prev) return 0;
  return +(((curr - prev) / prev) * 100).toFixed(1);
}
export function prevWeek(week: string): string | null {
  const i = weeks.indexOf(week);
  if (i <= 0) return null;
  return weeks[i - 1];
}

// ==== Score helpers for /brand-health ====
export function visibilityScore(brandId: string, platform: Platform | "all", week: string): number {
  const kws = brandKeywords[brandId] ?? [];
  const plats = platform === "all" ? PLATFORMS : [platform];
  let total = 0, n = 0;
  kws.forEach((kw) => {
    plats.forEach((p) => {
      const row = visibility.find((v) => v.brandId === brandId && v.keyword === kw && v.platform === p && v.weekEnding === week);
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
export function listingScore(brandId: string, platform: Platform | "all", week: string): number {
  const sIds = skus.filter((s) => s.brandId === brandId).map((s) => s.id);
  const plats = platform === "all" ? PLATFORMS : [platform];
  let listed = 0, total = 0;
  sIds.forEach((id) => {
    plats.forEach((p) => {
      const row = listings.find((l) => l.skuId === id && l.platform === p && l.weekEnding === week);
      if (!row) return;
      total++;
      if (row.status === "listed") listed++;
    });
  });
  return total ? Math.round((listed / total) * 100) : 0;
}
export function priceCompetitivenessScore(brandId: string, platform: Platform | "all", week: string): number {
  // Score = lower selling price vs MRP is better. Average discount % across brand SKUs.
  const brandSkus = skus.filter((s) => s.brandId === brandId);
  const plats = platform === "all" ? PLATFORMS : [platform];
  let total = 0, n = 0;
  brandSkus.forEach((s) => {
    plats.forEach((p) => {
      const pr = prices.find((x) => x.skuId === s.id && x.platform === p && x.weekEnding === week);
      if (!pr) return;
      const disc = 1 - pr.price / s.mrp; // 0..0.45
      n++;
      total += Math.min(100, Math.round(disc * 250));
    });
  });
  return n ? Math.round(total / n) : 0;
}
export function marketShareScore(brandId: string, platform: Platform | "all", week: string): number {
  const plats = platform === "all" ? PLATFORMS : [platform];
  let total = 0;
  plats.forEach((p) => {
    const ms = brandMarketShare(brandId, p, week);
    const fs = getFairShare(brandId, p);
    // If gap >=0 (meeting fair share) -> 100; gap of -10pp -> 50; -20pp -> 0
    const gap = ms - fs;
    const sc = Math.max(0, Math.min(100, 100 + gap * 5));
    total += sc;
  });
  return Math.round(total / plats.length);
}
export function overallBrandHealth(brandId: string, platform: Platform | "all", week: string): number {
  return Math.round(
    (visibilityScore(brandId, platform, week) +
      listingScore(brandId, platform, week) +
      priceCompetitivenessScore(brandId, platform, week) +
      marketShareScore(brandId, platform, week)) /
      4,
  );
}
