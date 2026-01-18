import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
    AIProviderConfig,
    StorageAdapter,
} from '../types';
import {
    AIService,
    createAIService,
    type AICallOptions,
    type AICallResult,
} from '../services/aiService';
import { useAIProvider } from './useAIProvider';

// ============================================================================
// Types
// ============================================================================

export interface UseAIServiceOptions {
    /** Storage adapter (defaults to localStorage) */
    storage?: StorageAdapter;
    /** Auto-initialize on mount */
    autoInitialize?: boolean;
}

export interface UseAIServiceReturn {
    /** AI service instance */
    service: AIService | null;
    /** Whether the service is initialized */
    isInitialized: boolean;
    /** Whether a request is in progress */
    isLoading: boolean;
    /** Current error, if any */
    error: string | null;
    /** Initialize the service */
    initialize: () => Promise<void>;
    /** Generate text using the configured provider */
    generateText: <T = string>(options: AICallOptions) => Promise<AICallResult<T>>;
    /** Stream text from the configured provider */
    streamText: (options: AICallOptions) => Promise<ReadableStream<string>>;
    /** Current provider configuration */
    config: AIProviderConfig | null;
    /** Check if custom provider is configured */
    isCustomProviderConfigured: boolean;
}

/**
 * Hook for using the AI service with automatic provider configuration sync
 * 
 * This hook integrates with useAIProvider to automatically sync provider
 * configuration and provides convenient methods for making AI API calls.
 */
export const useAIService = (
    options: UseAIServiceOptions = {}
): UseAIServiceReturn => {
    const { storage, autoInitialize = true } = options;
    
    // Get provider configuration from useAIProvider hook
    const { config: providerConfig } = useAIProvider({
        storage,
    });

    const [service] = useState<AIService>(() =>
        createAIService({ storage, initialConfig: providerConfig ?? undefined })
    );

    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize service
    const initialize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await service.initialize();
            setIsInitialized(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to initialize AI service';
            setError(errorMessage);
            setIsInitialized(false);
        } finally {
            setIsLoading(false);
        }
    }, [service]);

    // Auto-initialize on mount and when config changes
    useEffect(() => {
        if (autoInitialize && providerConfig) {
            // Update service config when provider config changes
            service.setConfig(providerConfig).then(() => {
                initialize();
            }).catch((err) => {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update service config';
                setError(errorMessage);
            });
        }
    }, [providerConfig, service, autoInitialize, initialize]);

    // Generate text wrapper
    const generateText = useCallback(
        async <T = string>(options: AICallOptions): Promise<AICallResult<T>> => {
            setIsLoading(true);
            setError(null);
            try {
                if (!isInitialized) {
                    await initialize();
                }
                const result = await service.generateText<T>(options);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'AI API call failed';
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [service, isInitialized, initialize]
    );

    // Stream text wrapper
    const streamText = useCallback(
        async (options: AICallOptions): Promise<ReadableStream<string>> => {
            setIsLoading(true);
            setError(null);
            try {
                if (!isInitialized) {
                    await initialize();
                }
                return await service.streamText(options);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'AI streaming failed';
                setError(errorMessage);
                setIsLoading(false);
                throw err;
            }
        },
        [service, isInitialized, initialize]
    );

    const isCustomProviderConfigured = useMemo(
        () => service.isCustomProviderConfigured(),
        [service, providerConfig]
    );

    return {
        service,
        isInitialized,
        isLoading,
        error,
        initialize,
        generateText,
        streamText,
        config: providerConfig,
        isCustomProviderConfigured,
    };
};
