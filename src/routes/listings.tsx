import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { brands, skus, PLATFORMS, PLATFORM_LABEL, prevPeriod, latestPeriodWithData, type Platform, type ListingRow } from "@/lib/mock-data";
import { fetchListings } from "@/lib/api/queries";
import { usePeriod } from "@/lib/period-context";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/listings")({
  loader: () => fetchListings(),
  component: ListingsPage,
});

function mp(rowPeriod: string | undefined, weekEnding: string, period: string) {
  return (rowPeriod ?? weekEnding.slice(0, 7)) === period;
}

function platformTotals(platform: Platform, period: string, allListings: ListingRow[]) {
  const rows    = allListings.filter((l) => l.platform === platform && mp(l.period, l.weekEnding, effectivePeriod));
  const total   = rows.length;
  const listed  = rows.filter((r) => r.status === "listed").length;
  const unlisted = rows.filter((r) => r.status === "unlisted").length;
  const oos     = rows.filter((r) => r.status === "oos").length;
  return { total, listed, unlisted, oos };
}

function ListingsPage() {
  const listings = Route.useLoaderData();
  const { period } = usePeriod();
  const effectivePeriod = latestPeriodWithData(listings, period);
  const isSnapshot = effectivePeriod !== period;
  const prev = prevPeriod(effectivePeriod);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Listing health" />
      {isSnapshot && (
        <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="size-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
            No listing data for the selected period — showing latest snapshot: <span className="font-semibold">{effectivePeriod}</span>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLATFORMS.map((p) => {
          const t = platformTotals(p, period, listings);
          return (
            <Card key={p}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{PLATFORM_LABEL[p]}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">{t.total}</div>
                <div className="text-xs text-muted-foreground">Total Haleon SKUs tracked</div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                  <div className="rounded-md bg-success/10 p-2"><div className="text-success font-bold text-base">{t.listed}</div><div>Listed · {t.total ? ((t.listed / t.total) * 100).toFixed(0) : 0}%</div></div>
                  <div className="rounded-md bg-destructive/10 p-2"><div className="text-destructive font-bold text-base">{t.unlisted}</div><div>Unlisted · {t.total ? ((t.unlisted / t.total) * 100).toFixed(0) : 0}%</div></div>
                  <div className="rounded-md bg-warning/15 p-2"><div className="text-warning-foreground font-bold text-base">{t.oos}</div><div>OOS · {t.total ? ((t.oos / t.total) * 100).toFixed(0) : 0}%</div></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">By brand</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Total SKUs (×4 platforms)</TableHead>
                <TableHead className="text-right">% Listed</TableHead>
                <TableHead className="text-right">vs last period</TableHead>
                <TableHead>Status changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((b) => {
                const brandSkuIds = skus.filter((s) => s.brandId === b.id).map((s) => s.id);
                const rows     = listings.filter((l) => brandSkuIds.includes(l.skuId) && mp(l.period, l.weekEnding, effectivePeriod));
                const listed   = rows.filter((r) => r.status === "listed").length;
                const pct      = rows.length ? (listed / rows.length) * 100 : 0;
                const prevRows = prev ? listings.filter((l) => brandSkuIds.includes(l.skuId) && mp(l.period, l.weekEnding, prev)) : [] as ListingRow[];
                const prevPct  = prevRows.length ? (prevRows.filter((r) => r.status === "listed").length / prevRows.length) * 100 : 0;
                const newlyUnlisted: string[] = [];
                const newlyRelisted: string[] = [];
                brandSkuIds.forEach((id) => PLATFORMS.forEach((p) => {
                  const c  = rows.find((r) => r.skuId === id && r.platform === p);
                  const pr = prevRows.find((r) => r.skuId === id && r.platform === p);
                  if (c && pr) {
                    if (c.status !== "listed" && pr.status === "listed") { const n = skus.find((s) => s.id === id)?.name; if (n) newlyUnlisted.push(n); }
                    if (c.status === "listed" && pr.status !== "listed") { const n = skus.find((s) => s.id === id)?.name; if (n) newlyRelisted.push(n); }
                  }
                }));
                return (
                  <>
                    <TableRow key={b.id} className="h-10 cursor-pointer hover:bg-muted/40" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                      <TableCell className="font-medium flex items-center gap-1.5">
                        {expanded === b.id ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        {b.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{rows.length}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{pct.toFixed(0)}%</TableCell>
                      <TableCell className={`text-right tabular-nums text-xs ${pct - prevPct >= 0 ? "text-success" : "text-destructive"}`}>
                        {pct - prevPct >= 0 ? "+" : ""}{(pct - prevPct).toFixed(1)} pp
                      </TableCell>
                      <TableCell className="space-x-1.5">
                        {newlyUnlisted.length > 0 && <Badge variant="destructive" className="text-[10px]">-{newlyUnlisted.length} unlisted</Badge>}
                        {newlyRelisted.length > 0 && <Badge className="text-[10px] bg-success text-success-foreground">+{newlyRelisted.length} relisted</Badge>}
                      </TableCell>
                    </TableRow>
                    {expanded === b.id && (
                      <TableRow key={`${b.id}-x`}>
                        <TableCell colSpan={5} className="bg-muted/20 p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-8">SKU</TableHead>
                                {PLATFORMS.map((p) => <TableHead key={p} className="text-center">{PLATFORM_LABEL[p]}</TableHead>)}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {skus.filter((s) => s.brandId === b.id).map((s) => (
                                <TableRow key={s.id} className="h-9">
                                  <TableCell className="pl-8 text-xs">{s.name}</TableCell>
                                  {PLATFORMS.map((p) => {
                                    const row = rows.find((r) => r.skuId === s.id && r.platform === p);
                                    return (
                                      <TableCell key={p} className="text-center">
                                        <Badge
                                          variant="outline"
                                          className={
                                            row?.status === "listed"   ? "border-success/40 text-success bg-success/10 text-[10px]" :
                                            row?.status === "oos"      ? "border-warning/40 text-warning-foreground bg-warning/10 text-[10px]" :
                                            "border-destructive/40 text-destructive bg-destructive/10 text-[10px]"
                                          }
                                        >
                                          {row?.status ?? "—"}
                                        </Badge>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
