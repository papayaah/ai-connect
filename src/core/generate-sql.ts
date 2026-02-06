/**
 * SQL Generation from Natural Language
 * Uses Vercel AI SDK - works in Node.js and Deno
 */

import { z } from 'zod';
import { generateObject, type LanguageModel } from './ai-caller.ts';
import { buildSchemaContext, type SchemaConfig } from './schema/database-schema.ts';

export interface GenerateSqlOptions {
  /** The natural language question to convert to SQL */
  question: string;

  /**
   * Your database schema - REQUIRED
   * Can be a markdown string or a SchemaConfig object.
   */
  schema: string | SchemaConfig;

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

export interface GenerateSqlResult {
  sql: string;
  explanation: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

const sqlResponseSchema = z.object({
  sql: z.string().describe('The PostgreSQL SELECT query to answer the question'),
  explanation: z.string().describe('Brief explanation of what the query does'),
});

/**
 * Generates a SQL query from a natural language question
 *
 * @example
 * ```typescript
 * import { google } from '@ai-sdk/google';
 *
 * const result = await generateSql({
 *   question: "How many users signed up last month?",
 *   schema: MY_APP_SCHEMA,
 *   model: google('gemini-2.5-flash'),
 * });
 * console.log(result.sql); // SELECT COUNT(*) FROM users WHERE created_at >= ...
 * ```
 */
export async function generateSql(options: GenerateSqlOptions): Promise<GenerateSqlResult> {
  const { question, schema, model } = options;

  // Build schema context - schema is required from the consumer
  if (!schema) {
    throw new Error('Schema is required. Pass your database schema as a string or SchemaConfig object.');
  }

  const schemaContext = typeof schema === 'string' ? schema : buildSchemaContext(schema);

  const systemPrompt = `You are a PostgreSQL expert. Generate SQL queries based on the user's question.

${schemaContext}

Rules:
- Only generate SELECT statements
- Never access sensitive columns (passwords, api_keys, secrets, stripe_customer_id)
- Always include LIMIT 1000 unless the user asks for a specific count
- Use proper PostgreSQL syntax
- For counts, use COUNT(*) with GROUP BY when appropriate
- Use ILIKE for case-insensitive text matching
- Return only valid, executable SQL
- Do not use SQL comments`;

  const result = await generateObject({
    model,
    system: systemPrompt,
    prompt: question,
    schema: sqlResponseSchema,
  });

  return {
    sql: result.object.sql,
    explanation: result.object.explanation,
    usage: result.usage,
  };
}
