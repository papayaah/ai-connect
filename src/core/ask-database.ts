/**
 * Ask Database - Complete flow from question to answer
 * Uses Vercel AI SDK - works in Node.js and Deno
 */

import { generateSql } from './generate-sql.ts';
import { formatQueryResults } from './format-results.ts';
import { validateSql, addSafetyLimits } from './sql-validator.ts';
import { type SchemaConfig } from './schema/database-schema.ts';
import { type LanguageModel } from './ai-caller.ts';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeQuery: (sql: string) => Promise<any[]>;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * ```typescript
 * import { google } from '@ai-sdk/google';
 * import { askDatabase } from '@reactkits.dev/ai-connect/core';
 *
 * // With Supabase
 * const result = await askDatabase({
 *   question: "How many orders were placed last month?",
 *   schema: MY_APP_SCHEMA,
 *   model: google('gemini-2.5-flash'),
 *   executeQuery: async (sql) => {
 *     const { data } = await supabase.rpc('execute_readonly_query', { query: sql });
 *     return data;
 *   },
 * });
 *
 * // With pg (Node.js)
 * const result = await askDatabase({
 *   question: "How many orders were placed last month?",
 *   schema: MY_APP_SCHEMA,
 *   model: google('gemini-2.5-flash'),
 *   executeQuery: async (sql) => {
 *     const { rows } = await pool.query(sql);
 *     return rows;
 *   },
 * });
 *
 * console.log(result.answer);    // "There were 1,247 orders placed last month."
 * console.log(result.sql);       // "SELECT COUNT(*) FROM orders WHERE..."
 * console.log(result.rawData);   // [{ count: 1247 }]
 * ```
 */
export async function askDatabase(options: AskDatabaseOptions): Promise<AskDatabaseResult> {
  const {
    question,
    executeQuery,
    model,
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
    return await Promise.race([executeAskDatabase(), timeoutPromise]);
  } catch (error) {
    throw error;
  }

  async function executeAskDatabase(): Promise<AskDatabaseResult> {
    // 1. Generate SQL from question
    const sqlResult = await generateSql({
      question,
      schema,
      model,
    });

    // 2. Validate SQL
    const validation = validateSql(sqlResult.sql);
    if (!validation.valid) {
      throw new Error(`Generated SQL is invalid: ${validation.error}`);
    }

    // 3. Add safety limits
    const safeSql = addSafetyLimits(sqlResult.sql, maxRows);

    // 4. Execute query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
