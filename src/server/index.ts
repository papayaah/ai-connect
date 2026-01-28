/**
 * Server-side utilities for ai-connect
 * Import from '@reactkits.dev/ai-connect/server'
 *
 * Works in:
 * - Supabase Edge Functions (Deno)
 * - Express/Node.js servers
 * - Any environment that supports fetch API
 */

// Re-export core functions (they work on server too)
export {
  askDatabase,
  generateSql,
  formatQueryResults,
  validateSql,
  addSafetyLimits,
  EXAMPLE_SCHEMA,
  buildSchemaContext,
  type AskDatabaseOptions,
  type AskDatabaseResult,
  type GenerateSqlOptions,
  type GenerateSqlResult,
  type FormatResultsOptions,
  type SqlValidationResult,
  type SchemaConfig,
} from '../core';

// Server-specific handlers
export { createSupabaseHandler, type SupabaseHandlerConfig } from './supabase-handler';
export { createExpressHandler, type ExpressHandlerConfig } from './express-handler';
export { createFetchHandler, type FetchHandlerConfig } from './fetch-handler';
