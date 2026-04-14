/**
 * DESIGN: Tactical Command Center — Question Input Bar
 * Bottom-center glass panel with text input, send button, and suggestion pills
 */

import { useApp } from "@/contexts/AppContext";
import { SUGGESTION_QUESTIONS } from "@/lib/types";
import { Send, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestionBar() {
  const { submitQuestion, isSimulating, isLoading } = useApp();
  const [input, setInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSimulating) return;
    submitQuestion(input.trim());
    setInput("");
  };

  const handleSuggestion = (q: string) => {
    setInput(q);
    submitQuestion(q);
  };

  if (isLoading) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-[720px]">
      {/* Suggestion pills */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-3"
        >
          {SUGGESTION_QUESTIONS.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              onClick={() => handleSuggestion(q)}
              disabled={isSimulating}
              className="px-3 py-1.5 text-[11px] font-medium bg-[#0A0E17]/80 backdrop-blur-md border border-[#00F0FF]/15 rounded-full text-[#00F0FF]/70 hover:text-[#00F0FF] hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/10 transition-all disabled:opacity-40 whitespace-nowrap"
            >
              {q}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Input bar */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="glass-panel hud-corners glow-cyan rounded-xl flex items-center gap-3 px-4 py-3"
      >
        <Zap size={16} className="text-[#00F0FF]/50 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What if USA..."
          disabled={isSimulating}
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none font-sans disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSimulating}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </motion.form>
    </div>
  );
}
