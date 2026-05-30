import { useState, useEffect, useCallback } from "react";
import { GridState, GridEvent } from "../app/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const API_STATE_MAP: Record<string, GridState> = {
  GRID_ON: "MAINS",
  DG_ON: "GENERATOR",
  BLACKOUT: "BLACKOUT",
  MAINTENANCE: "MAINTENANCE",
};

export interface RawHistoryEvent {
  time: string;
  status: string;
}

export interface DaySegment {
  state: GridState;
  pct: number;
}

export interface WeeklyDayData {
  day: string;
  uptime: number;
  segments: DaySegment[];
}

export interface PowerHistoryResult {
  events: GridEvent[];
  weeklyDays: WeeklyDayData[];
  overallUptimePct: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePowerHistory(): PowerHistoryResult {
  const [events, setEvents] = useState<GridEvent[]>([]);
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDayData[]>([]);
  const [overallUptimePct, setOverallUptimePct] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/public/history`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { events: RawHistoryEvent[] } = await res.json();

      // Convert raw events to GridEvent array (ordered chronologically ASC)
      const mappedEvents: GridEvent[] = data.events.map((e, index) => ({
        id: `db-${index}-${e.time}`,
        state: API_STATE_MAP[e.status] ?? "MAINTENANCE",
        timestamp: new Date(e.time),
      }));

      // Calculate duration of each event
      for (let i = 0; i < mappedEvents.length; i++) {
        if (i < mappedEvents.length - 1) {
          mappedEvents[i].duration = Math.floor(
            (mappedEvents[i + 1].timestamp.getTime() - mappedEvents[i].timestamp.getTime()) / 1000
          );
        }
      }

      setEvents(mappedEvents);
      processHistoryData(mappedEvents);
      setLoading(false);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[usePowerHistory] Failed to fetch history:", msg);
      setError(msg);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5 * 60 * 1000); // 5 min periodic reload fallback
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const processHistoryData = (allEvents: GridEvent[]) => {
    const formatDayLabel = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    };

    const now = new Date();
    const resultDays: WeeklyDayData[] = [];
    let totalMainsDuration = 0;
    let totalMonitoredDuration = 0;

    // Generate last 7 days starting with today (i=0) and ending with 6 days ago (i=6)
    // to order latest date as first and then the following days descending
    for (let i = 0; i <= 6; i++) {
      const dayDate = new Date();
      dayDate.setDate(now.getDate() - i);
      dayDate.setHours(0, 0, 0, 0);
      const dayStart = dayDate.getTime();
      
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(dayDate.getDate() + 1);
      const dayEnd = nextDayDate.getTime();

      const dayLabel = formatDayLabel(dayDate);

      // Find initial state of the day (the last event that started before the day began)
      // Default to "MAINTENANCE" (grey) if no events are recorded in the past
      let startState: GridState = "MAINTENANCE";
      const pastEvents = allEvents.filter(e => e.timestamp.getTime() < dayStart);
      if (pastEvents.length > 0) {
        startState = pastEvents[pastEvents.length - 1].state;
      }

      // Find events that occurred within this day
      const dayEvents = allEvents.filter(
        e => e.timestamp.getTime() >= dayStart && e.timestamp.getTime() < dayEnd
      );

      // Construct segments for the day
      const daySegments: { state: GridState; duration: number }[] = [];
      let lastTime = dayStart;
      let currentState = startState;

      for (const event of dayEvents) {
        const eventTime = event.timestamp.getTime();
        const duration = Math.floor((eventTime - lastTime) / 1000);
        if (duration > 0) {
          daySegments.push({ state: currentState, duration });
        }
        currentState = event.state;
        lastTime = eventTime;
      }

      // Add final active segment till midnight or current time (if today)
      const nowMs = Date.now();
      const endOfActiveSegment = Math.min(dayEnd, nowMs);
      const activeDuration = Math.max(0, Math.floor((endOfActiveSegment - lastTime) / 1000));
      if (activeDuration > 0) {
        daySegments.push({ state: currentState, duration: activeDuration });
      }

      // If there is any unelapsed time in this 24-hour day (e.g. today's future),
      // pad the remaining day with a MAINTENANCE segment so the total duration is exactly 86,400 seconds.
      const elapsedSeconds = daySegments.reduce((acc, s) => acc + s.duration, 0);
      const fullDaySeconds = 86400;
      if (elapsedSeconds < fullDaySeconds) {
        daySegments.push({
          state: "MAINTENANCE",
          duration: fullDaySeconds - elapsedSeconds
        });
      }

      // Build consolidated state durations
      const stateDurations: Record<GridState, number> = {
        MAINS: 0,
        GENERATOR: 0,
        BLACKOUT: 0,
        MAINTENANCE: 0,
      };

      for (const seg of daySegments) {
        stateDurations[seg.state] += seg.duration;
      }

      // Subtract the future padding segment duration from MAINTENANCE state duration for monitored calculations
      let activeMaintenanceDuration = stateDurations.MAINTENANCE;
      if (elapsedSeconds < fullDaySeconds) {
        activeMaintenanceDuration = Math.max(0, stateDurations.MAINTENANCE - (fullDaySeconds - elapsedSeconds));
      }

      const mainsSeconds = stateDurations.MAINS;
      const activeMonitoredSeconds = stateDurations.MAINS + stateDurations.GENERATOR + stateDurations.BLACKOUT + activeMaintenanceDuration;

      // Accumulate active monitored durations for the overall 7-day average
      totalMainsDuration += mainsSeconds;
      totalMonitoredDuration += (stateDurations.MAINS + stateDurations.GENERATOR + stateDurations.BLACKOUT);

      // Build segments list using the absolute 24h scale
      const segments: DaySegment[] = [];
      for (const seg of daySegments) {
        segments.push({
          state: seg.state,
          pct: Math.round((seg.duration / fullDaySeconds) * 1000) / 10,
        });
      }

      // Uptime is computed over elapsed active monitored time
      const uptimePct = activeMonitoredSeconds > 0 ? Math.round((mainsSeconds / activeMonitoredSeconds) * 100) : 0;

      resultDays.push({
        day: dayLabel,
        uptime: uptimePct,
        segments: segments,
      });
    }

    setWeeklyDays(resultDays);

    // Calculate overall uptime
    if (totalMonitoredDuration > 0) {
      setOverallUptimePct(Math.round((totalMainsDuration / totalMonitoredDuration) * 1000) / 10);
    } else {
      setOverallUptimePct(100);
    }
  };

  return {
    events,
    weeklyDays,
    overallUptimePct,
    loading,
    error,
    refetch: fetchHistory,
  };
}
