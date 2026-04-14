/**
 * DESIGN: Liquid Glass — Top Status Bar
 * Centered top bar with app title, status indicators, and data source provenance
 */

import { useApp } from "@/contexts/AppContext";
import { STATE_NAMES } from "@/lib/types";
import { Database, MapPin, Sparkles, Shield } from "lucide-react";

export default function StatusBar() {
  const { personas, selectedState, isLoading } = useApp();

  if (isLoading) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
      <div className="liquid-glass rounded-2xl px-5 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" style={{ boxShadow: "0 0 8px rgba(0, 200, 255, 0.5)" }} />
            <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-30" />
          </div>
          <h1 className="font-display text-sm font-bold tracking-[0.12em] uppercase bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            What If USA
          </h1>
        </div>

        <div className="w-px h-5 bg-white/8" />

        <div className="flex items-center gap-3 text-[10px] font-display text-white/35 tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <Database size={10} className="text-cyan-400/40" />
            {personas.length.toLocaleString()} personas
          </span>
          {selectedState && (
            <>
              <div className="w-px h-3 bg-white/8" />
              <span className="flex items-center gap-1.5 text-cyan-300/80">
                <MapPin size={10} />
                {STATE_NAMES[selectedState] || selectedState}
              </span>
            </>
          )}
          <div className="w-px h-3 bg-white/8" />
          <span className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-emerald-400/60" />
            <span className="text-emerald-400/70">AI-Powered</span>
          </span>
          <div className="w-px h-3 bg-white/8" />
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-USA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-amber-400/50 hover:text-amber-400/80 transition-colors"
            title="Data sourced from NVIDIA Nemotron-Personas-USA dataset on Hugging Face"
          >
            <Shield size={10} />
            <span>NVIDIA Nemotron</span>
          </a>
        </div>
      </div>
    </div>
  );
}
