/**
 * DESIGN: Tactical Command Center — Results & Sentiment Panel
 * Right-side slide-out panel with sentiment summary and persona response cards
 */

import { useApp } from "@/contexts/AppContext";
import GlassPanel from "./GlassPanel";
import PersonaCard from "./PersonaCard";
import { X, BarChart3, Users, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SentimentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-display uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="font-display text-white/60">{count} <span className="text-white/30">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ResultsPanel() {
  const {
    resultsPanelOpen, setResultsPanelOpen,
    responses, sentiment, currentQuestion, isSimulating,
    selectedState, setSelectedState,
  } = useApp();

  if (!resultsPanelOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-4 right-4 bottom-20 z-20 w-[400px] flex flex-col"
      >
        <GlassPanel className="flex flex-col h-full" glow>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-[#00F0FF]" />
              <span className="font-display text-xs font-semibold text-[#00F0FF] tracking-wider uppercase">
                Analysis Results
              </span>
            </div>
            <button
              onClick={() => setResultsPanelOpen(false)}
              className="p-1 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {isSimulating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-2 border-[#00F0FF]/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-xs font-display text-[#00F0FF]/60 tracking-wider uppercase">
                  Simulating Responses...
                </p>
              </div>
            ) : (
              <>
                {/* Question */}
                {currentQuestion && (
                  <div className="p-3 bg-[#00F0FF]/5 border border-[#00F0FF]/15 rounded-lg">
                    <p className="text-micro text-[#00F0FF]/50 mb-1 font-display">Query</p>
                    <p className="text-sm text-white/90 leading-relaxed">"{currentQuestion}"</p>
                  </div>
                )}

                {/* State filter indicator */}
                {selectedState && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#00F0FF]/5 border border-[#00F0FF]/15 rounded-lg">
                    <span className="text-micro text-[#00F0FF]/50 font-display">Filtered by</span>
                    <span className="text-xs font-display text-[#00F0FF]">{selectedState}</span>
                    <button
                      onClick={() => setSelectedState(null)}
                      className="ml-auto text-white/40 hover:text-white/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Sentiment Summary */}
                {sentiment && sentiment.total > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-[#00F0FF]/50" />
                      <span className="text-micro text-[#00F0FF]/50 font-display">Sentiment Analysis</span>
                    </div>
                    <SentimentBar label="Positive" count={sentiment.positive} total={sentiment.total} color="#00FF88" />
                    <SentimentBar label="Neutral" count={sentiment.neutral} total={sentiment.total} color="#FFB800" />
                    <SentimentBar label="Negative" count={sentiment.negative} total={sentiment.total} color="#FF3B5C" />
                    <div className="flex items-center gap-2 pt-1">
                      <Users size={12} className="text-white/30" />
                      <span className="text-[11px] text-white/40 font-display">{sentiment.total} respondents</span>
                    </div>
                  </div>
                )}

                {/* Response Cards */}
                {responses.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-micro text-[#00F0FF]/50 font-display block">
                      Individual Responses ({responses.length})
                    </span>
                    {responses.map((r, i) => (
                      <PersonaCard key={r.persona.id} response={r} index={i} />
                    ))}
                  </div>
                )}

                {responses.length === 0 && !isSimulating && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full border border-[#00F0FF]/20 flex items-center justify-center">
                      <MessageSquare size={20} className="text-[#00F0FF]/30" />
                    </div>
                    <p className="text-xs text-white/30">No responses yet. Ask a question below.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  );
}
