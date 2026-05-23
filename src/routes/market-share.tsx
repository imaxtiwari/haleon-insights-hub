import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { brands, PLATFORMS, PLATFORM_LABEL, brandMarketShare, categoryGMV, type Platform } from "@/lib/mock-data";
import { fetchOfftakes, fetchFairShares, fetchMarketShare, updateFairShare } from "@/lib/api/queries";
import { usePeriod } from "@/lib/period-context";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-share")({
  loader: async ({ context: _ctx }) => {
    // period is not yet known at load time (it lives in client context),
    // so we fetch the latest available period from DB as a hint.
    // The heavy filtering is done client-side once period is available.
    const [offtakes, fairShares] = await Promise.all([fetchOfftakes(), fetchFairShares()]);
    return { offtakes, fairShares };
  },
  component: MarketSharePage,
});

type Row = { brandId: string; brandName: string; platform: Platform; ms: number; fs: number; gap: number; opp: number; catGmv: number };

function MarketSharePage() {
  const { offtakes, fairShares } = Route.useLoaderData();
  const { period } = usePeriod();
  const [platform, setPlatform] = useState<Platform | "all">("all");

  // Real market share data fetched per (period, platform) — starts empty, populated on first render
  const [dbMsRows, setDbMsRows] = useState<Array<{ brandId: string; platform: Platform; sharePct: number }>>([]);
  const [dbPeriod, setDbPeriod] = useState<string>("");

  // Fetch from DB whenever period changes
  useMemo(() => {
    if (!period) return;
    if (period === dbPeriod) return;
    fetchMarketShare({ data: { period, platform: "all" } })
      .then((rows) => {
        setDbMsRows(rows);
        setDbPeriod(period);
      })
      .catch(() => {
        // DB fetch failed — keep using mock data (already the default)
        setDbMsRows([]);
        setDbPeriod(period);
      });
  }, [period]);

  // Build a lookup: "brandId|platform" → share_pct from DB
  const dbMsMap = useMemo(() => {
    const m = new Map<string, number>();
    dbMsRows.forEach((r) => m.set(`${r.brandId}|${r.platform}`, r.sharePct));
    return m;
  }, [dbMsRows]);

  const usingRealData = dbMsRows.length > 0;

  const [fsMap, setFsMap] = useState<Map<string, number>>(
    () => new Map(fairShares.map((r) => [`${r.brandId}|${r.platform}`, r.targetPct])),
  );

  async function handleFairShareBlur(brandId: string, p: Platform, raw: string) {
    const val = Math.max(0, Math.min(100, Number(raw)));
    setFsMap((prev) => new Map(prev).set(`${brandId}|${p}`, val));
    await updateFairShare({ data: { brandId, platform: p, targetPct: val } });
  }

  const allRows: Row[] = useMemo(() => {
    const out: Row[] = [];
    brands.forEach((b) => PLATFORMS.forEach((p) => {
      // Prefer real DB share%, fall back to mock estimate
      const ms = dbMsMap.has(`${b.id}|${p}`)
        ? dbMsMap.get(`${b.id}|${p}`)!
        : brandMarketShare(b.id, p, period, offtakes);

      const fs  = fsMap.get(`${b.id}|${p}`) ?? 20;
      const cat = categoryGMV(b.categoryId, p, period, offtakes);
      const opp = Math.max(0, ((fs - ms) / 100) * cat);
      out.push({ brandId: b.id, brandName: b.name, platform: p, ms, fs, gap: ms - fs, opp, catGmv: cat });
    }));
    return out.sort((a, b) => b.opp - a.opp);
  }, [period, offtakes, fsMap, dbMsMap]);

  const totalsPerPlatform = PLATFORMS.map((p) => ({
    p, opp: allRows.filter((r) => r.platform === p).reduce((a, r) => a + r.opp, 0),
  }));

  const rows = platform === "all" ? allRows : allRows.filter((r) => r.platform === platform);
  const showPlatformCol = platform === "all";
  const filteredTotal   = rows.reduce((a, r) => a + r.opp, 0);

  return (
    <div>
      <PageHeader title="Market share & fair share" />

      {usingRealData && (
        <p className="text-xs text-emerald-600 mb-3">
          ✓ Showing real market share data for {period}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {totalsPerPlatform.map((t) => (
          <Card key={t.p}>
            <CardHeader className="pb-1"><CardTitle className="text-sm">{PLATFORM_LABEL[t.p]}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatINR(t.opp)}</div>
              <div className="text-xs text-muted-foreground">Total opportunity (per month)</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-3">
        <Select value={platform} onValueChange={(v) => setPlatform(v as Platform | "all")}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All platforms</SelectItem>
            {PLATFORMS.map((p) => <SelectItem key={p} value={p} className="text-xs">{PLATFORM_LABEL[p]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {platform !== "all" && (
        <p className="text-xs text-muted-foreground mb-2">
          Showing {rows.length} brand{rows.length !== 1 ? "s" : ""} on {PLATFORM_LABEL[platform]} · total opportunity {formatINR(filteredTotal)}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                {showPlatformCol && <TableHead>Platform</TableHead>}
                <TableHead className="text-right">
                  Market Share %
                  {!usingRealData && <span className="ml-1 text-amber-500 text-[10px]">(est.)</span>}
                </TableHead>
                <TableHead className="text-right">Fair Share %</TableHead>
                <TableHead className="text-right">Gap (pp)</TableHead>
                <TableHead className="text-right">Opportunity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.brandId}-${r.platform}`} className="h-10">
                  <TableCell className="font-medium">{r.brandName}</TableCell>
                  {showPlatformCol && <TableCell className="text-muted-foreground text-xs">{PLATFORM_LABEL[r.platform]}</TableCell>}
                  <TableCell className="text-right tabular-nums">{r.ms.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step={0.5}
                      defaultValue={r.fs}
                      onBlur={(e) => { void handleFairShareBlur(r.brandId, r.platform, e.target.value); }}
                      className="h-7 w-20 text-right text-xs tabular-nums ml-auto"
                    />
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums font-semibold", r.gap < 0 ? "text-destructive" : "text-success")}>
                    {r.gap >= 0 ? "+" : ""}{r.gap.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{formatINR(r.opp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
