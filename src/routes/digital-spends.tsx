import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid,
} from "recharts";
import { TrendingUp, IndianRupee, Zap, Award, Info } from "lucide-react";
import { brands } from "@/lib/mock-data";
import { fetchDigitalSpends, type DbDigitalSpendsRow } from "@/lib/api/queries";
import { usePeriod } from "@/lib/period-context";
import { formatINR, fmtPeriodShort } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Mock fallback data (shown when DB is empty) ────────────────────────────────
// Representative Jan-Apr 2026, platform = tata_1mg
const MOCK_PERIODS = ["2026-01", "2026-02", "2026-03", "2026-04"];

type MockEntry = { brandId: string; period: string; spend: number; sales: number };
const MOCK_SEEDS: Array<{ brandId: string; baseSpend: number; baseRoas: number }> = [
  { brandId: "paste",       baseSpend: 320000,  baseRoas: 4.8 },
  { brandId: "brush",       baseSpend: 180000,  baseRoas: 3.9 },
  { brandId: "parodontax",  baseSpend: 240000,  baseRoas: 5.2 },
  { brandId: "pronamel",    baseSpend: 160000,  baseRoas: 4.1 },
  { brandId: "mouthwash",   baseSpend: 140000,  baseRoas: 3.5 },
  { brandId: "polident",    baseSpend: 90000,   baseRoas: 3.2 },
  { brandId: "crocin",      baseSpend: 480000,  baseRoas: 6.3 },
  { brandId: "iodex",       baseSpend: 260000,  baseRoas: 5.7 },
  { brandId: "voltaren",    baseSpend: 300000,  baseRoas: 5.4 },
  { brandId: "centrum",     baseSpend: 420000,  baseRoas: 4.6 },
  { brandId: "ostocalcium", baseSpend: 200000,  baseRoas: 3.8 },
  { brandId: "eno",         baseSpend: 380000,  baseRoas: 5.1 },
  { brandId: "otrivin",     baseSpend: 290000,  baseRoas: 4.4 },
];

function makeMockData(): DbDigitalSpendsRow[] {
  const rows: DbDigitalSpendsRow[] = [];
  // Seeded-RNG for determinism
  let seed = 42;
  function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }

  for (const { brandId, baseSpend, baseRoas } of MOCK_SEEDS) {
    MOCK_PERIODS.forEach((period, mi) => {
      const trend  = 1 + mi * 0.04;                     // slight growth each month
      const noise  = 0.88 + rng() * 0.24;               // ±12% random
      const spend  = Math.round(baseSpend * trend * noise);
      const roas   = +(baseRoas * (0.92 + rng() * 0.16)).toFixed(2);
      const sales  = Math.round(spend * roas);
      rows.push({
        id:           `${brandId}|tata_1mg|${period}`,
        brandId,
        platform:     "tata_1mg",
        period,
        paidSpendInr: spend,
        paidSalesInr: sales,
        paidRoas:     roas,
      });
    });
  }
  return rows;
}

// ── Chart colour palette (one per brand) ─────────────────────────────────────
const BRAND_COLORS: Record<string, string> = {
  paste:       "var(--chart-1)",
  brush:       "var(--chart-2)",
  parodontax:  "var(--chart-3)",
  pronamel:    "var(--chart-4)",
  mouthwash:   "var(--chart-5)",
  polident:    "#8b5cf6",
  crocin:      "#f59e0b",
  iodex:       "#10b981",
  voltaren:    "#ef4444",
  centrum:     "#3b82f6",
  ostocalcium: "#ec4899",
  eno:         "#14b8a6",
  otrivin:     "#f97316",
};

// ── Route ─────────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/digital-spends")({
  loader: async () => {
    const dbRows = await fetchDigitalSpends();
    return { dbRows };
  },
  component: DigitalSpendsPage,
});

// Brand label overrides for digital-spends display
// (Sensodyne stored as "paste" in DB; Centrum as "centrum"; etc.)
const DS_BRAND_LABEL: Record<string, string> = {
  paste:      "Sensodyne",
  centrum:    "Centrum",
  parodontax: "Parodontax",
  eno:        "Eno",
  iodex:      "Iodex",
  otrivin:    "Otrivin + Crocin",
};

function DigitalSpendsPage() {
  const { dbRows } = Route.useLoaderData();
  const { period }  = usePeriod();

  // Use real DB data if available, else mock — always tata_1mg only
  const allRows: DbDigitalSpendsRow[] = useMemo(
    () => (dbRows.length > 0 ? dbRows : makeMockData()).filter((r) => r.platform === "tata_1mg"),
    [dbRows],
  );
  const usingRealData = dbRows.length > 0;

  // Derive all periods present in data, sorted
  const allPeriods = useMemo(
    () => [...new Set(allRows.map((r) => r.period))].sort(),
    [allRows],
  );

  // Chart rows = all periods for tata_1mg
  const chartRows = allRows;

  // Rows for the current period (KPI tiles + bar chart)
  // Fall back to the latest period with data if current has none
  const effectivePeriod = useMemo(() => {
    if (allRows.some((r) => r.period === period)) return period;
    return allPeriods.at(-1) ?? period;
  }, [allRows, allPeriods, period]);

  const periodRows = useMemo(
    () => chartRows.filter((r) => r.period === effectivePeriod),
    [chartRows, effectivePeriod],
  );

  // ── KPI tiles ──────────────────────────────────────────────────────────────
  const totalSpend  = periodRows.reduce((a, r) => a + r.paidSpendInr, 0);
  const totalSales  = periodRows.reduce((a, r) => a + r.paidSalesInr, 0);
  const blendedRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

  const bestBrand = useMemo(() => {
    if (periodRows.length === 0) return null;
    const best = periodRows.reduce((a, b) => (b.paidRoas > a.paidRoas ? b : a));
    return { brandId: best.brandId, roas: best.paidRoas };
  }, [periodRows]);

  const bestBrandName = bestBrand
    ? (DS_BRAND_LABEL[bestBrand.brandId] ?? brands.find((b) => b.id === bestBrand.brandId)?.name ?? bestBrand.brandId)
    : "—";

  // ── ROAS trend line chart data (all periods, one series per brand) ─────────
  const roasTrendData = useMemo(() => {
    return allPeriods.map((p) => {
      const row: Record<string, string | number> = { period: fmtPeriodShort(p) };
      activeBrandIds.forEach((bId) => {
        const r = chartRows.find((cr) => cr.brandId === bId && cr.period === p);
        if (r) row[bId] = +r.paidRoas.toFixed(2);
      });
      return row;
    });
  }, [chartRows, allPeriods, activeBrandIds]);

  // ── Spend vs Paid Sales bar chart (current period, per brand) ─────────────
  const spendSalesData = useMemo(() => {
    return periodRows
      .map((r) => {
        const label = DS_BRAND_LABEL[r.brandId] ?? (brands.find((b) => b.id === r.brandId)?.name ?? r.brandId);
        const short = label.length > 13 ? label.slice(0, 11) + "…" : label;
        return { brand: short, brandFull: label, spend: r.paidSpendInr, sales: r.paidSalesInr, roas: r.paidRoas };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [periodRows]);

  // Unique brand IDs active across all periods (for the ROAS trend chart)
  const activeBrandIds = useMemo(
    () => [...new Set(chartRows.map((r) => r.brandId))],
    [chartRows],
  );

  return (
    <div>
      <PageHeader
        title="Digital Spends & ROAS"
        subtitle={usingRealData ? "Tata 1mg · Jan – Apr 2026 actuals" : "Tata 1mg · Showing estimated data"}
      />

      {/* Platform availability banner */}
      <div className="mb-5 flex items-start gap-2.5 text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-md px-3.5 py-2.5">
        <Info className="size-3.5 shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold">Digital spends data available for Tata 1mg only.</span>
          {" "}PharmEasy / Zepto / Amazon data pending.
        </span>
      </div>

      {/* Platform indicator (read-only) */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
          <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
          Tata 1mg
        </Badge>
        {!usingRealData && (
          <span className="text-xs text-amber-600">
            Estimated — upload Jan–Apr file to see actuals
          </span>
        )}
        {usingRealData && effectivePeriod !== period && (
          <span className="text-xs text-muted-foreground">
            No data for selected period · showing {effectivePeriod}
          </span>
        )}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<IndianRupee className="size-4 text-muted-foreground" />}
          label="Total Paid Spend"
          value={formatINR(totalSpend)}
        />
        <KpiCard
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
          label="Total Paid Sales"
          value={formatINR(totalSales)}
        />
        <KpiCard
          icon={<Zap className="size-4 text-muted-foreground" />}
          label="Blended ROAS"
          value={blendedRoas > 0 ? `${blendedRoas.toFixed(2)}×` : "—"}
          highlight={blendedRoas >= 4}
        />
        <KpiCard
          icon={<Award className="size-4 text-muted-foreground" />}
          label="Best ROAS Brand"
          value={bestBrandName}
          sub={bestBrand ? `${bestBrand.roas.toFixed(2)}×` : undefined}
          highlight
        />
      </div>

      {/* ROAS trend line chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ROAS Trend · all brands</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roasTrendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `${v}×`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                formatter={(v, name) => [
                  `${Number(v).toFixed(2)}×`,
                  DS_BRAND_LABEL[name as string] ?? brands.find((b) => b.id === name)?.name ?? name,
                ]}
              />
              {activeBrandIds.map((bId, i) => (
                <Line
                  key={bId}
                  type="monotone"
                  dataKey={bId}
                  stroke={BRAND_COLORS[bId] ?? `hsl(${(i * 60) % 360}, 65%, 50%)`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {activeBrandIds.map((bId, i) => (
              <div key={bId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full shrink-0" style={{ background: BRAND_COLORS[bId] ?? `hsl(${(i * 60) % 360}, 65%, 50%)` }} />
                {DS_BRAND_LABEL[bId] ?? brands.find((b) => b.id === bId)?.name ?? bId}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spend vs Paid Sales bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Spend vs Paid Sales · {fmtPeriodShort(effectivePeriod)}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={spendSalesData}
              margin={{ top: 4, right: 16, left: 0, bottom: 32 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="brand"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={68}
                tickFormatter={(v) => formatINR(v as number)}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                formatter={(v: number, name: string) =>
                  [formatINR(v), name === "spend" ? "Paid Spend" : "Paid Sales"] as [string, string]
                }
                labelFormatter={(label: string, payload) =>
                  (payload?.[0]?.payload as { brandFull?: string })?.brandFull ?? label
                }
              />
              <Legend
                verticalAlign="top"
                formatter={(v) => (v === "spend" ? "Paid Spend" : "Paid Sales")}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="spend" fill="var(--chart-2)" radius={[3, 3, 0, 0]} name="spend" />
              <Bar dataKey="sales" fill="var(--chart-1)" radius={[3, 3, 0, 0]} name="sales" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ── KPI card component ────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-1 flex-row items-center justify-between">
        <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tabular-nums", highlight && "text-primary")}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
