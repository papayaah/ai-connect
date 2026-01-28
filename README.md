# @reactkits.dev/ai-connect

AI Connect for React - provider selection, configuration, hosted-endpoint helpers, and cost tracking.

## Features

- **Multi-Provider Support** - OpenAI, Anthropic, Google, Mistral, Cohere, X.AI, and more
- **Cost Tracking** - Real-time cost estimation and usage statistics
- **Headless Architecture** - Bring your own UI components
- **Chrome AI Integration** - Built-in support for Chrome's native AI APIs
- **Rate Limiting** - Built-in rate limit management
- **Storage Adapters** - Flexible storage via adapters (localStorage by default, plus memory adapter; bring your own IndexedDB/server adapter)
- **Hosted Endpoint Helpers** - Standard request/response shapes for your own `/api/...` routes (text + images)
- **UI Presets** - Ready-to-use presets for Tailwind CSS

## Installation

```bash
npm install @reactkits.dev/ai-connect

# Optional: for Tailwind preset
npm install tailwindcss autoprefixer postcss

# Optional: for icons
npm install lucide-react
```

## Quick Start

### Basic Usage

```tsx
import {
  AIManagementProvider,
  AIProviderSelector,
  ModelSelector,
  tailwindPreset,
} from '@reactkits.dev/ai-connect';

function App() {
  return (
    <AIManagementProvider>
      <AIProviderSelector preset={tailwindPreset} />
      <ModelSelector preset={tailwindPreset} />
    </AIManagementProvider>
  );
}
```

### Using Hooks

```tsx
import { useAIProvider, useCostTracking } from '@reactkits.dev/ai-connect';

function MyComponent() {
  const { provider, model, apiKey, setProvider, setModel, setApiKey } = useAIProvider();
  const { totalCost, usageStats } = useCostTracking();

  return (
    <div>
      <p>Current Provider: {provider}</p>
      <p>Current Model: {model}</p>
      <p>Total Cost: ${totalCost.toFixed(4)}</p>
    </div>
  );
}
```

### Custom Storage

```tsx
import {
  AIManagementProvider,
  createStorageService,
  localStorageAdapter,
  createMemoryStorageAdapter,
} from '@reactkits.dev/ai-connect';

const storageService = createStorageService(localStorageAdapter);
// Or, for SSR/tests:
// const storageService = createStorageService(createMemoryStorageAdapter());

function App() {
  return (
    <AIManagementProvider storageService={storageService}>
      {/* Your components */}
    </AIManagementProvider>
  );
}
```

## Components

| Component | Description |
|-----------|-------------|
| `AIManagementProvider` | Context provider for AI management |
| `AIProviderSelector` | Provider selection component |
| `ModelSelector` | Model selection component |
| `ProviderCard` | Individual provider card |
| `CostDisplay` | Cost estimation display |
| `APIKeyInput` | API key input component |
| `UsageStats` | Usage statistics display |
| `ChromeAIStatus` | Chrome AI availability indicator |

## Hooks

| Hook | Description |
|------|-------------|
| `useAIProvider` | Get/set current provider, model, and API key |
| `useCostTracking` | Track costs and usage statistics |
| `useProviderPricing` | Get pricing information for providers |
| `useProviderValidation` | Validate API keys |
| `useChromeAI` | Check Chrome AI availability |
| `useRateLimit` | Manage rate limits |
| `useAIService` | Make AI API calls |
| `useAIImageService` | Call your hosted image-generation API and return `File`s |

## Hosted API (Text) + Hosted Image API (Images)

This package does **not** auto-create API routes in your app.
Instead, it provides helpers/hooks that call **your own hosted endpoints** (e.g. Next.js route handlers).

Use hosted endpoints when (recommended):
- you don’t want API keys in the browser
- you want centralized billing/rate limits/logging
- you want to persist settings in a DB later (Postgres, etc.)

### Text: `callHostedAPI`

Client helper:

```ts
import { callHostedAPI } from '@reactkits.dev/ai-connect';

const result = await callHostedAPI('/api/ai/text', {
  prompt: 'Write a short caption about coffee',
});
console.log(result.text);
```

Your server endpoint should return:
- `text` (string)
- optional `usage` (tokens)
- optional `metadata`

### Images: `callHostedImageAPI` + `useAIImageService`

Client helper:

```ts
import { callHostedImageAPI } from '@reactkits.dev/ai-connect';

const res = await callHostedImageAPI('/api/ai/image', {
  prompt: 'A minimal app icon, flat, high contrast',
  n: 1,
  format: 'png',
});
```

Or with the hook (returns `File`s):

```tsx
import { useAIImageService } from '@reactkits.dev/ai-connect';

function GenerateButton() {
  const { generateImages, isLoading, error } = useAIImageService({ endpoint: '/api/ai/image' });

  return (
    <button
      disabled={isLoading}
      onClick={async () => {
        const res = await generateImages({ prompt: 'A retro pixel art cat', n: 1 });
        // res.images[0].file is a File you can upload/store anywhere
      }}
    >
      Generate
      {error ? ` (${error})` : null}
    </button>
  );
}
```

Your server endpoint should return:
- `images: [{ mimeType, dataBase64? | url? }]`
- optional `costUsd` (useful for per-image billing)
- optional `provider`, `model`, `metadata`

## Ask Database (Text-to-SQL)

Natural language queries against your PostgreSQL database. Works in Browser, Deno (Supabase Edge Functions), and Node.js.

### What You Provide (Consumer App)

The package is **generic** - you must provide:

1. **Schema** - Description of YOUR database tables (required)
2. **executeQuery** - Callback to run SQL on YOUR database (required)
3. **API Key** - Your AI provider key (required)

### What the Package Provides

- SQL generation from natural language
- Query validation (blocks INSERT, DELETE, etc.)
- Safety limits (auto-adds LIMIT)
- Result formatting (AI-powered human-readable answers)
- Multiple AI provider support (Google, OpenAI, Anthropic)

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
import { askDatabase } from '@reactkits.dev/ai-connect/core';
import { MY_APP_SCHEMA } from './schema';

const result = await askDatabase({
  question: "How many orders were placed last month?",
  schema: MY_APP_SCHEMA,  // YOUR schema (required)
  executeQuery,            // YOUR db callback (required)
  apiKey: process.env.GEMINI_API_KEY,
  provider: 'google',
  model: 'gemini-2.5-flash',
});

console.log(result.answer);    // "There were 1,247 orders placed last month."
console.log(result.sql);       // "SELECT COUNT(*) FROM orders WHERE..."
console.log(result.rawData);   // [{ count: 1247 }]
```

### Server Handlers

Pre-built handlers for Supabase Edge Functions and Express:

```typescript
// Supabase Edge Function
import { createSupabaseHandler } from '@reactkits.dev/ai-connect/server';
import { MY_APP_SCHEMA } from '../_shared/schema.ts';

const handler = createSupabaseHandler({
  schema: MY_APP_SCHEMA,
  supabaseClient: supabase,
  rpcFunctionName: 'execute_readonly_query',
});

Deno.serve(handler);
```

```typescript
// Express/Node.js
import { createExpressHandler } from '@reactkits.dev/ai-connect/server';
import { MY_APP_SCHEMA } from './schema';

app.post('/api/ask-database', createExpressHandler({
  schema: MY_APP_SCHEMA,
  getApiKey: () => process.env.GEMINI_API_KEY,
  executeQuery: async (sql) => {
    const { rows } = await pool.query(sql);
    return rows;
  },
}));
```

### SQL Safety

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

### Schema Types Reference

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

- OpenAI (GPT-4, GPT-3.5, etc.)
- Anthropic (Claude 3, Claude 2, etc.)
- Google (Gemini Pro, Gemini Flash, etc.)
- Mistral (Mistral Large, Mistral Medium, etc.)
- Cohere (Command R+, Command R, etc.)
- X.AI (Grok)

## Presets

- `tailwindPreset` - Tailwind CSS components
- `defaultPreset` - Basic HTML components
- `lucideIcons` - Lucide React icons

## License

MIT
