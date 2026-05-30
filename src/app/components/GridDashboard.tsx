import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, History, AlertTriangle, Zap, Gauge, PowerOff, Wrench, ChevronRight, Calendar } from "lucide-react";
import { Link } from "react-router";
import { useGrid } from "../context/GridContext";
import { STATE_CONFIG } from "../constants";
import { formatDuration, formatTime, formatDateShort } from "../utils";
import { WeeklyHistory } from "./WeeklyHistory";

export default function GridDashboard() {
  const { currentState, events, timeInState, handleStateChange } = useGrid();
  const config = STATE_CONFIG[currentState];
  const Icon = config.icon;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayedEvents = events.slice(0, 5);

  return (
    <>
      <main className="relative z-10 w-full max-w-md mx-auto min-h-screen flex flex-col px-6 pt-8 pb-24">
        
        {/* Top Nav */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
              Live Status
            </span>
            <span className="text-sm font-medium text-white/90">Ibiza Town, Faridabad</span>
          </div>
          <button 
            onClick={() => alert("Report a local power fault or emergency issue to the maintenance team.")}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
            title="Report Fault"
          >
            <AlertTriangle size={14} className="text-white/60" />
          </button>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mt-2 mb-10">
          {/* Current Date & Time Pill */}
          <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
            <Calendar size={12} className="text-white/50" />
            <span className="text-[11px] font-medium text-white/70 tracking-widest uppercase">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>

          <motion.div
            key={currentState}
            initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative flex items-center justify-center mb-6"
          >
            <motion.div
              animate={{ boxShadow: `0 0 60px 10px ${config.glow}, inset 0 -10px 20px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.2)` }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="relative w-32 h-32 rounded-full flex items-center justify-center border border-white/20 shadow-2xl"
              style={{ 
                borderColor: config.color,
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), ${config.color} 150%)`
              }}
            >
              <div 
                className="absolute inset-0 rounded-full opacity-30 mix-blend-overlay"
                style={{ backgroundColor: config.color }}
              />
              <Icon size={48} style={{ color: '#fff', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }} strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          <motion.div
            key={`title-${currentState}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          >
            <h1 
              className="text-4xl font-bold tracking-tighter mb-2 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, #fff 0%, ${config.color} 150%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {config.label}
            </h1>
            <p className="text-white/60 text-sm tracking-wide uppercase font-medium">
              {config.message}
            </p>
          </motion.div>
        </section>

        {/* Info Bento Grid */}
        <section className="grid grid-cols-2 gap-4 mb-10">
          <BentoCard
            icon={<Clock size={16} className="text-white/40" />}
            label="Duration"
            value={formatDuration(timeInState)}
            accentColor={config.color}
          />
          <BentoCard
            icon={<History size={16} className="text-white/40" />}
            label="Last Transition"
            value={formatTime(events[0].timestamp)}
            subValue={formatDateShort(events[0].timestamp)}
            accentColor={config.color}
          />
        </section>

        {/* 7-Day History */}
        <WeeklyHistory />

        {/* History Metro Timeline */}
        <section className="flex flex-col relative pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white/90">Recent Log</h2>
          </div>
          
          <div className="relative pl-4">
            <div className="absolute left-[22px] top-4 bottom-0 w-[1px] bg-gradient-to-b from-white/20 to-transparent" />
            
            <div className="flex flex-col gap-6 relative">
              <AnimatePresence>
                {displayedEvents.map((event, idx) => {
                  const evConfig = STATE_CONFIG[event.state];
                  const isFirst = idx === 0;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative flex items-start gap-5"
                    >
                      <div className="relative mt-1.5 z-10">
                        <div 
                          className="w-3 h-3 rounded-full ring-4 ring-[#050505]"
                          style={{ 
                            backgroundColor: evConfig.color,
                            boxShadow: isFirst ? `0 0 12px 3px ${evConfig.color}40` : 'none'
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 pb-2 border-b border-white/5">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={`text-sm font-semibold ${isFirst ? 'text-white' : 'text-white/70'}`}>
                            {evConfig.label}
                          </h3>
                          <span className="text-xs text-white/40 font-mono">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        {event.duration !== undefined && (
                          <div className="text-xs text-white/50">
                            Lasted {formatDuration(event.duration)}
                          </div>
                        )}
                        {isFirst && (
                          <div className="text-[11px] text-emerald-400 mt-2 font-semibold uppercase tracking-wider">
                            Current active state
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Fade out mask over the last item */}
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
            </div>
          </div>
          
          <Link 
            to="/logs"
            className="mt-6 w-full bg-white/[0.03] hover:bg-white/10 transition-all duration-300 border border-white/10 rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm font-medium text-white/80 z-10 shadow-lg backdrop-blur-md"
          >
            View Full Logs
            <ChevronRight size={16} className="text-white/50" />
          </Link>
        </section>
      </main>

      {/* Demo Controls - Floating at bottom */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 rounded-full flex gap-1 shadow-2xl pointer-events-auto">
          <DemoButton 
            active={currentState === "MAINS"} 
            onClick={() => handleStateChange("MAINS")}
            color={STATE_CONFIG.MAINS.color}
            icon={<Zap size={16} />}
          />
          <DemoButton 
            active={currentState === "GENERATOR"} 
            onClick={() => handleStateChange("GENERATOR")}
            color={STATE_CONFIG.GENERATOR.color}
            icon={<Gauge size={16} />}
          />
          <DemoButton 
            active={currentState === "BLACKOUT"} 
            onClick={() => handleStateChange("BLACKOUT")}
            color={STATE_CONFIG.BLACKOUT.color}
            icon={<PowerOff size={16} />}
          />
          <DemoButton 
            active={currentState === "MAINTENANCE"} 
            onClick={() => handleStateChange("MAINTENANCE")}
            color={STATE_CONFIG.MAINTENANCE.color}
            icon={<Wrench size={16} />}
          />
        </div>
      </div>
    </>
  );
}

function BentoCard({ icon, label, value, subValue, accentColor }: { icon: React.ReactNode, label: string, value: string, subValue?: string, accentColor: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-4 shadow-xl shadow-black/50 backdrop-blur-md flex flex-col justify-between h-28" 
      style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)' }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex flex-col mt-auto">
        <div className="text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
          {value}
        </div>
        {subValue && (
          <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mt-0.5">
            {subValue}
          </div>
        )}
      </div>
      <motion.div 
        animate={{ backgroundColor: accentColor }}
        className="absolute bottom-0 left-0 h-[2px] w-1/3 opacity-50"
        style={{
          boxShadow: `0 -2px 10px 1px ${accentColor}`
        }}
      />
    </motion.div>
  );
}

function DemoButton({ active, onClick, color, icon }: { active: boolean, onClick: () => void, color: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
        active ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/10'
      }`}
    >
      {active && (
        <motion.div
          layoutId="demo-active-pill"
          className="absolute inset-0 rounded-full border border-white/30"
          style={{ backgroundColor: color, opacity: 0.2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span style={{ color: active ? color : 'inherit' }} className="relative z-10">
        {icon}
      </span>
    </button>
  );
}
