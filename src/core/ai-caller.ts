/**
 * AI Caller - Uses Vercel AI SDK
 * Server-only (Node.js, Deno)
 */

// Use dynamic import to avoid type resolution issues with peer dependencies
// At runtime, 'ai' package will be available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAI = async (): Promise<any> => {
  const ai = await import('ai');
  return ai;
};

import { z } from 'zod';

/**
 * Language model type - accepts any model from @ai-sdk/* providers
 *
 * @example
 * - google('gemini-2.5-flash') from @ai-sdk/google
 * - openai('gpt-4o') from @ai-sdk/openai
 * - anthropic('claude-3-5-sonnet') from @ai-sdk/anthropic
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LanguageModel = any;

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateObjectResult<T> {
  object: T;
  usage: AIUsage;
}

export interface GenerateTextResult {
  text: string;
  usage: AIUsage;
}

/**
 * Generate a structured object using AI
 *
 * @example
 * ```typescript
 * import { google } from '@ai-sdk/google';
 *
 * const result = await generateObject({
 *   model: google('gemini-2.5-flash'),
 *   system: "You are a SQL expert",
 *   prompt: "Generate a query for...",
 *   schema: z.object({ sql: z.string(), explanation: z.string() }),
 * });
 * ```
 */
export async function generateObject<T>(options: {
  model: LanguageModel;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
}): Promise<GenerateObjectResult<T>> {
  const { model, system, prompt, schema } = options;
  const ai = await getAI();

  const result = await ai.generateObject({
    model,
    system,
    prompt,
    schema,
  });

  return {
    object: result.object as T,
    usage: {
      inputTokens: result.usage?.promptTokens ?? 0,
      outputTokens: result.usage?.completionTokens ?? 0,
    },
  };
}

/**
 * Generate text using AI
 *
 * @example
 * ```typescript
 * import { google } from '@ai-sdk/google';
 *
 * const result = await generateText({
 *   model: google('gemini-2.5-flash'),
 *   system: "You are a helpful assistant",
 *   prompt: "Explain these results...",
 * });
 * ```
 */
export async function generateText(options: {
  model: LanguageModel;
  system: string;
  prompt: string;
}): Promise<GenerateTextResult> {
  const { model, system, prompt } = options;
  const ai = await getAI();

  const result = await ai.generateText({
    model,
    system,
    prompt,
  });

  return {
    text: result.text,
    usage: {
      inputTokens: result.usage?.promptTokens ?? 0,
      outputTokens: result.usage?.completionTokens ?? 0,
    },
  };
}
