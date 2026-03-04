'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
    AIProviderSelectorProps,
    AIProviderType,
    AIProviderConfig,
    LLMProvider,
    ChromeAIStatus as ChromeAIStatusType,
} from '../types';
import { defaultPreset } from '../presets/default';
import { getAllProviders, getDefaultModel } from '../providers';
import { ProviderCard } from './ProviderCard';
import { ModelSelector } from './ModelSelector';
import { APIKeyInput } from './APIKeyInput';
import { CostDisplay } from './CostDisplay';
import { ChromeAIStatus } from './ChromeAIStatus';
import { useChromeAI, useProviderPricing } from '../hooks';
import { useAIManagementContextOptional } from './AIManagementProvider';

/**
 * Main AI Provider Selector component
 * Allows users to choose between Chrome AI, Hosted API, or Custom LLM providers
 */
export const AIProviderSelector = ({
    onProviderSelect,
    onValidationComplete,
    onCostEstimate,
    defaultProvider,
    showCostComparison = true,
    enabledProviders,
    customPricing,
    // theme is reserved for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    theme: _theme = 'light',
    className = '',
    // storage is reserved for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    storage: _storage,
    preset = defaultPreset,
    icons,
    analysesPerMonth = 10,
}: AIProviderSelectorProps) => {
    const { Button, Select, Alert } = preset;
    const aiContext = useAIManagementContextOptional();

    // State
    const [selectedType, setSelectedType] = useState<AIProviderType>(defaultProvider ?? 'hosted-api');
    const [selectedLLMProvider, setSelectedLLMProvider] = useState<LLMProvider>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [chromeAIStatus, setChromeAIStatus] = useState<ChromeAIStatusType>('checking');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const isFirstProviderChange = useRef(true);

    // Hooks - Chrome AI status check
    useChromeAI();
    const { getCostEstimate } = useProviderPricing({
        provider: selectedLLMProvider,
        customPricing,
    });

    // Initialize from context on mount
    useEffect(() => {
        if (!hasInitialized && aiContext?.config) {
            const { config } = aiContext;
            setSelectedType(config.type);

            if (config.type === 'custom-llm' && config.customLLM) {
                // IMPORTANT: Set initial model first
                setSelectedLLMProvider(config.customLLM.provider);
                setSelectedModel(config.customLLM.model);
                setApiKey(config.customLLM.apiKey);
            }
            setHasInitialized(true);
        } else if (!hasInitialized && aiContext && !aiContext.config) {
            // Context is ready but has no config, mark as initialized to allow defaults
            setHasInitialized(true);
        }
    }, [aiContext, hasInitialized]);

    // Get available LLM providers
    const availableProviders = getAllProviders().filter(
        (p) => !enabledProviders || enabledProviders.includes(p.id)
    );

    // Set default model when provider changes - ONLY if not initializing
    useEffect(() => {
        if (hasInitialized) {
            // Skip the very first provider change if it was part of initialization
            if (isFirstProviderChange.current) {
                isFirstProviderChange.current = false;
                return;
            }
            const defaultModel = getDefaultModel(selectedLLMProvider);
            setSelectedModel(defaultModel);
        }
    }, [selectedLLMProvider, hasInitialized]);

    // Notify cost estimate changes
    useEffect(() => {
        if (selectedType === 'custom-llm' && selectedModel) {
            const estimate = getCostEstimate(selectedModel, analysesPerMonth);
            if (estimate) {
                onCostEstimate?.(estimate);
            }
        }
    }, [selectedType, selectedLLMProvider, selectedModel, analysesPerMonth, getCostEstimate, onCostEstimate]);

    // Handle provider type selection
    const handleTypeSelect = useCallback((type: AIProviderType) => {
        setSelectedType(type);
    }, []);

    // Handle Chrome AI status change
    const handleChromeAIStatusChange = useCallback((status: ChromeAIStatusType) => {
        setChromeAIStatus(status);
    }, []);

    // Handle API key validation
    const handleApiKeyValidate = useCallback((isValid: boolean) => {
        onValidationComplete?.(isValid, selectedLLMProvider);
    }, [selectedLLMProvider, onValidationComplete]);

    // Handle save/confirm
    const handleConfirm = useCallback(() => {
        let config: AIProviderConfig;

        switch (selectedType) {
            case 'chrome':
                config = {
                    type: 'chrome',
                    lastUpdated: new Date().toISOString(),
                };
                break;

            case 'hosted-api':
                config = {
                    type: 'hosted-api',
                    lastUpdated: new Date().toISOString(),
                };
                break;

            case 'custom-llm':
                config = {
                    type: 'custom-llm',
                    customLLM: {
                        provider: selectedLLMProvider,
                        model: selectedModel,
                        apiKey: apiKey,
                    },
                    lastUpdated: new Date().toISOString(),
                };
                break;

            default:
                return;
        }

        onProviderSelect(config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    }, [selectedType, selectedLLMProvider, selectedModel, apiKey, onProviderSelect]);

    // Check if can proceed — allow saving with any non-empty API key (Validate is optional)
    const canProceed = () => {
        switch (selectedType) {
            case 'chrome':
                return chromeAIStatus === 'available';
            case 'hosted-api':
                return true;
            case 'custom-llm':
                return apiKey.trim().length > 0 && !!selectedModel;
            default:
                return false;
        }
    };

    return (
        <div className={`flex flex-col gap-6 ${className}`}>
            {/* Provider Type Selection */}
            <div>
                <h3 className="m-0 mb-4 text-lg font-semibold">
                    Choose Your AI Provider
                </h3>

                <div className="flex flex-col gap-3">
                    {/* Chrome AI Option */}
                    <ProviderCard
                        providerType="chrome"
                        selected={selectedType === 'chrome'}
                        onSelect={() => handleTypeSelect('chrome')}
                        badge="Offline & Private"
                        available={chromeAIStatus === 'available' || chromeAIStatus === 'needs-download'}
                        recommended={chromeAIStatus === 'available'}
                        preset={preset}
                        icons={icons}
                    />

                    {/* Hosted API Option */}
                    <ProviderCard
                        providerType="hosted-api"
                        selected={selectedType === 'hosted-api'}
                        onSelect={() => handleTypeSelect('hosted-api')}
                        badge="Works Everywhere"
                        recommended={chromeAIStatus !== 'available'}
                        preset={preset}
                        icons={icons}
                    />

                    {/* Custom LLM Provider Option */}
                    <ProviderCard
                        providerType="custom-llm"
                        selected={selectedType === 'custom-llm'}
                        onSelect={() => handleTypeSelect('custom-llm')}
                        badge="Bring Your Own Key"
                        preset={preset}
                        icons={icons}
                    />
                </div>
            </div>

            {/* Chrome AI Status (when selected) */}
            {selectedType === 'chrome' && (
                <ChromeAIStatus
                    onStatusChange={handleChromeAIStatusChange}
                    preset={preset}
                    icons={icons}
                />
            )}

            {/* Hosted API Info (when selected) */}
            {selectedType === 'hosted-api' && (
                <Alert variant="info">
                    <div>
                        <strong>Hosted API Service</strong>
                        <p className="mt-2 mb-0 text-sm">
                            Use our hosted Gemini API service. Usage is billed per request.
                            No setup required - just start using the app!
                        </p>
                    </div>
                </Alert>
            )}

            {/* Custom LLM Configuration (when selected) */}
            {selectedType === 'custom-llm' && (
                <div className="flex flex-col gap-4">
                    {/* Provider Selection */}
                    <Select
                        value={selectedLLMProvider}
                        onChange={(value) => setSelectedLLMProvider(value as LLMProvider)}
                        options={availableProviders.map((p) => ({
                            value: p.id,
                            label: p.name,
                        }))}
                        label="Provider"
                    />

                    {/* Model Selection */}
                    <ModelSelector
                        provider={selectedLLMProvider}
                        selectedModel={selectedModel}
                        onModelSelect={setSelectedModel}
                        showPricing={showCostComparison}
                        preset={preset}
                    />

                    {/* API Key Input */}
                    <APIKeyInput
                        provider={selectedLLMProvider}
                        model={selectedModel}
                        value={apiKey}
                        onChange={setApiKey}
                        onValidate={handleApiKeyValidate}
                        preset={preset}
                        icons={icons}
                    />

                    {/* Cost Display */}
                    {showCostComparison && selectedModel && (
                        <CostDisplay
                            provider={selectedLLMProvider}
                            model={selectedModel}
                            analysesPerMonth={analysesPerMonth}
                            preset={preset}
                        />
                    )}

                    {/* Cost Tracking Notice */}
                    <Alert variant="info">
                        <div className="text-sm">
                            {icons?.dollarSign ?? '$'} Usage and costs will be tracked locally for your reference.
                        </div>
                    </Alert>
                </div>
            )}

            {/* Confirm Button */}
            <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirm}
                disabled={!canProceed()}
            >
                {selectedType === 'chrome' && 'Use Chrome AI'}
                {selectedType === 'hosted-api' && 'Use Hosted API'}
                {selectedType === 'custom-llm' && (saveSuccess ? 'Saved!' : 'Save Configuration')}
            </Button>

            {saveSuccess && (
                <Alert variant="success">
                    Configuration saved successfully!
                </Alert>
            )}
        </div>
    );
};
