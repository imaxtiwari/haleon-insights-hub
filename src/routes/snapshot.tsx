import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePeriod } from "@/lib/period-context";
import { PLATFORMS, PLATFORM_LABEL, prevPeriod, deltaPct, periods, type Platform } from "@/lib/mock-data";
import { fetchPlatformMetrics } from "@/lib/api/queries";
import { formatINR, formatNum, formatPct, formatDelta, fmtPeriod, fmtPeriodShort } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// ── Static platform benchmark data (industry figures, FY25) ──────────────────
// `sub` renders as a second muted line below the main value
type BenchmarkCell = { value: string; sub?: string; note?: string; dim?: boolean };
type BenchmarkRow  = { metric: string; cells: Record<Platform, BenchmarkCell> };

const BENCHMARK_ROWS: BenchmarkRow[] = [
  {
    metric: "FY25 Revenue (Rs Cr)",
    cells: {
      tata_1mg:        { value: "Rs 2,360 Cr" },
      pharmeasy:       { value: "~Rs 1,500 Cr", note: "*" },
      amazon_pharmacy: { value: "Sizing TBD", dim: true },
      zepto:           { value: "Rs 480 Cr" },
    },
  },
  {
    metric: "Market share of e-pharma",
    cells: {
      tata_1mg:        { value: "31%" },
      pharmeasy:       { value: "15%" },
      amazon_pharmacy: { value: "<5% est", dim: true },
      zepto:           { value: "5%" },
    },
  },
  {
    metric: "Growth WoW FY25",
    cells: {
      tata_1mg:        { value: "22% YoY FY25", sub: "3,000 stores by 2029" },
      pharmeasy:       { value: "Pharma-only declining", dim: true },
      amazon_pharmacy: { value: "Launched Apr 2026", dim: true },
      zepto:           { value: "Pilot, scaling" },
    },
  },
  {
    metric: "Reach",
    cells: {
      tata_1mg:        { value: "Pan-India", sub: "+280 stores (1,000 by 2030)" },
      pharmeasy:       { value: "16,500+ pincodes", sub: "(3,500 cities)" },
      amazon_pharmacy: { value: "19,000+ pincodes", sub: "Same-day in 23 cities" },
      zepto:           { value: "6 cities Rx", sub: "(Q-comm OTC nationwide)" },
    },
  },
  {
    metric: "OTC : Rx mix",
    cells: {
      tata_1mg:        { value: "40 : 60" },
      pharmeasy:       { value: "20 : 80" },
      amazon_pharmacy: { value: "25 : 75" },
      zepto:           { value: "70 : 30" },
    },
  },
  {
    metric: "Avg Order Value (AOV)",
    cells: {
      tata_1mg:        { value: "Rs 1,200" },
      pharmeasy:       { value: "Rs 2,500" },
      amazon_pharmacy: { value: "Rs 900" },
      zepto:           { value: "Rs 400" },
    },
  },
  {
    metric: "Daily orders / volume",
    cells: {
      tata_1mg:        { value: "15,000+ pincodes", sub: "in 25 cities" },
      pharmeasy:       { value: "~20,000 orders/day" },
      amazon_pharmacy: { value: "~30,000 orders/day" },
      zepto:           { value: "Q-comm overall: 20K+ orders/day", sub: "(~1 to 4% pharma)" },
    },
  },
];

export const Route = createFileRoute("/snapshot")({
  loader: () => fetchPlatformMetrics(),
  component: SnapshotPage,
});

function SnapshotPage() {
  const platformMetrics = Route.useLoaderData();
  const { period } = usePeriod();

  function getMetric(p: Platform, per: string) {
    return platformMetrics.find((m) => m.platform === p && (m.period ?? m.weekEnding.slice(0, 7)) === per) ?? null;
  }
  const prev = prevPeriod(period);

  return (
    <div>
      <PageHeader
        title="Platform snapshot"
        subtitle="All figures show Haleon's offtake performance. GMV = Qty × Offtake MRP. Periods are calendar months."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLATFORMS.map((p) => {
          const m  = getMetric(p, period);
          const pm = prev ? getMetric(p, prev) : null;
          if (!m) return null;
          const metrics = [
            { key: "Haleon GMV on platform", v: formatINR(m.gmv), d: pm ? deltaPct(m.gmv, pm.gmv) : 0 },
            { key: "MAU",   v: formatNum(m.mau),         d: pm ? deltaPct(m.mau,   pm.mau)   : 0 },
            { key: "AOV",   v: `₹${m.aov}`,              d: pm ? deltaPct(m.aov,   pm.aov)   : 0 },
            { key: "Reach", v: formatPct(m.reach * 100), d: pm ? deltaPct(m.reach, pm.reach) : 0 },
          ];
          return (
            <Card key={p}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {PLATFORM_LABEL[p]}
                  <span className="text-xs font-normal text-muted-foreground">{fmtPeriod(period)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {metrics.map((mt) => (
                  <div key={mt.key}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{mt.key}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{mt.v}</div>
                    <Delta v={mt.d} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(["gmv", "mau", "aov", "reach"] as const).map((metric) => (
          <Card key={metric}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm capitalize">
                {metric === "gmv" ? "Haleon GMV" : metric === "mau" ? "MAU" : metric === "aov" ? "AOV" : "Reach"} · 12 months
              </CardTitle>
            </CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periods.map((per) => {
                  const row: Record<string, number | string> = { w: fmtPeriodShort(per) };
                  PLATFORMS.forEach((p) => {
                    const m = getMetric(p, per);
                    if (!m) return;
                    row[p] = metric === "reach" ? +(m.reach * 100).toFixed(1) : (m as Record<string, unknown>)[metric] as number;
                  });
                  return row;
                })}>
                  <XAxis dataKey="w" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Line type="monotone" dataKey="pharmeasy"       stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="tata_1mg"        stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="zepto"           stroke="var(--chart-3)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="amazon_pharmacy" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {PLATFORMS.map((p, i) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: `var(--chart-${i + 1})` }} />
            {PLATFORM_LABEL[p]}
          </div>
        ))}
      </div>

      {/* ── Platform benchmark table ───────────────────────────────────────── */}
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Platform benchmark — industry context</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            FY25 industry figures · not Haleon-specific · for strategic context only
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Metric</TableHead>
                {PLATFORMS.map((p) => (
                  <TableHead key={p} className="text-left">{PLATFORM_LABEL[p]}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {BENCHMARK_ROWS.map((row) => (
                <TableRow key={row.metric}>
                  <TableCell className="font-semibold text-sm align-top py-2">{row.metric}</TableCell>
                  {PLATFORMS.map((p) => {
                    const cell = row.cells[p];
                    return (
                      <TableCell
                        key={p}
                        className={cn(
                          "text-sm align-top py-2",
                          cell.dim && "text-muted-foreground italic",
                        )}
                      >
                        <span className="tabular-nums">
                          {cell.value}
                          {cell.note && (
                            <sup className="ml-0.5 text-[10px] text-muted-foreground">{cell.note}</sup>
                          )}
                        </span>
                        {cell.sub && (
                          <div className="text-xs text-muted-foreground mt-0.5 not-italic">{cell.sub}</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="mt-2 text-[11px] text-muted-foreground">
        * PharmEasy revenue includes B2B + B2C; pharma-only segment is declining. All figures sourced from public filings, press releases, and industry estimates.
      </p>
    </div>
  );
}

function Delta({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <div className={cn("mt-1 text-xs font-medium flex items-center gap-0.5", up ? "text-success" : "text-destructive")}>
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {formatDelta(v)} <span className="text-muted-foreground font-normal ml-1">vs last month</span>
    </div>
  );
}
