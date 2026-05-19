import { createContext, useContext, useState, type ReactNode } from "react";
import { weeks, latestWeek } from "@/lib/mock-data";

type Ctx = { week: string; setWeek: (w: string) => void; weeks: string[] };
const WeekCtx = createContext<Ctx | null>(null);

export function WeekProvider({ children }: { children: ReactNode }) {
  const [week, setWeek] = useState<string>(latestWeek);
  return <WeekCtx.Provider value={{ week, setWeek, weeks }}>{children}</WeekCtx.Provider>;
}
export function useWeek() {
  const c = useContext(WeekCtx);
  if (!c) throw new Error("useWeek outside provider");
  return c;
}
