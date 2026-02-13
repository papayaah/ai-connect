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
 * Options for making AI API calls with image input (vision)
 */
export interface AIVisionCallOptions extends AICallOptions {
    /** Image data as base64 data URL (e.g. "data:image/png;base64,...") or raw Uint8Array */
    image: string | Uint8Array;
    /** MIME type of the image (required when image is Uint8Array) */
    mimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
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
                try {
                    const { openai } = await import('@ai-sdk/openai');
                    return openai(model, { apiKey, baseURL: baseUrl });
                } catch (e) { throw new Error('Please install @ai-sdk/openai to use OpenAI'); }
            }
            case 'anthropic': {
                try {
                    const { anthropic } = await import('@ai-sdk/anthropic');
                    return anthropic(model, { apiKey, baseURL: baseUrl });
                } catch (e) { throw new Error('Please install @ai-sdk/anthropic to use Anthropic'); }
            }
            case 'google': {
                try {
                    const { google } = await import('@ai-sdk/google');
                    return google(model, { apiKey, baseURL: baseUrl });
                } catch (e) { throw new Error('Please install @ai-sdk/google to use Google'); }
            }
            case 'mistral': {
                try {
                    const { mistral } = await import('@ai-sdk/mistral');
                    return mistral(model, { apiKey, baseURL: baseUrl });
                } catch (e) { throw new Error('Please install @ai-sdk/mistral to use Mistral'); }
            }
            case 'cohere': {
                try {
                    const { cohere } = await import('@ai-sdk/cohere');
                    return cohere(model, { apiKey, baseURL: baseUrl });
                } catch (e) { throw new Error('Please install @ai-sdk/cohere to use Cohere'); }
            }
            case 'xai': {
                try {
                    const { createXai } = await import('@ai-sdk/xai');
                    return createXai({ apiKey, baseURL: baseUrl })(model);
                } catch (e) { throw new Error('Please install @ai-sdk/xai to use xAI'); }
            }
            case 'perplexity': {
                try {
                    const { openai } = await import('@ai-sdk/openai');
                    return openai(model, { apiKey, baseURL: baseUrl || 'https://api.perplexity.ai' });
                } catch (e) { throw new Error('Please install @ai-sdk/openai to use Perplexity'); }
            }
            case 'openrouter': {
                try {
                    const { openai } = await import('@ai-sdk/openai');
                    return openai(model, { apiKey, baseURL: baseUrl || 'https://openrouter.ai/api/v1' });
                } catch (e) { throw new Error('Please install @ai-sdk/openai to use OpenRouter'); }
            }
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    } catch (error) {
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
     * Generate text from an image + text prompt (vision)
     *
     * Uses the Vercel AI SDK's multimodal message format to send an image
     * alongside a text prompt to a vision-capable model.
     *
     * @param options - Call options including image data, prompt, and settings
     * @returns Promise resolving to the AI response with usage data
     */
    async generateTextWithImage<T = string>(options: AIVisionCallOptions): Promise<AICallResult<T>> {
        const config = this.settingsService.getProviderConfig();

        if (!config || config.type !== 'custom-llm' || !config.customLLM) {
            throw new Error('Vision requires a custom LLM provider to be configured');
        }

        const llmConfig = config.customLLM;

        // Ensure model is initialized
        if (!this.currentModel || this.currentConfig?.customLLM?.provider !== llmConfig.provider) {
            this.currentModel = await createVercelAIModel(llmConfig);
        }

        const { generateText } = await import('ai');

        try {
            const result = await generateText({
                model: this.currentModel,
                system: options.systemPrompt,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                image: options.image,
                                mimeType: options.mimeType,
                            },
                            {
                                type: 'text',
                                text: options.prompt,
                            },
                        ],
                    },
                ],
            });

            const usage: TokenUsage = {
                inputTokens: result.usage?.promptTokens ?? 0,
                outputTokens: result.usage?.completionTokens ?? 0,
                totalTokens: result.usage?.totalTokens ?? 0,
            };

            const shouldTrackCosts = options.trackCosts !== false;
            if (shouldTrackCosts) {
                this.costTrackingService.recordApiCall(
                    llmConfig.provider,
                    llmConfig.model,
                    usage
                );
            }

            return {
                text: result.text as T,
                usage,
                provider: llmConfig.provider,
                model: llmConfig.model,
                rawResponse: result,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(
                `AI vision call failed (${llmConfig.provider}): ${errorMessage}`
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
