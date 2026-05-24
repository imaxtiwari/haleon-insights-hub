import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { brands, categories, skus, PLATFORMS, PLATFORM_LABEL, prevPeriod, deltaPct, type Platform } from "@/lib/mock-data";
import { fetchOfftakes, fetchOfftakesDetail, type DbOfftakeDetailRow } from "@/lib/api/queries";
import { usePeriod } from "@/lib/period-context";
import { formatINR, formatNum, formatDelta, fmtPeriod } from "@/lib/format";
import { UploadCloud, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export const Route = createFileRoute("/offtakes")({
  // Load all-period data once for sparklines; period-filtered detail is fetched client-side
  loader: () => fetchOfftakes(),
  component: OfftakesPage,
});

// Match helper for all-period offtake rows
function mp(rowPeriod: string | undefined, weekEnding: string, period: string) {
  return (rowPeriod ?? weekEnding.slice(0, 7)) === period;
}

function OfftakesPage() {
  const allPeriodOfftakes = Route.useLoaderData();
  const { period } = usePeriod();

  const [brandId,    setBrandId]    = useState<string>("all");
  const [platform,   setPlatform]   = useState<Platform | "all">("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  // ── Period-filtered real data (fetched client-side when period/platform changes) ─
  const [detailRows,   setDetailRows]   = useState<DbOfftakeDetailRow[]>([]);
  const [detailPeriod, setDetailPeriod] = useState<string>("");
  const [detailPlat,   setDetailPlat]   = useState<string>("");
  const [detailLoading, setDetailLoading] = useState(false);

  useMemo(() => {
    const key = `${period}|${platform}`;
    if (key === `${detailPeriod}|${detailPlat}`) return;
    if (!period) return;
    setDetailLoading(true);
    fetchOfftakesDetail({ data: { period, platform: platform === "all" ? undefined : platform } })
      .then((rows) => {
        setDetailRows(rows);
        setDetailPeriod(period);
        setDetailPlat(platform);
      })
      .catch(() => {
        setDetailRows([]);
        setDetailPeriod(period);
        setDetailPlat(platform);
      })
      .finally(() => setDetailLoading(false));
  }, [period, platform]);

  // ── Derived values ────────────────────────────────────────────────────────
  const usingRealData = detailRows.length > 0;

  // Apply brand + category filters to detail rows
  const filteredDetailRows = useMemo(() => {
    if (!usingRealData) return detailRows;
    return detailRows.filter((r) => {
      if (brandId !== "all" && r.brandId !== brandId) return false;
      if (categoryId !== "all") {
        const brand = brands.find((b) => b.id === r.brandId);
        if (brand?.categoryId !== categoryId) return false;
      }
      return true;
    });
  }, [detailRows, brandId, categoryId, usingRealData]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalUnits = filteredDetailRows.reduce((a, r) => a + r.units, 0);
  const totalGMV   = filteredDetailRows.reduce((a, r) => a + r.gmv, 0); // gmv = Offtake_MRP

  // For MoM delta: use all-period data (sparkline dataset)
  const filteredSkuIds = useMemo(
    () => new Set(filteredDetailRows.map((r) => r.skuId)),
    [filteredDetailRows],
  );
  const plats: Platform[] = platform === "all" ? PLATFORMS : [platform];
  const prev = prevPeriod(period);
  const prevRows = prev
    ? allPeriodOfftakes.filter(
        (o) => mp(o.period, o.weekEnding, prev) &&
               (usingRealData ? filteredSkuIds.has(o.skuId) : true) &&
               plats.includes(o.platform),
      )
    : [];
  const prevTotalGMV = prevRows.reduce((a, r) => a + r.gmv, 0);

  // Top Brand by GMV
  const topBrand = useMemo(() => {
    if (filteredDetailRows.length === 0) return null;
    const byBrand = new Map<string, number>();
    filteredDetailRows.forEach((r) => byBrand.set(r.brandId, (byBrand.get(r.brandId) ?? 0) + r.gmv));
    const [topId] = [...byBrand.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    return topId ? (brands.find((b) => b.id === topId)?.name ?? topId) : null;
  }, [filteredDetailRows]);

  // Top Platform by GMV
  const topPlatform = useMemo(() => {
    if (filteredDetailRows.length === 0) return null;
    const byPlat = new Map<string, number>();
    filteredDetailRows.forEach((r) => byPlat.set(r.platform, (byPlat.get(r.platform) ?? 0) + r.gmv));
    const [topP] = [...byPlat.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    return topP ? PLATFORM_LABEL[topP as Platform] : null;
  }, [filteredDetailRows]);

  const momDelta = deltaPct(totalGMV, prevTotalGMV);

  // ── Bar chart data: brand GMV per platform (real data) ────────────────────
  const barChartData = useMemo(() => {
    if (!usingRealData) return [];
    const activeBrandIds = [...new Set(filteredDetailRows.map((r) => r.brandId))];
    return activeBrandIds.map((bid) => {
      const row: Record<string, string | number> = {
        brand: brands.find((b) => b.id === bid)?.name ?? bid,
      };
      PLATFORMS.forEach((p) => {
        row[PLATFORM_LABEL[p]] = filteredDetailRows
          .filter((r) => r.brandId === bid && r.platform === p)
          .reduce((a, r) => a + r.gmv, 0);
      });
      return row;
    });
  }, [filteredDetailRows, usingRealData]);

  // ── Fallback: mock-data path (when DB empty — same as original code) ───────
  const filteredSkusMock = useMemo(() => skus.filter((s) => {
    if (brandId !== "all" && s.brandId !== brandId) return false;
    if (categoryId !== "all" && brands.find((b) => b.id === s.brandId)?.categoryId !== categoryId) return false;
    return true;
  }), [brandId, categoryId]);

  const mockCurrRows = usingRealData ? [] : allPeriodOfftakes.filter(
    (o) => mp(o.period, o.weekEnding, period) && filteredSkusMock.some((s) => s.id === o.skuId) && plats.includes(o.platform),
  );
  const mockTotalUnits  = mockCurrRows.reduce((a, r) => a + r.units, 0);
  const mockTotalGMV    = mockCurrRows.reduce((a, r) => a + r.gmv, 0);
  const mockPrevRows    = prev ? allPeriodOfftakes.filter((o) => mp(o.period, o.weekEnding, prev) && filteredSkusMock.some((s) => s.id === o.skuId) && plats.includes(o.platform)) : [];
  const mockPrevGMV     = mockPrevRows.reduce((a, r) => a + r.gmv, 0);
  const mockMomDelta    = deltaPct(mockTotalGMV, mockPrevGMV);

  // Decide which numbers to show in KPIs
  const dispUnits  = usingRealData ? totalUnits  : mockTotalUnits;
  const dispGMV    = usingRealData ? totalGMV    : mockTotalGMV;
  const dispMoM    = usingRealData ? momDelta     : mockMomDelta;

  return (
    <div>
      <PageHeader title="Offtake tracking" />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 py-3">
          <FilterSelect label="Brand"    value={brandId}    onChange={setBrandId}
            options={[{ id: "all", name: "All brands" }, ...brands]} />
          <FilterSelect label="Platform" value={platform}   onChange={(v) => setPlatform(v as Platform | "all")}
            options={[{ id: "all", name: "All platforms" }, ...PLATFORMS.map((p) => ({ id: p, name: PLATFORM_LABEL[p] }))]} />
          <FilterSelect label="Category" value={categoryId} onChange={setCategoryId}
            options={[{ id: "all", name: "All categories" }, ...categories]} />
        </CardContent>
      </Card>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label="Total Quantity"      value={formatNum(dispUnits)} />
        <KpiTile label="Total Offtake MRP"   value={formatINR(dispGMV)} />
        <KpiTile label="MoM Δ Offtake MRP"   value={formatDelta(dispMoM)}  delta={dispMoM} />
        {usingRealData
          ? <KpiTile label="Top Brand"    value={topBrand ?? "—"} />
          : <KpiTile label="Top Platform" value={topPlatform ?? "—"} />}
      </div>

      {/* When real data is loaded for this period */}
      {usingRealData && (
        <>
          {/* Data table */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Product × Platform · {fmtPeriod(period)}</CardTitle>
              <div className="flex gap-2 items-center text-xs text-muted-foreground">
                {topBrand && <span>Top brand: <span className="font-semibold text-foreground">{topBrand}</span></span>}
                {topPlatform && <span>Top platform: <span className="font-semibold text-foreground">{topPlatform}</span></span>}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Offtake MRP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetailRows.map((r) => (
                    <TableRow key={`${r.skuId}-${r.platform}`} className="h-9">
                      <TableCell className="font-medium text-xs max-w-[220px] truncate">{r.productName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {brands.find((b) => b.id === r.brandId)?.name ?? r.brandId}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{PLATFORM_LABEL[r.platform]}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNum(r.units)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(r.gmv)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Brand Offtake MRP bar chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Brand Offtake MRP by platform · {fmtPeriod(period)}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="brand" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatINR(v as number)} width={70} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => formatINR(v as number)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {PLATFORMS.map((p, i) => (
                    <Bar key={p} dataKey={PLATFORM_LABEL[p]} fill={`var(--chart-${i + 1})`} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state — no real data for this period */}
      {!usingRealData && !detailLoading && detailPeriod === period && (
        <EmptyState period={period} />
      )}

      {/* Mock data fallback table (shown when we have no real data and haven't confirmed empty yet) */}
      {!usingRealData && (detailLoading || detailPeriod !== period) && (
        <MockFallbackTable
          filteredSkus={filteredSkusMock}
          plats={plats}
          period={period}
          prev={prev}
          allPeriodOfftakes={allPeriodOfftakes}
        />
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ period }: { period: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
        <PackageOpen className="size-12 text-muted-foreground/40" />
        <div className="text-center">
          <p className="font-semibold text-base">No data uploaded for {fmtPeriod(period)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload the Amazon Pharmacy invoice CSV to see offtake data for this period.
          </p>
        </div>
        <Button asChild>
          <Link to="/upload">
            <UploadCloud className="size-4 mr-2" />
            Upload Offtakes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Mock fallback table (while real data loads or period not yet resolved) ────

function MockFallbackTable({
  filteredSkus, plats, period, prev, allPeriodOfftakes,
}: {
  filteredSkus: typeof skus;
  plats: Platform[];
  period: string;
  prev: string | null;
  allPeriodOfftakes: Awaited<ReturnType<typeof fetchOfftakes>>;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            SKU × platform
            <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              Estimated — no real data for {fmtPeriod(period)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Offtake MRP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkus.flatMap((s) => plats.map((p) => {
                const rRows = allPeriodOfftakes.filter((o) => o.skuId === s.id && o.platform === p && mp(o.period, o.weekEnding, period));
                const rUnits = rRows.reduce((a, r) => a + r.units, 0);
                const rGMV   = rRows.reduce((a, r) => a + r.gmv, 0);
                return (
                  <TableRow key={`${s.id}-${p}`} className="h-9">
                    <TableCell className="font-medium text-xs max-w-[220px] truncate">{s.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{PLATFORM_LABEL[p]}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNum(rUnits)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(rGMV)}</TableCell>
                  </TableRow>
                );
              }))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Brand Offtake MRP by platform · {fmtPeriod(period)}</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brands.map((b) => {
              const row: Record<string, string | number> = { brand: b.name };
              PLATFORMS.forEach((p) => {
                row[PLATFORM_LABEL[p]] = allPeriodOfftakes
                  .filter((o) => mp(o.period, o.weekEnding, period) && o.platform === p && skus.find((s) => s.id === o.skuId)?.brandId === b.id)
                  .reduce((a, r) => a + r.gmv, 0);
              });
              return row;
            })}>
              <XAxis dataKey="brand" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatINR(v as number)} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => formatINR(v as number)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {PLATFORMS.map((p, i) => (
                <Bar key={p} dataKey={PLATFORM_LABEL[p]} fill={`var(--chart-${i + 1})`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function KpiTile({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground uppercase">{label}</div>
        <div className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          delta != null && (delta >= 0 ? "text-success" : "text-destructive"),
        )}>{value}</div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
