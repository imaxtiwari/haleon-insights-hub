import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { brands, PLATFORMS, PLATFORM_LABEL, brandMarketShare, categoryGMV, getFairShare, setFairShare, type Platform } from "@/lib/mock-data";
import { useWeek } from "@/lib/week-context";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-share")({ component: MarketSharePage });

type Row = { brandId: string; brandName: string; platform: Platform; ms: number; fs: number; gap: number; opp: number; catGmv: number };

function MarketSharePage() {
  const { week } = useWeek();
  const [bump, setBump] = useState(0);
  const [platform, setPlatform] = useState<Platform | "all">("all");

  const allRows: Row[] = useMemo(() => {
    const out: Row[] = [];
    brands.forEach((b) => PLATFORMS.forEach((p) => {
      const ms = brandMarketShare(b.id, p, week);
      const fs = getFairShare(b.id, p);
      const cat = categoryGMV(b.categoryId, p, week);
      const opp = Math.max(0, ((fs - ms) / 100) * cat);
      out.push({ brandId: b.id, brandName: b.name, platform: p, ms, fs, gap: ms - fs, opp, catGmv: cat });
    }));
    return out.sort((a, b) => b.opp - a.opp);
  }, [week, bump]);

  const totalsPerPlatform = PLATFORMS.map((p) => ({
    p, opp: allRows.filter((r) => r.platform === p).reduce((a, r) => a + r.opp, 0),
  }));

  const rows = platform === "all" ? allRows : allRows.filter((r) => r.platform === platform);
  const showPlatformCol = platform === "all";
  const filteredTotal = rows.reduce((a, r) => a + r.opp, 0);

  return (
    <div>
      <PageHeader title="Market share & fair share" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {totalsPerPlatform.map((t) => (
          <Card key={t.p}>
            <CardHeader className="pb-1"><CardTitle className="text-sm">{PLATFORM_LABEL[t.p]}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatINR(t.opp)}</div>
              <div className="text-xs text-muted-foreground">Total opportunity (per week)</div>
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
                <TableHead className="text-right">Market Share %</TableHead>
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
                      onBlur={(e) => { setFairShare(r.brandId, r.platform, Number(e.target.value)); setBump((x) => x + 1); }}
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
