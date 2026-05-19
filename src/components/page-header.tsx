import { Download, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWeek } from "@/lib/week-context";
import { fmtDate } from "@/lib/format";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { week } = useWeek();
  const dummy = (fmt: string) => {
    const data = "Haleon E-Pharm Tracker export\n";
    const blob = new Blob([data], { type: fmt === "csv" ? "text/csv" : "image/png" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${week}.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export complete");
  };
  return (
    <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Week ending <span className="font-medium text-foreground">{fmtDate(week)}</span>
          {subtitle && <> · {subtitle}</>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <Button variant="outline" size="sm" onClick={() => dummy("csv")}>
          <Download className="size-3.5 mr-1.5" /> Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => dummy("png")}>
          <ImageDown className="size-3.5 mr-1.5" /> Export PNG
        </Button>
      </div>
    </div>
  );
}
