import { useState, useEffect, useCallback } from "react";
import { GridState, GridEvent } from "../app/types";

// Maps Flask API status strings → UI GridState labels
const API_STATE_MAP: Record<string, GridState> = {
  GRID_ON: "MAINS",
  DG_ON: "GENERATOR",
  BLACKOUT: "BLACKOUT",
  MAINTENANCE: "MAINTENANCE",
};

export interface PowerStatus {
  status: string;         // Raw Flask status e.g. "GRID_ON"
  since: string;          // ISO timestamp of last state change
  duration_seconds: number;
  views: number;
}

export interface PowerStatusResult {
  currentState: GridState;
  since: Date | null;
  durationSeconds: number;
  views: number;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function usePowerStatus(pollIntervalMs = 10_000): PowerStatusResult {
  const [result, setResult] = useState<PowerStatusResult>({
    currentState: "MAINS",
    since: null,
    durationSeconds: 0,
    views: 0,
    loading: true,
    error: null,
    lastFetched: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/status`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PowerStatus = await res.json();

      const mappedState: GridState = API_STATE_MAP[data.status] ?? "MAINTENANCE";
      const sinceDate = new Date(data.since);

      setResult({
        currentState: mappedState,
        since: sinceDate,
        durationSeconds: data.duration_seconds,
        views: data.views,
        loading: false,
        error: null,
        lastFetched: new Date(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[usePowerStatus] Failed to fetch power status:", msg);
      setResult((prev) => ({
        ...prev,
        loading: false,
        error: msg,
        lastFetched: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    // ALWAYS fetch initial status via HTTP on mount for instant load times
    fetchStatus();

    const startPolling = () => {
      if (pollInterval) return;
      console.log("[usePowerStatus] Starting polling fallback...");
      fetchStatus();
      pollInterval = setInterval(fetchStatus, pollIntervalMs);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    if (typeof EventSource !== "undefined") {
      console.log("[usePowerStatus] Connecting to SSE public stream...");
      eventSource = new EventSource(`${API_BASE}/api/public/stream`);

      eventSource.onopen = () => {
        console.log("[usePowerStatus] SSE connection opened successfully!");
        stopPolling();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "snapshot" || data.type === "state_change") {
            const mappedState: GridState = API_STATE_MAP[data.status] ?? "MAINTENANCE";
            const sinceDate = new Date(data.since);

            setResult((prev) => ({
              currentState: mappedState,
              since: sinceDate,
              durationSeconds: data.duration_seconds ?? 0,
              views: data.views ?? prev.views,
              loading: false,
              error: null,
              lastFetched: new Date(),
            }));

            if (data.type === "state_change") {
              const customEvent = new CustomEvent("power-state-change", {
                detail: {
                  state: mappedState,
                  timestamp: sinceDate,
                }
              });
              window.dispatchEvent(customEvent);
            }
          }
        } catch (err) {
          console.error("[usePowerStatus] Failed to parse SSE event:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("[usePowerStatus] SSE error occurred. Falling back to polling...", err);
        startPolling();
      };
    } else {
      console.log("[usePowerStatus] EventSource is not supported by this browser.");
      startPolling();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      stopPolling();
    };
  }, [fetchStatus, pollIntervalMs]);

  // Live-update durationSeconds every second (without a new API call)
  useEffect(() => {
    if (!result.since) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - result.since!.getTime()) / 1000);
      setResult((prev) => ({ ...prev, durationSeconds: elapsed }));
    }, 1000);
    return () => clearInterval(tick);
  }, [result.since]);

  return result;
}

/**
 * Converts the live status data into a GridEvent array for the timeline log.
 * Since the public API only returns the current state, we synthesise a single
 * "current" event and keep any previously-seen events in memory.
 */
export function buildEventsFromStatus(
  prevEvents: GridEvent[],
  currentState: GridState,
  since: Date | null,
): GridEvent[] {
  if (!since) return prevEvents;

  const sinceTime = since.getTime();

  // If the most recent event matches the current state + timestamp, no change
  if (
    prevEvents.length > 0 &&
    prevEvents[0].state === currentState &&
    prevEvents[0].timestamp.getTime() === sinceTime
  ) {
    return prevEvents;
  }

  // State changed — record duration on the previous event and prepend new one
  const updated = [...prevEvents];
  if (updated.length > 0 && updated[0].state !== currentState) {
    updated[0] = {
      ...updated[0],
      duration: Math.floor((sinceTime - updated[0].timestamp.getTime()) / 1000),
    };
  }

  const newEvent: GridEvent = {
    id: `live-${sinceTime}`,
    state: currentState,
    timestamp: since,
  };

  // Deduplicate: don't re-add if already the head
  if (updated[0]?.id === newEvent.id) return updated;

  return [newEvent, ...updated].slice(0, 50); // keep last 50 events
}
