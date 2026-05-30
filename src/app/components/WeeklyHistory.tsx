import { motion } from "motion/react";
import { STATE_CONFIG } from "../constants";
import { useGrid } from "../context/GridContext";

export function WeeklyHistory() {
  const { weeklyDays, overallUptimePct, loading } = useGrid();

  if (loading) {
    return (
      <section className="mb-10 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-white/10 rounded-md" />
          <div className="h-5 w-20 bg-white/10 rounded-md" />
        </div>
        
        <div className="relative rounded-[1.5rem] bg-white/[0.02] border border-white/10 p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-3 w-20 bg-white/10 rounded" />
                <div className="flex-1 h-1.5 bg-white/5 rounded-full" />
                <div className="h-3 w-8 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white/90">Weekly Summary</h2>
        <span className="text-sm font-semibold" style={{ color: STATE_CONFIG.MAINS.color }}>
          {overallUptimePct.toFixed(1)}% Uptime
        </span>
      </div>
      
      <div 
        className="relative overflow-hidden rounded-[1.5rem] bg-white/[0.02] border border-white/10 p-5 shadow-xl shadow-black/50 backdrop-blur-md" 
        style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)' }}
      >
        {!weeklyDays || weeklyDays.length === 0 ? (
          <div className="text-center py-6 text-white/40 text-sm">No historical data available</div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {weeklyDays.map((data, idx) => (
              <div key={data.day} className="flex items-center gap-4">
                <span className="text-xs font-medium text-white/40 w-20">{data.day}</span>
                
                {/* Segmented Bar */}
                <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-white/5 shadow-inner">
                  {data.segments.map((seg, i) => {
                    const color = STATE_CONFIG[seg.state as keyof typeof STATE_CONFIG]?.color ?? '#737373';
                    return (
                      <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${seg.pct}%` }}
                        transition={{ delay: idx * 0.05 + i * 0.02, duration: 0.6, ease: "easeOut" }}
                        className="h-full"
                        style={{ 
                          backgroundColor: color,
                          boxShadow: seg.state !== 'MAINS' ? `0 0 8px ${color}30` : 'none',
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
        )}
        
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
