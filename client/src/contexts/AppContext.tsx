/**
 * DESIGN: Liquid Glass — Global State Management
 * Handles persona data, filters, LLM-powered simulation with progressive wave delivery,
 * query history, and UI state. Waves: first 10, then 20, then rest.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type {
  Persona, FilterMeta, Filters, PersonaResponse,
  SentimentSummary, QueryHistoryEntry,
} from "@/lib/types";
import {
  filterPersonas, samplePersonas,
  computeSentiment, analyzeSentimentByState,
} from "@/lib/simulation";
import { trpc } from "@/lib/trpc";

const DATA_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663249428057/7pgggnfjc7LYDVaKEjkhKS/personas_usa_4eb9bc28.json";
const META_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663249428057/7pgggnfjc7LYDVaKEjkhKS/filter_meta_27ef7c8b.json";

export type SimulationPhase = "idle" | "thinking" | "drafting" | "delivering";

interface WaveProgress {
  currentWave: number;
  totalWaves: number;
  completedPersonas: number;
  totalPersonas: number;
  waveSizes: number[];
}

interface StateSentiment {
  [state: string]: { positive: number; neutral: number; negative: number; total: number };
}

interface AppState {
  // Data
  personas: Persona[];
  filterMeta: FilterMeta | null;
  isLoading: boolean;
  dataError: string | null;

  // Filters
  filters: Filters;
  setFilters: (f: Filters) => void;

  // Map
  selectedState: string | null;
  setSelectedState: (s: string | null) => void;
  stateSentiment: StateSentiment;

  // Query
  currentQuestion: string;
  setCurrentQuestion: (q: string) => void;
  isSimulating: boolean;
  simulationPhase: SimulationPhase;
  waveProgress: WaveProgress | null;
  responses: PersonaResponse[];
  sentiment: SentimentSummary | null;
  submitQuestion: (question: string) => void;

  // History
  history: QueryHistoryEntry[];
  loadHistoryEntry: (id: string) => void;
  deleteHistoryEntry: (id: string) => void;

  // UI
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  historyPanelOpen: boolean;
  setHistoryPanelOpen: (open: boolean) => void;
  resultsPanelOpen: boolean;
  setResultsPanelOpen: (open: boolean) => void;

  // Filtered count
  filteredCount: number;
}

const defaultFilters: Filters = {
  ageRange: [18, 106],
  sex: "Any",
  occupation: "",
  educationLevel: "",
  state: "",
  sampleSize: 25,
};

const AppContext = createContext<AppState | null>(null);

const MAX_BACKEND_PERSONAS = 100;

/**
 * Compute wave sizes for progressive delivery.
 * Absolute steps: first 10, then 20, then the rest.
 * Matches the server-side computeWaves logic.
 */
function computeWaveSizes(total: number): number[] {
  if (total <= 10) return [total];
  const wave1 = 10;
  const remaining1 = total - wave1;
  if (remaining1 <= 0) return [total];
  const wave2 = Math.min(20, remaining1);
  const remaining2 = remaining1 - wave2;
  if (remaining2 <= 0) return [wave1, wave2];
  return [wave1, wave2, remaining2];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filterMeta, setFilterMeta] = useState<FilterMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateSentiment, setStateSentiment] = useState<StateSentiment>({});

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>("idle");
  const [waveProgress, setWaveProgress] = useState<WaveProgress | null>(null);
  const [responses, setResponses] = useState<PersonaResponse[]>([]);
  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);

  const [history, setHistory] = useState<QueryHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("whatifusa_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [resultsPanelOpen, setResultsPanelOpen] = useState(false);

  const personasRef = useRef<Persona[]>([]);

  // tRPC mutation for wave-based LLM generation
  const generateWaveMutation = trpc.simulation.generateWave.useMutation();

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [personasRes, metaRes] = await Promise.all([
          fetch(DATA_URL),
          fetch(META_URL),
        ]);
        if (!personasRes.ok || !metaRes.ok) throw new Error("Failed to fetch data");
        const [personasData, metaData] = await Promise.all([
          personasRes.json(),
          metaRes.json(),
        ]);
        if (!cancelled) {
          setPersonas(personasData);
          personasRef.current = personasData;
          setFilterMeta(metaData);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : "Unknown error");
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("whatifusa_history", JSON.stringify(history));
    } catch { /* ignore */ }
  }, [history]);

  // Compute filtered count
  const filteredCount = React.useMemo(() => {
    if (!personas.length) return 0;
    return filterPersonas(personas, filters).length;
  }, [personas, filters]);

  const submitQuestion = useCallback(async (question: string) => {
    if (!question.trim() || !personasRef.current.length || isSimulating) return;

    setIsSimulating(true);
    setSimulationPhase("thinking");
    setResultsPanelOpen(true);
    setHistoryPanelOpen(false);
    setCurrentQuestion(question);
    setResponses([]);
    setSentiment(null);
    setWaveProgress(null);

    try {
      // Phase 1: THINKING — filter and sample personas
      const activeFilters = { ...filters };
      if (selectedState) {
        activeFilters.state = selectedState;
      }

      const filtered = filterPersonas(personasRef.current, activeFilters);
      const effectiveSampleSize = Math.min(activeFilters.sampleSize, MAX_BACKEND_PERSONAS);
      const sampled = samplePersonas(filtered, effectiveSampleSize);

      // Prepare personas for the API
      const apiPersonas = sampled.map((p) => ({
        id: p.uuid || String(p.id),
        age: p.age,
        sex: p.sex,
        city: p.city,
        state: p.state,
        zipcode: p.zipcode,
        occupation: p.occupation,
        education_level: p.education_level,
        marital_status: p.marital_status,
        persona: p.persona,
        professional_persona: p.professional_persona,
        cultural_background: p.cultural_background || undefined,
        hobbies_and_interests_list: p.hobbies_and_interests_list || undefined,
        career_goals_and_ambitions: p.career_goals_and_ambitions || undefined,
      }));

      // Compute wave sizes
      const waveSizes = computeWaveSizes(apiPersonas.length);
      const totalWaves = waveSizes.length;

      setWaveProgress({
        currentWave: 0,
        totalWaves,
        completedPersonas: 0,
        totalPersonas: apiPersonas.length,
        waveSizes,
      });

      // Phase 2: DRAFTING — send waves sequentially to LLM
      await new Promise((r) => setTimeout(r, 400));
      setSimulationPhase("drafting");

      const allResponses: PersonaResponse[] = [];
      let personaOffset = 0;

      for (let waveIdx = 0; waveIdx < totalWaves; waveIdx++) {
        const waveSize = waveSizes[waveIdx];
        const wavePersonas = apiPersonas.slice(personaOffset, personaOffset + waveSize);
        const waveSampled = sampled.slice(personaOffset, personaOffset + waveSize);

        setWaveProgress({
          currentWave: waveIdx + 1,
          totalWaves,
          completedPersonas: personaOffset,
          totalPersonas: apiPersonas.length,
          waveSizes,
        });

        // Call the API for this wave
        const result = await generateWaveMutation.mutateAsync({
          question,
          personas: wavePersonas,
          waveIndex: waveIdx,
          totalWaves,
        });

        // Phase 3: DELIVERING — switch to delivering after first wave completes
        if (waveIdx === 0) {
          setSimulationPhase("delivering");
        }

        // Map LLM results back to full persona objects
        const waveResponses: PersonaResponse[] = waveSampled.map((persona) => {
          const llmResult = result.results.find(
            (r) => r.personaId === (persona.uuid || String(persona.id))
          );
          return {
            persona,
            answer: llmResult?.answer || "I'd need more time to consider this question.",
            sentiment: llmResult?.sentiment || "neutral",
          };
        });

        // Incrementally add wave results with stagger animation
        const STAGGER_MS = 60;
        for (let i = 0; i < waveResponses.length; i++) {
          await new Promise((r) => setTimeout(r, STAGGER_MS));
          allResponses.push(waveResponses[i]);
          setResponses([...allResponses]);
          setSentiment(computeSentiment(allResponses));
        }

        // Update wave progress
        personaOffset += waveSize;
        setWaveProgress({
          currentWave: waveIdx + 1,
          totalWaves,
          completedPersonas: personaOffset,
          totalPersonas: apiPersonas.length,
          waveSizes,
        });

        // Update state sentiment after each wave
        setStateSentiment(analyzeSentimentByState(allResponses));
      }

      // Final state
      const sentimentData = computeSentiment(allResponses);
      setResponses(allResponses);
      setSentiment(sentimentData);
      setStateSentiment(analyzeSentimentByState(allResponses));

      // Add to history
      const entry: QueryHistoryEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        question,
        timestamp: Date.now(),
        responses: allResponses,
        sentiment: sentimentData,
        filters: activeFilters,
        selectedState,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 50));
    } catch (err) {
      console.error("[Simulation] Error:", err);
      setResponses([]);
      setSentiment({ positive: 0, neutral: 0, negative: 0, total: 0 });
    } finally {
      setIsSimulating(false);
      setSimulationPhase("idle");
      setWaveProgress(null);
    }
  }, [filters, selectedState, isSimulating]);

  const loadHistoryEntry = useCallback((id: string) => {
    const entry = history.find((h) => h.id === id);
    if (!entry) return;
    setCurrentQuestion(entry.question);
    setResponses(entry.responses);
    setSentiment(entry.sentiment);
    setResultsPanelOpen(true);
    setHistoryPanelOpen(false);

    if (entry.responses.length) {
      setStateSentiment(analyzeSentimentByState(entry.responses));
    }
  }, [history]);

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        personas, filterMeta, isLoading, dataError,
        filters, setFilters,
        selectedState, setSelectedState, stateSentiment,
        currentQuestion, setCurrentQuestion,
        isSimulating, simulationPhase, waveProgress, responses, sentiment,
        submitQuestion,
        history, loadHistoryEntry, deleteHistoryEntry,
        filterPanelOpen, setFilterPanelOpen,
        historyPanelOpen, setHistoryPanelOpen,
        resultsPanelOpen, setResultsPanelOpen,
        filteredCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
