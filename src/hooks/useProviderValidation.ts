import { useState, useCallback } from 'react';
import type { LLMProvider, ValidationResult, CustomLLMConfig } from '../types';
import { validateApiKeyFormat, getProvider } from '../providers';

export interface UseProviderValidationReturn {
    /** Validate an API key for a provider */
    validateApiKey: (provider: LLMProvider, apiKey: string) => Promise<ValidationResult>;
    /** Test a full provider connection */
    testConnection: (config: CustomLLMConfig) => Promise<boolean>;
    /** Whether validation is in progress */
    isValidating: boolean;
    /** Last validation error */
    lastError: string | null;
    /** Clear the last error */
    clearError: () => void;
}

/**
 * Hook for validating API keys and testing provider connections
 */
export const useProviderValidation = (): UseProviderValidationReturn => {
    const [isValidating, setIsValidating] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setLastError(null);
    }, []);

    const validateApiKey = useCallback(
        async (provider: LLMProvider, apiKey: string): Promise<ValidationResult> => {
            setIsValidating(true);
            setLastError(null);

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

                // In a production environment, you would make a lightweight API call here
                // to verify the key actually works. For now, we do format validation only.
                //
                // Example verification approaches:
                // - OpenAI: GET /v1/models
                // - Anthropic: Send a minimal message
                // - Google: GET /v1/models
                //
                // This would typically be done through a server-side proxy to avoid
                // exposing API keys in client-side network requests.

                const providerInfo = getProvider(provider);
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
        []
    );

    const testConnection = useCallback(
        async (config: CustomLLMConfig): Promise<boolean> => {
            const result = await validateApiKey(config.provider, config.apiKey);
            return result.isValid;
        },
        [validateApiKey]
    );

    return {
        validateApiKey,
        testConnection,
        isValidating,
        lastError,
        clearError,
    };
};
