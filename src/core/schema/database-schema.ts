/**
 * Database Schema Context for LLM
 * This tells the LLM what tables and columns are available
 */

export interface SchemaConfig {
  tables: TableSchema[];
  relationships?: string[];
  customInstructions?: string;
}

export interface TableSchema {
  name: string;
  description?: string;
  columns: ColumnSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  description?: string;
  sensitive?: boolean; // If true, LLM will be instructed not to query this column
}

/**
 * Default database schema for The Tasting List
 * Override this by passing your own schema to askDatabase()
 */
export const DATABASE_SCHEMA = `
You have access to a PostgreSQL database. Here are the tables and their columns:

## restaurants
Primary table for restaurant data.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Restaurant name |
| address | text | Street address |
| city | text | City name |
| state | text | State/province |
| country | text | Country |
| cuisine | text | Type of cuisine (e.g., "French", "Japanese") |
| price_range | text | One of: "$", "$$", "$$$", "$$$$" |
| michelin_status | text | null, "1 star", "2 stars", "3 stars", "bib gourmand" |
| google_rating | numeric | Rating from 1.0 to 5.0 |
| yelp_rating | numeric | Rating from 1.0 to 5.0 |
| is_active | boolean | Whether restaurant is published |
| latitude | numeric | GPS latitude |
| longitude | numeric | GPS longitude |
| created_at | timestamptz | When record was created |
| updated_at | timestamptz | When record was last updated |

## profiles (users)
User accounts and subscription info.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, links to auth.users |
| subscription_active | boolean | Has active subscription |
| subscription_tier | text | "free" or "pro" |
| created_at | timestamptz | Account creation date |

## tastemakers
Curators/influencers who recommend restaurants.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name |
| bio | text | Short biography |
| instagram_handle | text | Instagram username |
| follower_count | integer | Number of followers |
| is_verified | boolean | Verified tastemaker |

## tastemaker_reviews
Reviews written by tastemakers.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tastemaker_id | uuid | FK to tastemakers |
| restaurant_id | uuid | FK to restaurants |
| review_text | text | The review content |
| rating | integer | Rating 1-5 |
| created_at | timestamptz | When review was written |

## staging_restaurants
Restaurants pending review (same schema as restaurants).

## usage
AI API usage tracking.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| model | text | AI model used |
| input_tokens | integer | Tokens in prompt |
| output_tokens | integer | Tokens in response |
| total_cost | numeric | Cost in USD |
| response_time_ms | integer | Response time |
| created_at | timestamptz | When API was called |

## Relationships
- tastemaker_reviews.tastemaker_id → tastemakers.id
- tastemaker_reviews.restaurant_id → restaurants.id
- profiles.id → auth.users.id (Supabase auth)
`;

/**
 * Builds a schema context string from a SchemaConfig object
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
  }

  if (config.customInstructions) {
    context += `\n## Additional Instructions\n${config.customInstructions}\n`;
  }

  return context;
}
