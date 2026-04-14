/**
 * DESIGN: Liquid Glass — Results & Sentiment Panel
 * Right-side slide-out panel with wave progress, sentiment summary, data source annotations,
 * analytics charts, and persona response cards. Supports progressive wave delivery.
 */

import { useApp } from "@/contexts/AppContext";
import GlassPanel from "./GlassPanel";
import PersonaCard from "./PersonaCard";
import AnalyticsCharts from "./AnalyticsCharts";
import { X, BarChart3, Users, MessageSquare, Brain, PenLine, Send as SendIcon, ExternalLink, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SentimentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-display uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="font-display text-white/50">{count} <span className="text-white/25">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
        />
      </div>
    </div>
  );
}

function PhaseIndicator({ phase, label, icon: Icon, isActive, isDone, detail }: {
  phase: number; label: string; icon: any; isActive: boolean; isDone: boolean; detail?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all ${
      isActive ? "bg-cyan-400/8 border border-cyan-400/15" :
      isDone ? "bg-emerald-400/5 border border-emerald-400/10" :
      "bg-white/2 border border-white/4"
    }`}>
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
        isActive ? "bg-cyan-400/15 text-cyan-400 phase-active" :
        isDone ? "bg-emerald-400/15 text-emerald-400" :
        "bg-white/5 text-white/20"
      }`}>
        <Icon size={13} />
      </div>
      <div className="flex-1">
        <div className={`text-[10px] font-display tracking-wider uppercase ${
          isActive ? "text-cyan-300/80" :
          isDone ? "text-emerald-300/60" :
          "text-white/25"
        }`}>
          Phase {phase}
        </div>
        <div className={`text-[11px] font-medium ${
          isActive ? "text-white/80" :
          isDone ? "text-white/50" :
          "text-white/20"
        }`}>
          {label}
        </div>
        {detail && isActive && (
          <div className="text-[9px] text-cyan-400/50 font-display mt-0.5">{detail}</div>
        )}
      </div>
      {isDone && (
        <span className="text-[9px] font-display text-emerald-400/60 tracking-wider uppercase">Done</span>
      )}
      {isActive && (
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-40" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400/60" />
        </span>
      )}
    </div>
  );
}

function WaveProgressBar({ waveProgress }: { waveProgress: { currentWave: number; totalWaves: number; completedPersonas: number; totalPersonas: number; waveSizes: number[] } }) {
  const pct = waveProgress.totalPersonas > 0
    ? (waveProgress.completedPersonas / waveProgress.totalPersonas) * 100
    : 0;

  return (
    <div className="space-y-2 p-3 bg-cyan-400/4 border border-cyan-400/10 rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display text-cyan-300/60 tracking-wider uppercase">
          Wave {waveProgress.currentWave} of {waveProgress.totalWaves}
        </span>
        <span className="text-[10px] font-display text-white/40">
          {waveProgress.completedPersonas}/{waveProgress.totalPersonas} respondents
        </span>
      </div>
      {/* Overall progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-400/60 to-blue-400/60"
          style={{ boxShadow: "0 0 8px rgba(34, 211, 238, 0.3)" }}
        />
      </div>
      {/* Wave segments */}
      <div className="flex gap-1">
        {waveProgress.waveSizes.map((size, i) => {
          const isCompleted = i < waveProgress.currentWave;
          const isCurrent = i === waveProgress.currentWave - 1;
          return (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                isCompleted ? "bg-emerald-400/50" :
                isCurrent ? "bg-cyan-400/40 animate-pulse" :
                "bg-white/5"
              }`}
              title={`Wave ${i + 1}: ${size} personas`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[9px] text-white/25 font-display">
        {waveProgress.waveSizes.map((size, i) => (
          <span key={i} className={
            i < waveProgress.currentWave ? "text-emerald-400/50" :
            i === waveProgress.currentWave - 1 ? "text-cyan-400/50" :
            ""
          }>
            W{i + 1}: {size}
          </span>
        ))}
      </div>
    </div>
  );
}

function DataSourceBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-400/4 border border-emerald-400/10 rounded-xl">
      <Shield size={12} className="text-emerald-400/50" />
      <div className="flex-1">
        <div className="text-[10px] font-display text-emerald-300/60 tracking-wider uppercase">Data Source</div>
        <div className="text-[10px] text-white/50">
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-USA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300/70 hover:text-emerald-300/90 transition-colors inline-flex items-center gap-1"
          >
            NVIDIA Nemotron-Personas-USA
            <ExternalLink size={8} />
          </a>
        </div>
      </div>
      <div className="text-[9px] text-white/20 font-display text-right">
        <div>3,120 personas</div>
        <div>52 states</div>
      </div>
    </div>
  );
}

export default function ResultsPanel() {
  const {
    resultsPanelOpen, setResultsPanelOpen,
    responses, sentiment, currentQuestion, isSimulating,
    selectedState, setSelectedState, simulationPhase,
    waveProgress,
  } = useApp();

  if (!resultsPanelOpen) return null;

  const isDelivering = simulationPhase === "delivering";
  const isWaiting = isSimulating && (simulationPhase === "thinking" || simulationPhase === "drafting");
  const hasResults = responses.length > 0;

  // Compute wave detail strings for phase indicators
  const draftDetail = waveProgress
    ? `Wave ${waveProgress.currentWave}/${waveProgress.totalWaves} — ${waveProgress.completedPersonas}/${waveProgress.totalPersonas}`
    : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute top-4 right-4 bottom-20 z-20 w-[420px] flex flex-col"
      >
        <GlassPanel variant="glow" className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-cyan-400/70" />
              <span className="font-display text-[11px] font-semibold text-cyan-300/80 tracking-wider uppercase">
                Analysis Results
              </span>
              {hasResults && (
                <span className="text-[9px] font-display text-white/25 ml-1">
                  ({responses.length} responses)
                </span>
              )}
            </div>
            <button
              onClick={() => setResultsPanelOpen(false)}
              className="p-1.5 text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Phase indicators — show during thinking/drafting */}
            {(isWaiting || isDelivering) && (
              <div className="space-y-3">
                <PhaseIndicator
                  phase={1}
                  label="Thinking"
                  icon={Brain}
                  isActive={simulationPhase === "thinking"}
                  isDone={simulationPhase !== "thinking"}
                />
                <PhaseIndicator
                  phase={2}
                  label="Drafting Responses"
                  icon={PenLine}
                  isActive={simulationPhase === "drafting"}
                  isDone={simulationPhase === "delivering"}
                  detail={draftDetail}
                />
                <PhaseIndicator
                  phase={3}
                  label="Delivering Results"
                  icon={SendIcon}
                  isActive={simulationPhase === "delivering"}
                  isDone={false}
                  detail={isDelivering && waveProgress ? `${waveProgress.completedPersonas}/${waveProgress.totalPersonas} complete` : undefined}
                />

                {/* Wave progress bar */}
                {waveProgress && (simulationPhase === "drafting" || simulationPhase === "delivering") && (
                  <WaveProgressBar waveProgress={waveProgress} />
                )}

                {/* Shimmer loading cards — only during waiting */}
                {isWaiting && (
                  <div className="space-y-2 pt-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="shimmer rounded-xl h-20 border border-white/4" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* During delivering or after completion — show results incrementally */}
            {(isDelivering || (!isSimulating && hasResults)) && (
              <>
                {/* Question */}
                {currentQuestion && (
                  <div className="p-3.5 bg-cyan-400/4 border border-cyan-400/10 rounded-xl">
                    <p className="text-micro text-cyan-300/40 mb-1.5 font-display">Query</p>
                    <p className="text-sm text-white/85 leading-relaxed">"{currentQuestion}"</p>
                  </div>
                )}

                {/* Data Source Badge */}
                <DataSourceBadge />

                {/* State filter indicator */}
                {selectedState && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-400/4 border border-cyan-400/10 rounded-xl">
                    <span className="text-micro text-cyan-300/40 font-display">Filtered by</span>
                    <span className="text-xs font-display text-cyan-300/80">{selectedState}</span>
                    <button
                      onClick={() => setSelectedState(null)}
                      className="ml-auto text-white/30 hover:text-white/70 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Sentiment Summary — updates progressively */}
                {sentiment && sentiment.total > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-cyan-400/40" />
                      <span className="text-micro text-cyan-300/40 font-display">Sentiment Analysis</span>
                      {isDelivering && (
                        <span className="ml-auto text-[9px] text-cyan-400/40 font-display animate-pulse">
                          Streaming...
                        </span>
                      )}
                    </div>
                    <SentimentBar label="Positive" count={sentiment.positive} total={sentiment.total} color="#34D399" />
                    <SentimentBar label="Neutral" count={sentiment.neutral} total={sentiment.total} color="#FBBF24" />
                    <SentimentBar label="Negative" count={sentiment.negative} total={sentiment.total} color="#F87171" />
                    <div className="flex items-center gap-2 pt-1">
                      <Users size={12} className="text-white/20" />
                      <span className="text-[11px] text-white/30 font-display">
                        {sentiment.total} respondent{sentiment.total !== 1 ? "s" : ""}
                        {waveProgress && isSimulating && ` of ${waveProgress.totalPersonas}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Analytics Charts — show after results are available */}
                {responses.length >= 5 && !isSimulating && (
                  <AnalyticsCharts responses={responses} />
                )}

                {/* Response Cards — appear incrementally */}
                {responses.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-micro text-cyan-300/40 font-display block">
                      Individual Responses ({responses.length})
                    </span>
                    {responses.map((r, i) => (
                      <motion.div
                        key={r.persona.id || i}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <PersonaCard response={r} index={i} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {responses.length === 0 && !isSimulating && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl liquid-glass-subtle flex items-center justify-center">
                  <MessageSquare size={22} className="text-cyan-400/25" />
                </div>
                <p className="text-xs text-white/25">No responses yet. Ask a question below.</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  );
}
