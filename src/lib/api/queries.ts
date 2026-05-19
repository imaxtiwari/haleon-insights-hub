import { createServerFn } from "@tanstack/react-start";
import type { Platform, OfftakeRow, ListingRow, VisibilityRow, PlatformMetricRow, PriceRow } from "@/lib/mock-data";

// ── New type for D1 prices (unified item_id / item_kind) ─────────────────────
export type DbPriceRow = {
  itemId: string;
  itemKind: "sku" | "comp";
  platform: Platform;
  weekEnding: string;
  price: number;
};

export type DbFairShareRow = {
  brandId: string;
  platform: Platform;
  targetPct: number;
};

export type DbUploadRow = {
  id: string;
  weekEnding: string;
  platform: Platform;
  uploadedBy: string;
  uploadedAt: string;
  rowCount: number;
  status: "committed" | "processing" | "failed";
};

// ── Fetch server functions ────────────────────────────────────────────────────

export const fetchOfftakes = createServerFn({ method: "GET" }).handler(
  async (): Promise<OfftakeRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { sku_id: string; platform: string; week_ending: string; units: number; gmv: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT sku_id, platform, week_ending, units, gmv FROM offtakes ORDER BY week_ending")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      skuId: r.sku_id,
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      units: r.units,
      gmv: r.gmv,
    }));
  },
);

export const fetchListings = createServerFn({ method: "GET" }).handler(
  async (): Promise<ListingRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { sku_id: string; platform: string; week_ending: string; status: string };
    const result = (await env.haleon_insights_db
      .prepare("SELECT sku_id, platform, week_ending, status FROM listings ORDER BY week_ending")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      skuId: r.sku_id,
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      status: r.status as ListingRow["status"],
    }));
  },
);

export const fetchPrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbPriceRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { item_id: string; item_kind: string; platform: string; week_ending: string; price: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT item_id, item_kind, platform, week_ending, price FROM prices ORDER BY week_ending")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      itemId: r.item_id,
      itemKind: r.item_kind as "sku" | "comp",
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      price: r.price,
    }));
  },
);

export const fetchVisibility = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisibilityRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { brand_id: string; keyword: string; platform: string; week_ending: string; rank: number | null };
    const result = (await env.haleon_insights_db
      .prepare("SELECT brand_id, keyword, platform, week_ending, rank FROM visibility ORDER BY week_ending")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      brandId: r.brand_id,
      keyword: r.keyword,
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      rank: r.rank,
    }));
  },
);

export const fetchPlatformMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlatformMetricRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { platform: string; week_ending: string; gmv: number; mau: number; aov: number; reach: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT platform, week_ending, gmv, mau, aov, reach FROM platform_metrics ORDER BY week_ending")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      gmv: r.gmv,
      mau: r.mau,
      aov: r.aov,
      reach: r.reach,
    }));
  },
);

export const fetchFairShares = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbFairShareRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { brand_id: string; platform: string; target_pct: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT brand_id, platform, target_pct FROM fair_shares")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      brandId: r.brand_id,
      platform: r.platform as Platform,
      targetPct: r.target_pct,
    }));
  },
);

export const fetchUploads = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbUploadRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = {
      id: string; week_ending: string; platform: string;
      uploaded_by: string; uploaded_at: string; row_count: number; status: string;
    };
    const result = (await env.haleon_insights_db
      .prepare(
        "SELECT id, week_ending, platform, uploaded_by, uploaded_at, row_count, status FROM uploads ORDER BY uploaded_at DESC"
      )
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      id: r.id,
      weekEnding: r.week_ending,
      platform: r.platform as Platform,
      uploadedBy: r.uploaded_by,
      uploadedAt: r.uploaded_at,
      rowCount: r.row_count,
      status: r.status as DbUploadRow["status"],
    }));
  },
);

// ── Mutation ──────────────────────────────────────────────────────────────────

export type UpdateFairShareInput = { brandId: string; platform: Platform; targetPct: number };

export const updateFairShare = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateFairShareInput) => input)
  .handler(async ({ data }) => {
    const { env } = await import("cloudflare:workers");
    await env.haleon_insights_db
      .prepare("UPDATE fair_shares SET target_pct = ? WHERE brand_id = ? AND platform = ?")
      .bind(data.targetPct, data.brandId, data.platform)
      .run();
  });

// ── Helper: convert DbPriceRow → PriceRow (mock-data shape) ─────────────────
export function toPriceRows(dbRows: DbPriceRow[]): PriceRow[] {
  return dbRows.map((r) =>
    r.itemKind === "sku"
      ? { skuId: r.itemId, platform: r.platform, weekEnding: r.weekEnding, price: r.price }
      : { competitorSkuId: r.itemId, platform: r.platform, weekEnding: r.weekEnding, price: r.price },
  );
}
