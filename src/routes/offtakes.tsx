import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { brands, categories, skus, offtakes, PLATFORMS, PLATFORM_LABEL, weeks, prevWeek, deltaPct, type Platform } from "@/lib/mock-data";
import { useWeek } from "@/lib/week-context";
import { formatINR, formatNum, formatDelta } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export const Route = createFileRoute("/offtakes")({ component: OfftakesPage });

function OfftakesPage() {
  const { week } = useWeek();
  const [brandId, setBrandId] = useState<string>("all");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  const filteredSkus = useMemo(() => skus.filter((s) => {
    if (brandId !== "all" && s.brandId !== brandId) return false;
    if (categoryId !== "all" && brands.find((b) => b.id === s.brandId)!.categoryId !== categoryId) return false;
    return true;
  }), [brandId, categoryId]);

  const plats: Platform[] = platform === "all" ? PLATFORMS : [platform];

  const currWeekRows = offtakes.filter((o) => o.weekEnding === week && filteredSkus.some((s) => s.id === o.skuId) && plats.includes(o.platform));
  const prev = prevWeek(week);
  const prevWeekRows = prev ? offtakes.filter((o) => o.weekEnding === prev && filteredSkus.some((s) => s.id === o.skuId) && plats.includes(o.platform)) : [];

  const totalUnits = currWeekRows.reduce((a, r) => a + r.units, 0);
  const totalGMV = currWeekRows.reduce((a, r) => a + r.gmv, 0);
  const prevTotalGMV = prevWeekRows.reduce((a, r) => a + r.gmv, 0);
  const last4 = weeks.slice(-5, -1).flatMap((w) => offtakes.filter((o) => o.weekEnding === w && filteredSkus.some((s) => s.id === o.skuId) && plats.includes(o.platform)));
  const avg4 = last4.reduce((a, r) => a + r.gmv, 0) / 4;

  const kpis = [
    { k: "Total units", v: formatNum(totalUnits) },
    { k: "Total GMV", v: formatINR(totalGMV) },
    { k: "vs last week", v: formatDelta(deltaPct(totalGMV, prevTotalGMV)), delta: deltaPct(totalGMV, prevTotalGMV) },
    { k: "vs 4-week avg", v: formatDelta(deltaPct(totalGMV, avg4)), delta: deltaPct(totalGMV, avg4) },
  ];

  return (
    <div>
      <PageHeader title="Offtake tracking" />
      <Card className="mb-4"><CardContent className="flex flex-wrap items-center gap-3 py-3">
        <FilterSelect label="Brand" value={brandId} onChange={setBrandId} options={[{ id: "all", name: "All brands" }, ...brands]} />
        <FilterSelect label="Platform" value={platform} onChange={(v) => setPlatform(v as Platform | "all")} options={[{ id: "all", name: "All platforms" }, ...PLATFORMS.map((p) => ({ id: p, name: PLATFORM_LABEL[p] }))]} />
        <FilterSelect label="Category" value={categoryId} onChange={setCategoryId} options={[{ id: "all", name: "All categories" }, ...categories]} />
      </CardContent></Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.k}><CardContent className="py-4">
            <div className="text-xs text-muted-foreground uppercase">{k.k}</div>
            <div className={cn("mt-1 text-2xl font-bold tabular-nums", k.delta != null && (k.delta >= 0 ? "text-success" : "text-destructive"))}>{k.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">SKU × platform</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">GMV</TableHead>
                <TableHead className="text-right">WoW Δ</TableHead>
                <TableHead className="w-32">4-week trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkus.flatMap((s) => plats.map((p) => {
                const r = offtakes.find((o) => o.skuId === s.id && o.platform === p && o.weekEnding === week);
                const pr = prev && offtakes.find((o) => o.skuId === s.id && o.platform === p && o.weekEnding === prev);
                const d = r && pr ? deltaPct(r.units, pr.units) : 0;
                const spark = weeks.slice(-4).map((w) => ({ w, units: offtakes.find((o) => o.skuId === s.id && o.platform === p && o.weekEnding === w)?.units ?? 0 }));
                return (
                  <TableRow key={`${s.id}-${p}`} className="h-9">
                    <TableCell className="font-medium text-xs">{s.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{PLATFORM_LABEL[p]}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNum(r?.units ?? 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(r?.gmv ?? 0)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums text-xs flex items-center justify-end gap-0.5 h-9", d >= 0 ? "text-success" : "text-destructive")}>
                      {d >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{formatDelta(d)}
                    </TableCell>
                    <TableCell className="w-32 py-0">
                      <div className="h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={spark}><Line type="monotone" dataKey="units" stroke="var(--primary)" strokeWidth={1.5} dot={false} /></LineChart>
                        </ResponsiveContainer>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Brand GMV by platform · {week}</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brands.map((b) => {
              const row: Record<string, string | number> = { brand: b.name };
              PLATFORMS.forEach((p) => {
                row[PLATFORM_LABEL[p]] = offtakes.filter((o) => o.weekEnding === week && o.platform === p && skus.find((s) => s.id === o.skuId)!.brandId === b.id).reduce((a, r) => a + r.gmv, 0);
              });
              return row;
            })}>
              <XAxis dataKey="brand" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatINR(v as number)} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => formatINR(v as number)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="PharmEasy" fill="var(--chart-1)" />
              <Bar dataKey="Zepto Pharmacy" fill="var(--chart-2)" />
              <Bar dataKey="Amazon Pharmacy" fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
