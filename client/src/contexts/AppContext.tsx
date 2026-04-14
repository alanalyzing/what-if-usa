/**
 * DESIGN: Tactical Command Center — Military-Grade Data Ops
 * Global state: personas data, filters, query results, history
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type {
  Persona, FilterMeta, Filters, PersonaResponse,
  SentimentSummary, QueryHistoryEntry,
} from "@/lib/types";
import {
  filterPersonas, samplePersonas, simulateResponses,
  computeSentiment, analyzeSentimentByState,
} from "@/lib/simulation";

const DATA_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663249428057/7pgggnfjc7LYDVaKEjkhKS/personas_usa_4eb9bc28.json";
const META_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663249428057/7pgggnfjc7LYDVaKEjkhKS/filter_meta_27ef7c8b.json";

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

  const submitQuestion = useCallback((question: string) => {
    if (!question.trim() || !personasRef.current.length) return;

    setIsSimulating(true);
    setResultsPanelOpen(true);
    setHistoryPanelOpen(false);
    setCurrentQuestion(question);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const activeFilters = { ...filters };
      if (selectedState) {
        activeFilters.state = selectedState;
      }

      const filtered = filterPersonas(personasRef.current, activeFilters);
      const sampled = samplePersonas(filtered, activeFilters.sampleSize);
      const responseList = simulateResponses(sampled, question);
      const sentimentData = computeSentiment(responseList);

      // Compute full state sentiment (use all filtered personas, not just sample)
      const allFiltered = filterPersonas(personasRef.current, { ...filters, state: "" });
      const allResponses = simulateResponses(allFiltered, question);
      const stSentiment = analyzeSentimentByState(allResponses);

      setResponses(responseList);
      setSentiment(sentimentData);
      setStateSentiment(stSentiment);
      setIsSimulating(false);

      // Add to history
      const entry: QueryHistoryEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        question,
        timestamp: Date.now(),
        responses: responseList,
        sentiment: sentimentData,
        filters: activeFilters,
        selectedState,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 50));
    }, 100);
  }, [filters, selectedState]);

  const loadHistoryEntry = useCallback((id: string) => {
    const entry = history.find((h) => h.id === id);
    if (!entry) return;
    setCurrentQuestion(entry.question);
    setResponses(entry.responses);
    setSentiment(entry.sentiment);
    setResultsPanelOpen(true);
    setHistoryPanelOpen(false);

    // Recompute state sentiment
    if (personasRef.current.length) {
      const allFiltered = filterPersonas(personasRef.current, { ...entry.filters, state: "" });
      const allResponses = simulateResponses(allFiltered, entry.question);
      setStateSentiment(analyzeSentimentByState(allResponses));
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
        isSimulating, responses, sentiment,
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
