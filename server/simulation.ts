/**
 * Server-side simulation engine
 * Generates real-time contextual persona responses using the Forge LLM API
 * Supports wave-based batch processing: processes personas in escalating waves
 */

import { invokeLLM } from "./_core/llm";
import type { SimulationPersona, PersonaResult, Sentiment } from "../shared/simulation";

const BATCH_SIZE = 5; // Process 5 personas per LLM call for efficiency

function buildPersonaContext(p: SimulationPersona): string {
  const parts = [
    `Name context: ${p.age}-year-old ${p.sex}`,
    `Location: ${p.city}, ${p.state} (ZIP: ${p.zipcode})`,
    `Occupation: ${p.occupation.replace(/_/g, " ")}`,
    `Education: ${p.education_level.replace(/_/g, " ")}`,
    `Marital status: ${p.marital_status.replace(/_/g, " ")}`,
  ];
  if (p.persona) parts.push(`Personal background: ${p.persona.slice(0, 300)}`);
  if (p.professional_persona) parts.push(`Professional context: ${p.professional_persona.slice(0, 200)}`);
  if (p.cultural_background) parts.push(`Cultural background: ${p.cultural_background.slice(0, 150)}`);
  if (p.hobbies_and_interests_list?.length) {
    parts.push(`Interests: ${p.hobbies_and_interests_list.slice(0, 5).join(", ")}`);
  }
  if (p.career_goals_and_ambitions) parts.push(`Career goals: ${p.career_goals_and_ambitions.slice(0, 150)}`);
  return parts.join("\n");
}

function buildBatchPrompt(question: string, personas: SimulationPersona[]): string {
  const personaBlocks = personas.map((p, i) => {
    return `--- PERSONA ${i + 1} (ID: ${p.id}) ---\n${buildPersonaContext(p)}`;
  }).join("\n\n");

  return `You are simulating a public survey. For each persona below, generate a realistic, contextual response to the question. Each response should:
1. Reflect the persona's unique background, occupation, location, education, and life experience
2. Be written in first person as if the persona is speaking naturally
3. Be 2-3 sentences long — concise but substantive
4. Include a sentiment classification (positive, neutral, or negative) based on the persona's likely stance

QUESTION: "${question}"

${personaBlocks}

Respond with a JSON array. Each element must have exactly these fields:
- "id": the persona ID string exactly as given
- "answer": the persona's response (2-3 sentences, first person)
- "sentiment": one of "positive", "neutral", or "negative"

Return ONLY the JSON array, no other text.`;
}

export function parseBatchResponse(raw: string, personaIds: string[]): PersonaResult[] {
  try {
    // Try to extract JSON array from the response
    let jsonStr = raw.trim();
    
    // Handle markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Find the JSON array
    const arrayStart = jsonStr.indexOf("[");
    const arrayEnd = jsonStr.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1) {
      jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);
    
    // Handle both array and object-wrapped responses
    const items = Array.isArray(parsed) ? parsed : (parsed.results || parsed.responses || []);
    if (!Array.isArray(items)) throw new Error("Not an array");

    return items.map((item: any) => {
      const sentiment: Sentiment =
        item.sentiment === "positive" || item.sentiment === "neutral" || item.sentiment === "negative"
          ? item.sentiment
          : "neutral";
      return {
        personaId: String(item.id || item.personaId || ""),
        answer: String(item.answer || item.response || "No response generated."),
        sentiment,
      };
    });
  } catch (e) {
    console.error("[Simulation] Failed to parse LLM response:", e, "\nRaw:", raw.slice(0, 500));
    // Return fallback responses
    return personaIds.map((id) => ({
      personaId: id,
      answer: "I'd need more time to think about this question carefully before giving my opinion.",
      sentiment: "neutral" as Sentiment,
    }));
  }
}

/**
 * Process a single batch of personas through the LLM
 */
async function processBatch(question: string, batch: SimulationPersona[]): Promise<PersonaResult[]> {
  const prompt = buildBatchPrompt(question, batch);
  const personaIds = batch.map((p) => p.id);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a survey simulation engine. You generate realistic, diverse responses from the perspective of different American personas. Always respond with valid JSON arrays only. No markdown, no explanation — just the JSON array.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = typeof response.choices[0]?.message?.content === "string"
      ? response.choices[0].message.content
      : JSON.stringify(response.choices[0]?.message?.content);

    return parseBatchResponse(content, personaIds);
  } catch (err) {
    console.error("[Simulation] LLM batch failed:", err);
    return personaIds.map((id) => ({
      personaId: id,
      answer: "I appreciate the question but would need to reflect on it more before sharing my thoughts.",
      sentiment: "neutral" as Sentiment,
    }));
  }
}

/**
 * Compute wave sizes for progressive delivery.
 * Uses absolute step sizes: first 10, then 20, then the rest.
 * For small samples (≤10), returns a single wave.
 */
export function computeWaves(total: number): number[] {
  if (total <= 10) return [total]; // Single wave for small samples
  
  // Wave 1: always 10
  const wave1 = 10;
  const remaining1 = total - wave1;
  
  if (remaining1 <= 0) return [total];
  
  // Wave 2: 20 or whatever remains if less than 20
  const wave2 = Math.min(20, remaining1);
  const remaining2 = remaining1 - wave2;
  
  if (remaining2 <= 0) return [wave1, wave2];
  
  // Wave 3: the rest
  return [wave1, wave2, remaining2];
}

/**
 * Generate responses for a single wave of personas.
 * Processes the wave's personas in parallel sub-batches of BATCH_SIZE.
 */
export async function generateWaveResponses(
  question: string,
  personas: SimulationPersona[],
): Promise<PersonaResult[]> {
  // Split into sub-batches of BATCH_SIZE
  const batches: SimulationPersona[][] = [];
  for (let i = 0; i < personas.length; i += BATCH_SIZE) {
    batches.push(personas.slice(i, i + BATCH_SIZE));
  }

  // Process sub-batches in parallel (up to 4 concurrent)
  const CONCURRENCY = 4;
  const allResults: PersonaResult[] = [];

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const concurrentBatches = batches.slice(i, i + CONCURRENCY);
    const batchPromises = concurrentBatches.map((batch) => processBatch(question, batch));
    const batchResults = await Promise.all(batchPromises);
    for (const results of batchResults) {
      allResults.push(...results);
    }
  }

  return allResults;
}

/**
 * Legacy single-shot generation for backward compatibility
 */
export async function generateBatchResponses(
  question: string,
  personas: SimulationPersona[],
): Promise<PersonaResult[]> {
  return generateWaveResponses(question, personas);
}
