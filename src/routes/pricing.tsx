import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { skus, competitorSkus, prices, PLATFORMS, PLATFORM_LABEL, weeks, prevWeek, deltaPct, type Platform } from "@/lib/mock-data";
import { useWeek } from "@/lib/week-context";
import { formatDelta, fmtDate } from "@/lib/format";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

type ItemKind = "sku" | "comp";

function PricingPage() {
  const { week } = useWeek();
  return (
    <div>
      <PageHeader title="Price tracking" />
      <Tabs defaultValue="haleon">
        <TabsList>
          <TabsTrigger value="haleon">Haleon SKUs</TabsTrigger>
          <TabsTrigger value="comp">Competitor SKUs</TabsTrigger>
        </TabsList>
        <TabsContent value="haleon"><PriceTable kind="sku" week={week} /></TabsContent>
        <TabsContent value="comp"><PriceTable kind="comp" week={week} /></TabsContent>
      </Tabs>
    </div>
  );
}

function PriceTable({ kind, week }: { kind: ItemKind; week: string }) {
  const items = kind === "sku"
    ? skus.map((s) => ({ id: s.id, name: s.name }))
    : competitorSkus.map((c) => ({ id: c.id, name: c.name }));
  const prev = prevWeek(week);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = items.flatMap((it) => PLATFORMS.map((p) => {
    const curr = prices.find((x) => (kind === "sku" ? x.skuId : x.competitorSkuId) === it.id && x.platform === p && x.weekEnding === week);
    const pr = prev ? prices.find((x) => (kind === "sku" ? x.skuId : x.competitorSkuId) === it.id && x.platform === p && x.weekEnding === prev) : null;
    const change = curr && pr ? deltaPct(curr.price, pr.price) : 0;
    return { id: it.id, name: it.name, platform: p, curr: curr?.price ?? 0, prev: pr?.price ?? 0, change };
  })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return (
    <Card className="mt-4">
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
          {openId && <PriceDetail id={openId} kind={kind} week={week} />}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function PriceDetail({ id, kind, week }: { id: string; kind: ItemKind; week: string }) {
  const item = kind === "sku" ? skus.find((s) => s.id === id)! : competitorSkus.find((c) => c.id === id)!;
  const chartData = weeks.map((w) => {
    const row: Record<string, number | string> = { w: fmtDate(w).slice(0, 6) };
    PLATFORMS.forEach((p) => {
      const r = prices.find((x) => (kind === "sku" ? x.skuId : x.competitorSkuId) === id && x.platform === p && x.weekEnding === w);
      row[p] = r?.price ?? 0;
    });
    return row;
  });
  const today = PLATFORMS.map((p) => ({
    p, price: prices.find((x) => (kind === "sku" ? x.skuId : x.competitorSkuId) === id && x.platform === p && x.weekEnding === week)?.price ?? 0,
  }));
  return (
    <>
      <SheetHeader><SheetTitle>{item.name}</SheetTitle></SheetHeader>
      <div className="grid grid-cols-3 gap-3 mt-6">
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
            <Line type="monotone" dataKey="zepto" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Zepto" />
            <Line type="monotone" dataKey="amazon_pharmacy" stroke="var(--chart-3)" strokeWidth={2} dot={false} name="Amazon" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
