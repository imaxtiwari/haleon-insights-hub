import { createContext, useContext, useState, type ReactNode } from "react";
import { periods, latestPeriod } from "@/lib/mock-data";

type Ctx = { period: string; setPeriod: (p: string) => void; periods: string[] };
const PeriodCtx = createContext<Ctx | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<string>(latestPeriod);
  return <PeriodCtx.Provider value={{ period, setPeriod, periods }}>{children}</PeriodCtx.Provider>;
}

export function usePeriod() {
  const c = useContext(PeriodCtx);
  if (!c) throw new Error("usePeriod outside provider");
  return c;
}
