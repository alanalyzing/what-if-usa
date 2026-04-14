/**
 * DESIGN: Tactical Command Center — Audience Filter Panel
 * Top-left collapsible glass panel with age slider, sex, occupation, education, state, sample size
 */

import { useApp } from "@/contexts/AppContext";
import GlassPanel from "./GlassPanel";
import { STATE_NAMES, EDUCATION_LABELS } from "@/lib/types";
import { ChevronDown, ChevronUp, Filter, Users, RotateCcw } from "lucide-react";
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
    <div className="absolute top-4 left-4 z-20 w-[320px]">
      {/* Toggle button */}
      <button
        onClick={() => setFilterPanelOpen(!filterPanelOpen)}
        className="flex items-center gap-2 px-3 py-2 mb-2 glass-panel rounded-lg hud-corners text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors w-full"
      >
        <Filter size={14} />
        <span className="font-display text-xs font-semibold tracking-wider uppercase">
          Audience Filters
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-[#00F0FF]/60">
            <Users size={10} />
            {filteredCount.toLocaleString()}
          </span>
          {filterPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {filterPanelOpen && (
        <GlassPanel className="p-4 space-y-4" glow>
          {/* Age Range */}
          <div>
            <label className="text-micro text-[#00F0FF]/70 mb-2 block font-display">
              Age Range: {filters.ageRange[0]} — {filters.ageRange[1]}
            </label>
            <Slider
              min={0}
              max={106}
              step={1}
              value={filters.ageRange}
              onValueChange={(val) => setFilters({ ...filters, ageRange: val as [number, number] })}
              className="[&_[role=slider]]:bg-[#00F0FF] [&_[role=slider]]:border-[#00F0FF]/50 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_.relative>div:first-child]:bg-[#00F0FF]/20 [&_.relative>div:first-child>div]:bg-[#00F0FF]"
            />
          </div>

          {/* Sex */}
          <div>
            <label className="text-micro text-[#00F0FF]/70 mb-2 block font-display">Sex</label>
            <div className="flex gap-1">
              {(["Any", "Male", "Female"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, sex: s })}
                  className={`flex-1 py-1.5 text-xs font-display rounded transition-all ${
                    filters.sex === s
                      ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
                      : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Occupation */}
          <div>
            <label className="text-micro text-[#00F0FF]/70 mb-2 block font-display">Occupation</label>
            <input
              type="text"
              placeholder="Search occupations..."
              value={occupationSearch}
              onChange={(e) => setOccupationSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded text-white/80 placeholder:text-white/30 focus:border-[#00F0FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/20 mb-1"
            />
            <select
              value={filters.occupation}
              onChange={(e) => setFilters({ ...filters, occupation: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#0A0E17] border border-white/10 rounded text-white/80 focus:border-[#00F0FF]/40 focus:outline-none"
            >
              <option value="">All Occupations</option>
              {filteredOccupations.map((o) => (
                <option key={o} value={o}>{formatOcc(o)}</option>
              ))}
            </select>
          </div>

          {/* Education Level */}
          <div>
            <label className="text-micro text-[#00F0FF]/70 mb-2 block font-display">Education</label>
            <select
              value={filters.educationLevel}
              onChange={(e) => setFilters({ ...filters, educationLevel: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#0A0E17] border border-white/10 rounded text-white/80 focus:border-[#00F0FF]/40 focus:outline-none"
            >
              <option value="">All Levels</option>
              {filterMeta?.education_levels.map((e) => (
                <option key={e} value={e}>{EDUCATION_LABELS[e] || e}</option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="text-micro text-[#00F0FF]/70 mb-2 block font-display">State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#0A0E17] border border-white/10 rounded text-white/80 focus:border-[#00F0FF]/40 focus:outline-none"
            >
              <option value="">All States</option>
              {filterMeta?.states.map((s) => (
                <option key={s} value={s}>{STATE_NAMES[s] || s} ({s})</option>
              ))}
            </select>
          </div>

          {/* Sample Size */}
          <div>
            <label className="text-micro text-[#00F0FF]/70 mb-2 block font-display">
              Sample Size: {filters.sampleSize}
            </label>
            <Slider
              min={5}
              max={100}
              step={5}
              value={[filters.sampleSize]}
              onValueChange={(val) => setFilters({ ...filters, sampleSize: val[0] })}
              className="[&_[role=slider]]:bg-[#00F0FF] [&_[role=slider]]:border-[#00F0FF]/50 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_.relative>div:first-child]:bg-[#00F0FF]/20 [&_.relative>div:first-child>div]:bg-[#00F0FF]"
            />
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-display text-white/50 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF]/30 rounded transition-all"
          >
            <RotateCcw size={12} />
            Reset Filters
          </button>
        </GlassPanel>
      )}
    </div>
  );
}
