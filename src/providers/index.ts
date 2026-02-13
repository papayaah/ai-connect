import type { LLMProvider, ProviderInfo, ModelInfo, PricingModel } from '../types';

// ============================================================================
// Pricing Data (as of December 2024)
// ============================================================================

const createPricing = (
    inputCostPer1M: number,
    outputCostPer1M: number,
    cachedInputCostPer1M?: number
): PricingModel => ({
    inputCostPer1M,
    outputCostPer1M,
    cachedInputCostPer1M,
    currency: 'USD',
    lastUpdated: '2024-12-01',
});

// Average tokens per symptom analysis (~200-500 tokens)
const AVERAGE_INPUT_TOKENS = 300;
const AVERAGE_OUTPUT_TOKENS = 400;

const calculateEstimatedCost = (pricing: PricingModel): number => {
    const inputCost = (AVERAGE_INPUT_TOKENS / 1_000_000) * pricing.inputCostPer1M;
    const outputCost = (AVERAGE_OUTPUT_TOKENS / 1_000_000) * pricing.outputCostPer1M;
    return inputCost + outputCost;
};

const getCostTier = (pricing: PricingModel): 'budget' | 'standard' | 'premium' => {
    const estimatedCost = calculateEstimatedCost(pricing);
    if (estimatedCost < 0.001) return 'budget';
    if (estimatedCost < 0.01) return 'standard';
    return 'premium';
};

// ============================================================================
// OpenAI Models
// ============================================================================

const openaiModels: ModelInfo[] = [
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable model for complex tasks',
        pricing: createPricing(2.50, 10.00, 1.25),
        contextLength: 128000,
        costTier: 'standard',
        recommended: true,
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable for most tasks',
        pricing: createPricing(0.15, 0.60, 0.075),
        contextLength: 128000,
        costTier: 'budget',
    },
    {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Previous generation, still powerful',
        pricing: createPricing(10.00, 30.00),
        contextLength: 128000,
        costTier: 'premium',
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective',
        pricing: createPricing(0.50, 1.50),
        contextLength: 16385,
        costTier: 'budget',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// Anthropic Models
// ============================================================================

const anthropicModels: ModelInfo[] = [
    {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: 'Best balance of speed and intelligence',
        pricing: createPricing(3.00, 15.00),
        contextLength: 200000,
        costTier: 'standard',
        recommended: true,
    },
    {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        description: 'Most powerful for complex reasoning',
        pricing: createPricing(15.00, 75.00),
        contextLength: 200000,
        costTier: 'premium',
    },
    {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fastest and most affordable',
        pricing: createPricing(0.80, 4.00),
        contextLength: 200000,
        costTier: 'budget',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// Google Models
// ============================================================================

const googleModels: ModelInfo[] = [
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Fast and efficient multimodal model',
        pricing: createPricing(0.10, 0.40),
        contextLength: 1000000,
        costTier: 'budget',
        recommended: true,
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Most capable for complex reasoning',
        pricing: createPricing(1.25, 10.00),
        contextLength: 1000000,
        costTier: 'standard',
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Balanced speed and capability',
        pricing: createPricing(0.30, 2.50),
        contextLength: 1000000,
        costTier: 'budget',
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Previous generation multimodal',
        pricing: createPricing(1.25, 5.00),
        contextLength: 2000000,
        costTier: 'standard',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// Mistral Models
// ============================================================================

const mistralModels: ModelInfo[] = [
    {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Most capable Mistral model',
        pricing: createPricing(2.00, 6.00),
        contextLength: 128000,
        costTier: 'standard',
        recommended: true,
    },
    {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        description: 'Efficient for most tasks',
        pricing: createPricing(0.20, 0.60),
        contextLength: 128000,
        costTier: 'budget',
    },
    {
        id: 'open-mistral-nemo',
        name: 'Mistral Nemo',
        description: 'Open-source compatible',
        pricing: createPricing(0.15, 0.15),
        contextLength: 128000,
        costTier: 'budget',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// Cohere Models
// ============================================================================

const cohereModels: ModelInfo[] = [
    {
        id: 'command-r-plus',
        name: 'Command R+',
        description: 'Most capable for RAG and enterprise',
        pricing: createPricing(2.50, 10.00),
        contextLength: 128000,
        costTier: 'standard',
        recommended: true,
    },
    {
        id: 'command-r',
        name: 'Command R',
        description: 'Balanced performance and cost',
        pricing: createPricing(0.15, 0.60),
        contextLength: 128000,
        costTier: 'budget',
    },
    {
        id: 'command',
        name: 'Command',
        description: 'Fast and efficient',
        pricing: createPricing(1.00, 2.00),
        contextLength: 4096,
        costTier: 'budget',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// xAI Models
// ============================================================================

const xaiModels: ModelInfo[] = [
    {
        id: 'grok-3',
        name: 'Grok 3',
        description: 'Most capable reasoning model',
        pricing: createPricing(3.00, 15.00),
        contextLength: 131072,
        costTier: 'standard',
        recommended: true,
    },
    {
        id: 'grok-3-mini',
        name: 'Grok 3 Mini',
        description: 'Fast and efficient',
        pricing: createPricing(0.30, 0.50),
        contextLength: 131072,
        costTier: 'budget',
    },
    {
        id: 'grok-2',
        name: 'Grok 2',
        description: 'Previous generation',
        pricing: createPricing(2.00, 10.00),
        contextLength: 131072,
        costTier: 'standard',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// Perplexity Models
// ============================================================================

const perplexityModels: ModelInfo[] = [
    {
        id: 'sonar-pro',
        name: 'Sonar Pro',
        description: 'Advanced search with citations',
        pricing: createPricing(3.00, 15.00),
        contextLength: 200000,
        costTier: 'standard',
        recommended: true,
    },
    {
        id: 'sonar',
        name: 'Sonar',
        description: 'Fast search with citations',
        pricing: createPricing(1.00, 1.00),
        contextLength: 128000,
        costTier: 'budget',
    },
    {
        id: 'sonar-reasoning',
        name: 'Sonar Reasoning',
        description: 'Complex reasoning with search',
        pricing: createPricing(1.00, 5.00),
        contextLength: 128000,
        costTier: 'standard',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// OpenRouter Models (includes free models)
// ============================================================================

const openrouterModels: ModelInfo[] = [
    {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash (Free)',
        description: 'Free, 1M context, vision support',
        pricing: createPricing(0, 0),
        contextLength: 1000000,
        costTier: 'budget',
        recommended: true,
    },
    {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B (Free)',
        description: 'Free, GPT-4 level performance',
        pricing: createPricing(0, 0),
        contextLength: 131072,
        costTier: 'budget',
    },
    {
        id: 'qwen/qwen3-235b-a22b:free',
        name: 'Qwen3 235B (Free)',
        description: 'Free, large MoE model',
        pricing: createPricing(0, 0),
        contextLength: 40960,
        costTier: 'budget',
    },
    {
        id: 'mistralai/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral Small 3.1 (Free)',
        description: 'Free, efficient for structured tasks',
        pricing: createPricing(0, 0),
        contextLength: 131072,
        costTier: 'budget',
    },
    {
        id: 'anthropic/claude-sonnet-4',
        name: 'Claude Sonnet 4',
        description: 'Best balance of speed and intelligence',
        pricing: createPricing(3.00, 15.00),
        contextLength: 200000,
        costTier: 'standard',
    },
    {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable OpenAI model',
        pricing: createPricing(2.50, 10.00),
        contextLength: 128000,
        costTier: 'standard',
    },
    {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable',
        pricing: createPricing(0.15, 0.60),
        contextLength: 128000,
        costTier: 'budget',
    },
    {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Balanced speed and capability',
        pricing: createPricing(0.15, 0.60),
        contextLength: 1000000,
        costTier: 'budget',
    },
].map(m => ({
    ...m,
    estimatedCostPerAnalysis: calculateEstimatedCost(m.pricing),
    costTier: getCostTier(m.pricing),
}));

// ============================================================================
// Provider Registry
// ============================================================================

export const providers: Record<LLMProvider, ProviderInfo> = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o and GPT-3.5 models',
        models: openaiModels,
        defaultModel: 'gpt-4o-mini',
        apiKeyPattern: /^sk-[a-zA-Z0-9]{20,}$/,
        apiKeyPlaceholder: 'sk-...',
        docsUrl: 'https://platform.openai.com/api-keys',
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude Sonnet and Opus models',
        models: anthropicModels,
        defaultModel: 'claude-sonnet-4-20250514',
        apiKeyPattern: /^sk-ant-[a-zA-Z0-9-]{20,}$/,
        apiKeyPlaceholder: 'sk-ant-...',
        docsUrl: 'https://console.anthropic.com/settings/keys',
    },
    google: {
        id: 'google',
        name: 'Google AI',
        description: 'Gemini 2.0 and 1.5 models',
        models: googleModels,
        defaultModel: 'gemini-2.0-flash',
        apiKeyPattern: /^AIza[a-zA-Z0-9_-]{35}$/,
        apiKeyPlaceholder: 'AIza...',
        docsUrl: 'https://aistudio.google.com/app/apikey',
    },
    mistral: {
        id: 'mistral',
        name: 'Mistral AI',
        description: 'Mistral Large and Small models',
        models: mistralModels,
        defaultModel: 'mistral-small-latest',
        apiKeyPlaceholder: 'Your API key',
        docsUrl: 'https://console.mistral.ai/api-keys',
    },
    cohere: {
        id: 'cohere',
        name: 'Cohere',
        description: 'Command R models for RAG',
        models: cohereModels,
        defaultModel: 'command-r',
        apiKeyPlaceholder: 'Your API key',
        docsUrl: 'https://dashboard.cohere.com/api-keys',
    },
    xai: {
        id: 'xai',
        name: 'xAI',
        description: 'Grok models',
        models: xaiModels,
        defaultModel: 'grok-3-mini',
        apiKeyPlaceholder: 'xai-...',
        docsUrl: 'https://console.x.ai/',
    },
    perplexity: {
        id: 'perplexity',
        name: 'Perplexity',
        description: 'Sonar models with web search',
        models: perplexityModels,
        defaultModel: 'sonar',
        apiKeyPattern: /^pplx-[a-zA-Z0-9]{20,}$/,
        apiKeyPlaceholder: 'pplx-...',
        docsUrl: 'https://www.perplexity.ai/settings/api',
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        description: '300+ models including free ones',
        models: openrouterModels,
        defaultModel: 'google/gemini-2.0-flash-exp:free',
        apiKeyPattern: /^sk-or-v1-[a-f0-9]{64}$/,
        apiKeyPlaceholder: 'sk-or-v1-...',
        docsUrl: 'https://openrouter.ai/keys',
    },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get provider information by ID
 */
export const getProvider = (providerId: LLMProvider): ProviderInfo | undefined => {
    return providers[providerId];
};

/**
 * Get all available providers
 */
export const getAllProviders = (): ProviderInfo[] => {
    return Object.values(providers);
};

/**
 * Get available models for a provider
 */
export const getModels = (providerId: LLMProvider): ModelInfo[] => {
    return providers[providerId]?.models ?? [];
};

/**
 * Get a specific model by provider and model ID
 */
export const getModel = (providerId: LLMProvider, modelId: string): ModelInfo | undefined => {
    return providers[providerId]?.models.find(m => m.id === modelId);
};

/**
 * Get the default model for a provider
 */
export const getDefaultModel = (providerId: LLMProvider): string => {
    return providers[providerId]?.defaultModel ?? '';
};

/**
 * Get the recommended model for a provider
 */
export const getRecommendedModel = (providerId: LLMProvider): ModelInfo | undefined => {
    return providers[providerId]?.models.find(m => m.recommended);
};

/**
 * Calculate cost for a given token usage
 */
export const calculateCost = (
    providerId: LLMProvider,
    modelId: string,
    inputTokens: number,
    outputTokens: number
): number => {
    const model = getModel(providerId, modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.outputCostPer1M;
    return inputCost + outputCost;
};

/**
 * Estimate monthly cost based on usage pattern
 */
export const estimateMonthlyCost = (
    providerId: LLMProvider,
    modelId: string,
    analysesPerMonth: number = 10
): number => {
    const model = getModel(providerId, modelId);
    if (!model || !model.estimatedCostPerAnalysis) return 0;
    return model.estimatedCostPerAnalysis * analysesPerMonth;
};

/**
 * Validate API key format for a provider
 */
export const validateApiKeyFormat = (providerId: LLMProvider, apiKey: string): boolean => {
    const provider = providers[providerId];
    if (!provider?.apiKeyPattern) return apiKey.length > 0;
    return provider.apiKeyPattern.test(apiKey);
};

/**
 * Get cost tier indicator
 */
export const getCostTierEmoji = (tier: 'budget' | 'standard' | 'premium'): string => {
    switch (tier) {
        case 'budget': return '$';
        case 'standard': return '$$';
        case 'premium': return '$$$';
    }
};

/**
 * Get cost tier label
 */
export const getCostTierLabel = (tier: 'budget' | 'standard' | 'premium'): string => {
    switch (tier) {
        case 'budget': return 'Budget';
        case 'standard': return 'Standard';
        case 'premium': return 'Premium';
    }
};

/**
 * Format cost as currency string
 */
export const formatCost = (cost: number): string => {
    if (cost < 0.001) return '<$0.001';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    if (cost < 1) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(2)}`;
};

/**
 * Format large numbers (tokens, etc.)
 */
export const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};
