/**
 * DESIGN: Tactical Command Center — Map Legend
 * Bottom-left legend showing the sentiment color scale
 */

import { useApp } from "@/contexts/AppContext";

export default function MapLegend() {
  const { stateSentiment, isLoading } = useApp();

  if (isLoading || Object.keys(stateSentiment).length === 0) return null;

  return (
    <div className="absolute bottom-24 left-4 z-10 glass-panel hud-corners rounded-lg px-3 py-2.5">
      <span className="text-[9px] font-display text-[#00F0FF]/50 tracking-[0.15em] uppercase block mb-2">
        Sentiment Scale
      </span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(255, 59, 92, 0.5)" }} />
          <span className="text-[9px] text-white/40 font-display">Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(255, 184, 0, 0.4)" }} />
          <span className="text-[9px] text-white/40 font-display">Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(0, 255, 136, 0.5)" }} />
          <span className="text-[9px] text-white/40 font-display">Positive</span>
        </div>
      </div>
    </div>
  );
}
