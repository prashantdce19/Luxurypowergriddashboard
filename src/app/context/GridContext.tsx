import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GridState, GridEvent } from "../types";
import { usePowerStatus, buildEventsFromStatus } from "../../hooks/usePowerStatus";

interface GridContextType {
  currentState: GridState;
  events: GridEvent[];
  timeInState: number;
  views: number;
  loading: boolean;
  error: string | null;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export function GridProvider({ children }: { children: ReactNode }) {
  const { currentState, since, durationSeconds, views, loading, error } =
    usePowerStatus(10_000);

  const [events, setEvents] = useState<GridEvent[]>([]);

  // Rebuild the event log whenever the live state changes
  useEffect(() => {
    setEvents((prev) => buildEventsFromStatus(prev, currentState, since));
  }, [currentState, since]);

  return (
    <GridContext.Provider
      value={{
        currentState,
        events,
        timeInState: durationSeconds,
        views,
        loading,
        error,
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
