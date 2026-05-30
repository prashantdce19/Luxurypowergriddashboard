import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GridState, GridEvent } from "../types";

// Seed some initial historical events
const createInitialEvents = (): GridEvent[] => {
  const now = new Date();
  return [
    { id: "e1", state: "MAINS", timestamp: new Date(now.getTime() - 1000 * 60 * 45), duration: undefined },
    { id: "e2", state: "GENERATOR", timestamp: new Date(now.getTime() - 1000 * 60 * 105), duration: 1000 * 60 * 60 },
    { id: "e3", state: "BLACKOUT", timestamp: new Date(now.getTime() - 1000 * 60 * 110), duration: 1000 * 60 * 5 },
    { id: "e4", state: "MAINS", timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), duration: 1000 * 60 * 60 * 24 - 1000 * 60 * 110 },
    { id: "e5", state: "GENERATOR", timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 26), duration: 1000 * 60 * 60 * 2 },
    { id: "e6", state: "BLACKOUT", timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 26.2), duration: 1000 * 60 * 12 },
    { id: "e7", state: "MAINS", timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 72), duration: 1000 * 60 * 60 * 45.8 },
  ];
};

interface GridContextType {
  currentState: GridState;
  events: GridEvent[];
  timeInState: number;
  handleStateChange: (newState: GridState) => void;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export function GridProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<GridEvent[]>(createInitialEvents());
  const [currentState, setCurrentState] = useState<GridState>(events[0].state);
  const [timeInState, setTimeInState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInState(Math.floor((Date.now() - events[0].timestamp.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const handleStateChange = (newState: GridState) => {
    if (newState === currentState) return;
    const now = new Date();
    setEvents((prev) => {
      const updatedPrev = [...prev];
      updatedPrev[0].duration = Math.floor((now.getTime() - updatedPrev[0].timestamp.getTime()) / 1000);
      return [
        { id: Math.random().toString(36).substr(2, 9), state: newState, timestamp: now },
        ...updatedPrev,
      ];
    });
    setCurrentState(newState);
    setTimeInState(0);
  };

  return (
    <GridContext.Provider value={{ currentState, events, timeInState, handleStateChange }}>
      {children}
    </GridContext.Provider>
  );
}

export function useGrid() {
  const context = useContext(GridContext);
  if (!context) throw new Error("useGrid must be used within GridProvider");
  return context;
}
