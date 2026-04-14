/**
 * Shared types for the persona simulation API
 * Used by both server (tRPC route) and client (mutation calls)
 */

export interface SimulationPersona {
  id: string;
  age: number;
  sex: string;
  city: string;
  state: string;
  zipcode: string;
  occupation: string;
  education_level: string;
  marital_status: string;
  persona: string;
  professional_persona: string;
  cultural_background?: string;
  hobbies_and_interests_list?: string[];
  career_goals_and_ambitions?: string;
}

export interface SimulationRequest {
  question: string;
  personas: SimulationPersona[];
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface PersonaResult {
  personaId: string;
  answer: string;
  sentiment: Sentiment;
}

export interface SimulationResponse {
  results: PersonaResult[];
}
