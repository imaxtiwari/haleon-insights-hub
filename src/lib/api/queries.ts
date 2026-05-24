import { createServerFn } from "@tanstack/react-start";
import type { Platform, OfftakeRow, ListingRow, VisibilityRow, PlatformMetricRow, PriceRow } from "@/lib/mock-data";

// ── D1 return types ───────────────────────────────────────────────────────────

export type DbPriceRow = {
  itemId: string;
  itemKind: "sku" | "comp";
  platform: Platform;
  weekEnding: string;
  period: string;
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

// ── Offtakes (detail) — period-filtered JOIN with skus ───────────────────────

export type DbOfftakeDetailRow = {
  skuId: string;
  productName: string;
  brandId: string;
  platform: Platform;
  period: string;
  weekEnding: string;
  units: number;
  gmv: number;
  mrp: number;
};

export const fetchOfftakesDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { period: string; platform?: string }) => input)
  .handler(async ({ data }): Promise<DbOfftakeDetailRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = {
      sku_id: string; product_name: string; brand_id: string;
      platform: string; period: string | null; week_ending: string;
      units: number; gmv: number; mrp: number;
    };
    const base = `
      SELECT o.sku_id, s.name AS product_name, s.brand_id, s.mrp,
             o.platform, o.period, o.week_ending, o.units, o.gmv
      FROM offtakes o
      JOIN skus s ON s.id = o.sku_id
      WHERE coalesce(o.period, substr(o.week_ending, 1, 7)) = ?`;

    const result = (
      data.platform && data.platform !== "all"
        ? await env.haleon_insights_db
            .prepare(base + " AND o.platform = ? ORDER BY o.gmv DESC")
            .bind(data.period, data.platform)
            .all()
        : await env.haleon_insights_db
            .prepare(base + " ORDER BY o.gmv DESC")
            .bind(data.period)
            .all()
    ) as D1Result<Raw>;

    return result.results.map((r) => ({
      skuId:       r.sku_id,
      productName: r.product_name,
      brandId:     r.brand_id,
      platform:    r.platform as Platform,
      period:      r.period ?? r.week_ending.slice(0, 7),
      weekEnding:  r.week_ending,
      units:       r.units,
      gmv:         r.gmv,
      mrp:         r.mrp,
    }));
  });

// ── Offtakes (all) — used for sparklines / trend data ────────────────────────

export const fetchOfftakes = createServerFn({ method: "GET" }).handler(
  async (): Promise<OfftakeRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { sku_id: string; platform: string; week_ending: string; period: string | null; units: number; gmv: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT sku_id, platform, week_ending, period, units, gmv FROM offtakes ORDER BY coalesce(period, week_ending)")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      skuId: r.sku_id,
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      period: r.period ?? r.week_ending.slice(0, 7),
      units: r.units,
      gmv: r.gmv,
    }));
  },
);

export const fetchListings = createServerFn({ method: "GET" }).handler(
  async (): Promise<ListingRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { sku_id: string; platform: string; week_ending: string; period: string | null; status: string };
    const result = (await env.haleon_insights_db
      .prepare("SELECT sku_id, platform, week_ending, period, status FROM listings ORDER BY coalesce(period, week_ending)")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      skuId: r.sku_id,
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      period: r.period ?? r.week_ending.slice(0, 7),
      status: r.status as ListingRow["status"],
    }));
  },
);

export const fetchPrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbPriceRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { item_id: string; item_kind: string; platform: string; week_ending: string; period: string | null; price: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT item_id, item_kind, platform, week_ending, period, price FROM prices ORDER BY coalesce(period, week_ending)")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      itemId: r.item_id,
      itemKind: r.item_kind as "sku" | "comp",
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      period: r.period ?? r.week_ending.slice(0, 7),
      price: r.price,
    }));
  },
);

export const fetchVisibility = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisibilityRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { brand_id: string; keyword: string; platform: string; week_ending: string; period: string | null; rank: number | null };
    const result = (await env.haleon_insights_db
      .prepare("SELECT brand_id, keyword, platform, week_ending, period, rank FROM visibility ORDER BY coalesce(period, week_ending)")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      brandId: r.brand_id,
      keyword: r.keyword,
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      period: r.period ?? r.week_ending.slice(0, 7),
      rank: r.rank,
    }));
  },
);

export const fetchPlatformMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlatformMetricRow[]> => {
    const { env } = await import("cloudflare:workers");
    // platform_metrics has no period column — derive from week_ending
    type Raw = { platform: string; week_ending: string; gmv: number; mau: number; aov: number; reach: number };
    const result = (await env.haleon_insights_db
      .prepare("SELECT platform, week_ending, gmv, mau, aov, reach FROM platform_metrics ORDER BY week_ending")
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      platform: r.platform as Platform,
      weekEnding: r.week_ending,
      period: r.week_ending.slice(0, 7),
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

// ── Purchase Orders ───────────────────────────────────────────────────────────

export type PurchaseOrderRow = {
  id: string;
  platform: string;
  period: string;
  productName: string;
  asin?: string;
  location?: string;
  stockistName?: string;
  edCode?: string;
  qty: number;
  mrp: number;
  invoiceDate: string;
};

export const fetchPurchaseOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<PurchaseOrderRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = {
      id: string; platform: string; period: string; product_name: string;
      asin: string | null; location: string | null; stockist_name: string | null;
      ed_code: string | null; qty: number; mrp: number; invoice_date: string;
    };
    const result = (await env.haleon_insights_db
      .prepare(
        `SELECT id, platform, period, product_name, asin, location,
                stockist_name, ed_code, qty, mrp, invoice_date
         FROM purchase_orders
         ORDER BY invoice_date DESC, id`
      )
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      id: r.id,
      platform: r.platform,
      period: r.period,
      productName: r.product_name,
      asin: r.asin ?? undefined,
      location: r.location ?? undefined,
      stockistName: r.stockist_name ?? undefined,
      edCode: r.ed_code ?? undefined,
      qty: r.qty,
      mrp: r.mrp,
      invoiceDate: r.invoice_date,
    }));
  },
);

// ── Digital Spends ────────────────────────────────────────────────────────────

export type DbDigitalSpendsRow = {
  id: string;
  brandId: string;
  platform: Platform;
  period: string;
  paidSpendInr: number;
  paidSalesInr: number;
  paidRoas: number;
};

export const fetchDigitalSpends = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbDigitalSpendsRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = {
      id: string; brand_id: string; platform: string; period: string;
      paid_spend_inr: number; paid_sales_inr: number; paid_roas: number;
    };
    const result = (await env.haleon_insights_db
      .prepare(
        `SELECT id, brand_id, platform, period, paid_spend_inr, paid_sales_inr, paid_roas
         FROM digital_spends ORDER BY period, brand_id`
      )
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      id: r.id,
      brandId: r.brand_id,
      platform: r.platform as Platform,
      period: r.period,
      paidSpendInr: r.paid_spend_inr,
      paidSalesInr: r.paid_sales_inr,
      paidRoas: r.paid_roas,
    }));
  },
);

// ── Market Share ──────────────────────────────────────────────────────────────

export type DbMarketShareRow = {
  brandId: string;
  platform: Platform;
  period: string;
  sharePct: number;
  categoryGmvInr: number | null;
};

export const fetchMarketShare = createServerFn({ method: "GET" })
  .inputValidator((input: { period: string; platform?: Platform | "all" }) => input)
  .handler(async ({ data }): Promise<DbMarketShareRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { brand_id: string; platform: string; period: string; share_pct: number; category_gmv_inr: number | null };
    const platformFilter = data.platform && data.platform !== "all" ? data.platform : null;
    const sql = platformFilter
      ? "SELECT brand_id, platform, period, share_pct, category_gmv_inr FROM brand_market_share WHERE period = ? AND platform = ? ORDER BY brand_id"
      : "SELECT brand_id, platform, period, share_pct, category_gmv_inr FROM brand_market_share WHERE period = ? ORDER BY brand_id";
    const stmt = platformFilter
      ? env.haleon_insights_db.prepare(sql).bind(data.period, platformFilter)
      : env.haleon_insights_db.prepare(sql).bind(data.period);
    const result = (await stmt.all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      brandId: r.brand_id,
      platform: r.platform as Platform,
      period: r.period,
      sharePct: r.share_pct,
      categoryGmvInr: r.category_gmv_inr ?? null,
    }));
  });

// ── Category Market Share ─────────────────────────────────────────────────────

export type DbCategoryMsRow = {
  categoryId: string;
  platform: Platform;
  period: string;
  sharePct: number | null;
  gapCr: number | null;
};

export const fetchCategoryMarketShare = createServerFn({ method: "GET" })
  .inputValidator((input: { period: string }) => input)
  .handler(async ({ data }): Promise<DbCategoryMsRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { category_id: string; platform: string; period: string; share_pct: number | null; gap_cr: number | null };
    const result = (await env.haleon_insights_db
      .prepare(
        `SELECT category_id, platform, period, share_pct, gap_cr
         FROM category_market_share
         WHERE period = ?
         ORDER BY category_id, platform`,
      )
      .bind(data.period)
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      categoryId: r.category_id,
      platform:   r.platform as Platform,
      period:     r.period,
      sharePct:   r.share_pct,
      gapCr:      r.gap_cr,
    }));
  });

// ── Category Market Share (all periods) ──────────────────────────────────────
// Used by market-share page for client-side period fallback + trend charts
export const fetchCategoryMarketShareAll = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbCategoryMsRow[]> => {
    const { env } = await import("cloudflare:workers");
    type Raw = { category_id: string; platform: string; period: string; share_pct: number | null; gap_cr: number | null };
    const result = (await env.haleon_insights_db
      .prepare(
        `SELECT category_id, platform, period, share_pct, gap_cr
         FROM category_market_share
         ORDER BY period, category_id, platform`,
      )
      .all()) as D1Result<Raw>;
    return result.results.map((r) => ({
      categoryId: r.category_id,
      platform:   r.platform as Platform,
      period:     r.period,
      sharePct:   r.share_pct,
      gapCr:      r.gap_cr,
    }));
  },
);

// ── Helper: convert DbPriceRow → PriceRow (mock-data shape) ─────────────────
export function toPriceRows(dbRows: DbPriceRow[]): PriceRow[] {
  return dbRows.map((r) =>
    r.itemKind === "sku"
      ? { skuId: r.itemId, platform: r.platform, weekEnding: r.weekEnding, period: r.period, price: r.price }
      : { competitorSkuId: r.itemId, platform: r.platform, weekEnding: r.weekEnding, period: r.period, price: r.price },
  );
}
