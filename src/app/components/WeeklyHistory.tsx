import { motion } from "motion/react";
import { STATE_CONFIG } from "../constants";

// Mock 7-day data (distributed across 24h timeline)
const weeklyData = [
  { day: "Mon", uptime: 98, segments: [{ state: "MAINS", pct: 45 }, { state: "BLACKOUT", pct: 1 }, { state: "GENERATOR", pct: 1 }, { state: "MAINS", pct: 53 }] },
  { day: "Tue", uptime: 100, segments: [{ state: "MAINS", pct: 100 }] },
  { day: "Wed", uptime: 94, segments: [{ state: "MAINS", pct: 30 }, { state: "BLACKOUT", pct: 2 }, { state: "GENERATOR", pct: 4 }, { state: "MAINS", pct: 64 }] },
  { day: "Thu", uptime: 88, segments: [{ state: "MAINS", pct: 80 }, { state: "BLACKOUT", pct: 2 }, { state: "GENERATOR", pct: 10 }, { state: "MAINS", pct: 8 }] },
  { day: "Fri", uptime: 100, segments: [{ state: "MAINS", pct: 100 }] },
  { day: "Sat", uptime: 99, segments: [{ state: "MAINS", pct: 20 }, { state: "MAINTENANCE", pct: 1 }, { state: "MAINS", pct: 79 }] },
  { day: "Sun", uptime: 95, segments: [{ state: "MAINS", pct: 60 }, { state: "BLACKOUT", pct: 2 }, { state: "GENERATOR", pct: 3 }, { state: "MAINS", pct: 35 }] },
] as const;

export function WeeklyHistory() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white/90">Weekly Summary</h2>
        <span className="text-sm font-semibold" style={{ color: STATE_CONFIG.MAINS.color }}>
          96.2% Uptime
        </span>
      </div>
      
      <div 
        className="relative overflow-hidden rounded-[1.5rem] bg-white/[0.02] border border-white/10 p-5 shadow-xl shadow-black/50 backdrop-blur-md" 
        style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)' }}
      >
        <div className="flex flex-col gap-3.5">
          {weeklyData.map((data, idx) => (
            <div key={data.day} className="flex items-center gap-4">
              <span className="text-xs font-medium text-white/40 w-6">{data.day}</span>
              
              {/* Segmented Bar */}
              <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-white/5 shadow-inner">
                {data.segments.map((seg, i) => {
                  const color = STATE_CONFIG[seg.state as keyof typeof STATE_CONFIG].color;
                  return (
                    <motion.div
                      key={i}
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.pct}%` }}
                      transition={{ delay: idx * 0.1 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className="h-full"
                      style={{ 
                        backgroundColor: color,
                        boxShadow: seg.state !== 'MAINS' ? `0 0 8px ${color}` : 'none',
                        zIndex: seg.state !== 'MAINS' ? 10 : 1
                      }}
                    />
                  );
                })}
              </div>
              
              <span className="text-[10px] font-mono text-white/50 w-8 text-right">{data.uptime}%</span>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_CONFIG.MAINS.color }} />
            <span className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Mains</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_CONFIG.GENERATOR.color }} />
            <span className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Gen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_CONFIG.BLACKOUT.color }} />
            <span className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Outage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_CONFIG.MAINTENANCE.color }} />
            <span className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Maint</span>
          </div>
        </div>
      </div>
    </section>
  );
}
