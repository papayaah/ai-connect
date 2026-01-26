/**
 * Format Query Results into Human-Readable Answers
 * Uses fetch-based AI calls - works in Browser, Deno, and Node.js
 */

import { generateText } from './ai-caller';

export interface FormatResultsOptions {
  question: string;
  data: any[];
  model?: string;
  apiKey: string;
  provider?: 'google' | 'openai' | 'anthropic';
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
 * const result = await formatQueryResults({
 *   question: "How many restaurants are in Tokyo?",
 *   data: [{ count: 89 }],
 *   apiKey: process.env.GEMINI_API_KEY,
 * });
 * console.log(result.answer); // "There are 89 restaurants in Tokyo."
 */
export async function formatQueryResults(options: FormatResultsOptions): Promise<FormatResultsResult> {
  const { question, data, model = 'gemini-2.5-flash', apiKey, provider = 'google' } = options;

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
    apiKey,
    provider,
    model,
    system: systemPrompt,
    prompt,
  });

  return {
    answer: result.text,
    usage: result.usage,
  };
}
