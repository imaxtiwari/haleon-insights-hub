import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useRef } from "react";
import { PLATFORMS, PLATFORM_LABEL, periods, type Platform } from "@/lib/mock-data";
import { fetchPurchaseOrders, type PurchaseOrderRow } from "@/lib/api/queries";
import { processPOUpload } from "@/lib/api/upload";
import { usePeriod } from "@/lib/period-context";
import { formatINR, fmtPeriod } from "@/lib/format";
import { UploadCloud, FileCheck2, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/purchase-orders")({
  loader: () => fetchPurchaseOrders(),
  component: PurchaseOrdersPage,
});

type SortKey = "invoiceDate" | "productName" | "qty" | "mrp" | "totalValue";
type SortDir = "asc" | "desc";

function PurchaseOrdersPage() {
  const rows = Route.useLoaderData();
  const { period } = usePeriod();

  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [periodFilter, setPeriodFilter]     = useState<string>("current");
  const [sortKey, setSortKey]               = useState<SortKey>("invoiceDate");
  const [sortDir, setSortDir]               = useState<SortDir>("desc");
  const [uploadOpen, setUploadOpen]         = useState(false);

  const activePeriod = periodFilter === "current" ? period : periodFilter;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchPlatform = platformFilter === "all" || r.platform === platformFilter;
      const matchPeriod   = periodFilter === "all" || r.period === activePeriod;
      return matchPlatform && matchPeriod;
    });
  }, [rows, platformFilter, periodFilter, activePeriod]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "invoiceDate")  cmp = a.invoiceDate.localeCompare(b.invoiceDate);
      else if (sortKey === "productName") cmp = a.productName.localeCompare(b.productName);
      else if (sortKey === "qty")     cmp = a.qty - b.qty;
      else if (sortKey === "mrp")     cmp = a.mrp - b.mrp;
      else if (sortKey === "totalValue") cmp = a.qty * a.mrp - b.qty * b.mrp;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // KPI tiles
  const totalPOs    = filtered.length;
  const totalUnits  = filtered.reduce((s, r) => s + r.qty, 0);
  const totalGMV    = filtered.reduce((s, r) => s + r.qty * r.mrp, 0);
  const uniqueSkus  = new Set(filtered.map((r) => r.productName)).size;

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Stockist-level purchase order records across platforms."
        right={
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setUploadOpen(true)}>
            <UploadCloud className="size-4" /> Upload PO data
          </Button>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiTile label="Total POs"      value={totalPOs.toLocaleString("en-IN")} />
        <KpiTile label="Total Units"    value={totalUnits.toLocaleString("en-IN")} />
        <KpiTile label="Total GMV"      value={formatINR(totalGMV)} />
        <KpiTile label="Unique SKUs"    value={uniqueSkus.toLocaleString("en-IN")} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as Platform | "all")}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All platforms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">{PLATFORM_LABEL[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="current" className="text-xs">Current period ({fmtPeriod(period)})</SelectItem>
            <SelectItem value="all" className="text-xs">All periods</SelectItem>
            {[...periods].reverse().map((p) => (
              <SelectItem key={p} value={p} className="text-xs">{fmtPeriod(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="px-4 pt-3 pb-1 text-xs text-muted-foreground">
          {sorted.length.toLocaleString("en-IN")} record{sorted.length !== 1 ? "s" : ""}
          {platformFilter !== "all" && ` · ${PLATFORM_LABEL[platformFilter as Platform]}`}
          {periodFilter !== "all" && ` · ${fmtPeriod(activePeriod)}`}
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label="Invoice Date" sortKey="invoiceDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHead label="Product"      sortKey="productName" current={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead>Platform</TableHead>
                <TableHead>ASIN</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stockist</TableHead>
                <SortHead label="Units"        sortKey="qty"         current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                <SortHead label="MRP"          sortKey="mrp"         current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                <SortHead label="Total Value"  sortKey="totalValue"  current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground text-sm py-10">
                    No purchase orders found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((r) => (
                  <TableRow key={r.id} className="h-9">
                    <TableCell className="text-xs tabular-nums">{r.invoiceDate}</TableCell>
                    <TableCell className="text-xs font-medium max-w-[200px] truncate" title={r.productName}>{r.productName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-normal">{PLATFORM_LABEL[r.platform as Platform] ?? r.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{r.asin ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.location ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={r.stockistName}>{r.stockistName ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{r.qty.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">₹{r.mrp.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-medium">{formatINR(r.qty * r.mrp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <POUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

// ── KPI tile ──────────────────────────────────────────────────────────────────

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

// ── Sortable column header ────────────────────────────────────────────────────

function SortHead({
  label, sortKey, current, dir, onSort, className,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const active = current === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:text-foreground", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
        ) : (
          <ChevronDown className="size-3 opacity-30" />
        )}
      </span>
    </TableHead>
  );
}

// ── Upload dialog ─────────────────────────────────────────────────────────────

function POUploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage]       = useState<"idle" | "preview" | "submitting">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);
  const router                  = useRouter();

  function handleFile(f: File) {
    setFileName(f.name);
    setFile(f);
    setStage("preview");
  }

  function handleClose() {
    setStage("idle");
    setFileName(null);
    setFile(null);
    onClose();
  }

  async function handleCommit() {
    if (!file) return;
    setStage("submitting");
    try {
      const csvText = await file.text();
      const result  = await processPOUpload({ data: { csvText } });
      toast.success("Purchase Orders uploaded", {
        description: `${result.committed} rows saved · ${result.skipped} skipped`,
        icon: <FileCheck2 className="size-4" />,
      });
      await router.invalidate();
      handleClose();
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" });
      setStage("preview");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Purchase Order CSV</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Expected columns: <span className="font-mono">product_name, qty, mrp, invoice_date, platform</span>.
          Optional: <span className="font-mono">asin, location, stockist_name, ed_code</span>.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
        >
          <UploadCloud className="size-8 mx-auto text-muted-foreground" />
          {fileName ? (
            <p className="mt-2 text-sm font-medium text-primary truncate">{fileName}</p>
          ) : (
            <>
              <p className="mt-2 text-sm font-medium">Drop CSV here</p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCommit} disabled={!file || stage === "submitting"}>
            {stage === "submitting"
              ? <><Loader2 className="size-4 mr-2 animate-spin" />Uploading…</>
              : "Commit upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
