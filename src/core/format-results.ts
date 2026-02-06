/**
 * Format Query Results into Human-Readable Answers
 * Uses Vercel AI SDK - works in Node.js and Deno
 */

import { generateText, type LanguageModel } from './ai-caller.ts';

export interface FormatResultsOptions {
  /** The original question that was asked */
  question: string;

  /** Raw data from the SQL query */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];

  /**
   * AI model instance from @ai-sdk/* provider
   *
   * @example
   * ```typescript
   * import { google } from '@ai-sdk/google';
   * const model = google('gemini-2.5-flash');
   * ```
   */
  model: LanguageModel;
}

export interface FormatResultsResult {
  answer: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Formats raw query results into a human-readable answer
 *
 * @example
 * ```typescript
 * import { google } from '@ai-sdk/google';
 *
 * const result = await formatQueryResults({
 *   question: "How many users signed up last month?",
 *   data: [{ count: 89 }],
 *   model: google('gemini-2.5-flash'),
 * });
 * console.log(result.answer); // "There were 89 users who signed up last month."
 * ```
 */
export async function formatQueryResults(options: FormatResultsOptions): Promise<FormatResultsResult> {
  const { question, data, model } = options;

  const systemPrompt = `You are a helpful assistant that explains database query results in plain English.
Format numbers nicely (e.g., "1,247" not "1247").
Use markdown tables when showing multiple rows of data.
Be concise but informative.
If the data is empty, say so clearly.`;

  const prompt = `Question: ${question}

Query Results (${data.length} rows):
${JSON.stringify(data, null, 2)}

Provide a clear, concise answer to the question based on these results.`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt,
  });

  return {
    answer: result.text,
    usage: result.usage,
  };
}
