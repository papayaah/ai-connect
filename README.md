# @reactkits.dev/ai-connect

AI Connect - Text-to-SQL and structured AI generation using Vercel AI SDK.

## Features

- **Vercel AI SDK Integration** - Uses the official Vercel AI SDK for structured output generation
- **Multi-Provider Support** - OpenAI, Anthropic, Google, and more via @ai-sdk/* packages
- **Cost Tracking** - Real-time cost estimation and usage statistics
- **Text-to-SQL** - Natural language queries against your PostgreSQL database
- **SQL Safety** - Built-in validation blocks dangerous queries
- **Server Handlers** - Pre-built handlers for Express, Supabase Edge Functions, and fetch API

## Installation

```bash
npm install @reactkits.dev/ai-connect ai zod

# Install the AI provider you want to use (pick one or more):
npm install @ai-sdk/google    # For Google Gemini
npm install @ai-sdk/openai    # For OpenAI
npm install @ai-sdk/anthropic # For Claude
```

## Quick Start

### Basic Usage with askDatabase

```typescript
import { google } from '@ai-sdk/google';
import { askDatabase } from '@reactkits.dev/ai-connect/core';

const result = await askDatabase({
  question: "How many orders were placed last month?",
  schema: MY_APP_SCHEMA,  // Your database schema (required)
  model: google('gemini-2.5-flash'),
  executeQuery: async (sql) => {
    const { rows } = await pool.query(sql);
    return rows;
  },
});

console.log(result.answer);    // "There were 1,247 orders placed last month."
console.log(result.sql);       // "SELECT COUNT(*) FROM orders WHERE..."
console.log(result.rawData);   // [{ count: 1247 }]
```

### Using Different Providers

```typescript
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Google Gemini
const googleModel = google('gemini-2.5-flash');

// OpenAI
const openaiModel = openai('gpt-4o');

// Anthropic Claude
const claudeModel = anthropic('claude-3-5-sonnet-20241022');
```

## Ask Database (Text-to-SQL)

Natural language queries against your PostgreSQL database.

### What You Provide (Consumer App)

The package is **generic** - you must provide:

1. **Schema** - Description of YOUR database tables (required)
2. **executeQuery** - Callback to run SQL on YOUR database (required)
3. **Model** - AI model instance from @ai-sdk/* (required)

### What the Package Provides

- SQL generation from natural language
- Query validation (blocks INSERT, DELETE, etc.)
- Safety limits (auto-adds LIMIT)
- Result formatting (AI-powered human-readable answers)
- Multiple AI provider support via Vercel AI SDK

### Step 1: Define Your Schema

Create a schema file in YOUR app (not in the package):

```typescript
// my-app/shared/schema.ts
export const MY_APP_SCHEMA = `
You have access to a PostgreSQL database. Here are the tables and their columns:

## users
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | User email |
| name | text | Display name |
| created_at | timestamptz | Account creation date |

## orders
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to users |
| total | decimal | Order total |
| status | text | 'pending', 'completed', 'cancelled' |

## Relationships
- orders.user_id → users.id
`;
```

Or use the structured interface:

```typescript
import { SchemaConfig, buildSchemaContext } from '@reactkits.dev/ai-connect/core';

const mySchema: SchemaConfig = {
  tables: [
    {
      name: 'users',
      description: 'Application users',
      columns: [
        { name: 'id', type: 'uuid', description: 'Primary key' },
        { name: 'email', type: 'text', description: 'User email' },
        { name: 'password_hash', type: 'text', sensitive: true }, // Hidden from AI
      ]
    }
  ],
  relationships: ['orders.user_id → users.id'],
  customInstructions: 'Always filter by status = "active" unless asked otherwise.'
};

const schemaString = buildSchemaContext(mySchema);
```

### Step 2: Create Your Query Executor

```typescript
// Supabase example
const executeQuery = async (sql: string) => {
  const { data, error } = await supabase.rpc('execute_readonly_query', { query: sql });
  if (error) throw error;
  return data;
};

// Node.js pg example
const executeQuery = async (sql: string) => {
  const { rows } = await pool.query(sql);
  return rows;
};
```

### Step 3: Use askDatabase

```typescript
import { google } from '@ai-sdk/google';
import { askDatabase } from '@reactkits.dev/ai-connect/core';

const result = await askDatabase({
  question: "How many orders were placed last month?",
  schema: MY_APP_SCHEMA,  // YOUR schema (required)
  model: google('gemini-2.5-flash'),
  executeQuery,            // YOUR db callback (required)
});

console.log(result.answer);    // "There were 1,247 orders placed last month."
console.log(result.sql);       // "SELECT COUNT(*) FROM orders WHERE..."
console.log(result.rawData);   // [{ count: 1247 }]
```

## Server Handlers

Pre-built handlers for Supabase Edge Functions and Express:

### Supabase Edge Function

```typescript
// supabase/functions/ask-database/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/@ai-sdk/google';
import { createSupabaseHandler } from '@reactkits.dev/ai-connect/server';
import { MY_APP_SCHEMA } from '../_shared/schema.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const handler = createSupabaseHandler({
  schema: MY_APP_SCHEMA,
  supabaseClient: supabase,
  getModel: () => google('gemini-2.5-flash'),
});

serve(handler);
```

### Express/Node.js

```typescript
import express from 'express';
import { Pool } from 'pg';
import { google } from '@ai-sdk/google';
import { createExpressHandler } from '@reactkits.dev/ai-connect/server';
import { MY_APP_SCHEMA } from './schema';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.post('/api/ask-database', createExpressHandler({
  schema: MY_APP_SCHEMA,
  getModel: () => google('gemini-2.5-flash'),
  executeQuery: async (sql) => {
    const { rows } = await pool.query(sql);
    return rows;
  },
}));
```

### Fetch Handler (Universal)

```typescript
import { google } from '@ai-sdk/google';
import { createFetchHandler } from '@reactkits.dev/ai-connect/server';

const handler = createFetchHandler({
  schema: MY_APP_SCHEMA,
  getModel: () => google('gemini-2.5-flash'),
  executeQuery: async (sql) => {
    const { rows } = await pool.query(sql);
    return rows;
  },
});

// Works with Deno.serve, Cloudflare Workers, etc.
```

## SQL Safety

Built-in validation blocks dangerous queries:

```typescript
import { validateSql, addSafetyLimits } from '@reactkits.dev/ai-connect/core';

const validation = validateSql(sql);
if (!validation.valid) {
  throw new Error(validation.error);
}

// Add LIMIT if not present
const safeSql = addSafetyLimits(sql, 1000);
```

**Blocked**: INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, etc.
**Protected**: password, api_key, secret, auth.users, pg_catalog columns

## Core Functions

### generateSql

Generate SQL from natural language:

```typescript
import { google } from '@ai-sdk/google';
import { generateSql } from '@reactkits.dev/ai-connect/core';

const result = await generateSql({
  question: "How many users signed up last week?",
  schema: MY_APP_SCHEMA,
  model: google('gemini-2.5-flash'),
});

console.log(result.sql);         // "SELECT COUNT(*) FROM users WHERE..."
console.log(result.explanation); // "Counts users created in the last 7 days"
```

### formatQueryResults

Format raw query results into human-readable text:

```typescript
import { google } from '@ai-sdk/google';
import { formatQueryResults } from '@reactkits.dev/ai-connect/core';

const result = await formatQueryResults({
  question: "How many users signed up last week?",
  data: [{ count: 42 }],
  model: google('gemini-2.5-flash'),
});

console.log(result.answer); // "42 users signed up last week."
```

### generateObject / generateText

Lower-level functions for structured AI output:

```typescript
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { generateObject, generateText } from '@reactkits.dev/ai-connect/core';

// Structured object generation
const result = await generateObject({
  model: google('gemini-2.5-flash'),
  system: "You are a helpful assistant",
  prompt: "Extract the name and age from: John is 25 years old",
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
});
console.log(result.object); // { name: "John", age: 25 }

// Text generation
const textResult = await generateText({
  model: google('gemini-2.5-flash'),
  system: "You are a helpful assistant",
  prompt: "Explain what a database index is",
});
console.log(textResult.text);
```

## Schema Types Reference

```typescript
interface SchemaConfig {
  tables: TableSchema[];
  relationships?: string[];           // e.g., ['orders.user_id → users.id']
  customInstructions?: string;        // Business rules for the AI
}

interface TableSchema {
  name: string;
  description?: string;
  columns: ColumnSchema[];
}

interface ColumnSchema {
  name: string;
  type: string;                       // PostgreSQL type
  description?: string;
  sensitive?: boolean;                // If true, hidden from AI
}
```

## Supported Providers

Install the provider package you need:

| Provider | Package | Example Model |
|----------|---------|---------------|
| Google | `@ai-sdk/google` | `google('gemini-2.5-flash')` |
| OpenAI | `@ai-sdk/openai` | `openai('gpt-4o')` |
| Anthropic | `@ai-sdk/anthropic` | `anthropic('claude-3-5-sonnet-20241022')` |
| Mistral | `@ai-sdk/mistral` | `mistral('mistral-large-latest')` |
| Cohere | `@ai-sdk/cohere` | `cohere('command-r-plus')` |

See [Vercel AI SDK Providers](https://sdk.vercel.ai/providers) for full list.

## License

MIT
