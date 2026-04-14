/**
 * DESIGN: Liquid Glass — Map Legend
 * Bottom-left floating legend showing sentiment color scale
 */

import { useApp } from "@/contexts/AppContext";

export default function MapLegend() {
  const { stateSentiment, isLoading } = useApp();

  if (isLoading || Object.keys(stateSentiment).length === 0) return null;

  return (
    <div className="absolute bottom-24 left-4 z-10">
      <div className="liquid-glass rounded-xl px-3.5 py-3 space-y-2.5">
        <span className="text-[10px] font-display text-cyan-300/40 tracking-wider uppercase block">
          Sentiment
        </span>
        <div className="space-y-1.5">
          <LegendItem color="#34D399" label="Positive" />
          <LegendItem color="#FBBF24" label="Neutral" />
          <LegendItem color="#F87171" label="Negative" />
          <LegendItem color="rgba(100, 180, 255, 0.25)" label="No Data" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-sm"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}30` }}
      />
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}
