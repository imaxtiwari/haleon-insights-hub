import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

// ── Real data from Tata 1mg Excel — Jan–Apr 2026 ─────────────────────────────
// Source: "Haleon - Tata 1MG Data - Jan-26 - Apr-26.xlsx" (Tata 1MG sheet)
// Centrum row = MVM + Omega + Biotin + Recharge NPI + CJM (sub-brand aggregates)
// Ostocalcium row = "Osto + CCM" line from the same sheet
// Otrivin + Crocin combined in the file (Apr only) — split 50/50 here
const REAL_1MG_DATA: DbDigitalSpendsRow[] = [
  // ── Sensodyne Paste ────────────────────────────────────────────────────────
  { id: "paste|tata_1mg|2026-01", brandId: "paste",      platform: "tata_1mg", period: "2026-01", paidSpendInr:  98_404, paidSalesInr: 126_494, paidRoas: 1.29 },
  { id: "paste|tata_1mg|2026-02", brandId: "paste",      platform: "tata_1mg", period: "2026-02", paidSpendInr:  80_637, paidSalesInr:  98_513, paidRoas: 1.22 },
  { id: "paste|tata_1mg|2026-03", brandId: "paste",      platform: "tata_1mg", period: "2026-03", paidSpendInr:  93_977, paidSalesInr:  97_650, paidRoas: 1.04 },
  { id: "paste|tata_1mg|2026-04", brandId: "paste",      platform: "tata_1mg", period: "2026-04", paidSpendInr: 118_020, paidSalesInr:  78_868, paidRoas: 0.67 },
  // ── Parodontax ────────────────────────────────────────────────────────────
  { id: "paro|tata_1mg|2026-01", brandId: "parodontax", platform: "tata_1mg", period: "2026-01", paidSpendInr:  53_437, paidSalesInr:  22_469, paidRoas: 0.42 },
  { id: "paro|tata_1mg|2026-02", brandId: "parodontax", platform: "tata_1mg", period: "2026-02", paidSpendInr:  30_388, paidSalesInr:  14_966, paidRoas: 0.49 },
  { id: "paro|tata_1mg|2026-03", brandId: "parodontax", platform: "tata_1mg", period: "2026-03", paidSpendInr:  30_969, paidSalesInr:  13_026, paidRoas: 0.42 },
  { id: "paro|tata_1mg|2026-04", brandId: "parodontax", platform: "tata_1mg", period: "2026-04", paidSpendInr:  27_846, paidSalesInr:  12_250, paidRoas: 0.44 },
  // ── Centrum (MVM + Omega + Biotin + NPI + CJM; Osto kept separate below) ──
  { id: "cent|tata_1mg|2026-01", brandId: "centrum",    platform: "tata_1mg", period: "2026-01", paidSpendInr: 497_652, paidSalesInr: 341_833, paidRoas: 0.69 },
  { id: "cent|tata_1mg|2026-02", brandId: "centrum",    platform: "tata_1mg", period: "2026-02", paidSpendInr: 559_535, paidSalesInr: 432_986, paidRoas: 0.77 },
  { id: "cent|tata_1mg|2026-03", brandId: "centrum",    platform: "tata_1mg", period: "2026-03", paidSpendInr: 372_185, paidSalesInr: 459_751, paidRoas: 1.24 },
  { id: "cent|tata_1mg|2026-04", brandId: "centrum",    platform: "tata_1mg", period: "2026-04", paidSpendInr: 561_782, paidSalesInr: 299_779, paidRoas: 0.53 },
  // ── Ostocalcium (Osto + CCM line — zero in Jan) ───────────────────────────
  { id: "osto|tata_1mg|2026-02", brandId: "ostocalcium", platform: "tata_1mg", period: "2026-02", paidSpendInr:  87_232, paidSalesInr:  73_118, paidRoas: 0.84 },
  { id: "osto|tata_1mg|2026-03", brandId: "ostocalcium", platform: "tata_1mg", period: "2026-03", paidSpendInr:  86_907, paidSalesInr:  80_907, paidRoas: 0.93 },
  { id: "osto|tata_1mg|2026-04", brandId: "ostocalcium", platform: "tata_1mg", period: "2026-04", paidSpendInr:  85_900, paidSalesInr:  73_044, paidRoas: 0.85 },
  // ── Eno (Bites NPI — Jan only) ────────────────────────────────────────────
  { id: "eno|tata_1mg|2026-01",  brandId: "eno",         platform: "tata_1mg", period: "2026-01", paidSpendInr:  18_480, paidSalesInr:  33_243, paidRoas: 1.80 },
  // ── Otrivin + Crocin combined (Apr only, split 50/50) ─────────────────────
  { id: "otr|tata_1mg|2026-04",  brandId: "otrivin",     platform: "tata_1mg", period: "2026-04", paidSpendInr:   4_805, paidSalesInr:   2_263, paidRoas: 0.47 },
  { id: "cro|tata_1mg|2026-04",  brandId: "crocin",      platform: "tata_1mg", period: "2026-04", paidSpendInr:   4_805, paidSalesInr:   2_262, paidRoas: 0.47 },
];

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

function DigitalSpendsPage() {
  const { dbRows } = Route.useLoaderData();
  const { period }  = usePeriod();

  // DB rows take priority; fall back to the real Excel-sourced seed data
  const allRows: DbDigitalSpendsRow[] = useMemo(
    () => {
      // Filter DB rows to tata_1mg only — other platforms have no data yet
      const db1mg = dbRows.filter((r) => r.platform === "tata_1mg");
      return db1mg.length > 0 ? db1mg : REAL_1MG_DATA;
    },
    [dbRows],
  );
  const usingDbData = dbRows.filter((r) => r.platform === "tata_1mg").length > 0;

  // Platform is locked to tata_1mg
  const PLATFORM = "tata_1mg" as const;

  // All periods present in data, sorted
  const allPeriods = useMemo(
    () => [...new Set(allRows.map((r) => r.period))].sort(),
    [allRows],
  );

  // KPI period rows
  const periodRows = useMemo(
    () => allRows.filter((r) => r.period === period),
    [allRows, period],
  );

  // ── KPI tiles ──────────────────────────────────────────────────────────────
  const totalSpend  = periodRows.reduce((a, r) => a + r.paidSpendInr, 0);
  const totalSales  = periodRows.reduce((a, r) => a + r.paidSalesInr, 0);
  const blendedRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

  const bestBrand = useMemo(() => {
    const active = periodRows.filter((r) => r.paidSpendInr > 0);
    if (active.length === 0) return null;
    const best = active.reduce((a, b) => (b.paidRoas > a.paidRoas ? b : a));
    return { brandId: best.brandId, roas: best.paidRoas };
  }, [periodRows]);

  const bestBrandName = brands.find((b) => b.id === bestBrand?.brandId)?.name ?? bestBrand?.brandId ?? "—";

  // ── ROAS trend line chart data ─────────────────────────────────────────────
  const roasTrendData = useMemo(() => {
    return allPeriods.map((p) => {
      const row: Record<string, string | number> = { period: fmtPeriodShort(p) };
      brands.forEach((b) => {
        const r = allRows.find((cr) => cr.brandId === b.id && cr.period === p);
        if (r && r.paidSpendInr > 0) row[b.id] = +r.paidRoas.toFixed(2);
      });
      return row;
    });
  }, [allRows, allPeriods]);

  // ── Spend vs Paid Sales bar chart (current period, per brand) ─────────────
  const spendSalesData = useMemo(() => {
    return brands
      .map((b) => {
        const r = periodRows.find((cr) => cr.brandId === b.id);
        return {
          brand:     b.name.length > 12 ? b.name.slice(0, 10) + "…" : b.name,
          brandFull: b.name,
          spend:     r?.paidSpendInr ?? 0,
          sales:     r?.paidSalesInr ?? 0,
          roas:      r?.paidRoas ?? 0,
        };
      })
      .filter((d) => d.spend > 0 || d.sales > 0)
      .sort((a, b) => b.spend - a.spend);
  }, [periodRows]);

  // Brands with any activity in the chart window
  const activeBrands = useMemo(
    () => brands.filter((b) => allRows.some((r) => r.brandId === b.id && r.paidSpendInr > 0)),
    [allRows],
  );

  // ── ROAS colour helper ─────────────────────────────────────────────────────
  const roasColor = (v: number) =>
    v >= 1.5 ? "text-success" : v >= 1.0 ? "text-warning-foreground" : "text-destructive";

  return (
    <div>
      <PageHeader
        title="Digital Spends & ROAS"
        subtitle="Tata 1mg · Jan–Apr 2026"
      />

      {/* ── Data availability banner ──────────────────────────────────────── */}
      <Alert className="mb-5 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <Info className="size-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
          Digital spends data available for <span className="font-semibold">Tata 1mg only</span>.
          PharmEasy / Zepto / Amazon Pharmacy data pending.
          {usingDbData
            ? <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">✓ Showing live DB data</span>
            : <span className="ml-2 opacity-70"> · Showing actuals from Jan–Apr 2026 file</span>
          }
        </AlertDescription>
      </Alert>

      {/* ── Platform badge (locked — no selector) ────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-muted-foreground">Platform:</span>
        <Badge variant="secondary" className="text-xs font-medium">Tata 1mg</Badge>
        <span className="text-xs text-muted-foreground/60 ml-1">
          PharmEasy · Zepto · Amazon — data pending
        </span>
      </div>

      {/* ── KPI tiles ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<IndianRupee className="size-4 text-muted-foreground" />}
          label="Total Paid Spend"
          value={totalSpend > 0 ? formatINR(totalSpend) : "—"}
          sub={totalSpend === 0 ? "No data for this period" : undefined}
        />
        <KpiCard
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
          label="Total Paid Sales"
          value={totalSales > 0 ? formatINR(totalSales) : "—"}
        />
        <KpiCard
          icon={<Zap className="size-4 text-muted-foreground" />}
          label="Blended ROAS"
          value={blendedRoas > 0 ? `${blendedRoas.toFixed(2)}×` : "—"}
          valueClass={blendedRoas > 0 ? roasColor(blendedRoas) : undefined}
          sub={blendedRoas > 0 && blendedRoas < 1 ? "Below breakeven (< 1×)" : undefined}
          subClass={blendedRoas > 0 && blendedRoas < 1 ? "text-destructive" : undefined}
        />
        <KpiCard
          icon={<Award className="size-4 text-muted-foreground" />}
          label="Best ROAS Brand"
          value={bestBrandName}
          sub={bestBrand ? `${bestBrand.roas.toFixed(2)}×` : undefined}
          valueClass="text-primary"
        />
      </div>

      {/* ── Brand-level ROAS table for current period ─────────────────────── */}
      {periodRows.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Brand breakdown · {fmtPeriodShort(period)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Brand</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Paid Spend</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Paid Sales</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {periodRows
                  .filter((r) => r.paidSpendInr > 0)
                  .sort((a, b) => b.paidSpendInr - a.paidSpendInr)
                  .map((r) => {
                    const brandName = brands.find((b) => b.id === r.brandId)?.name ?? r.brandId;
                    return (
                      <tr key={r.brandId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">{brandName}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(r.paidSpendInr)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(r.paidSalesInr)}</td>
                        <td className={cn("px-4 py-2.5 text-right tabular-nums font-semibold", roasColor(r.paidRoas))}>
                          {r.paidRoas.toFixed(2)}×
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold border-t">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">Total</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(totalSpend)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(totalSales)}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", roasColor(blendedRoas))}>
                    {blendedRoas.toFixed(2)}×
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {periodRows.filter((r) => r.paidSpendInr > 0).length === 0 && (
        <div className="mb-6 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No paid spend data for <span className="font-semibold">{fmtPeriodShort(period)}</span>.
          Data available for Jan–Apr 2026.
        </div>
      )}

      {/* ── ROAS trend line chart ─────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ROAS Trend · Jan–Apr 2026</CardTitle>
          <p className="text-xs text-muted-foreground">
            Dashed line at 1.0× = breakeven. Mar 2026 was the only profitable month overall.
          </p>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roasTrendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              {/* Breakeven reference line at 1.0 */}
              <CartesianGrid horizontal={false} stroke="transparent" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `${v}×`}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                formatter={(v, name) => [
                  `${Number(v).toFixed(2)}×`,
                  brands.find((b) => b.id === name)?.name ?? name,
                ]}
              />
              {activeBrands.map((b) => (
                <Line
                  key={b.id}
                  type="monotone"
                  dataKey={b.id}
                  stroke={BRAND_COLORS[b.id] ?? "#94a3b8"}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {activeBrands.map((b) => (
              <div key={b.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full shrink-0" style={{ background: BRAND_COLORS[b.id] ?? "#94a3b8" }} />
                {b.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Spend vs Paid Sales bar chart ────────────────────────────────────── */}
      {spendSalesData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Spend vs Paid Sales · {fmtPeriodShort(period)}
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
      )}
    </div>
  );
}

// ── KPI card component ────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, valueClass, subClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  subClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1 flex-row items-center justify-between">
        <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tabular-nums", valueClass)}>{value}</div>
        {sub && <div className={cn("text-xs text-muted-foreground mt-0.5", subClass)}>{sub}</div>}
      </CardContent>
    </Card>
  );
}
