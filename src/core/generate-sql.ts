/**
 * SQL Generation from Natural Language
 * Uses fetch-based AI calls - works in Browser, Deno, and Node.js
 */

import { generateObject } from './ai-caller';
import { buildSchemaContext, type SchemaConfig } from './schema/database-schema';

export interface GenerateSqlOptions {
  question: string;
  schema?: string | SchemaConfig;
  model?: string;
  apiKey: string;
  provider?: 'google' | 'openai' | 'anthropic';
}

export interface GenerateSqlResult {
  sql: string;
  explanation: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Generates a SQL query from a natural language question
 *
 * @example
 * const result = await generateSql({
 *   question: "How many restaurants are in Tokyo?",
 *   apiKey: process.env.GEMINI_API_KEY,
 * });
 * console.log(result.sql); // SELECT COUNT(*) FROM restaurants WHERE city = 'Tokyo'
 */
export async function generateSql(options: GenerateSqlOptions): Promise<GenerateSqlResult> {
  const { question, schema, model = 'gemini-2.5-flash', apiKey, provider = 'google' } = options;

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

  const result = await generateObject<{ sql: string; explanation: string }>({
    apiKey,
    provider,
    model,
    system: systemPrompt,
    prompt: question,
    schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'The PostgreSQL SELECT query to answer the question' },
        explanation: { type: 'string', description: 'Brief explanation of what the query does' },
      },
      required: ['sql', 'explanation'],
    },
  });

  return {
    sql: result.object.sql,
    explanation: result.object.explanation,
    usage: result.usage,
  };
}
