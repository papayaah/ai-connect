/**
 * Supabase Edge Function Handler
 * Designed for Supabase Edge Functions (Deno runtime)
 */

import { createFetchHandler, type FetchHandlerConfig } from './fetch-handler';

export interface SupabaseHandlerConfig {
  /** Supabase client instance */
  supabaseClient: any; // SupabaseClient type - using any to avoid import issues in Deno

  /** Name of the RPC function to execute SQL (default: 'execute_readonly_query') */
  rpcFunctionName?: string;

  /** Environment variable name for API key (default: 'GEMINI_API_KEY') */
  apiKeyEnvVar?: string;

  /** AI provider to use */
  provider?: 'google' | 'openai' | 'anthropic';

  /** Model to use */
  model?: string;

  /** Custom schema (optional) */
  schema?: string;

  /** CORS origins to allow */
  corsOrigins?: string[];
}

/**
 * Creates a handler for Supabase Edge Functions
 *
 * @example
 * // supabase/functions/ask-database/index.ts
 * import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 * import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 * import { createSupabaseHandler } from '@reactkits.dev/ai-connect/server';
 *
 * const supabase = createClient(
 *   Deno.env.get('SUPABASE_URL')!,
 *   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 * );
 *
 * const handler = createSupabaseHandler({
 *   supabaseClient: supabase,
 * });
 *
 * serve(handler);
 */
export function createSupabaseHandler(config: SupabaseHandlerConfig) {
  const {
    supabaseClient,
    rpcFunctionName = 'execute_readonly_query',
    apiKeyEnvVar = 'GEMINI_API_KEY',
    provider = 'google',
    model,
    schema,
    corsOrigins,
  } = config;

  // Check if we're in Deno environment
  const isDeno = typeof (globalThis as any).Deno !== 'undefined';

  const fetchConfig: FetchHandlerConfig = {
    getApiKey: () => {
      if (isDeno) {
        const key = (globalThis as any).Deno.env.get(apiKeyEnvVar);
        if (!key) throw new Error(`Missing environment variable: ${apiKeyEnvVar}`);
        return key;
      }
      // Fallback for Node.js testing
      const key = process.env[apiKeyEnvVar];
      if (!key) throw new Error(`Missing environment variable: ${apiKeyEnvVar}`);
      return key;
    },

    executeQuery: async (sql: string) => {
      const { data, error } = await supabaseClient.rpc(rpcFunctionName, { query: sql });

      if (error) {
        throw new Error(`SQL execution error: ${error.message}`);
      }

      return data || [];
    },

    provider,
    model,
    schema,
    corsOrigins,
  };

  return createFetchHandler(fetchConfig);
}
