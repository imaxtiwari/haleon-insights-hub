import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PLATFORMS, PLATFORM_LABEL, latestWeek, weeks, type Platform } from "@/lib/mock-data";
import { processUpload } from "@/lib/server/upload";
import { fetchUploads } from "@/lib/server/queries";
import { fmtDate } from "@/lib/format";
import { UploadCloud, FileCheck2, ArrowRight, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

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
      <PageHeader title="Upload" subtitle="Weekly CSV ingestion per platform" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLATFORMS.map((p) => (
          <DropZone key={p} platform={p} lastUpload={latestPerPlatform[p]} />
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle className="text-base">Upload history</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week ending</TableHead>
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
                  <TableCell className="font-medium">{fmtDate(u.weekEnding)}</TableCell>
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

function DropZone({ platform, lastUpload }: { platform: Platform; lastUpload: string }) {
  const [stage, setStage] = useState<"idle" | "map" | "preview" | "overwrite" | "submitting">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      toast.success(`${PLATFORM_LABEL[platform]} upload committed`, {
        description: `${result.committed} rows saved · ${result.skipped} skipped`,
        icon: <FileCheck2 className="size-4" />,
      });
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
            An upload already exists for {PLATFORM_LABEL[platform]} · {fmtDate(weeks[weeks.length - 1])}. Replacing it
            will overwrite all derived metrics for that week.
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
