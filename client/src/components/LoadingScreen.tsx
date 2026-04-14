/**
 * DESIGN: Liquid Glass — Loading Screen
 * Full-screen loading with animated elements
 */

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "#080B12" }}>
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-2xl liquid-glass-glow flex items-center justify-center">
            <span className="font-display text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              US
            </span>
          </div>
          <motion.div
            className="absolute -inset-2 rounded-3xl border border-cyan-400/20"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="font-display text-sm font-bold tracking-[0.15em] uppercase bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            What If USA
          </h1>
          <p className="text-[11px] text-white/25 mt-1.5">Loading persona dataset...</p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-48 h-1 bg-white/5 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400/60 to-blue-400/60 rounded-full"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
