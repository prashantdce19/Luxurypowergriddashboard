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
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const resultDays: WeeklyDayData[] = [];
    let totalMainsDuration = 0;
    let totalMonitoredDuration = 0;

    // Generate last 7 days starting 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date();
      dayDate.setDate(now.getDate() - i);
      dayDate.setHours(0, 0, 0, 0);
      const dayStart = dayDate.getTime();
      
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(dayDate.getDate() + 1);
      const dayEnd = nextDayDate.getTime();

      const dayLabel = daysOfWeek[dayDate.getDay()];

      // Find initial state of the day (the last event that started before the day began)
      let startState: GridState = "MAINS";
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

      // Add final segment till midnight or current time (if today)
      const endOfSegment = Math.min(dayEnd, Date.now());
      const remainingDuration = Math.max(0, Math.floor((endOfSegment - lastTime) / 1000));
      if (remainingDuration > 0) {
        daySegments.push({ state: currentState, duration: remainingDuration });
      }

      // Calculate total seconds in this day so far
      const totalDaySeconds = daySegments.reduce((acc, s) => acc + s.duration, 0);

      // Build consolidated segments and calculate percentages
      const stateDurations: Record<GridState, number> = {
        MAINS: 0,
        GENERATOR: 0,
        BLACKOUT: 0,
        MAINTENANCE: 0,
      };

      for (const seg of daySegments) {
        stateDurations[seg.state] += seg.duration;
      }

      // Accumulate for overall uptime
      totalMainsDuration += stateDurations.MAINS;
      totalMonitoredDuration += totalDaySeconds;

      const segments: DaySegment[] = [];
      if (totalDaySeconds > 0) {
        for (const seg of daySegments) {
          segments.push({
            state: seg.state,
            pct: Math.round((seg.duration / totalDaySeconds) * 1000) / 10,
          });
        }
      } else {
        // Default to 100% MAINS if no time elapsed / offline
        segments.push({ state: "MAINS", pct: 100 });
      }

      // Uptime is MAINS percentage
      const mainsSeconds = stateDurations.MAINS;
      const uptimePct = totalDaySeconds > 0 ? Math.round((mainsSeconds / totalDaySeconds) * 100) : 100;

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
