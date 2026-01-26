/**
 * Universal Fetch Handler - Works in any environment with fetch API
 * Deno, Node.js 18+, Cloudflare Workers, etc.
 */

import { askDatabase, type AskDatabaseResult } from '../core';

export interface FetchHandlerConfig {
  /** Function to get API key (from env, headers, etc.) */
  getApiKey: () => string | Promise<string>;

  /** Function to execute SQL queries */
  executeQuery: (sql: string) => Promise<any[]>;

  /** AI provider to use */
  provider?: 'google' | 'openai' | 'anthropic';

  /** Model to use */
  model?: string;

  /** Custom schema (optional) */
  schema?: string;

  /** Rate limit per minute (optional) */
  rateLimit?: number;

  /** CORS origins to allow (optional) */
  corsOrigins?: string[];
}

export interface AskDatabaseRequest {
  question: string;
  model?: string;
  maxRows?: number;
  formatResults?: boolean;
}

/**
 * Creates a fetch-compatible handler for the ask-database endpoint
 *
 * @example
 * // Deno / Supabase Edge Function
 * const handler = createFetchHandler({
 *   getApiKey: () => Deno.env.get('GEMINI_API_KEY')!,
 *   executeQuery: async (sql) => {
 *     const { data } = await supabase.rpc('execute_readonly_query', { query: sql });
 *     return data;
 *   },
 * });
 *
 * Deno.serve(handler);
 *
 * @example
 * // Node.js with native fetch
 * const handler = createFetchHandler({
 *   getApiKey: () => process.env.GEMINI_API_KEY!,
 *   executeQuery: async (sql) => {
 *     const { rows } = await pool.query(sql);
 *     return rows;
 *   },
 * });
 */
export function createFetchHandler(config: FetchHandlerConfig) {
  const {
    getApiKey,
    executeQuery,
    provider = 'google',
    model: defaultModel = 'gemini-2.5-flash',
    schema,
    corsOrigins = ['*'],
  } = config;

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
      const body = await request.json() as AskDatabaseRequest;

      if (!body.question || typeof body.question !== 'string') {
        return new Response(JSON.stringify({ error: 'Question is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(corsOrigins), 'Content-Type': 'application/json' },
        });
      }

      const apiKey = await getApiKey();

      const result: AskDatabaseResult = await askDatabase({
        question: body.question,
        executeQuery,
        apiKey,
        provider,
        model: body.model || defaultModel,
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
