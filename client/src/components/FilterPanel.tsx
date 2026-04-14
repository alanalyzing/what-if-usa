/**
 * DESIGN: Liquid Glass — Audience Filter Panel
 * Top-left collapsible glass panel with age slider, sex, occupation, education, state, sample size
 */

import { useApp } from "@/contexts/AppContext";
import GlassPanel from "./GlassPanel";
import { STATE_NAMES, EDUCATION_LABELS } from "@/lib/types";
import { ChevronDown, ChevronUp, SlidersHorizontal, Users, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";

export default function FilterPanel() {
  const {
    filters, setFilters, filterMeta, filterPanelOpen, setFilterPanelOpen,
    filteredCount, isLoading,
  } = useApp();
  const [occupationSearch, setOccupationSearch] = useState("");

  const filteredOccupations = useMemo(() => {
    if (!filterMeta) return [];
    if (!occupationSearch) return filterMeta.occupations;
    const q = occupationSearch.toLowerCase();
    return filterMeta.occupations.filter((o) => o.replace(/_/g, " ").toLowerCase().includes(q));
  }, [filterMeta, occupationSearch]);

  const formatOcc = (occ: string) => occ.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const resetFilters = () => {
    setFilters({
      ageRange: [18, 106],
      sex: "Any",
      occupation: "",
      educationLevel: "",
      state: "",
      sampleSize: 25,
    });
    setOccupationSearch("");
  };

  if (isLoading) return null;

  return (
    <div className="absolute top-4 left-4 z-20 w-[300px]">
      {/* Toggle button */}
      <button
        onClick={() => setFilterPanelOpen(!filterPanelOpen)}
        className="flex items-center gap-2 px-4 py-2.5 mb-2 liquid-glass rounded-2xl text-white/70 hover:text-white/90 transition-colors w-full"
      >
        <SlidersHorizontal size={14} className="text-cyan-400/60" />
        <span className="font-display text-[11px] font-medium tracking-wider uppercase">
          Audience Filters
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-cyan-300/50 font-display">
            <Users size={10} />
            {filteredCount.toLocaleString()}
          </span>
          {filterPanelOpen ? <ChevronUp size={13} className="text-white/40" /> : <ChevronDown size={13} className="text-white/40" />}
        </span>
      </button>

      {filterPanelOpen && (
        <GlassPanel variant="glow" className="p-4 space-y-4">
          {/* Age Range */}
          <div>
            <label className="text-micro text-cyan-300/50 mb-2.5 block font-display">
              Age Range: {filters.ageRange[0]} — {filters.ageRange[1]}
            </label>
            <Slider
              min={0}
              max={106}
              step={1}
              value={filters.ageRange}
              onValueChange={(val) => setFilters({ ...filters, ageRange: val as [number, number] })}
              className="[&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-400/50 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:shadow-[0_0_8px_rgba(0,200,255,0.3)] [&_.relative>div:first-child]:bg-white/8 [&_.relative>div:first-child>div]:bg-cyan-400/60"
            />
          </div>

          {/* Sex */}
          <div>
            <label className="text-micro text-cyan-300/50 mb-2.5 block font-display">Sex</label>
            <div className="flex gap-1.5">
              {(["Any", "Male", "Female"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, sex: s })}
                  className={`flex-1 py-2 text-xs font-display rounded-xl transition-all ${
                    filters.sex === s
                      ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(0,200,255,0.1)]"
                      : "bg-white/4 text-white/40 border border-white/6 hover:bg-white/8 hover:text-white/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Occupation */}
          <div>
            <label className="text-micro text-cyan-300/50 mb-2.5 block font-display">Occupation</label>
            <input
              type="text"
              placeholder="Search occupations..."
              value={occupationSearch}
              onChange={(e) => setOccupationSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/4 border border-white/8 rounded-xl text-white/80 placeholder:text-white/25 focus:border-cyan-400/30 focus:outline-none focus:ring-1 focus:ring-cyan-400/15 mb-1.5 transition-all"
            />
            <select
              value={filters.occupation}
              onChange={(e) => setFilters({ ...filters, occupation: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/8 rounded-xl text-white/80 focus:border-cyan-400/30 focus:outline-none transition-all"
            >
              <option value="">All Occupations</option>
              {filteredOccupations.map((o) => (
                <option key={o} value={o}>{formatOcc(o)}</option>
              ))}
            </select>
          </div>

          {/* Education Level */}
          <div>
            <label className="text-micro text-cyan-300/50 mb-2.5 block font-display">Education</label>
            <select
              value={filters.educationLevel}
              onChange={(e) => setFilters({ ...filters, educationLevel: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/8 rounded-xl text-white/80 focus:border-cyan-400/30 focus:outline-none transition-all"
            >
              <option value="">All Levels</option>
              {filterMeta?.education_levels.map((e) => (
                <option key={e} value={e}>{EDUCATION_LABELS[e] || e}</option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="text-micro text-cyan-300/50 mb-2.5 block font-display">State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/8 rounded-xl text-white/80 focus:border-cyan-400/30 focus:outline-none transition-all"
            >
              <option value="">All States</option>
              {filterMeta?.states.map((s) => (
                <option key={s} value={s}>{STATE_NAMES[s] || s} ({s})</option>
              ))}
            </select>
          </div>

          {/* Sample Size */}
          <div>
            <label className="text-micro text-cyan-300/50 mb-2.5 block font-display">
              Sample Size: {filters.sampleSize}
            </label>
            <Slider
              min={5}
              max={100}
              step={5}
              value={[filters.sampleSize]}
              onValueChange={(val) => setFilters({ ...filters, sampleSize: val[0] })}
              className="[&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-400/50 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:shadow-[0_0_8px_rgba(0,200,255,0.3)] [&_.relative>div:first-child]:bg-white/8 [&_.relative>div:first-child>div]:bg-cyan-400/60"
            />
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-display text-white/35 hover:text-cyan-300/80 border border-white/6 hover:border-cyan-400/20 rounded-xl transition-all"
          >
            <RotateCcw size={12} />
            Reset Filters
          </button>
        </GlassPanel>
      )}
    </div>
  );
}
