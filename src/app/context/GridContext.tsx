import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GridState, GridEvent } from "../types";
import { usePowerStatus, buildEventsFromStatus } from "../../hooks/usePowerStatus";
import { usePowerHistory, WeeklyDayData } from "../../hooks/usePowerHistory";

interface GridContextType {
  currentState: GridState;
  events: GridEvent[];
  timeInState: number;
  views: number;
  loading: boolean;
  error: string | null;
  weeklyDays: WeeklyDayData[];
  overallUptimePct: number;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export function GridProvider({ children }: { children: ReactNode }) {
  const { currentState, since, durationSeconds, views, loading: statusLoading, error: statusError } =
    usePowerStatus(10_000);

  const { events: historyEvents, weeklyDays, overallUptimePct, loading: historyLoading, error: historyError, refetch } =
    usePowerHistory();

  const [events, setEvents] = useState<GridEvent[]>([]);

  // Load history events initially when ready
  useEffect(() => {
    if (historyEvents.length > 0) {
      const reversed = [...historyEvents].reverse();
      setEvents(reversed);
    }
  }, [historyEvents]);

  // Rebuild the event log whenever the live state changes
  useEffect(() => {
    setEvents((prev) => buildEventsFromStatus(prev, currentState, since));
  }, [currentState, since]);

  // Listen to custom power state changes to trigger a history refetch
  useEffect(() => {
    const handleStateChange = () => {
      console.log("[GridContext] State changed, refetching history...");
      refetch();
    };
    window.addEventListener("power-state-change", handleStateChange);
    return () => window.removeEventListener("power-state-change", handleStateChange);
  }, [refetch]);

  const loading = statusLoading || historyLoading;
  const error = statusError || historyError;

  return (
    <GridContext.Provider
      value={{
        currentState,
        events,
        timeInState: durationSeconds,
        views,
        loading,
        error,
        weeklyDays,
        overallUptimePct,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}

export function useGrid() {
  const context = useContext(GridContext);
  if (!context) throw new Error("useGrid must be used within GridProvider");
  return context;
}
