import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateWaveResponses, computeWaves } from "./simulation";

const personaSchema = z.object({
  id: z.string(),
  age: z.number(),
  sex: z.string(),
  city: z.string(),
  state: z.string(),
  zipcode: z.string(),
  occupation: z.string(),
  education_level: z.string(),
  marital_status: z.string(),
  persona: z.string(),
  professional_persona: z.string(),
  cultural_background: z.string().optional(),
  hobbies_and_interests_list: z.array(z.string()).optional(),
  career_goals_and_ambitions: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  simulation: router({
    /**
     * Generate responses for a single wave of personas.
     * The frontend calls this multiple times with different persona subsets
     * to implement progressive wave delivery (e.g., first 10, then 20, then rest).
     */
    generateWave: publicProcedure
      .input(
        z.object({
          question: z.string().min(1).max(500),
          personas: z.array(personaSchema).min(1).max(100),
          waveIndex: z.number().int().min(0),
          totalWaves: z.number().int().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const results = await generateWaveResponses(input.question, input.personas);
        return {
          results,
          waveIndex: input.waveIndex,
          totalWaves: input.totalWaves,
          personaCount: input.personas.length,
        };
      }),

    /**
     * Compute wave plan for a given total persona count.
     * Returns the wave sizes so the frontend knows how to split the personas.
     */
    planWaves: publicProcedure
      .input(z.object({ totalPersonas: z.number().int().min(1).max(100) }))
      .query(({ input }) => {
        const waves = computeWaves(input.totalPersonas);
        return { waves, totalWaves: waves.length };
      }),

    /**
     * Legacy single-shot generation (backward compatible)
     */
    generate: publicProcedure
      .input(
        z.object({
          question: z.string().min(1).max(500),
          personas: z.array(personaSchema).min(1).max(100),
        }),
      )
      .mutation(async ({ input }) => {
        const results = await generateWaveResponses(input.question, input.personas);
        return { results };
      }),
  }),
});

export type AppRouter = typeof appRouter;
