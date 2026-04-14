/**
 * DESIGN: Tactical Command Center — Glass-morphism HUD panel
 * Floating glass panel with micro-grid dot pattern, corner brackets, optional scan line
 */

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  corners?: boolean;
  scanLine?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function GlassPanel({
  corners = true,
  scanLine = false,
  glow = false,
  className,
  children,
  ...motionProps
}: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "glass-panel rounded-lg overflow-hidden",
        corners && "hud-corners",
        scanLine && "scan-line",
        glow && "glow-cyan",
        className,
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
