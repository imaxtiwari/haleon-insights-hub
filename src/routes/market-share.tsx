import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Info } from "lucide-react";
import { PLATFORM_LABEL, latestPeriodWithData, type Platform } from "@/lib/mock-data";
import { fetchCategoryMarketShareAll, type DbCategoryMsRow } from "@/lib/api/queries";
import { usePeriod } from "@/lib/period-context";
import { fmtPeriodShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-share")({
  loader: () => fetchCategoryMarketShareAll(),
  component: MarketSharePage,
});

// Category metadata — order matches screenshot
const CATEGORIES = [
  { id: "oral",    label: "Oral Care",    brands: "Sensodyne / Parodontax / Pronamel" },
  { id: "mvm",     label: "VMS",          brands: "Centrum / Ostocalcium" },
  { id: "pain",    label: "Pain Relief",  brands: "Iodex / Crocin / Voltaren" },
  { id: "cold",    label: "Respiratory",  brands: "Otrivin" },
  { id: "antacid", label: "Digestive",    brands: "ENO" },
] as const;

// Fair share = best observed platform share (the benchmark)
const FAIR_SHARE: Record<string, number> = {
  oral: 60.3, mvm: 13.4, pain: 7.4, cold: 47.6, antacid: 14.9,
};

// Rs Cr gap — null means "Track"
const GAP_CR: Record<string, number | null> = {
  oral: 5.7, mvm: 1.0, pain: null, cold: 8.9, antacid: 0.5,
};

const TRACKED_PLATFORMS: Platform[] = ["tata_1mg", "pharmeasy", "zepto"];

// Zepto trend chart colours per category
const CAT_COLORS: Record<string, string> = {
  oral:    "var(--chart-1)",
  mvm:     "var(--chart-2)",
  pain:    "var(--chart-3)",
  cold:    "var(--chart-4)",
  antacid: "var(--chart-5)",
};

function shareBadgeClass(pct: number, fairShare: number) {
  const ratio = pct / fairShare;
  if (ratio >= 0.8)  return "bg-success/15 text-success border-success/30";
  if (ratio >= 0.4)  return "bg-warning/20 text-warning-foreground border-warning/30";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

function MarketSharePage() {
  const allRows = Route.useLoaderData();
  const { period } = usePeriod();

  // Derive effective period (fall back to latest available if selected period has no data)
  const effectivePeriod = useMemo(
    () => latestPeriodWithData(allRows.map((r) => ({ period: r.period, weekEnding: `${r.period}-01` })), period),
    [allRows, period],
  );
  const isSnapshot = effectivePeriod !== period;

  // Filter to effective period for the snapshot table
  const rows = useMemo(
    () => allRows.filter((r) => r.period === effectivePeriod),
    [allRows, effectivePeriod],
  );

  // Build lookup: "catId|platform" → share_pct
  const lookup = useMemo(() => {
    const m = new Map<string, number | null>();
    rows.forEach((r) => m.set(`${r.categoryId}|${r.platform}`, r.sharePct));
    return m;
  }, [rows]);

  const hasData = rows.length > 0;

  // KPI summary
  const totalGapCr = CATEGORIES.reduce((sum, c) => sum + (GAP_CR[c.id] ?? 0), 0);

  // Trend chart: Zepto share over time per category (from historical Excel data)
  const zeptoTrendPeriods = useMemo(
    () => [...new Set(allRows.filter((r) => r.platform === "zepto").map((r) => r.period))].sort(),
    [allRows],
  );
  const zeptoTrendData = useMemo(() => {
    return zeptoTrendPeriods.map((per) => {
      const row: Record<string, number | string> = { w: fmtPeriodShort(per) };
      CATEGORIES.forEach((cat) => {
        const r = allRows.find((x) => x.platform === "zepto" && x.categoryId === cat.id && x.period === per);
        if (r?.sharePct != null) row[cat.id] = +r.sharePct.toFixed(1);
      });
      return row;
    });
  }, [allRows, zeptoTrendPeriods]);

  return (
    <div>
      <PageHeader
        title="Market share & fair share"
        subtitle={hasData ? `Snapshot · ${effectivePeriod}` : undefined}
      />

      {isSnapshot && (
        <div className="mb-5 flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-md px-3 py-2">
          <Info className="size-3.5 shrink-0" />
          No market share data for {period} — showing latest snapshot ({effectivePeriod})
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {CATEGORIES.map((cat) => {
          const bestPct = hasData
            ? Math.max(...TRACKED_PLATFORMS.map((p) => lookup.get(`${cat.id}|${p}`) ?? 0))
            : 0;
          const fs = FAIR_SHARE[cat.id];
          const gap = GAP_CR[cat.id];
          return (
            <Card key={cat.id}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={cn(
                  "text-2xl font-bold tabular-nums",
                  hasData
                    ? (bestPct >= fs * 0.8 ? "text-success" : bestPct >= fs * 0.4 ? "text-warning-foreground" : "text-destructive")
                    : "text-muted-foreground"
                )}>
                  {hasData ? `${bestPct.toFixed(1)}%` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">Best platform share</div>
                <div className="text-xs mt-1">
                  <span className="text-muted-foreground">Fair share: </span>
                  <span className="font-medium">{fs}%</span>
                </div>
                {gap != null
                  ? <div className="text-xs mt-0.5 text-destructive font-medium">Gap: ₹{gap} Cr</div>
                  : <div className="text-xs mt-0.5 text-muted-foreground">Gap: Track</div>
                }
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Source badge + gap total */}
      <div className="flex items-center gap-3 mb-3">
        <Badge variant="outline" className={cn(
          "text-xs",
          hasData
            ? "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
            : "text-amber-600 border-amber-300 bg-amber-50"
        )}>
          {hasData ? `✓ Real data · ${effectivePeriod}` : "No snapshot data"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Total revenue gap: <span className="font-semibold text-foreground">₹{totalGapCr.toFixed(1)} Cr</span>
        </span>
      </div>

      {/* Main snapshot grid */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="text-xs text-muted-foreground w-52">Brands</TableHead>
                <TableHead className="text-center">Tata 1mg</TableHead>
                <TableHead className="text-center">PharmEasy</TableHead>
                <TableHead className="text-center">Zepto</TableHead>
                <TableHead className="text-center text-muted-foreground">Amazon</TableHead>
                <TableHead className="text-center">Fair Share</TableHead>
                <TableHead className="text-right">Gap (Rs Cr)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CATEGORIES.map((cat) => {
                const fs  = FAIR_SHARE[cat.id];
                const gap = GAP_CR[cat.id];
                return (
                  <TableRow key={cat.id} className="h-12">
                    <TableCell className="font-semibold">{cat.label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cat.brands}</TableCell>

                    {TRACKED_PLATFORMS.map((p) => {
                      const pct = lookup.get(`${cat.id}|${p}`);
                      return (
                        <TableCell key={p} className="text-center">
                          {pct != null ? (
                            <span className={cn(
                              "inline-flex items-center justify-center min-w-14 rounded-md px-2 py-1 text-xs font-semibold tabular-nums border",
                              shareBadgeClass(pct, fs),
                            )}>
                              {pct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}

                    {/* Amazon — always TBD */}
                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground italic">TBD</span>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-14 rounded-md px-2 py-1 text-xs font-bold bg-muted border tabular-nums">
                        {fs}%
                      </span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-semibold">
                      {gap != null
                        ? <span className="text-destructive">₹{gap} Cr</span>
                        : <span className="text-muted-foreground text-xs">Track</span>
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-success/20 border border-success/40" />
          ≥80% of fair share
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-warning/20 border border-warning/40" />
          40–79% of fair share
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-destructive/10 border border-destructive/30" />
          &lt;40% of fair share
        </div>
        <div className="flex items-center gap-1.5">
          <span className="italic">TBD</span> = Amazon data not yet available
        </div>
      </div>

      {/* Zepto trend chart — historical data from Excel */}
      {zeptoTrendPeriods.length > 1 && (
        <div className="mt-10">
          <h2 className="text-base font-semibold mb-1">Zepto market share trend</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Haleon share % on Zepto by category · source: Market Share report (Jan 2023 – Apr 2026)
          </p>
          <Card>
            <CardContent className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={zeptoTrendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="w" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(v, name) => [`${Number(v).toFixed(1)}%`, CATEGORIES.find((c) => c.id === name)?.label ?? name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(name) => CATEGORIES.find((c) => c.id === name)?.label ?? name}
                  />
                  {CATEGORIES.map((cat) => (
                    <Line
                      key={cat.id}
                      type="monotone"
                      dataKey={cat.id}
                      stroke={CAT_COLORS[cat.id]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
