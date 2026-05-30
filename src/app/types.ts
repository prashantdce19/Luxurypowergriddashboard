export type GridState = "MAINS" | "GENERATOR" | "BLACKOUT" | "MAINTENANCE";

export interface GridEvent {
  id: string;
  state: GridState;
  timestamp: Date;
  duration?: number; // duration in seconds before next state
}
