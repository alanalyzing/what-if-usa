/**
 * DESIGN: Tactical Command Center — Main Page
 * Full-screen map canvas with floating HUD panels overlay
 */

import { useApp } from "@/contexts/AppContext";
import USAMap from "@/components/USAMap";
import FilterPanel from "@/components/FilterPanel";
import QuestionBar from "@/components/QuestionBar";
import ResultsPanel from "@/components/ResultsPanel";
import QueryHistory from "@/components/QueryHistory";
import StatusBar from "@/components/StatusBar";
import MapLegend from "@/components/MapLegend";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const { isLoading, dataError } = useApp();

  if (isLoading) return <LoadingScreen />;

  if (dataError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0E17]">
        <div className="glass-panel hud-corners rounded-lg p-8 max-w-md text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-[#FF3B5C]/30 flex items-center justify-center">
            <span className="text-[#FF3B5C] text-xl">!</span>
          </div>
          <h2 className="font-display text-sm font-bold text-[#FF3B5C] tracking-wider uppercase mb-2">
            System Error
          </h2>
          <p className="text-xs text-white/50">{dataError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-xs font-display bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0A0E17]">
      {/* Full-screen map canvas */}
      <USAMap />

      {/* Floating HUD panels */}
      <StatusBar />
      <FilterPanel />
      <QueryHistory />
      <ResultsPanel />
      <MapLegend />
      <QuestionBar />
    </div>
  );
}
