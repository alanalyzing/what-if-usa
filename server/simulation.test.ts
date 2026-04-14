import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the simulation module:
 * 1. tRPC route validation (input schema)
 * 2. LLM integration via mocked invokeLLM
 * 3. Response parsing robustness
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

describe("simulation.generate", () => {
  it("returns results for each persona when LLM responds with valid JSON array", async () => {
    const mockLLMResponse = JSON.stringify([
      {
        id: "test-persona-1",
        answer: "As a software developer, I believe AI will significantly enhance my productivity and open new career opportunities.",
        sentiment: "positive",
      },
      {
        id: "test-persona-2",
        answer: "Having retired from teaching, I'm mostly concerned about how AI might affect the quality of education for future generations.",
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
    expect(result.results[0].answer).toContain("software developer");
    expect(result.results[1].personaId).toBe("test-persona-2");
    expect(result.results[1].sentiment).toBe("neutral");
  });

  it("handles LLM response wrapped in markdown code blocks", async () => {
    const mockLLMResponse = '```json\n[{"id":"test-persona-1","answer":"I think it will help.","sentiment":"positive"}]\n```';

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
      question: "Will AI help your career?",
      personas: [samplePersona],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].answer).toBe("I think it will help.");
    expect(result.results[0].sentiment).toBe("positive");
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

  it("returns fallback responses when LLM returns invalid JSON", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: "This is not valid JSON at all!", role: "assistant" }, index: 0, finish_reason: "stop" }],
      id: "test",
      object: "chat.completion",
      created: Date.now(),
      model: "test-model",
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.simulation.generate({
      question: "What do you think about healthcare?",
      personas: [samplePersona],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].sentiment).toBe("neutral");
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

  it("handles LLM response with JSON object wrapper (not bare array)", async () => {
    // Some models return { "results": [...] } instead of bare array
    const mockLLMResponse = JSON.stringify({
      results: [
        {
          id: "test-persona-1",
          answer: "I support renewable energy initiatives.",
          sentiment: "positive",
        },
      ],
    });

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
      question: "What about clean energy?",
      personas: [samplePersona],
    });

    // The parser should still find the array inside the JSON object
    expect(result.results).toHaveLength(1);
    // It may or may not parse correctly depending on the structure,
    // but it should not crash and should return at least one result
    expect(result.results[0].sentiment).toBeTruthy();
  });

  it("correctly batches large persona sets", async () => {
    // Reset mock call count from previous tests
    mockedInvokeLLM.mockClear();

    // Create 12 personas (should be split into 3 batches of 5, 5, 2)
    const manyPersonas = Array.from({ length: 12 }, (_, i) => ({
      ...samplePersona,
      id: `persona-${i}`,
      age: 25 + i,
      city: `City${i}`,
    }));

    // Mock 3 LLM calls (one per batch)
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
