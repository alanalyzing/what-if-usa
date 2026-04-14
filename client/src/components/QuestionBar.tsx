/**
 * DESIGN: Liquid Glass — Question Input Bar
 * Bottom-center glass panel with text input, send button, and suggestion pills
 */

import { useApp } from "@/contexts/AppContext";
import { SUGGESTION_QUESTIONS } from "@/lib/types";
import { Send, Loader2, Sparkles } from "lucide-react";
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-3"
        >
          {SUGGESTION_QUESTIONS.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
              onClick={() => handleSuggestion(q)}
              disabled={isSimulating}
              className="liquid-pill px-3.5 py-1.5 text-[11px] font-medium text-white/50 hover:text-cyan-300/90 disabled:opacity-30 whitespace-nowrap"
            >
              {q}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Input bar */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="liquid-glass-glow rounded-2xl flex items-center gap-3 px-5 py-3.5"
      >
        <Sparkles size={16} className="text-cyan-400/40 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything... What if USA..."
          disabled={isSimulating}
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 focus:outline-none font-sans disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSimulating}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-cyan-400/12 border border-cyan-400/20 text-cyan-400/80 hover:bg-cyan-400/20 hover:text-cyan-300 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </motion.form>
    </div>
  );
}
