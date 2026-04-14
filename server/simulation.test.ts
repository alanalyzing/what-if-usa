import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { computeWaves, parseBatchResponse } from "./simulation";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the simulation module:
 * 1. Wave computation logic (absolute: 10, 20, rest)
 * 2. Response parsing robustness
 * 3. tRPC route validation (input schema)
 * 4. LLM integration via mocked invokeLLM
 * 5. Wave-based generation endpoint
 */

// Mock the LLM module to avoid real API calls in tests
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
const mockedInvokeLLM = vi.mocked(invokeLLM);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

const samplePersona = {
  id: "test-persona-1",
  age: 35,
  sex: "Female",
  city: "Austin",
  state: "TX",
  zipcode: "73301",
  occupation: "Software_Developer",
  education_level: "bachelors",
  marital_status: "Married",
  persona: "A tech-savvy professional who enjoys coding and hiking.",
  professional_persona: "Senior developer with 10 years of experience in web technologies.",
};

const samplePersona2 = {
  id: "test-persona-2",
  age: 62,
  sex: "Male",
  city: "Detroit",
  state: "MI",
  zipcode: "48201",
  occupation: "Retired_Teacher",
  education_level: "graduate",
  marital_status: "Widowed",
  persona: "A retired high school history teacher who loves gardening.",
  professional_persona: "Former educator with 30 years in public schools.",
};

// ── Wave computation tests ──────────────────────────────────────────
describe("computeWaves", () => {
  it("returns single wave for small sample (≤10)", () => {
    expect(computeWaves(1)).toEqual([1]);
    expect(computeWaves(5)).toEqual([5]);
    expect(computeWaves(10)).toEqual([10]);
  });

  it("returns [10, remainder] when total is 11-30", () => {
    expect(computeWaves(11)).toEqual([10, 1]);
    expect(computeWaves(15)).toEqual([10, 5]);
    expect(computeWaves(25)).toEqual([10, 15]);
    expect(computeWaves(30)).toEqual([10, 20]);
  });

  it("returns [10, 20, rest] when total exceeds 30", () => {
    expect(computeWaves(31)).toEqual([10, 20, 1]);
    expect(computeWaves(50)).toEqual([10, 20, 20]);
    expect(computeWaves(100)).toEqual([10, 20, 70]);
  });

  it("wave sizes always sum to total", () => {
    for (const total of [1, 5, 10, 11, 15, 25, 30, 31, 50, 80, 100]) {
      const waves = computeWaves(total);
      expect(waves.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it("first wave is always 10 for samples > 10", () => {
    for (const total of [11, 15, 25, 50, 100]) {
      expect(computeWaves(total)[0]).toBe(10);
    }
  });

  it("second wave is at most 20", () => {
    for (const total of [11, 15, 25, 30, 50, 100]) {
      const waves = computeWaves(total);
      if (waves.length >= 2) {
        expect(waves[1]).toBeLessThanOrEqual(20);
      }
    }
  });
});

// ── Response parsing tests ──────────────────────────────────────────
describe("parseBatchResponse", () => {
  it("parses valid JSON array", () => {
    const raw = JSON.stringify([
      { id: "p1", answer: "I agree.", sentiment: "positive" },
      { id: "p2", answer: "I disagree.", sentiment: "negative" },
    ]);
    const results = parseBatchResponse(raw, ["p1", "p2"]);
    expect(results).toHaveLength(2);
    expect(results[0].personaId).toBe("p1");
    expect(results[0].sentiment).toBe("positive");
    expect(results[1].sentiment).toBe("negative");
  });

  it("parses JSON wrapped in markdown code block", () => {
    const raw = '```json\n[{"id":"p1","answer":"Yes.","sentiment":"positive"}]\n```';
    const results = parseBatchResponse(raw, ["p1"]);
    expect(results).toHaveLength(1);
    expect(results[0].answer).toBe("Yes.");
  });

  it("parses object-wrapped response with results key", () => {
    const raw = JSON.stringify({
      results: [{ id: "p1", answer: "Maybe.", sentiment: "neutral" }],
    });
    const results = parseBatchResponse(raw, ["p1"]);
    expect(results).toHaveLength(1);
    expect(results[0].sentiment).toBe("neutral");
  });

  it("returns fallback for completely invalid input", () => {
    const results = parseBatchResponse("not json at all", ["p1", "p2"]);
    expect(results).toHaveLength(2);
    expect(results[0].sentiment).toBe("neutral");
    expect(results[1].sentiment).toBe("neutral");
  });

  it("normalizes invalid sentiment to neutral", () => {
    const raw = JSON.stringify([
      { id: "p1", answer: "Test.", sentiment: "very_positive" },
    ]);
    const results = parseBatchResponse(raw, ["p1"]);
    expect(results[0].sentiment).toBe("neutral");
  });
});

// ── Legacy generate endpoint tests ──────────────────────────────────
describe("simulation.generate", () => {
  it("returns results for each persona when LLM responds with valid JSON array", async () => {
    const mockLLMResponse = JSON.stringify([
      {
        id: "test-persona-1",
        answer: "As a software developer, I believe AI will significantly enhance my productivity.",
        sentiment: "positive",
      },
      {
        id: "test-persona-2",
        answer: "Having retired from teaching, I'm mostly concerned about education quality.",
        sentiment: "neutral",
      },
    ]);

    mockedInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: mockLLMResponse, role: "assistant" }, index: 0, finish_reason: "stop" }],
      id: "test",
      object: "chat.completion",
      created: Date.now(),
      model: "test-model",
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.simulation.generate({
      question: "How do you feel about AI in education?",
      personas: [samplePersona, samplePersona2],
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].personaId).toBe("test-persona-1");
    expect(result.results[0].sentiment).toBe("positive");
    expect(result.results[1].personaId).toBe("test-persona-2");
    expect(result.results[1].sentiment).toBe("neutral");
  });

  it("returns fallback neutral responses when LLM fails", async () => {
    mockedInvokeLLM.mockRejectedValueOnce(new Error("API rate limit exceeded"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.simulation.generate({
      question: "What do you think about taxes?",
      personas: [samplePersona],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].sentiment).toBe("neutral");
    expect(result.results[0].answer).toBeTruthy();
  });

  it("rejects empty question", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.simulation.generate({
        question: "",
        personas: [samplePersona],
      }),
    ).rejects.toThrow();
  });

  it("rejects empty personas array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.simulation.generate({
        question: "Test question?",
        personas: [],
      }),
    ).rejects.toThrow();
  });

  it("correctly batches large persona sets", async () => {
    mockedInvokeLLM.mockClear();

    // Create 12 personas (should be split into 3 sub-batches of 5, 5, 2)
    const manyPersonas = Array.from({ length: 12 }, (_, i) => ({
      ...samplePersona,
      id: `persona-${i}`,
      age: 25 + i,
      city: `City${i}`,
    }));

    // Mock 3 LLM calls (one per sub-batch of 5)
    for (let batch = 0; batch < 3; batch++) {
      const batchSize = batch < 2 ? 5 : 2;
      const batchResults = Array.from({ length: batchSize }, (_, i) => ({
        id: `persona-${batch * 5 + i}`,
        answer: `Response from persona ${batch * 5 + i}`,
        sentiment: "positive",
      }));

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(batchResults), role: "assistant" }, index: 0, finish_reason: "stop" }],
        id: `test-${batch}`,
        object: "chat.completion",
        created: Date.now(),
        model: "test-model",
      } as any);
    }

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.simulation.generate({
      question: "What do you think about education?",
      personas: manyPersonas,
    });

    expect(result.results).toHaveLength(12);
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(3);
  });
});

// ── Wave-based generateWave endpoint tests ──────────────────────────
describe("simulation.generateWave", () => {
  it("returns results with wave metadata", async () => {
    mockedInvokeLLM.mockClear();

    const mockResponse = JSON.stringify([
      { id: "test-persona-1", answer: "Wave response.", sentiment: "positive" },
    ]);

    mockedInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: mockResponse, role: "assistant" }, index: 0, finish_reason: "stop" }],
      id: "test",
      object: "chat.completion",
      created: Date.now(),
      model: "test-model",
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.simulation.generateWave({
      question: "What about healthcare?",
      personas: [samplePersona],
      waveIndex: 0,
      totalWaves: 3,
    });

    expect(result.results).toHaveLength(1);
    expect(result.waveIndex).toBe(0);
    expect(result.totalWaves).toBe(3);
    expect(result.personaCount).toBe(1);
  });

  it("rejects invalid waveIndex", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.simulation.generateWave({
        question: "Test?",
        personas: [samplePersona],
        waveIndex: -1,
        totalWaves: 3,
      }),
    ).rejects.toThrow();
  });
});
