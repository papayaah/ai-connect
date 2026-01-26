/**
 * Core AI utilities - works in Browser, Deno, and Node.js
 * Import from '@reactkits.dev/ai-connect/core'
 */

export { generateSql, type GenerateSqlOptions, type GenerateSqlResult } from './generate-sql';
export { validateSql, addSafetyLimits, type SqlValidationResult } from './sql-validator';
export { formatQueryResults, type FormatResultsOptions } from './format-results';
export { askDatabase, type AskDatabaseOptions, type AskDatabaseResult } from './ask-database';
export { DATABASE_SCHEMA, buildSchemaContext, type SchemaConfig } from './schema/database-schema';
export { generateObject, generateText, type AICallerOptions, type AIUsage } from './ai-caller';
export {
  createUsageTracker,
  calculateCost,
  USAGE_TABLE_SQL,
  READONLY_QUERY_FUNCTION_SQL,
  type UsageRecord,
  type UsageTrackerConfig,
} from './usage-tracker';
