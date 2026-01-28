/**
 * Ask Database - Complete flow from question to answer
 * Uses Vercel AI SDK - works in Browser, Deno, and Node.js
 */

import { generateSql } from './generate-sql';
import { formatQueryResults } from './format-results';
import { validateSql, addSafetyLimits } from './sql-validator';
import { type SchemaConfig } from './schema/database-schema';

export interface AskDatabaseOptions {
  /** The natural language question to answer */
  question: string;

  /**
   * Your database schema description - REQUIRED
   * Can be a markdown string or a SchemaConfig object.
   *
   * @example String format:
   * ```
   * const schema = `
   * ## users
   * | Column | Type | Description |
   * |--------|------|-------------|
   * | id | uuid | Primary key |
   * | email | text | User email |
   * `;
   * ```
   *
   * @example SchemaConfig format:
   * ```
   * const schema: SchemaConfig = {
   *   tables: [
   *     { name: 'users', columns: [{ name: 'id', type: 'uuid' }, { name: 'email', type: 'text' }] }
   *   ],
   *   relationships: ['orders.user_id → users.id']
   * };
   * ```
   */
  schema: string | SchemaConfig;

  /**
   * Function to execute SQL queries against your database.
   * This is how ai-connect communicates with YOUR database.
   *
   * @example Supabase:
   * ```
   * executeQuery: async (sql) => {
   *   const { data, error } = await supabase.rpc('execute_readonly_query', { query: sql });
   *   if (error) throw error;
   *   return data;
   * }
   * ```
   *
   * @example Node.js pg:
   * ```
   * executeQuery: async (sql) => {
   *   const { rows } = await pool.query(sql);
   *   return rows;
   * }
   * ```
   */
  executeQuery: (sql: string) => Promise<any[]>;

  /** API key for the AI provider (Google, OpenAI, or Anthropic) */
  apiKey: string;

  /** AI provider to use (default: 'google') */
  provider?: 'google' | 'openai' | 'anthropic';

  /** Model to use for SQL generation and result formatting (default: 'gemini-2.5-flash') */
  model?: string;

  /** Maximum rows to return (default: 1000) */
  maxRows?: number;

  /** Whether to format results with AI into human-readable text (default: true) */
  formatResults?: boolean;

  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export interface AskDatabaseResult {
  /** The generated SQL query */
  sql: string;

  /** Explanation of what the query does */
  explanation: string;

  /** Human-readable answer (if formatResults is true) */
  answer: string;

  /** Raw data from the query */
  rawData: any[];

  /** Total execution time in milliseconds */
  executionTimeMs: number;

  /** Token usage for AI calls */
  usage?: {
    sqlGeneration: { inputTokens: number; outputTokens: number };
    formatting?: { inputTokens: number; outputTokens: number };
    total: { inputTokens: number; outputTokens: number };
  };
}

/**
 * Complete flow: Question → SQL → Execute → Format Answer
 *
 * @example
 * // With Supabase
 * const result = await askDatabase({
 *   question: "How many restaurants are in Tokyo?",
 *   apiKey: process.env.GEMINI_API_KEY,
 *   executeQuery: async (sql) => {
 *     const { data } = await supabase.rpc('execute_readonly_query', { query: sql });
 *     return data;
 *   },
 * });
 *
 * // With pg (Node.js)
 * const result = await askDatabase({
 *   question: "How many restaurants are in Tokyo?",
 *   apiKey: process.env.GEMINI_API_KEY,
 *   executeQuery: async (sql) => {
 *     const { rows } = await pool.query(sql);
 *     return rows;
 *   },
 * });
 */
export async function askDatabase(options: AskDatabaseOptions): Promise<AskDatabaseResult> {
  const {
    question,
    executeQuery,
    apiKey,
    provider = 'google',
    model = 'gemini-2.5-flash',
    schema,
    maxRows = 1000,
    formatResults: shouldFormat = true,
    timeout = 30000,
  } = options;

  const startTime = Date.now();

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Query timed out after ${timeout}ms`)), timeout);
  });

  try {
    // Race against timeout
    return await Promise.race([
      executeAskDatabase(),
      timeoutPromise,
    ]);
  } catch (error) {
    throw error;
  }

  async function executeAskDatabase(): Promise<AskDatabaseResult> {
    // 1. Generate SQL from question
    const sqlResult = await generateSql({
      question,
      schema,
      model,
      apiKey,
      provider,
    });

    // 2. Validate SQL
    const validation = validateSql(sqlResult.sql);
    if (!validation.valid) {
      throw new Error(`Generated SQL is invalid: ${validation.error}`);
    }

    // 3. Add safety limits
    const safeSql = addSafetyLimits(sqlResult.sql, maxRows);

    // 4. Execute query
    let rawData: any[];
    try {
      rawData = await executeQuery(safeSql);
    } catch (error) {
      throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 5. Format results (optional)
    let answer = '';
    let formattingUsage: { inputTokens: number; outputTokens: number } | undefined;

    if (shouldFormat) {
      const formatResult = await formatQueryResults({
        question,
        data: rawData,
        model,
        apiKey,
        provider,
      });
      answer = formatResult.answer;
      formattingUsage = formatResult.usage;
    } else {
      // Simple default formatting
      if (rawData.length === 0) {
        answer = 'No results found.';
      } else if (rawData.length === 1 && Object.keys(rawData[0]).length === 1) {
        const value = Object.values(rawData[0])[0];
        answer = `Result: ${value}`;
      } else {
        answer = `Found ${rawData.length} result(s).`;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    // Calculate total usage
    const sqlUsage = sqlResult.usage || { inputTokens: 0, outputTokens: 0 };
    const fmtUsage = formattingUsage || { inputTokens: 0, outputTokens: 0 };

    return {
      sql: safeSql,
      explanation: sqlResult.explanation,
      answer,
      rawData,
      executionTimeMs,
      usage: {
        sqlGeneration: sqlUsage,
        formatting: shouldFormat ? fmtUsage : undefined,
        total: {
          inputTokens: sqlUsage.inputTokens + fmtUsage.inputTokens,
          outputTokens: sqlUsage.outputTokens + fmtUsage.outputTokens,
        },
      },
    };
  }
}
