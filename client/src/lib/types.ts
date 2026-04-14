/**
 * DESIGN: Tactical Command Center — Military-Grade Data Ops
 * Colors: Base #0A0E17, Accent #00F0FF, Green #00FF88, Amber #FFB800, Red #FF3B5C
 * Typography: JetBrains Mono (headers/data) + Inter (body)
 */

export interface Persona {
  id: number;
  uuid: string;
  professional_persona: string;
  sports_persona: string;
  arts_persona: string;
  travel_persona: string;
  culinary_persona: string;
  persona: string;
  cultural_background: string;
  skills_and_expertise: string;
  skills_and_expertise_list: string[];
  hobbies_and_interests: string;
  hobbies_and_interests_list: string[];
  career_goals_and_ambitions: string;
  sex: "Male" | "Female";
  age: number;
  marital_status: string;
  education_level: string;
  bachelors_field: string;
  occupation: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface FilterMeta {
  occupations: string[];
  education_levels: string[];
  states: string[];
  total_personas: number;
  age_range: [number, number];
}

export interface Filters {
  ageRange: [number, number];
  sex: "Male" | "Female" | "Any";
  occupation: string;
  educationLevel: string;
  state: string;
  sampleSize: number;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface PersonaResponse {
  persona: Persona;
  answer: string;
  sentiment: Sentiment;
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface QueryHistoryEntry {
  id: string;
  question: string;
  timestamp: number;
  responses: PersonaResponse[];
  sentiment: SentimentSummary;
  filters: Filters;
  selectedState: string | null;
}

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii",
  IA: "Iowa", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", MA: "Massachusetts",
  MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota",
  MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina",
  ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", PR: "Puerto Rico",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
  VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia",
  WY: "Wyoming",
};

export const EDUCATION_LABELS: Record<string, string> = {
  "9th_12th_no_diploma": "9th-12th (No Diploma)",
  "associates": "Associate's Degree",
  "bachelors": "Bachelor's Degree",
  "graduate": "Graduate Degree",
  "high_school": "High School Diploma",
  "less_than_9th": "Less than 9th Grade",
  "some_college": "Some College",
};

export const SUGGESTION_QUESTIONS = [
  "What do you think about the cost of healthcare?",
  "How do you feel about public transportation in your city?",
  "Should the minimum wage be raised to $20/hour?",
  "What's your opinion on remote work becoming permanent?",
  "How important is climate change action to you?",
  "Do you think AI will help or hurt your career?",
];
