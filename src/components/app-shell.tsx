import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Upload, LayoutDashboard, Activity, Search, ListChecks, ShoppingCart, PieChart, IndianRupee, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useWeek } from "@/lib/week-context";
import { fmtDate } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/snapshot", label: "Snapshot", icon: LayoutDashboard },
  { to: "/brand-health", label: "Brand Health", icon: Activity },
  { to: "/visibility", label: "Visibility", icon: Search },
  { to: "/listings", label: "Listings", icon: ListChecks },
  { to: "/offtakes", label: "Offtakes", icon: ShoppingCart },
  { to: "/market-share", label: "Market Share", icon: PieChart },
  { to: "/pricing", label: "Pricing", icon: IndianRupee },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { week, setWeek, weeks } = useWeek();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={cn(
          "shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-200",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <div className={cn("h-14 flex items-center px-3 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
          <div className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold text-xs">H</div>
          {!collapsed && <div className="ml-2 font-semibold tracking-tight text-sm">E-Pharm Tracker</div>}
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((n) => {
            const active = path === n.to || path.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <n.icon className="size-4 shrink-0" />
                {!collapsed && <span>{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mx-2 mb-2 h-8 rounded-md border border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 sticky top-0 z-30">
          <div className="font-semibold text-sm tracking-tight">Haleon E-Pharm Tracker</div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Week ending</span>
              <Select value={week} onValueChange={setWeek}>
                <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...weeks].reverse().map((w) => (
                    <SelectItem key={w} value={w} className="text-xs">{fmtDate(w)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate({ to: "/login" })}>
            <LogOut className="size-3.5 mr-1.5" /> Sign out
          </Button>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">PS</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}
