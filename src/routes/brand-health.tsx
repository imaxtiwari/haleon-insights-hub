import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { brands, PLATFORMS, PLATFORM_LABEL, visibilityScore, listingScore, priceCompetitivenessScore, marketShareScore, overallBrandHealth, type Platform, type PriceRow } from "@/lib/mock-data";
import { fetchOfftakes, fetchListings, fetchVisibility, fetchPrices, fetchFairShares, toPriceRows } from "@/lib/api/queries";
import { usePeriod } from "@/lib/period-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand-health")({
  loader: async () => {
    const [offtakes, listings, visibility, dbPrices, fairShares] = await Promise.all([
      fetchOfftakes(), fetchListings(), fetchVisibility(), fetchPrices(), fetchFairShares(),
    ]);
    const prices: PriceRow[] = toPriceRows(dbPrices);
    return { offtakes, listings, visibility, prices, fairShares };
  },
  component: BrandHealthPage,
});

function scoreClass(v: number) {
  if (v < 40) return "bg-destructive/15 text-destructive";
  if (v < 70) return "bg-warning/20 text-warning-foreground";
  return "bg-success/15 text-success";
}

function BrandHealthPage() {
  const { offtakes, listings, visibility, prices, fairShares } = Route.useLoaderData();
  const fsMap = useMemo(
    () => new Map(fairShares.map((r) => [`${r.brandId}|${r.platform}`, r.targetPct])),
    [fairShares],
  );
  const scoreData = useMemo(() => ({ offtakes, listings, visibility, prices, fairShares: fsMap }), [offtakes, listings, visibility, prices, fsMap]);
  const { period } = usePeriod();
  const [platform, setPlatform] = useState<Platform | "all">("all");
  return (
    <div>
      <PageHeader
        title="Brand health"
        right={
          <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform | "all")}>
            <TabsList className="h-auto min-h-8 flex-wrap justify-end gap-1 max-w-full">
              <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
              {PLATFORMS.map((p) => (
                <TabsTrigger key={p} value={p} className="text-xs h-7">{PLATFORM_LABEL[p]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Brand</TableHead>
                <TableHead className="text-center">Visibility</TableHead>
                <TableHead className="text-center">Listing health</TableHead>
                <TableHead className="text-center">Price comp.</TableHead>
                <TableHead className="text-center">Market share</TableHead>
                <TableHead className="text-center">Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((b) => {
                const v  = visibilityScore(b.id, platform, period, scoreData.visibility);
                const l  = listingScore(b.id, platform, period, scoreData.listings);
                const pr = priceCompetitivenessScore(b.id, platform, period, scoreData.prices);
                const ms = marketShareScore(b.id, platform, period, scoreData.offtakes, scoreData.fairShares);
                const o  = overallBrandHealth(b.id, platform, period, scoreData);
                return (
                  <TableRow key={b.id} className="h-10">
                    <TableCell className="font-medium">{b.name}</TableCell>
                    {[v, l, pr, ms].map((s, i) => (
                      <TableCell key={i} className="text-center">
                        <span className={cn("inline-flex items-center justify-center w-12 rounded-md py-1 text-xs font-semibold tabular-nums", scoreClass(s))}>{s}</span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <span className={cn("inline-flex items-center justify-center w-14 rounded-md py-1.5 text-sm font-bold tabular-nums border", scoreClass(o))}>{o}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-destructive/40" /> &lt;40</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-warning/60" /> 40–70</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded bg-success/40" /> &gt;70</span>
      </div>
    </div>
  );
}
