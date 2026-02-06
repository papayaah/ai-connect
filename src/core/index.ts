/**
 * Core AI utilities - works in Browser, Deno, and Node.js
 * Import from '@reactkits.dev/ai-connect/core'
 */

export { generateSql, type GenerateSqlOptions, type GenerateSqlResult } from './generate-sql.ts';
export { validateSql, addSafetyLimits, type SqlValidationResult } from './sql-validator.ts';
export { formatQueryResults, type FormatResultsOptions } from './format-results.ts';
export { askDatabase, type AskDatabaseOptions, type AskDatabaseResult } from './ask-database.ts';
export {
  EXAMPLE_SCHEMA,
  buildSchemaContext,
  createSchemaTemplate,
  type SchemaConfig,
  type TableSchema,
  type ColumnSchema,
} from './schema/database-schema.ts';
export {
  generateObject,
  generateText,
  type LanguageModel,
  type AIUsage,
  type GenerateObjectResult,
  type GenerateTextResult,
} from './ai-caller.ts';
export {
  createUsageTracker,
  calculateCost,
  USAGE_TABLE_SQL,
  READONLY_QUERY_FUNCTION_SQL,
  type UsageRecord,
  type UsageTrackerConfig,
} from './usage-tracker.ts';
