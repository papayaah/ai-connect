/**
 * Universal Fetch Handler - Works in any environment with fetch API
 * Deno, Node.js 18+, Cloudflare Workers, etc.
 */

import { askDatabase, type AskDatabaseResult } from '../core';
import { type LanguageModel } from '../core/ai-caller';

export interface FetchHandlerConfig {
  /**
   * Your database schema - REQUIRED
   * Describes your tables and columns so the AI can generate correct SQL.
   */
  schema: string;

  /**
   * Function to get the AI model instance.
   * Called for each request, so you can dynamically select models.
   *
   * @example
   * ```typescript
   * import { google } from '@ai-sdk/google';
   *
   * getModel: () => google('gemini-2.5-flash')
   * ```
   */
  getModel: () => LanguageModel | Promise<LanguageModel>;

  /** Function to execute SQL queries */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeQuery: (sql: string) => Promise<any[]>;

  /** Rate limit per minute (optional) */
  rateLimit?: number;

  /** CORS origins to allow (optional) */
  corsOrigins?: string[];
}

export interface AskDatabaseRequest {
  question: string;
  maxRows?: number;
  formatResults?: boolean;
}

/**
 * Creates a fetch-compatible handler for the ask-database endpoint
 *
 * @example
 * ```typescript
 * import { google } from '@ai-sdk/google';
 *
 * // Deno / Supabase Edge Function
 * const handler = createFetchHandler({
 *   schema: MY_APP_SCHEMA,
 *   getModel: () => google('gemini-2.5-flash'),
 *   executeQuery: async (sql) => {
 *     const { data } = await supabase.rpc('execute_readonly_query', { query: sql });
 *     return data;
 *   },
 * });
 *
 * Deno.serve(handler);
 * ```
 *
 * @example
 * ```typescript
 * import { google } from '@ai-sdk/google';
 *
 * // Node.js with native fetch
 * const handler = createFetchHandler({
 *   schema: MY_APP_SCHEMA,
 *   getModel: () => google('gemini-2.5-flash'),
 *   executeQuery: async (sql) => {
 *     const { rows } = await pool.query(sql);
 *     return rows;
 *   },
 * });
 * ```
 */
export function createFetchHandler(config: FetchHandlerConfig) {
  const { getModel, executeQuery, schema, corsOrigins = ['*'] } = config;

  return async (request: Request): Promise<Response> => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(corsOrigins),
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...getCorsHeaders(corsOrigins), 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = (await request.json()) as AskDatabaseRequest;

      if (!body.question || typeof body.question !== 'string') {
        return new Response(JSON.stringify({ error: 'Question is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(corsOrigins), 'Content-Type': 'application/json' },
        });
      }

      const model = await getModel();

      const result: AskDatabaseResult = await askDatabase({
        question: body.question,
        executeQuery,
        model,
        schema,
        maxRows: body.maxRows,
        formatResults: body.formatResults,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...getCorsHeaders(corsOrigins), 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[ai-connect] Error:', error);

      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = message.includes('invalid') || message.includes('required') ? 400 : 500;

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...getCorsHeaders(corsOrigins), 'Content-Type': 'application/json' },
      });
    }
  };
}

function getCorsHeaders(origins: string[]): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origins.includes('*') ? '*' : origins.join(', '),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
