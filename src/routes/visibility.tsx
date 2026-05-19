import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { brands, brandKeywords, PLATFORMS, PLATFORM_LABEL, visibility, weeks, prevWeek } from "@/lib/mock-data";
import { useWeek } from "@/lib/week-context";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/visibility")({ component: VisibilityPage });

function rankClass(r: number | null) {
  if (r == null) return "bg-destructive/15 text-destructive";
  if (r <= 10) return "bg-success/15 text-success";
  if (r <= 20) return "bg-warning/20 text-warning-foreground";
  return "bg-destructive/15 text-destructive";
}

function VisibilityPage() {
  const { week } = useWeek();
  const [brandId, setBrandId] = useState(brands[0].id);
  const [expanded, setExpanded] = useState<string | null>(null);

  const kws = brandKeywords[brandId];
  const prev = prevWeek(week);

  const droppedOutOfTop10: string[] = [];
  kws.forEach((kw) => {
    PLATFORMS.forEach((p) => {
      const curr = visibility.find((v) => v.brandId === brandId && v.keyword === kw && v.platform === p && v.weekEnding === week);
      const pr = prev && visibility.find((v) => v.brandId === brandId && v.keyword === kw && v.platform === p && v.weekEnding === prev);
      if (curr && pr && pr.rank != null && pr.rank <= 10 && (curr.rank == null || curr.rank > 10)) {
        droppedOutOfTop10.push(`${kw} · ${PLATFORM_LABEL[p]}`);
      }
    });
  });

  return (
    <div>
      <PageHeader
        title="Visibility tracking"
        right={
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>)}</SelectContent>
          </Select>
        }
      />
      {droppedOutOfTop10.length > 0 && (
        <Alert className="mb-4 border-warning/40 bg-warning/10">
          <AlertTriangle className="size-4 text-warning-foreground" />
          <AlertDescription className="text-xs">
            <span className="font-semibold">{droppedOutOfTop10.length}</span> keyword{droppedOutOfTop10.length > 1 ? "s" : ""} dropped out of top 10 this week:{" "}
            <span className="text-muted-foreground">{droppedOutOfTop10.slice(0, 4).join(" · ")}{droppedOutOfTop10.length > 4 ? ` +${droppedOutOfTop10.length - 4} more` : ""}</span>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Keyword</TableHead>
                {PLATFORMS.map((p) => <TableHead key={p} className="text-center">{PLATFORM_LABEL[p]}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {kws.map((kw) => (
                <>
                  <TableRow key={kw} className="cursor-pointer h-10 hover:bg-muted/40" onClick={() => setExpanded(expanded === kw ? null : kw)}>
                    <TableCell className="font-medium flex items-center gap-1.5">
                      {expanded === kw ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      {kw}
                    </TableCell>
                    {PLATFORMS.map((p) => {
                      const row = visibility.find((v) => v.brandId === brandId && v.keyword === kw && v.platform === p && v.weekEnding === week);
                      return (
                        <TableCell key={p} className="text-center">
                          <span className={cn("inline-block min-w-10 rounded-md py-0.5 text-xs font-semibold tabular-nums", rankClass(row?.rank ?? null))}>
                            {row?.rank ?? "NR"}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {expanded === kw && (
                    <TableRow key={`${kw}-x`}>
                      <TableCell colSpan={4} className="bg-muted/20 h-56 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeks.map((w) => {
                            const row: Record<string, number | string | null> = { w: fmtDate(w).slice(0, 6) };
                            PLATFORMS.forEach((p) => {
                              const v = visibility.find((x) => x.brandId === brandId && x.keyword === kw && x.platform === p && x.weekEnding === w);
                              row[p] = v?.rank ?? null;
                            });
                            return row;
                          })}>
                            <XAxis dataKey="w" tick={{ fontSize: 10 }} />
                            <YAxis reversed domain={[1, 50]} tick={{ fontSize: 10 }} width={32} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                            <Line type="monotone" dataKey="pharmeasy" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                            <Line type="monotone" dataKey="zepto" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                            <Line type="monotone" dataKey="amazon_pharmacy" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
