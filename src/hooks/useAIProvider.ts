import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
    AIProviderConfig,
    AIProviderType,
    CustomLLMConfig,
    StorageAdapter,
} from '../types';
import { AISettingsService, localStorageAdapter } from '../services';

export interface UseAIProviderOptions {
    storage?: StorageAdapter;
    onConfigChange?: (config: AIProviderConfig | null) => void;
}

export interface UseAIProviderReturn {
    /** Current provider configuration */
    config: AIProviderConfig | null;
    /** Set the provider configuration */
    setConfig: (config: AIProviderConfig) => void;
    /** Clear the provider configuration */
    clearConfig: () => void;
    /** Current provider type */
    providerType: AIProviderType;
    /** Custom LLM configuration (if using custom provider) */
    customLLMConfig: CustomLLMConfig | null;
    /** Set custom LLM configuration */
    setCustomLLMConfig: (config: CustomLLMConfig) => void;
    /** Whether the provider is configured */
    isConfigured: boolean;
    /** Whether using a custom API key */
    isUsingCustomKey: boolean;
    /** Masked API key for display */
    maskedApiKey: string | null;
    /** Settings service instance */
    settingsService: AISettingsService;
}

/**
 * Hook for managing AI provider configuration
 */
export const useAIProvider = (
    options: UseAIProviderOptions = {}
): UseAIProviderReturn => {
    const { storage = localStorageAdapter, onConfigChange } = options;

    const settingsService = useMemo(
        () => new AISettingsService(storage),
        [storage]
    );

    const [config, setConfigState] = useState<AIProviderConfig | null>(() =>
        settingsService.getProviderConfig()
    );

    // Sync with storage on mount
    useEffect(() => {
        const storedConfig = settingsService.getProviderConfig();
        if (JSON.stringify(storedConfig) !== JSON.stringify(config)) {
            setConfigState(storedConfig);
        }
    }, [settingsService, config]);

    const setConfig = useCallback(
        (newConfig: AIProviderConfig) => {
            settingsService.setProviderConfig(newConfig);
            setConfigState(newConfig);
            onConfigChange?.(newConfig);
        },
        [settingsService, onConfigChange]
    );

    const clearConfig = useCallback(() => {
        settingsService.clearProviderConfig();
        setConfigState(null);
        onConfigChange?.(null);
    }, [settingsService, onConfigChange]);

    const setCustomLLMConfig = useCallback(
        (customConfig: CustomLLMConfig) => {
            settingsService.setCustomLLMConfig(customConfig);
            const newConfig = settingsService.getProviderConfig();
            setConfigState(newConfig);
            onConfigChange?.(newConfig);
        },
        [settingsService, onConfigChange]
    );

    const providerType = config?.type ?? 'hosted-api';
    const customLLMConfig = config?.customLLM ?? null;
    const isConfigured = config !== null;
    const isUsingCustomKey = config?.type === 'custom-llm' && !!config.customLLM?.apiKey;
    const maskedApiKey = settingsService.getMaskedApiKey();

    return {
        config,
        setConfig,
        clearConfig,
        providerType,
        customLLMConfig,
        setCustomLLMConfig,
        isConfigured,
        isUsingCustomKey,
        maskedApiKey,
        settingsService,
    };
};
