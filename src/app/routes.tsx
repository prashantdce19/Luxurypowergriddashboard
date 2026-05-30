import { createBrowserRouter, Outlet } from "react-router";
import { motion } from "motion/react";
import GridDashboard from "./components/GridDashboard";
import LogsView from "./components/LogsView";
import { GridProvider, useGrid } from "./context/GridContext";
import { STATE_CONFIG } from "./constants";

function Layout() {
  const { currentState } = useGrid();
  const config = STATE_CONFIG[currentState];

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white font-['Inter'] overflow-x-hidden selection:bg-white/20 flex justify-center">
      {/* Ambient Color Bleed Background */}
      <motion.div
        animate={{ backgroundColor: config.glow }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute inset-0 blur-[100px] opacity-40 mix-blend-screen pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% -10%, ${config.color} 0%, transparent 60%)`,
        }}
      />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="w-full max-w-md min-h-screen relative z-10 flex flex-col shadow-2xl border-x border-white/[0.02] bg-black/20 backdrop-blur-3xl">
        <Outlet />
      </div>
    </div>
  );
}

function Root() {
  return (
    <GridProvider>
      <Layout />
    </GridProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: GridDashboard },
      { path: "logs", Component: LogsView },
    ],
  },
]);
