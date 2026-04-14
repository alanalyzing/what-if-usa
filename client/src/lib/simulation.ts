/**
 * DESIGN: Tactical Command Center — Military-Grade Data Ops
 * Simulation Engine: Samples personas, generates simulated responses, and computes sentiment.
 */

import type { Persona, Filters, PersonaResponse, Sentiment, SentimentSummary } from "./types";

// Response templates keyed by topic keywords — each has positive, neutral, negative variants
const TOPIC_RESPONSES: Record<string, Record<Sentiment, string[]>> = {
  healthcare: {
    positive: [
      "As a {age}-year-old {occupation} in {city}, {state}, I believe our healthcare system has real potential. I've seen improvements in my community and I'm hopeful we can make it accessible for everyone.",
      "Healthcare matters deeply to me. Working as a {occupation}, I've seen how good coverage can change lives. I support expanding access and making it more affordable.",
      "Living in {state}, I think we're moving in the right direction on healthcare. It's not perfect, but the progress I've seen gives me hope for the future.",
      "I strongly believe healthcare should be a priority. As someone from {city}, I've witnessed how community health programs can make a real difference.",
    ],
    neutral: [
      "Healthcare is complicated. As a {age}-year-old {occupation} in {state}, I see valid arguments on both sides. We need reform, but the details matter a lot.",
      "I have mixed feelings about healthcare policy. Living in {city}, {state}, I've seen both the strengths and weaknesses of our current system firsthand.",
      "This is a tough issue. My experience as a {occupation} has shown me that healthcare needs change, but I'm not sure any single approach is the answer.",
      "I think we need to have honest conversations about healthcare costs. As someone in {state}, I see the challenges but also recognize the complexity.",
    ],
    negative: [
      "Healthcare costs are crushing families in {state}. As a {occupation}, I see people struggling every day to afford basic care. We need serious reform.",
      "I'm frustrated with the healthcare situation. Living in {city}, {state}, I've watched costs skyrocket while quality hasn't kept pace. Something has to change.",
      "The cost of healthcare is a real crisis. At {age}, I worry about my future and the burden on working families like those in my community.",
      "Our healthcare system is failing too many people. As a {occupation} in {state}, I've seen the consequences firsthand and it's deeply concerning.",
    ],
  },
  transportation: {
    positive: [
      "Public transportation in {city} has been improving, and I appreciate the investment. As a {occupation}, having reliable transit options makes a real difference in my daily life.",
      "I'm a big supporter of better public transit. Living in {state}, I've seen how good transportation infrastructure can connect communities and create opportunities.",
      "Transportation is key to economic growth. In {city}, I've noticed positive changes and I hope we continue investing in making it better for everyone.",
    ],
    neutral: [
      "Transportation in {city} is a mixed bag. Some routes work well, but there are still gaps. As a {occupation}, I rely on it sometimes but it's not always reliable.",
      "I think public transportation needs more attention, but it's not a simple fix. In {state}, the geography and population spread make it challenging.",
      "I see the value of public transit, but in {city}, {state}, the current system doesn't serve everyone equally. We need a more balanced approach.",
    ],
    negative: [
      "Public transportation in {city} is inadequate. As a {age}-year-old {occupation}, I've struggled with unreliable service and limited routes.",
      "Transportation infrastructure in {state} has been neglected for too long. It's holding back economic development and making life harder for working people.",
      "I'm disappointed with the state of public transit in {city}. We deserve better options, and the current system isn't meeting the needs of our community.",
    ],
  },
  wage: {
    positive: [
      "I support raising the minimum wage. As a {occupation} in {state}, I've seen how hard it is for people to make ends meet on current wages. Workers deserve fair pay.",
      "A higher minimum wage would help so many families in {city}. At {age}, I understand the value of hard work and believe people should be compensated fairly.",
      "Raising wages is the right thing to do. Living in {state}, the cost of living keeps rising but wages haven't kept up. It's time for change.",
    ],
    neutral: [
      "The minimum wage debate is nuanced. As a {occupation} in {state}, I understand both the need for fair wages and the concerns about business impacts.",
      "I think wages should be higher, but the specifics matter. In {city}, {state}, the cost of living varies so much that a one-size-fits-all approach may not work.",
      "I'm torn on this. Workers in {state} definitely need better pay, but I worry about unintended consequences for small businesses in communities like {city}.",
    ],
    negative: [
      "I'm concerned that a dramatic wage increase could hurt small businesses in {city}. As a {occupation}, I've seen how tight margins already are.",
      "While I understand the intent, raising the minimum wage too quickly could lead to job losses in {state}. We need a more gradual, thoughtful approach.",
      "I worry this would accelerate automation and hurt the very workers it's meant to help. In {city}, {state}, many businesses are already struggling.",
    ],
  },
  remote: {
    positive: [
      "Remote work has been transformative for me as a {occupation}. Living in {city}, {state}, it's given me flexibility and improved my quality of life significantly.",
      "I'm a strong advocate for remote work options. At {age}, I've seen how it can benefit both employees and employers when done right.",
      "Working remotely from {city} has been a game-changer. It's reduced my commute stress and allowed me to be more productive and present with my family.",
    ],
    neutral: [
      "Remote work has pros and cons. As a {occupation} in {state}, I value the flexibility but miss the collaboration that comes with being in an office.",
      "I think hybrid work is the best compromise. Living in {city}, I appreciate having options but recognize that not every job can be done remotely.",
      "The shift to remote work is complicated. In {state}, some industries thrive with it while others struggle. We need flexible policies, not mandates.",
    ],
    negative: [
      "Remote work isn't for everyone. As a {occupation} in {city}, I've seen how it can lead to isolation and make career advancement harder for some.",
      "I'm concerned about the long-term effects of permanent remote work on communities in {state}. Local businesses and social connections are suffering.",
      "While remote work sounds appealing, the reality in {city} is that many jobs simply can't be done from home. It's creating a two-tier workforce.",
    ],
  },
  climate: {
    positive: [
      "Climate action is essential. As a {age}-year-old in {state}, I've seen environmental changes firsthand and believe we must act now for future generations.",
      "I strongly support climate initiatives. Living in {city}, {state}, I've witnessed the impact of extreme weather and know we need to invest in solutions.",
      "Climate change is the defining issue of our time. As a {occupation}, I believe transitioning to clean energy will create jobs and protect our communities.",
    ],
    neutral: [
      "Climate change is real, but the solutions need to be practical. As a {occupation} in {state}, I worry about the economic impact of rapid transitions.",
      "I care about the environment, but I think we need balanced policies. In {city}, {state}, people depend on industries that would be affected by aggressive climate action.",
      "I believe in addressing climate change, but the approach matters. We need solutions that work for communities like {city} without devastating local economies.",
    ],
    negative: [
      "I'm skeptical of many climate proposals. As a {occupation} in {state}, I've seen how regulations can hurt working families without delivering real results.",
      "Climate policies often overlook the impact on communities like {city}. At {age}, I've watched good jobs disappear due to regulations that don't consider local realities.",
      "I think climate action is important, but the current approach is wrong. In {state}, we're being asked to sacrifice too much too fast without viable alternatives.",
    ],
  },
  ai: {
    positive: [
      "I'm optimistic about AI. As a {occupation} in {city}, I see it as a tool that can help us work smarter and solve complex problems more effectively.",
      "AI has real potential to improve lives. At {age}, I'm excited about how it could transform healthcare, education, and other fields for the better.",
      "I believe AI will create more opportunities than it eliminates. In {state}, I've seen technology drive innovation and I think AI will do the same.",
    ],
    neutral: [
      "AI is a double-edged sword. As a {occupation}, I see both the potential benefits and the risks. We need thoughtful regulation to get this right.",
      "I have mixed feelings about AI. Living in {city}, {state}, I appreciate the convenience but worry about privacy and job displacement.",
      "AI will definitely change things, but how it affects us depends on the policies we put in place. As a {age}-year-old, I think we need to be proactive.",
    ],
    negative: [
      "AI concerns me deeply. As a {occupation} in {state}, I worry about job losses and the concentration of power in the hands of a few tech companies.",
      "I'm worried about AI's impact on employment. In {city}, many people in my community could see their jobs automated away without adequate support.",
      "The rush to adopt AI without safeguards is reckless. At {age}, I've seen technological changes disrupt communities, and AI could be the most disruptive yet.",
    ],
  },
  default: {
    positive: [
      "As a {age}-year-old {occupation} from {city}, {state}, I feel strongly positive about this. I believe it represents progress and could benefit many people in our community.",
      "This is an important issue to me. Living in {state} and working as a {occupation}, I've seen how positive change can transform communities for the better.",
      "I support this direction. My experience in {city}, {state} has shown me that when we invest in our communities, everyone benefits.",
    ],
    neutral: [
      "This is a complex issue. As a {occupation} in {city}, {state}, I see merit in different perspectives and think we need more thoughtful discussion before acting.",
      "I'm still weighing the pros and cons. At {age}, living in {state}, I've learned that most issues have more nuance than they first appear.",
      "I think there are valid points on multiple sides. As someone from {city}, {state}, I'd want to understand the full impact before taking a strong position.",
    ],
    negative: [
      "I have serious concerns about this. As a {occupation} in {state}, I've seen similar approaches fail and worry about the consequences for working families.",
      "This doesn't sit right with me. Living in {city}, {state}, I've witnessed how well-intentioned policies can have unintended negative effects on communities like mine.",
      "I'm opposed to this direction. At {age}, working as a {occupation}, I believe there are better approaches that would actually help people in {state}.",
    ],
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectTopic(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("health") || q.includes("medical") || q.includes("doctor") || q.includes("insurance") || q.includes("hospital")) return "healthcare";
  if (q.includes("transport") || q.includes("commut") || q.includes("bus") || q.includes("train") || q.includes("subway") || q.includes("transit")) return "transportation";
  if (q.includes("wage") || q.includes("salary") || q.includes("pay") || q.includes("income") || q.includes("minimum")) return "wage";
  if (q.includes("remote") || q.includes("work from home") || q.includes("hybrid") || q.includes("office") || q.includes("telework")) return "remote";
  if (q.includes("climate") || q.includes("environment") || q.includes("green") || q.includes("carbon") || q.includes("pollution") || q.includes("warming")) return "climate";
  if (q.includes("ai") || q.includes("artificial intelligence") || q.includes("automation") || q.includes("robot") || q.includes("machine learning")) return "ai";
  return "default";
}

function assignSentiment(persona: Persona, question: string): Sentiment {
  // Deterministic but varied sentiment based on persona characteristics and question
  let hash = 0;
  const str = persona.uuid + question;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const seed = Math.abs(hash) % 100;

  // Age factor: younger slightly more positive about change topics
  const ageFactor = persona.age < 30 ? 8 : persona.age > 65 ? -5 : 0;
  // Education factor: higher education slightly more nuanced (neutral)
  const eduFactor = ["graduate", "bachelors"].includes(persona.education_level) ? 3 : 0;

  const score = seed + ageFactor + eduFactor;
  if (score > 62) return "positive";
  if (score > 28) return "neutral";
  return "negative";
}

function formatOccupation(occ: string): string {
  return occ.replace(/_/g, " ");
}

function generateResponse(persona: Persona, question: string, sentiment: Sentiment): string {
  const topic = detectTopic(question);
  const topicResponses = TOPIC_RESPONSES[topic] || TOPIC_RESPONSES.default;
  const templates = topicResponses[sentiment];
  let response = pickRandom(templates);

  response = response
    .replace(/{occupation}/g, formatOccupation(persona.occupation))
    .replace(/{state}/g, persona.state)
    .replace(/{city}/g, persona.city)
    .replace(/{age}/g, String(persona.age));

  return response;
}

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

export function simulateResponses(personas: Persona[], question: string): PersonaResponse[] {
  return personas.map((persona) => {
    const sentiment = assignSentiment(persona, question);
    const answer = generateResponse(persona, question, sentiment);
    return { persona, answer, sentiment };
  });
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
