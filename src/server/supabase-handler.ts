/**
 * Supabase Edge Function Handler
 * Designed for Supabase Edge Functions (Deno runtime)
 */

import { createFetchHandler, type FetchHandlerConfig } from './fetch-handler';
import { type LanguageModel } from '../core/ai-caller';

export interface SupabaseHandlerConfig {
  /**
   * Your database schema - REQUIRED
   * Describes your tables and columns so the AI can generate correct SQL.
   */
  schema: string;

  /**
   * Function to get the AI model instance.
   *
   * @example
   * ```typescript
   * import { google } from '@ai-sdk/google';
   *
   * getModel: () => google('gemini-2.5-flash')
   * ```
   */
  getModel: () => LanguageModel | Promise<LanguageModel>;

  /** Supabase client instance */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any; // SupabaseClient type - using any to avoid import issues in Deno

  /** Name of the RPC function to execute SQL (default: 'execute_readonly_query') */
  rpcFunctionName?: string;

  /** CORS origins to allow */
  corsOrigins?: string[];
}

/**
 * Creates a handler for Supabase Edge Functions
 *
 * @example
 * ```typescript
 * // supabase/functions/ask-database/index.ts
 * import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 * import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 * import { google } from 'https://esm.sh/@ai-sdk/google';
 * import { createSupabaseHandler } from '@reactkits.dev/ai-connect/server';
 * import { MY_APP_SCHEMA } from '../_shared/schema.ts';
 *
 * const supabase = createClient(
 *   Deno.env.get('SUPABASE_URL')!,
 *   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 * );
 *
 * const handler = createSupabaseHandler({
 *   schema: MY_APP_SCHEMA,
 *   supabaseClient: supabase,
 *   getModel: () => google('gemini-2.5-flash'),
 * });
 *
 * serve(handler);
 * ```
 */
export function createSupabaseHandler(config: SupabaseHandlerConfig) {
  const { supabaseClient, rpcFunctionName = 'execute_readonly_query', getModel, schema, corsOrigins } = config;

  const fetchConfig: FetchHandlerConfig = {
    getModel,
    executeQuery: async (sql: string) => {
      const { data, error } = await supabaseClient.rpc(rpcFunctionName, { query: sql });

      if (error) {
        throw new Error(`SQL execution error: ${error.message}`);
      }

      return data || [];
    },
    schema,
    corsOrigins,
  };

  return createFetchHandler(fetchConfig);
}
