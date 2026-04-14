/**
 * DESIGN: Liquid Glass — Client-side Simulation Utilities
 * Filter, sample, and compute sentiment from persona responses
 * (Actual response generation is now handled server-side via LLM)
 */

import type { Persona, Filters, PersonaResponse, SentimentSummary } from "./types";

export function filterPersonas(personas: Persona[], filters: Filters): Persona[] {
  return personas.filter((p) => {
    if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) return false;
    if (filters.sex !== "Any" && p.sex !== filters.sex) return false;
    if (filters.occupation && p.occupation !== filters.occupation) return false;
    if (filters.educationLevel && p.education_level !== filters.educationLevel) return false;
    if (filters.state && p.state !== filters.state) return false;
    return true;
  });
}

export function samplePersonas(personas: Persona[], count: number): Persona[] {
  const shuffled = [...personas].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function computeSentiment(responses: PersonaResponse[]): SentimentSummary {
  const summary: SentimentSummary = { positive: 0, neutral: 0, negative: 0, total: responses.length };
  for (const r of responses) {
    summary[r.sentiment]++;
  }
  return summary;
}

export function analyzeSentimentByState(responses: PersonaResponse[]): Record<string, { positive: number; neutral: number; negative: number; total: number }> {
  const byState: Record<string, { positive: number; neutral: number; negative: number; total: number }> = {};
  for (const r of responses) {
    const st = r.persona.state;
    if (!byState[st]) byState[st] = { positive: 0, neutral: 0, negative: 0, total: 0 };
    byState[st][r.sentiment]++;
    byState[st].total++;
  }
  return byState;
}
