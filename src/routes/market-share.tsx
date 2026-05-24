import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_MARKET_SHARE,
  CATEGORY_FAIR_SHARE,
  CATEGORY_GAP_DISPLAY,
  CATEGORY_DISPLAY_NAME,
  type Platform,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-share")({
  component: MarketSharePage,
});

// Ordered category rows (matches the screenshot layout)
const CATEGORY_ORDER = ["oral", "mvm", "pain", "cold", "antacid"] as const;

// Platforms that have real data vs TBD — Amazon excluded per business decision
const DATA_PLATFORMS: Platform[] = ["tata_1mg", "pharmeasy", "zepto"];

type ColDef = { platform: Platform; label: string; hasData: boolean };
const COLUMNS: ColDef[] = [
  { platform: "tata_1mg",        label: "1mg",             hasData: true  },
  { platform: "pharmeasy",       label: "PharmEasy",       hasData: true  },
  { platform: "amazon_pharmacy", label: "Amazon Pharmacy", hasData: false },
  { platform: "zepto",           label: "Zepto",           hasData: true  },
];

function MarketSharePage() {
  // Aggregate totals for the summary strip
  const totalGap = Object.values(CATEGORY_GAP_DISPLAY)
    .filter((v) => v !== "Track")
    .map((v) => parseFloat(v.replace(/[^\d.]/g, "")))
    .reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader title="Market share & fair share" />

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Source: Platform data · Apr 2026
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Amazon Pharmacy share data not yet available — showing TBD
        </div>
        <div className="ml-auto rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">
          Total identified gap: Rs {totalGap.toFixed(1)} Cr
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-72">Category (Haleon brands)</TableHead>
                {COLUMNS.map((c) => (
                  <TableHead key={c.platform} className="text-center">
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="text-center">Fair Share %</TableHead>
                <TableHead className="text-right">Gap (Rs Cr)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CATEGORY_ORDER.map((catId) => {
                const ms   = CATEGORY_MARKET_SHARE[catId] ?? {};
                const fs   = CATEGORY_FAIR_SHARE[catId]   ?? 0;
                const gap  = CATEGORY_GAP_DISPLAY[catId]  ?? "—";
                const name = CATEGORY_DISPLAY_NAME[catId] ?? catId;

                // The platform leader is whichever has the highest actual share
                const dataVals = DATA_PLATFORMS.map((p) => ms[p] ?? 0);
                const maxShare = Math.max(...dataVals);

                return (
                  <TableRow key={catId} className="h-12">
                    {/* Category name */}
                    <TableCell className="font-medium text-sm">{name}</TableCell>

                    {/* Per-platform share cells */}
                    {COLUMNS.map((col) => {
                      if (!col.hasData) {
                        return (
                          <TableCell key={col.platform} className="text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground/50 border-muted-foreground/20"
                            >
                              TBD
                            </Badge>
                          </TableCell>
                        );
                      }
                      const share    = ms[col.platform];
                      const isLeader = share != null && share > 0 && share === maxShare;
                      return (
                        <TableCell key={col.platform} className="text-center">
                          {share != null ? (
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded px-2 py-0.5 text-sm tabular-nums font-semibold min-w-[3.5rem]",
                                isLeader
                                  ? "bg-success/15 text-success"
                                  : "text-foreground",
                              )}
                            >
                              {share}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      );
                    })}

                    {/* Fair share */}
                    <TableCell className="text-center">
                      <span className="font-semibold tabular-nums text-sm">{fs}%</span>
                    </TableCell>

                    {/* Gap */}
                    <TableCell className="text-right">
                      {gap === "Track" ? (
                        <span className="text-muted-foreground text-xs italic">Track</span>
                      ) : (
                        <span className="font-bold tabular-nums text-destructive">{gap}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-success/15 border border-success/30" />
          <span>Category leader — highest Haleon share on that platform</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground/60">Fair Share %</span>
          <span>= best-in-class platform share (benchmark target)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="italic">Track</span>
          <span>= data insufficient to compute opportunity</span>
        </div>
      </div>
    </div>
  );
}
