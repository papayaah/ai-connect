'use client';

import { useState, useCallback, useEffect } from 'react';
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

    // State
    const [selectedType, setSelectedType] = useState<AIProviderType>(defaultProvider ?? 'hosted-api');
    const [selectedLLMProvider, setSelectedLLMProvider] = useState<LLMProvider>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
    const [chromeAIStatus, setChromeAIStatus] = useState<ChromeAIStatusType>('checking');

    // Hooks - Chrome AI status check
    useChromeAI();
    const { getCostEstimate } = useProviderPricing({
        provider: selectedLLMProvider,
        customPricing,
    });

    // Get available LLM providers
    const availableProviders = getAllProviders().filter(
        (p) => !enabledProviders || enabledProviders.includes(p.id)
    );

    // Set default model when provider changes
    useEffect(() => {
        const defaultModel = getDefaultModel(selectedLLMProvider);
        setSelectedModel(defaultModel);
    }, [selectedLLMProvider]);

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
        setIsApiKeyValid(isValid);
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
    }, [selectedType, selectedLLMProvider, selectedModel, apiKey, onProviderSelect]);

    // Check if can proceed
    const canProceed = () => {
        switch (selectedType) {
            case 'chrome':
                return chromeAIStatus === 'available';
            case 'hosted-api':
                return true;
            case 'custom-llm':
                return isApiKeyValid && selectedModel;
            default:
                return false;
        }
    };

    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Provider Type Selection */}
            <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
                    Choose Your AI Provider
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                            Use our hosted Gemini API service. Usage is billed per request.
                            No setup required - just start using the app!
                        </p>
                    </div>
                </Alert>
            )}

            {/* Custom LLM Configuration (when selected) */}
            {selectedType === 'custom-llm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        <div style={{ fontSize: '14px' }}>
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
                {selectedType === 'custom-llm' && 'Save Configuration'}
            </Button>
        </div>
    );
};
