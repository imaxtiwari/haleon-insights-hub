import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PLATFORMS, PLATFORM_LABEL, latestWeek, type Platform } from "@/lib/mock-data";
import { processUpload, processOfftakesUpload, processMetricsUpload, parseMetricsCsv, type MetricsParsedRow } from "@/lib/api/upload";
import { fetchUploads } from "@/lib/api/queries";
import { fmtPeriod } from "@/lib/format";
import { UploadCloud, FileCheck2, ArrowRight, Loader2, ShoppingCart, BarChart2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/upload")({
  loader: () => fetchUploads(),
  component: UploadPage,
});

function UploadPage() {
  const uploads = Route.useLoaderData();
  const latestPerPlatform = PLATFORMS.reduce(
    (acc, p) => ({ ...acc, [p]: "" }),
    {} as Record<Platform, string>,
  );
  uploads.forEach((u) => {
    if (!latestPerPlatform[u.platform] || u.uploadedAt > latestPerPlatform[u.platform]) {
      latestPerPlatform[u.platform] = u.uploadedAt;
    }
  });

  return (
    <div>
      <PageHeader title="Upload" subtitle="Monthly CSV ingestion per platform" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLATFORMS.map((p) => (
          <DropZone key={p} platform={p} lastUpload={latestPerPlatform[p]} />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Invoice-line offtakes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <OfftakesUploadCard />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Platform metrics — MAU &amp; AOV</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <MetricsUploadCard />
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle className="text-base">Upload history</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.map((u) => (
                <TableRow key={u.id} className="h-9">
                  <TableCell className="font-medium">{fmtPeriod(u.weekEnding.slice(0, 7))}</TableCell>
                  <TableCell>{PLATFORM_LABEL[u.platform]}</TableCell>
                  <TableCell className="text-muted-foreground">{u.uploadedBy}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.rowCount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "committed" ? "secondary" : u.status === "processing" ? "outline" : "destructive"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(u.uploadedAt).toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Offtakes upload card (invoice-line CSV → offtakes table) ─────────────────

function OfftakesUploadCard() {
  const [stage, setStage] = useState<"idle" | "preview" | "submitting">("idle");
  const [file, setFile]   = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  const handleFile = (f: File) => {
    setFile(f);
    setFileName(f.name);
    setStage("preview");
  };

  async function handleCommit() {
    if (!file) return;
    setStage("submitting");
    try {
      const csvText = await file.text();
      const result  = await processOfftakesUpload({ data: { csvText } });

      const parts = [
        `${result.committed.toLocaleString("en-IN")} SKU-months saved`,
        `${result.skipped} rows skipped`,
      ];
      if (result.unmatched.length > 0) {
        parts.push(`${result.unmatched.length} unmatched`);
      }

      if (result.unmatched.length > 0) {
        toast.warning("Offtakes committed — some SKUs unmatched", {
          description: (
            <div>
              <p className="mb-1">{parts.join(" · ")}</p>
              <p className="text-xs font-semibold mb-0.5">Unmatched product names:</p>
              <ul className="text-xs list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                {result.unmatched.slice(0, 20).map((n) => <li key={n} className="truncate">{n}</li>)}
                {result.unmatched.length > 20 && <li>…and {result.unmatched.length - 20} more</li>}
              </ul>
            </div>
          ),
          duration: 12000,
          icon: <FileCheck2 className="size-4" />,
        });
      } else {
        toast.success("Offtakes committed", {
          description: parts.join(" · "),
          icon: <FileCheck2 className="size-4" />,
        });
      }
      await router.invalidate();
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" });
    }
    setStage("idle");
    setFile(null);
    setFileName(null);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingCart className="size-4 text-muted-foreground" />
          Amazon Pharmacy — Offtakes CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Upload the invoice-line CSV exported from the Amazon Pharmacy Haleon Sales sheet.
          Expected columns: <span className="font-mono">product_name, asin, qty, mrp, invoice_date, platform, location, ed_code</span>
        </p>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
        >
          <UploadCloud className="size-7 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Drop CSV here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
          {fileName && stage === "idle" && (
            <p className="mt-2 text-xs text-primary truncate">{fileName}</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </CardContent>

      {/* Preview + confirm */}
      <Dialog open={stage === "preview" || stage === "submitting"} onOpenChange={(o) => !o && setStage("idle")}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload offtakes — {fileName}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>This will:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Match each row to a SKU via ASIN lookup, then fuzzy product-name matching</li>
              <li>Aggregate qty and GMV by SKU + month, then upsert into the offtakes table</li>
              <li>Show unmatched product names in the result so you can add missing SKUs</li>
            </ul>
            <p className="text-xs pt-1">
              Platform: <span className="font-semibold">Amazon Pharmacy</span> · Period inferred from <span className="font-mono">invoice_date</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStage("idle")} disabled={stage === "submitting"}>
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={stage === "submitting"}>
              {stage === "submitting"
                ? <><Loader2 className="size-4 mr-2 animate-spin" />Uploading…</>
                : "Commit offtakes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── MAU / AOV upload card ──────────────────────────────────────────────────────

function MetricsUploadCard() {
  const [stage,    setStage]    = useState<"idle" | "preview" | "submitting">("idle");
  const [csvText,  setCsvText]  = useState("");
  const [rows,     setRows]     = useState<MetricsParsedRow[]>([]);
  const [parseErr, setParseErr] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  function loadText(text: string) {
    setCsvText(text);
    const { rows: parsed, errors } = parseMetricsCsv(text);
    setRows(parsed);
    setParseErr(errors);
    if (parsed.length > 0) setStage("preview");
    else setParseErr(errors.length ? errors : ["No valid rows found — check your CSV format"]);
  }

  function handleFile(f: File) {
    f.text().then(loadText).catch(() => setParseErr(["Could not read file"]));
  }

  async function handleCommit() {
    setStage("submitting");
    try {
      const result = await processMetricsUpload({ data: { csvText } });
      toast.success("Metrics committed", {
        description: `${result.upserted} rows upserted · ${result.skipped} skipped`,
        icon: <FileCheck2 className="size-4" />,
      });
      await router.invalidate();
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" });
    }
    setStage("idle");
    setCsvText("");
    setRows([]);
    setParseErr([]);
  }

  const PLATFORM_LABEL_SHORT: Record<string, string> = {
    tata_1mg: "Tata 1mg", pharmeasy: "PharmEasy",
    zepto: "Zepto", amazon_pharmacy: "Amazon Pharmacy",
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart2 className="size-4 text-muted-foreground" />
          MAU &amp; AOV — CSV paste or upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Required columns:{" "}
          <span className="font-mono">platform, period (YYYY-MM), mau, aov</span>
          <br />
          Updates <strong>only</strong> MAU + AOV — GMV and Reach stay unchanged.
        </p>

        {/* Paste textarea */}
        <Textarea
          placeholder={"platform,period,mau,aov\ntata_1mg,2026-04,7200000,1200\npharmeasy,2026-04,5100000,2500"}
          className="font-mono text-xs h-28 resize-none"
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setRows([]);
            setParseErr([]);
          }}
        />

        {/* File drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="border-dashed border rounded-md p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-colors"
        >
          <UploadCloud className="size-5 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-1">or drop a .csv file here</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {parseErr.length > 0 && (
          <ul className="text-xs text-destructive space-y-0.5">
            {parseErr.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={csvText.trim().length < 10}
            onClick={() => {
              const { rows: parsed, errors } = parseMetricsCsv(csvText);
              setRows(parsed);
              setParseErr(errors);
              if (parsed.length > 0) setStage("preview");
            }}
          >
            Preview
          </Button>
        </div>
      </CardContent>

      {/* Preview dialog */}
      <Dialog open={stage === "preview" || stage === "submitting"} onOpenChange={(o) => !o && setStage("idle")}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview — {rows.length} rows</DialogTitle>
          </DialogHeader>

          {parseErr.length > 0 && (
            <div className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5 mb-1">
              {parseErr.map((e, i) => <p key={i}>⚠ {e}</p>)}
            </div>
          )}

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">MAU</TableHead>
                  <TableHead className="text-right">AOV (Rs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} className="h-9">
                    <TableCell className="text-sm">{PLATFORM_LABEL_SHORT[r.platform] ?? r.platform}</TableCell>
                    <TableCell className="text-sm font-mono">{r.period}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{r.mau.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">₹{r.aov.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            This will upsert MAU + AOV for the rows above into <span className="font-mono">platform_metrics</span>.
            GMV and Reach will not be touched.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStage("idle")} disabled={stage === "submitting"}>
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={stage === "submitting"}>
              {stage === "submitting"
                ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving…</>
                : `Commit ${rows.length} rows`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Per-platform drop zone (existing Haleon / legacy CSV format) ──────────────

function DropZone({ platform, lastUpload }: { platform: Platform; lastUpload: string }) {
  const [stage, setStage] = useState<"idle" | "map" | "preview" | "overwrite" | "submitting">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = (f: File) => {
    setFileName(f.name);
    setFile(f);
    if (Math.random() < 0.4) setStage("overwrite");
    else setStage("map");
  };

  async function handleCommit() {
    if (!file) return;
    setStage("submitting");
    try {
      const csvText = await file.text();
      const result = await processUpload({ data: { csvText, platform, weekEnding: latestWeek } });
      const parts = [`${result.committed} rows saved`, `${result.skipped} skipped`];
      if (result.autoCreated > 0) parts.push(`${result.autoCreated} new SKUs created`);
      toast.success(`${PLATFORM_LABEL[platform]} upload committed`, {
        description: parts.join(" · "),
        icon: <FileCheck2 className="size-4" />,
      });
      await router.invalidate();
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" });
    }
    setStage("idle");
    setFileName(null);
    setFile(null);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          {PLATFORM_LABEL[platform]}
          <span className="text-xs text-muted-foreground font-normal">
            Last: {lastUpload ? new Date(lastUpload).toLocaleDateString("en-IN") : "—"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
        >
          <UploadCloud className="size-7 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Drop CSV here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
          {fileName && stage === "idle" && (
            <p className="mt-2 text-xs text-primary truncate">{fileName}</p>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </CardContent>

      {/* Overwrite confirmation */}
      <Dialog open={stage === "overwrite"} onOpenChange={(o) => !o && setStage("idle")}>
        <DialogContent>
          <DialogHeader><DialogTitle>Overwrite existing upload?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            An upload already exists for {PLATFORM_LABEL[platform]}. Replacing it
            will overwrite all derived metrics for that period.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStage("idle")}>Cancel</Button>
            <Button onClick={() => setStage("map")}>Overwrite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map columns */}
      <Dialog open={stage === "map"} onOpenChange={(o) => !o && setStage("idle")}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Map columns — saved mapping</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Detected mapping from prior uploads. Edit later if your export format changes.</p>
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            {[
              ["sku_code", "sku.platform_id"],
              ["product_name", "sku.name"],
              ["units_sold", "offtake.units"],
              ["gross_sales", "offtake.gmv"],
              ["selling_price", "price.price"],
              ["listing_status", "listing.status"],
              ["keyword_query", "visibility.keyword"],
              ["search_position", "visibility.rank"],
            ].map(([src, dst]) => (
              <div key={src} className="contents">
                <div className="rounded-md border px-2.5 py-1.5 font-mono text-xs bg-muted/40">{src}</div>
                <div className="rounded-md border px-2.5 py-1.5 font-mono text-xs flex items-center gap-2"><ArrowRight className="size-3 text-muted-foreground" />{dst}</div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStage("idle")}>Cancel</Button>
            <Button onClick={() => setStage("preview")}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={stage === "preview"} onOpenChange={(o) => !o && setStage("idle")}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Preview · first 5 rows</DialogTitle></DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead><TableHead>Product</TableHead><TableHead>Units</TableHead><TableHead>GMV</TableHead><TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["PE-SEN1", "Sensodyne Rapid Relief 75g", "1,240", "₹2,18,640", "₹176"],
                  ["PE-CRO1", "Crocin Advance 500mg 15 tabs", "4,820", "₹1,49,420", "₹31"],
                  ["PE-CEN1", "Centrum Adults 30 tabs", "612", "₹2,11,140", "₹345"],
                  ["PE-ENO1", "ENO Lemon 5g sachet ×30", "1,888", "₹2,26,560", "₹120"],
                  ["PE-OTR1", "Otrivin Adult Nasal Spray 10ml", "934", "₹93,400", "₹100"],
                ].map((r) => (
                  <TableRow key={r[0]} className="h-9">
                    {r.map((c, i) => <TableCell key={i} className={i === 0 ? "font-mono text-xs" : ""}>{c}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStage("idle")}>Cancel</Button>
            <Button onClick={handleCommit} disabled={stage === "submitting"}>
              {stage === "submitting" ? <><Loader2 className="size-4 mr-2 animate-spin" />Uploading…</> : "Commit upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
