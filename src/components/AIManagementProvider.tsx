import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type {
    AIManagementContextValue,
    AIProviderConfig,
    StorageAdapter,
    TokenUsage,
    LLMProvider,
} from '../types';
import { useAIProvider } from '../hooks/useAIProvider';
import { useCostTracking } from '../hooks/useCostTracking';
import { localStorageAdapter } from '../services';

// ============================================================================
// Context
// ============================================================================

const AIManagementContext = createContext<AIManagementContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface AIManagementProviderProps {
    children: ReactNode;
    storage?: StorageAdapter;
    initialConfig?: AIProviderConfig;
}

/**
 * Provider component for AI Management context
 * Wraps your app to provide AI provider configuration and cost tracking
 */
export const AIManagementProvider: React.FC<AIManagementProviderProps> = ({
    children,
    storage = localStorageAdapter,
    initialConfig,
}) => {
    const {
        config,
        setConfig,
        clearConfig,
    } = useAIProvider({ storage });

    const {
        usageStats,
        recordUsage,
        resetStats,
    } = useCostTracking({ storage });

    // Set initial config if provided and no existing config
    React.useEffect(() => {
        if (initialConfig && !config) {
            setConfig(initialConfig);
        }
    }, [initialConfig, config, setConfig]);

    const isValid = useMemo(() => {
        if (!config) return false;
        if (config.type === 'chrome' || config.type === 'hosted-api') return true;
        if (config.type === 'custom-llm') {
            return !!(config.customLLM?.apiKey && config.customLLM?.provider && config.customLLM?.model);
        }
        return false;
    }, [config]);

    const value: AIManagementContextValue = useMemo(
        () => ({
            config,
            setConfig,
            clearConfig,
            isValid,
            isLoading: false,
            error: null,
            usageStats,
            recordUsage: (provider: LLMProvider, model: string, tokens: TokenUsage) => {
                recordUsage(provider, model, tokens);
            },
            resetUsageStats: resetStats,
            storage,
        }),
        [config, setConfig, clearConfig, isValid, usageStats, recordUsage, resetStats, storage]
    );

    return (
        <AIManagementContext.Provider value={value}>
            {children}
        </AIManagementContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access AI Management context
 * Must be used within an AIManagementProvider
 */
export const useAIManagementContext = (): AIManagementContextValue => {
    const context = useContext(AIManagementContext);
    if (!context) {
        throw new Error('useAIManagementContext must be used within an AIManagementProvider');
    }
    return context;
};

/**
 * Hook to access AI Management context (optional)
 * Returns null if not within an AIManagementProvider
 */
export const useAIManagementContextOptional = (): AIManagementContextValue | null => {
    return useContext(AIManagementContext);
};
