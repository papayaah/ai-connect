import { useState, useCallback } from 'react';
import type { LLMProvider, ValidationResult, CustomLLMConfig } from '../types';
import { validateApiKeyFormat, getProvider } from '../providers';
import { useAIManagementContextOptional } from '../components/AIManagementProvider';

export interface UseProviderValidationReturn {
    /** Validate an API key for a provider */
    validateApiKey: (provider: LLMProvider, apiKey: string, model?: string) => Promise<ValidationResult>;
    /** Test a full provider connection */
    testConnection: (config: CustomLLMConfig) => Promise<boolean>;
    /** Whether validation is in progress */
    isValidating: boolean;
    /** Last validation error */
    lastError: string | null;
    /** Whether last validation was successful */
    lastSuccess: boolean;
    /** Clear the last error and success */
    clearError: () => void;
}

/**
 * Hook for validating API keys and testing provider connections
 */
export const useProviderValidation = (): UseProviderValidationReturn => {
    const [isValidating, setIsValidating] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastSuccess, setLastSuccess] = useState(false);
    const aiContext = useAIManagementContextOptional();

    const clearError = useCallback(() => {
        setLastError(null);
        setLastSuccess(false);
    }, []);

    const validateApiKey = useCallback(
        async (provider: LLMProvider, apiKey: string, model?: string): Promise<ValidationResult> => {
            setIsValidating(true);
            setLastError(null);
            setLastSuccess(false);

            try {
                // Check if API key is provided
                if (!apiKey || apiKey.trim().length === 0) {
                    const error = 'API key cannot be empty';
                    setLastError(error);
                    return { isValid: false, error };
                }

                // Validate format
                if (!validateApiKeyFormat(provider, apiKey)) {
                    const providerInfo = getProvider(provider);
                    const error = `Invalid API key format. Expected format: ${providerInfo?.apiKeyPlaceholder ?? 'Valid API key'}`;
                    setLastError(error);
                    return { isValid: false, error };
                }

                // Try a lightweight API call to verify the key works
                try {
                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'x-provider': provider,
                    };

                    if (model) {
                        headers['x-model'] = model;
                    }

                    // Set a timeout for the fetch request
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                    const res = await fetch('/api/ai/status', {
                        method: 'POST',
                        headers,
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        const error = data.error || `API key validation failed (${res.status})`;
                        setLastError(error);
                        return { isValid: false, error };
                    }

                    // Record usage for validation call
                    const data = await res.json().catch(() => ({}));
                    if (data.usage && aiContext?.recordUsage) {
                        aiContext.recordUsage(
                            provider,
                            model || 'test-model',
                            {
                                inputTokens: data.usage.promptTokens,
                                outputTokens: data.usage.completionTokens,
                                totalTokens: data.usage.totalTokens
                            }
                        );
                    }
                } catch (error) {
                    // Only log real errors, not aborts
                    if (error instanceof Error && error.name === 'AbortError') {
                        const timeoutError = 'Validation timed out. Please check your connection or try again.';
                        setLastError(timeoutError);
                        return { isValid: false, error: timeoutError };
                    }
                    // If the status endpoint doesn't exist or fails, fall through to format-only validation
                }

                const providerInfo = getProvider(provider);
                setLastSuccess(true);
                return {
                    isValid: true,
                    availableModels: providerInfo?.models.map(m => m.id),
                    defaultModel: providerInfo?.defaultModel,
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Validation failed';
                setLastError(errorMessage);
                return { isValid: false, error: errorMessage };
            } finally {
                setIsValidating(false);
            }
        },
        [aiContext]
    );

    const testConnection = useCallback(
        async (config: CustomLLMConfig): Promise<boolean> => {
            const result = await validateApiKey(config.provider, config.apiKey, config.model);
            return result.isValid;
        },
        [validateApiKey]
    );

    return {
        validateApiKey,
        testConnection,
        isValidating,
        lastError,
        lastSuccess,
        clearError,
    };
};
