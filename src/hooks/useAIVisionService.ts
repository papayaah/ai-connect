import { useState, useCallback } from 'react';
import type {
    StorageAdapter,
    AIProviderConfig,
} from '../types';
import {
    AIService,
    createAIService,
    type AIVisionCallOptions,
    type AICallResult,
} from '../services/aiService';
import { useAIProvider } from './useAIProvider';

// ============================================================================
// Types
// ============================================================================

export interface UseAIVisionServiceOptions {
    /** Storage adapter (defaults to localStorage) */
    storage?: StorageAdapter;
}

export interface UseAIVisionServiceReturn {
    /** Whether a vision request is in progress */
    isProcessing: boolean;
    /** Current error, if any */
    error: string | null;
    /** Generate text from an image + prompt */
    generateTextWithImage: <T = string>(options: AIVisionCallOptions) => Promise<AICallResult<T>>;
    /** Current provider configuration */
    config: AIProviderConfig | null;
    /** Whether a vision-capable provider is configured */
    isConfigured: boolean;
}

/**
 * Hook for using AI vision (image + text) capabilities.
 *
 * Wraps AIService.generateTextWithImage with React state management
 * for loading/error states and automatic provider configuration sync.
 *
 * @example
 * ```tsx
 * const { generateTextWithImage, isProcessing, error } = useAIVisionService();
 *
 * const result = await generateTextWithImage({
 *   prompt: 'Extract the trade data from this table image as JSON.',
 *   image: base64DataUrl,
 *   temperature: 0,
 * });
 * ```
 */
export const useAIVisionService = (
    options: UseAIVisionServiceOptions = {}
): UseAIVisionServiceReturn => {
    const { storage } = options;

    const { config: providerConfig } = useAIProvider({ storage });

    const [service] = useState<AIService>(() =>
        createAIService({ storage, initialConfig: providerConfig ?? undefined })
    );

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateTextWithImage = useCallback(
        async <T = string>(callOptions: AIVisionCallOptions): Promise<AICallResult<T>> => {
            setIsProcessing(true);
            setError(null);
            try {
                // Sync config before calling
                if (providerConfig) {
                    await service.setConfig(providerConfig);
                }
                const result = await service.generateTextWithImage<T>(callOptions);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Vision API call failed';
                setError(errorMessage);
                throw err;
            } finally {
                setIsProcessing(false);
            }
        },
        [service, providerConfig]
    );

    const isConfigured = providerConfig?.type === 'custom-llm' && !!providerConfig.customLLM;

    return {
        isProcessing,
        error,
        generateTextWithImage,
        config: providerConfig,
        isConfigured,
    };
};
