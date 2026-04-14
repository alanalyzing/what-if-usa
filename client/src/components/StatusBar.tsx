/**
 * DESIGN: Tactical Command Center — Top Status Bar / Title
 * Centered top bar with app title and status indicators
 */

import { useApp } from "@/contexts/AppContext";
import { STATE_NAMES } from "@/lib/types";
import { Database, MapPin, Radio } from "lucide-react";

export default function StatusBar() {
  const { personas, selectedState, isLoading } = useApp();

  if (isLoading) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      {/* Title */}
      <div className="glass-panel hud-corners rounded-lg px-5 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse" style={{ boxShadow: "0 0 8px #00F0FF" }} />
          <h1 className="font-display text-sm font-bold text-[#00F0FF] tracking-[0.15em] uppercase glow-text-cyan">
            What If USA
          </h1>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-3 text-[10px] font-display text-white/40 tracking-wider uppercase">
          <span className="flex items-center gap-1">
            <Database size={10} className="text-[#00F0FF]/40" />
            {personas.length.toLocaleString()} personas
          </span>
          {selectedState && (
            <>
              <div className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1 text-[#00F0FF]">
                <MapPin size={10} />
                {STATE_NAMES[selectedState] || selectedState}
              </span>
            </>
          )}
          <div className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1">
            <Radio size={10} className="text-[#00FF88]" />
            <span className="text-[#00FF88]">LIVE</span>
          </span>
        </div>
      </div>
    </div>
  );
}
