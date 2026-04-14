/**
 * DESIGN: Tactical Command Center — Query History Panel
 * Top-right slide-out panel showing past queries with sentiment bars and timestamps
 */

import { useApp } from "@/contexts/AppContext";
import GlassPanel from "./GlassPanel";
import { Clock, Trash2, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function QueryHistory() {
  const {
    historyPanelOpen, setHistoryPanelOpen,
    history, loadHistoryEntry, deleteHistoryEntry,
    isLoading,
  } = useApp();

  if (isLoading) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setHistoryPanelOpen(!historyPanelOpen)}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 glass-panel rounded-lg hud-corners text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors"
      >
        <Clock size={14} />
        <span className="font-display text-xs font-semibold tracking-wider uppercase">
          History
        </span>
        {history.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-display bg-[#00F0FF]/15 rounded-full">
            {history.length}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {historyPanelOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute top-4 right-4 bottom-20 z-30 w-[360px]"
          >
            <GlassPanel className="flex flex-col h-full" glow>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#00F0FF]" />
                  <span className="font-display text-xs font-semibold text-[#00F0FF] tracking-wider uppercase">
                    Query History
                  </span>
                </div>
                <button
                  onClick={() => setHistoryPanelOpen(false)}
                  className="p-1 text-white/40 hover:text-white/80 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Entries */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <Clock size={24} className="text-white/15" />
                    <p className="text-xs text-white/30">No queries yet</p>
                  </div>
                ) : (
                  history.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group p-3 border border-white/5 rounded-lg hover:border-[#00F0FF]/20 hover:bg-[#00F0FF]/3 transition-all cursor-pointer"
                      onClick={() => loadHistoryEntry(entry.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[12px] text-white/80 leading-snug line-clamp-2 flex-1">
                          "{entry.question}"
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryEntry(entry.id);
                          }}
                          className="p-1 text-white/20 hover:text-[#FF3B5C] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Mini sentiment bars */}
                      <div className="flex gap-1 h-1.5 rounded-full overflow-hidden mb-2">
                        {entry.sentiment.total > 0 && (
                          <>
                            <div
                              className="rounded-full"
                              style={{
                                width: `${(entry.sentiment.positive / entry.sentiment.total) * 100}%`,
                                backgroundColor: "#00FF88",
                              }}
                            />
                            <div
                              className="rounded-full"
                              style={{
                                width: `${(entry.sentiment.neutral / entry.sentiment.total) * 100}%`,
                                backgroundColor: "#FFB800",
                              }}
                            />
                            <div
                              className="rounded-full"
                              style={{
                                width: `${(entry.sentiment.negative / entry.sentiment.total) * 100}%`,
                                backgroundColor: "#FF3B5C",
                              }}
                            />
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 font-display">
                          {entry.sentiment.total} responses
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-white/25">{timeAgo(entry.timestamp)}</span>
                          <ChevronRight size={10} className="text-[#00F0FF]/30 group-hover:text-[#00F0FF]/60 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
