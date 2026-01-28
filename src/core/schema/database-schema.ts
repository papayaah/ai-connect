/**
 * Database Schema Context for LLM
 *
 * This module provides the interfaces and utilities for describing your database
 * schema to the AI. The schema tells the LLM what tables and columns are available
 * so it can generate accurate SQL queries.
 *
 * IMPORTANT: Consumer apps MUST provide their own schema. This package does NOT
 * include any app-specific schema - it only provides the format/contract.
 */

// =============================================================================
// Schema Interfaces - Define your database structure
// =============================================================================

/**
 * Complete schema configuration for your database.
 *
 * @example
 * ```typescript
 * const mySchema: SchemaConfig = {
 *   tables: [
 *     {
 *       name: 'users',
 *       description: 'Application users',
 *       columns: [
 *         { name: 'id', type: 'uuid', description: 'Primary key' },
 *         { name: 'email', type: 'text', description: 'User email address' },
 *         { name: 'password_hash', type: 'text', sensitive: true }, // Won't be queried
 *       ]
 *     }
 *   ],
 *   relationships: ['orders.user_id → users.id'],
 *   customInstructions: 'Always filter by status = "active" unless asked otherwise.'
 * };
 * ```
 */
export interface SchemaConfig {
  /** Array of table definitions */
  tables: TableSchema[];

  /**
   * Foreign key relationships between tables.
   * Format: 'table.column → referenced_table.column'
   */
  relationships?: string[];

  /**
   * Additional instructions for the LLM when generating queries.
   * Use this for business rules, default filters, or query patterns.
   */
  customInstructions?: string;
}

/**
 * Definition of a single database table.
 */
export interface TableSchema {
  /** Table name as it appears in the database */
  name: string;

  /** Human-readable description of what this table contains */
  description?: string;

  /** Array of column definitions */
  columns: ColumnSchema[];
}

/**
 * Definition of a single column within a table.
 */
export interface ColumnSchema {
  /** Column name as it appears in the database */
  name: string;

  /**
   * PostgreSQL data type.
   * Common types: uuid, text, integer, decimal, boolean, timestamptz, text[], jsonb
   */
  type: string;

  /** Human-readable description of what this column contains */
  description?: string;

  /**
   * If true, LLM will be instructed NOT to query this column.
   * Use for passwords, API keys, tokens, PII, or any sensitive data.
   */
  sensitive?: boolean;
}

// =============================================================================
// Schema Builder - Convert SchemaConfig to markdown string
// =============================================================================

/**
 * Builds a schema context string from a SchemaConfig object.
 * This converts your structured schema into a markdown format the LLM can understand.
 *
 * @example
 * ```typescript
 * const schemaString = buildSchemaContext(mySchema);
 * // Returns:
 * // "You have access to a PostgreSQL database...
 * // ## users
 * // | Column | Type | Description |
 * // ..."
 * ```
 */
export function buildSchemaContext(config: SchemaConfig): string {
  let context = 'You have access to a PostgreSQL database. Here are the tables and their columns:\n\n';

  for (const table of config.tables) {
    context += `## ${table.name}\n`;
    if (table.description) {
      context += `${table.description}\n`;
    }
    context += '| Column | Type | Description |\n';
    context += '|--------|------|-------------|\n';

    for (const column of table.columns) {
      // Skip sensitive columns - don't even tell the LLM about them
      if (!column.sensitive) {
        context += `| ${column.name} | ${column.type} | ${column.description || ''} |\n`;
      }
    }
    context += '\n';
  }

  if (config.relationships && config.relationships.length > 0) {
    context += '## Relationships\n';
    for (const rel of config.relationships) {
      context += `- ${rel}\n`;
    }
    context += '\n';
  }

  if (config.customInstructions) {
    context += `## Additional Instructions\n${config.customInstructions}\n`;
  }

  return context;
}

// =============================================================================
// Example Schema - For documentation purposes only
// =============================================================================

/**
 * Example schema showing the expected markdown format.
 * This is for DOCUMENTATION ONLY - consumer apps should provide their own schema.
 *
 * You can pass schema as either:
 * 1. A markdown string (like this example)
 * 2. A SchemaConfig object (use buildSchemaContext to convert)
 */
export const EXAMPLE_SCHEMA = `
You have access to a PostgreSQL database. Here are the tables and their columns:

## users
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | User email |
| name | text | Display name |
| created_at | timestamptz | When user was created |

## orders
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to users |
| total | decimal | Order total in cents |
| status | text | 'pending', 'completed', 'cancelled' |
| created_at | timestamptz | When order was created |

## products
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Product name |
| price | decimal | Price in cents |
| category | text | Product category |

## Relationships
- orders.user_id → users.id
- order_items.order_id → orders.id
- order_items.product_id → products.id
`;

// =============================================================================
// Schema Template - Copy and customize for your app
// =============================================================================

/**
 * Template function to help you create your schema.
 * Copy this pattern to your consumer app.
 *
 * @example In your app (e.g., supabase/functions/_shared/schema.ts):
 * ```typescript
 * export const MY_APP_SCHEMA = `
 * You have access to a PostgreSQL database. Here are the tables and their columns:
 *
 * ## your_table
 * | Column | Type | Description |
 * |--------|------|-------------|
 * | id | uuid | Primary key |
 * | ... | ... | ... |
 *
 * ## Relationships
 * - table_a.foreign_key → table_b.id
 * `;
 * ```
 */
export function createSchemaTemplate(appName: string): string {
  return `
// =============================================================================
// ${appName} Database Schema
// Copy this to your app and customize for your tables
// =============================================================================

export const ${appName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_SCHEMA = \`
You have access to a PostgreSQL database. Here are the tables and their columns:

## your_first_table
Description of what this table contains.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | ... |
| created_at | timestamptz | When record was created |

## your_second_table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| first_table_id | uuid | FK to your_first_table |

## Relationships
- your_second_table.first_table_id → your_first_table.id
\`;
`;
}
