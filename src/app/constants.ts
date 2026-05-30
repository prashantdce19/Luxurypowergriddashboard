import { Zap, PowerOff, Gauge, Wrench } from "lucide-react";

export const STATE_CONFIG = {
  MAINS: {
    label: "Mains Grid",
    color: "rgba(16, 185, 129, 1)", // emerald-500
    glow: "rgba(16, 185, 129, 0.3)",
    icon: Zap,
    message: "Primary Source Active. Grid is stable.",
  },
  GENERATOR: {
    label: "Diesel Generator",
    color: "rgba(245, 158, 11, 1)", // amber-500
    glow: "rgba(245, 158, 11, 0.3)",
    icon: Gauge,
    message: "Backup Power Active. Conserve Energy.",
  },
  BLACKOUT: {
    label: "Blackout",
    color: "rgba(239, 68, 68, 1)", // red-500
    glow: "rgba(239, 68, 68, 0.3)",
    icon: PowerOff,
    message: "Total Power Loss. Awaiting Backup.",
  },
  MAINTENANCE: {
    label: "Under Maintenance",
    color: "rgba(156, 163, 175, 1)", // gray-400
    glow: "rgba(156, 163, 175, 0.3)",
    icon: Wrench,
    message: "System Maintenance. Normalizing soon.",
  },
};
