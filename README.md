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
