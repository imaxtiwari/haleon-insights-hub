import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { skus, competitorSkus, brands, categories, PLATFORMS, PLATFORM_LABEL, weeks, prevWeek, deltaPct, type Platform } from "@/lib/mock-data";
import { fetchPrices, type DbPriceRow } from "@/lib/server/queries";
import { useWeek } from "@/lib/week-context";
import { formatDelta, fmtDate } from "@/lib/format";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/pricing")({
  loader: () => fetchPrices(),
  component: PricingPage,
});

type ItemKind = "sku" | "comp";

function PricingPage() {
  const priceRows = Route.useLoaderData();
  const { week } = useWeek();
  const [brandId, setBrandId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const activeBrand = brands.find((b) => b.id === brandId);
  const activeCategoryId = categoryId;
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const brandLabel = activeBrand?.name ?? "all brands";
  const categoryLabel = activeCategory?.name ?? "all categories";

  function handleBrandChange(val: string) {
    setBrandId(val);
    if (val !== "all") {
      const brand = brands.find((b) => b.id === val);
      if (brand) setCategoryId(brand.categoryId);
    } else {
      setCategoryId("all");
    }
  }

  return (
    <div>
      <PageHeader title="Price tracking" />
      <div className="flex gap-3 mb-4">
        <Select value={brandId} onValueChange={handleBrandChange}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All brands" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All brands</SelectItem>
            {brands.map((b) => <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeCategoryId} onValueChange={setCategoryId} disabled={brandId !== "all"}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="haleon">
        <TabsList>
          <TabsTrigger value="haleon">Haleon SKUs</TabsTrigger>
          <TabsTrigger value="comp">Competitor SKUs</TabsTrigger>
        </TabsList>
        <TabsContent value="haleon">
          <PriceTable priceRows={priceRows} kind="sku" week={week} brandId={brandId} categoryId={activeCategoryId} brandLabel={brandLabel} categoryLabel={categoryLabel} />
        </TabsContent>
        <TabsContent value="comp">
          <PriceTable priceRows={priceRows} kind="comp" week={week} brandId={brandId} categoryId={activeCategoryId} brandLabel={brandLabel} categoryLabel={categoryLabel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type PriceTableProps = { priceRows: DbPriceRow[]; kind: ItemKind; week: string; brandId: string; categoryId: string; brandLabel: string; categoryLabel: string };

function PriceTable({ priceRows, kind, week, brandId, categoryId, brandLabel, categoryLabel }: PriceTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const prev = prevWeek(week);

  const items: { id: string; name: string }[] = (() => {
    if (kind === "sku") {
      if (brandId !== "all") return skus.filter((s) => s.brandId === brandId).map((s) => ({ id: s.id, name: s.name }));
      if (categoryId !== "all") {
        const brandIds = new Set(brands.filter((b) => b.categoryId === categoryId).map((b) => b.id));
        return skus.filter((s) => brandIds.has(s.brandId)).map((s) => ({ id: s.id, name: s.name }));
      }
      return skus.map((s) => ({ id: s.id, name: s.name }));
    } else {
      if (categoryId !== "all") return competitorSkus.filter((c) => c.categoryId === categoryId).map((c) => ({ id: c.id, name: c.name }));
      return competitorSkus.map((c) => ({ id: c.id, name: c.name }));
    }
  })();

  const rows = items.flatMap((it) => PLATFORMS.map((p) => {
    const curr = priceRows.find((x) => x.itemId === it.id && x.itemKind === kind && x.platform === p && x.weekEnding === week);
    const pr = prev ? priceRows.find((x) => x.itemId === it.id && x.itemKind === kind && x.platform === p && x.weekEnding === prev) : null;
    const change = curr && pr ? deltaPct(curr.price, pr.price) : 0;
    return { id: it.id, name: it.name, platform: p, curr: curr?.price ?? 0, prev: pr?.price ?? 0, change };
  })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return (
    <Card className="mt-4">
      <div className="px-4 pt-3 pb-1 text-xs text-muted-foreground">
        Showing {items.length} SKU{items.length !== 1 ? "s" : ""} · {brandLabel} · {categoryLabel}
      </div>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Prior week</TableHead>
              <TableHead className="text-right">% Change</TableHead>
              <TableHead>Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.id}-${r.platform}`} className="h-9 cursor-pointer hover:bg-muted/40" onClick={() => setOpenId(r.id)}>
                <TableCell className="text-xs font-medium">{r.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{PLATFORM_LABEL[r.platform]}</TableCell>
                <TableCell className="text-right tabular-nums">₹{r.curr}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">₹{r.prev}</TableCell>
                <TableCell className={cn("text-right tabular-nums font-semibold", r.change >= 0 ? "text-success" : "text-destructive")}>{formatDelta(r.change)}</TableCell>
                <TableCell>
                  {r.change <= -5 && <Badge variant="destructive" className="text-[10px] gap-1"><ArrowDown className="size-3" />Drop</Badge>}
                  {r.change >= 5 && <Badge className="text-[10px] gap-1 bg-success text-success-foreground"><ArrowUp className="size-3" />Hike</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {openId && <PriceDetail id={openId} kind={kind} week={week} priceRows={priceRows} activeCategoryId={categoryId} />}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function PriceDetail({ id, kind, week, priceRows, activeCategoryId: _activeCategoryId }: { id: string; kind: ItemKind; week: string; priceRows: DbPriceRow[]; activeCategoryId: string }) {
  const item = kind === "sku" ? skus.find((s) => s.id === id) : competitorSkus.find((c) => c.id === id);
  if (!item) return null;
  const chartData = weeks.map((w) => {
    const row: Record<string, number | string> = { w: fmtDate(w).slice(0, 6) };
    PLATFORMS.forEach((p) => {
      const r = priceRows.find((x) => x.itemId === id && x.itemKind === kind && x.platform === p && x.weekEnding === w);
      row[p] = r?.price ?? 0;
    });
    return row;
  });
  const today = PLATFORMS.map((p) => ({
    p, price: priceRows.find((x) => x.itemId === id && x.itemKind === kind && x.platform === p && x.weekEnding === week)?.price ?? 0,
  }));
  return (
    <>
      <SheetHeader><SheetTitle>{item.name}</SheetTitle></SheetHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
        {today.map((t) => (
          <Card key={t.p}><CardContent className="py-3">
            <div className="text-xs text-muted-foreground">{PLATFORM_LABEL[t.p]}</div>
            <div className="text-2xl font-bold tabular-nums mt-1">₹{t.price}</div>
          </CardContent></Card>
        ))}
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="w" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={42} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => `₹${v}`} />
            <Line type="monotone" dataKey="pharmeasy" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="PharmEasy" />
            <Line type="monotone" dataKey="tata_1mg" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Tata 1mg" />
            <Line type="monotone" dataKey="zepto" stroke="var(--chart-3)" strokeWidth={2} dot={false} name="Zepto" />
            <Line type="monotone" dataKey="amazon_pharmacy" stroke="var(--chart-4)" strokeWidth={2} dot={false} name="Amazon" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
