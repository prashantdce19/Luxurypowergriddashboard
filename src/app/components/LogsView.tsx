import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useGrid } from "../context/GridContext";
import { STATE_CONFIG } from "../constants";
import { formatDuration, formatTime } from "../utils";

export default function LogsView() {
  const navigate = useNavigate();
  const { events, timeInState } = useGrid();

  // Group events by day
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = event.timestamp.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <main className="relative z-10 w-full max-w-md mx-auto min-h-screen flex flex-col px-6 pt-8 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={18} className="text-white/80" />
        </button>
        <h1 className="text-xl font-semibold text-white tracking-tight">Full History</h1>
      </header>

      <div className="flex flex-col gap-10">
        {Object.entries(groupedEvents).map(([date, dayEvents], groupIdx) => (
          <section key={date}>
            <h2 className="text-[11px] font-bold tracking-widest text-white/40 uppercase mb-6 sticky top-4 bg-[#050505]/80 backdrop-blur-xl py-2 z-20 rounded-lg px-1">
              {date}
            </h2>
            
            <div className="relative pl-4">
              <div className="absolute left-[22px] top-4 bottom-0 w-[1px] bg-gradient-to-b from-white/20 to-transparent" />
              
              <div className="flex flex-col gap-6">
                <AnimatePresence>
                  {dayEvents.map((event, idx) => {
                    const evConfig = STATE_CONFIG[event.state];
                    const isLatest = groupIdx === 0 && idx === 0;
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative flex items-start gap-5"
                      >
                        <div className="relative mt-1.5 z-10">
                          <div 
                            className="w-3 h-3 rounded-full ring-4 ring-[#050505]"
                            style={{ 
                              backgroundColor: evConfig.color,
                              boxShadow: isLatest ? `0 0 12px 3px ${evConfig.color}40` : 'none'
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-sm shadow-xl shadow-black/20">
                          <div className="flex justify-between items-baseline mb-2">
                            <h3 className={`text-sm font-semibold ${isLatest ? 'text-white' : 'text-white/80'}`}>
                              {evConfig.label}
                            </h3>
                            <span className="text-xs text-white/40 font-mono">
                              {formatTime(event.timestamp)}
                            </span>
                          </div>
                          {(isLatest || event.duration !== undefined) && (
                            <div className="text-xs text-white/50 bg-white/5 inline-block px-2 py-1 rounded-md mt-1">
                              Duration: {formatDuration(isLatest ? timeInState : event.duration!)}
                            </div>
                          )}
                          {isLatest && (
                            <div className="text-[11px] text-emerald-400 mt-3 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Current Status
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
