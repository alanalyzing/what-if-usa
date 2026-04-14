/**
 * DESIGN: Tactical Command Center — Loading Screen
 * Full-screen loading overlay with tactical HUD aesthetic
 */

import { motion } from "framer-motion";

const LOADING_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663249428057/7pgggnfjc7LYDVaKEjkhKS/loading-bg-RMFYH9Ru3A2yhPQSmd3cmn.webp";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E17]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${LOADING_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 border-2 border-[#00F0FF]/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-1 border-2 border-[#00F0FF]/40 border-t-[#00F0FF] rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-3 border border-[#00F0FF]/15 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="font-display text-xl font-bold text-[#00F0FF] tracking-[0.2em] uppercase glow-text-cyan">
            What If USA
          </h1>
          <p className="text-[10px] font-display text-[#00F0FF]/40 tracking-[0.3em] uppercase mt-2">
            Initializing Persona Database
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-[#00F0FF]/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#00F0FF]/60 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
