import type {
    CustomLLMConfig,
    AIProviderConfig,
    TokenUsage,
    StorageAdapter,
} from '../types';
import { CostTrackingService, createCostTrackingService } from './costTracking';
import { AISettingsService, createAISettingsService } from './aiSettings';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for making AI API calls
 */
export interface AICallOptions {
    /** The prompt/message to send to the AI */
    prompt: string;
    /** Optional system prompt */
    systemPrompt?: string;
    /** Temperature setting (0-1) */
    temperature?: number;
    /** Maximum tokens in response */
    maxTokens?: number;
    /** Whether to track costs (default: true for custom providers) */
    trackCosts?: boolean;
}

/**
 * Result from an AI API call
 */
export interface AICallResult<T = string> {
    /** The response text/data */
    text: T;
    /** Token usage information */
    usage: TokenUsage;
    /** Provider used */
    provider: string;
    /** Model used */
    model: string;
    /** Raw response object from Vercel AI SDK */
    rawResponse?: unknown;
}

/**
 * Options for creating an AI service instance
 */
export interface AIServiceOptions {
    /** Storage adapter (defaults to localStorage) */
    storage?: StorageAdapter;
    /** Initial provider configuration */
    initialConfig?: AIProviderConfig;
}

// ============================================================================
// Vercel AI SDK Model Factory
// ============================================================================

/**
 * Creates a Vercel AI SDK model instance from a custom LLM configuration
 * 
 * This function dynamically imports the appropriate Vercel AI SDK provider
 * based on the configuration. The Vercel AI SDK packages must be installed
 * as peer dependencies.
 * 
 * @param config - Custom LLM configuration
 * @returns Promise resolving to a Vercel AI SDK model instance
 * @throws Error if provider package is not installed or config is invalid
 */
export async function createVercelAIModel(config: CustomLLMConfig): Promise<any> {
    const { provider, model, apiKey, baseUrl } = config;

    try {
        switch (provider) {
            case 'openai': {
                const { openai } = await import('@ai-sdk/openai');
                return openai(model, {
                    apiKey,
                    baseURL: baseUrl,
                });
            }
            case 'anthropic': {
                const { anthropic } = await import('@ai-sdk/anthropic');
                return anthropic(model, {
                    apiKey,
                    baseURL: baseUrl,
                });
            }
            case 'google': {
                const { google } = await import('@ai-sdk/google');
                return google(model, {
                    apiKey,
                    baseURL: baseUrl,
                });
            }
            case 'mistral': {
                const { mistral } = await import('@ai-sdk/mistral');
                return mistral(model, {
                    apiKey,
                    baseURL: baseUrl,
                });
            }
            case 'cohere': {
                const { cohere } = await import('@ai-sdk/cohere');
                return cohere(model, {
                    apiKey,
                    baseURL: baseUrl,
                });
            }
            case 'xai': {
                const { createXai } = await import('@ai-sdk/xai');
                return createXai({
                    apiKey,
                    baseURL: baseUrl,
                })(model);
            }
            case 'perplexity': {
                // Perplexity uses OpenAI-compatible API
                const { openai } = await import('@ai-sdk/openai');
                return openai(model, {
                    apiKey,
                    baseURL: baseUrl || 'https://api.perplexity.ai',
                });
            }
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot find module')) {
            throw new Error(
                `Vercel AI SDK package for ${provider} is not installed. ` +
                `Please install @ai-sdk/${provider === 'xai' ? 'xai' : provider}`
            );
        }
        throw error;
    }
}

// ============================================================================
// AI Service
// ============================================================================

/**
 * Service for making AI API calls using Vercel AI SDK
 * 
 * This service handles:
 * - Provider initialization from configuration
 * - Making API calls via Vercel AI SDK
 * - Token usage extraction and cost tracking
 * - Error handling with provider-specific messages
 */
export class AIService {
    private settingsService: AISettingsService;
    private costTrackingService: CostTrackingService;
    private currentModel: any = null;
    private currentConfig: AIProviderConfig | null = null;

    constructor(options: AIServiceOptions = {}) {
        const { storage, initialConfig } = options;
        this.settingsService = createAISettingsService(storage);
        this.costTrackingService = createCostTrackingService(storage);
        
        if (initialConfig) {
            this.settingsService.setProviderConfig(initialConfig);
        }
        
        this.currentConfig = this.settingsService.getProviderConfig();
    }

    /**
     * Initialize the AI service with the current provider configuration
     */
    async initialize(): Promise<void> {
        const config = this.settingsService.getProviderConfig();
        
        if (!config) {
            throw new Error('No AI provider configuration found. Please configure a provider first.');
        }

        // Only initialize Vercel AI SDK model for custom providers
        if (config.type === 'custom-llm' && config.customLLM) {
            this.currentModel = await createVercelAIModel(config.customLLM);
            this.currentConfig = config;
        } else {
            // Chrome AI and Hosted API are handled elsewhere
            this.currentModel = null;
            this.currentConfig = config;
        }
    }

    /**
     * Make an AI API call using the configured provider
     * 
     * @param options - Call options including prompt and settings
     * @returns Promise resolving to the AI response with usage data
     */
    async generateText<T = string>(options: AICallOptions): Promise<AICallResult<T>> {
        const config = this.settingsService.getProviderConfig();
        
        if (!config) {
            throw new Error('No AI provider configured');
        }

        // Handle different provider types
        if (config.type === 'custom-llm' && config.customLLM) {
            return this.generateTextWithCustomProvider<T>(config.customLLM, options);
        } else if (config.type === 'chrome') {
            throw new Error(
                'Chrome AI is not supported through this service. ' +
                'Use the useChromeAI hook instead.'
            );
        } else if (config.type === 'hosted-api') {
            throw new Error(
                'Hosted API is not supported through this service. ' +
                'Use your application\'s hosted API endpoint instead.'
            );
        } else {
            throw new Error(`Unknown provider type: ${config.type}`);
        }
    }

    /**
     * Make an AI API call with a custom provider using Vercel AI SDK
     */
    private async generateTextWithCustomProvider<T>(
        config: CustomLLMConfig,
        options: AICallOptions
    ): Promise<AICallResult<T>> {
        // Ensure model is initialized
        if (!this.currentModel || this.currentConfig?.customLLM?.provider !== config.provider) {
            this.currentModel = await createVercelAIModel(config);
        }

        // Import generateText from Vercel AI SDK
        const { generateText } = await import('ai');

        try {
            const result = await generateText({
                model: this.currentModel,
                prompt: options.prompt,
                system: options.systemPrompt,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
            });

            // Extract token usage
            const usage: TokenUsage = {
                inputTokens: result.usage?.promptTokens ?? 0,
                outputTokens: result.usage?.completionTokens ?? 0,
                totalTokens: result.usage?.totalTokens ?? 0,
            };

            // Track costs if enabled
            const shouldTrackCosts = options.trackCosts !== false;
            if (shouldTrackCosts) {
                this.costTrackingService.recordApiCall(
                    config.provider,
                    config.model,
                    usage
                );
            }

            return {
                text: result.text as T,
                usage,
                provider: config.provider,
                model: config.model,
                rawResponse: result,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(
                `AI API call failed (${config.provider}): ${errorMessage}`
            );
        }
    }

    /**
     * Stream text from AI API (for streaming responses)
     * 
     * @param options - Call options including prompt and settings
     * @returns ReadableStream of text chunks
     */
    async streamText(options: AICallOptions): Promise<ReadableStream<string>> {
        const config = this.settingsService.getProviderConfig();
        
        if (!config || config.type !== 'custom-llm' || !config.customLLM) {
            throw new Error('Streaming is only supported for custom LLM providers');
        }

        // Ensure model is initialized
        if (!this.currentModel || this.currentConfig?.customLLM?.provider !== config.customLLM.provider) {
            this.currentModel = await createVercelAIModel(config.customLLM);
        }

        // Import streamText from Vercel AI SDK
        const { streamText } = await import('ai');

        try {
            const result = await streamText({
                model: this.currentModel,
                prompt: options.prompt,
                system: options.systemPrompt,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
            });

            // Return the text stream
            return result.textStream;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(
                `AI streaming failed (${config.customLLM.provider}): ${errorMessage}`
            );
        }
    }

    /**
     * Get the current provider configuration
     */
    getConfig(): AIProviderConfig | null {
        return this.settingsService.getProviderConfig();
    }

    /**
     * Update the provider configuration and reinitialize
     */
    async setConfig(config: AIProviderConfig): Promise<void> {
        this.settingsService.setProviderConfig(config);
        this.currentConfig = config;
        await this.initialize();
    }

    /**
     * Check if a custom provider is configured
     */
    isCustomProviderConfigured(): boolean {
        const config = this.settingsService.getProviderConfig();
        return config?.type === 'custom-llm' && !!config.customLLM;
    }
}

/**
 * Create an AI service instance
 */
export function createAIService(options?: AIServiceOptions): AIService {
    return new AIService(options);
}
