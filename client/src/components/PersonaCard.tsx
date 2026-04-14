/**
 * DESIGN: Liquid Glass — Persona Response Card
 * Expandable card showing demographic info, AI-generated answer, and rich persona details
 */

import type { PersonaResponse } from "@/lib/types";
import { STATE_NAMES, EDUCATION_LABELS } from "@/lib/types";
import { ChevronDown, ChevronUp, MapPin, Briefcase, GraduationCap, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SENTIMENT_COLORS = {
  positive: "#34D399",
  neutral: "#FBBF24",
  negative: "#F87171",
};

const SENTIMENT_LABELS = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

function formatOcc(occ: string) {
  return occ.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PersonaCard({ response, index }: { response: PersonaResponse; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { persona, answer, sentiment } = response;
  const color = SENTIMENT_COLORS[sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="liquid-glass-subtle rounded-xl overflow-hidden transition-all"
      style={{ borderColor: `${color}15` }}
    >
      {/* Main content */}
      <div className="p-3.5 space-y-2.5">
        {/* Demographics row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
            />
            <span className="text-[10px] font-display font-medium tracking-wider" style={{ color }}>
              {SENTIMENT_LABELS[sentiment]}
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/35">
            <User size={10} />
            <span className="text-[10px]">{persona.sex}, {persona.age}</span>
          </div>
          <div className="flex items-center gap-1 text-white/35">
            <Briefcase size={10} />
            <span className="text-[10px] truncate max-w-[120px]">{formatOcc(persona.occupation)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/35">
            <MapPin size={10} />
            <span className="text-[10px]">{persona.city}, {persona.state}</span>
          </div>
        </div>

        {/* Answer */}
        <p className="text-[13px] text-white/75 leading-relaxed">{answer}</p>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] font-display text-cyan-400/40 hover:text-cyan-300/80 transition-colors tracking-wider uppercase"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Collapse" : "View Full Profile"}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3 border-t border-white/5 pt-3">
              <DetailSection icon={<User size={11} />} label="Persona" text={persona.persona} />
              <DetailSection icon={<Briefcase size={11} />} label="Professional" text={persona.professional_persona} />

              <div className="grid grid-cols-2 gap-2">
                <DetailChip label="Education" value={EDUCATION_LABELS[persona.education_level] || persona.education_level} />
                <DetailChip label="Marital Status" value={persona.marital_status.replace(/_/g, " ")} />
                <DetailChip label="State" value={STATE_NAMES[persona.state] || persona.state} />
                <DetailChip label="Zipcode" value={persona.zipcode} />
              </div>

              {persona.cultural_background && (
                <DetailSection icon={<GraduationCap size={11} />} label="Cultural Background" text={persona.cultural_background} />
              )}

              {persona.hobbies_and_interests_list && Array.isArray(persona.hobbies_and_interests_list) && (
                <div>
                  <span className="text-[10px] font-display text-cyan-300/40 tracking-wider uppercase block mb-1.5">
                    Hobbies & Interests
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {persona.hobbies_and_interests_list.slice(0, 8).map((h, i) => (
                      <span key={i} className="liquid-pill px-2 py-0.5 text-[10px] text-cyan-300/60">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {persona.career_goals_and_ambitions && (
                <DetailSection icon={<Briefcase size={11} />} label="Career Goals" text={persona.career_goals_and_ambitions} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailSection({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-cyan-400/30">{icon}</span>
        <span className="text-[10px] font-display text-cyan-300/40 tracking-wider uppercase">{label}</span>
      </div>
      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-4">{text}</p>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2.5 py-2 bg-white/3 rounded-lg border border-white/4">
      <span className="text-[9px] font-display text-white/25 tracking-wider uppercase block">{label}</span>
      <span className="text-[11px] text-white/60 capitalize">{value}</span>
    </div>
  );
}
