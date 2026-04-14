/**
 * DESIGN: Liquid Glass — Frosted translucent panel
 * Semi-transparent with specular highlights, soft blur, and subtle glow
 */

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "subtle" | "glow";
  corners?: boolean;
  scanLine?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function GlassPanel({
  variant = "default",
  corners = false,
  scanLine = false,
  className,
  children,
  ...motionProps
}: GlassPanelProps) {
  const variantClass = {
    default: "liquid-glass",
    subtle: "liquid-glass-subtle",
    glow: "liquid-glass-glow",
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        variantClass,
        "overflow-hidden",
        corners && "hud-corners",
        scanLine && "scan-line",
        className,
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
