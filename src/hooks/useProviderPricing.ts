import { useMemo, useCallback } from 'react';
import type { LLMProvider, ModelInfo, CostEstimate, PricingModel } from '../types';
import {
    getProvider,
    getModels,
    calculateCost,
    estimateMonthlyCost,
} from '../providers';

export interface UseProviderPricingOptions {
    provider?: LLMProvider;
    customPricing?: Partial<Record<LLMProvider, Record<string, Partial<PricingModel>>>>;
}

export interface CostComparison {
    modelId: string;
    modelName: string;
    provider: LLMProvider;
    estimatedCostPerAnalysis: number;
    monthlyCost: number;
    costTier: 'budget' | 'standard' | 'premium';
}

export interface UseProviderPricingReturn {
    /** Get all models with pricing for a provider */
    models: ModelInfo[];
    /** Estimate cost for a specific token usage */
    estimateCost: (inputTokens: number, outputTokens: number, modelId: string) => number;
    /** Get cost estimate for analysis */
    getCostEstimate: (modelId: string, analysesPerMonth?: number) => CostEstimate | null;
    /** Compare costs across models */
    compareModels: (modelIds?: string[]) => CostComparison[];
    /** Compare costs across providers */
    compareProviders: (providers?: LLMProvider[]) => CostComparison[];
    /** Get monthly cost estimate */
    getMonthlyCost: (modelId: string, analysesPerMonth?: number) => number;
}

/**
 * Hook for accessing and calculating provider pricing
 */
export const useProviderPricing = (
    options: UseProviderPricingOptions = {}
): UseProviderPricingReturn => {
    const { provider, customPricing } = options;

    // Get models with optional custom pricing overrides
    const models = useMemo(() => {
        if (!provider) return [];

        const baseModels = getModels(provider);
        if (!customPricing?.[provider]) return baseModels;

        // Apply custom pricing overrides
        return baseModels.map(model => {
            const customModelPricing = customPricing[provider]?.[model.id];
            if (!customModelPricing) return model;

            return {
                ...model,
                pricing: {
                    ...model.pricing,
                    ...customModelPricing,
                },
            };
        });
    }, [provider, customPricing]);

    const estimateCost = useCallback(
        (inputTokens: number, outputTokens: number, modelId: string): number => {
            if (!provider) return 0;

            // Check for custom pricing first
            const customModelPricing = customPricing?.[provider]?.[modelId];
            if (customModelPricing?.inputCostPer1M && customModelPricing?.outputCostPer1M) {
                const inputCost = (inputTokens / 1_000_000) * customModelPricing.inputCostPer1M;
                const outputCost = (outputTokens / 1_000_000) * customModelPricing.outputCostPer1M;
                return inputCost + outputCost;
            }

            return calculateCost(provider, modelId, inputTokens, outputTokens);
        },
        [provider, customPricing]
    );

    const getCostEstimate = useCallback(
        (modelId: string, analysesPerMonth: number = 10): CostEstimate | null => {
            if (!provider) return null;

            const model = models.find(m => m.id === modelId);
            if (!model) return null;

            const perAnalysis = model.estimatedCostPerAnalysis ?? 0;
            const monthlyEstimate = perAnalysis * analysesPerMonth;

            return {
                perAnalysis,
                monthlyEstimate,
                provider,
                model: modelId,
            };
        },
        [provider, models]
    );

    const getMonthlyCost = useCallback(
        (modelId: string, analysesPerMonth: number = 10): number => {
            if (!provider) return 0;
            return estimateMonthlyCost(provider, modelId, analysesPerMonth);
        },
        [provider]
    );

    const compareModels = useCallback(
        (modelIds?: string[]): CostComparison[] => {
            if (!provider) return [];

            const modelsToCompare = modelIds
                ? models.filter(m => modelIds.includes(m.id))
                : models;

            return modelsToCompare
                .map(model => ({
                    modelId: model.id,
                    modelName: model.name,
                    provider,
                    estimatedCostPerAnalysis: model.estimatedCostPerAnalysis ?? 0,
                    monthlyCost: (model.estimatedCostPerAnalysis ?? 0) * 10,
                    costTier: model.costTier,
                }))
                .sort((a, b) => a.estimatedCostPerAnalysis - b.estimatedCostPerAnalysis);
        },
        [provider, models]
    );

    const compareProviders = useCallback(
        (providersToCompare?: LLMProvider[]): CostComparison[] => {
            const allProviders: LLMProvider[] = providersToCompare ?? [
                'openai',
                'anthropic',
                'google',
                'mistral',
                'cohere',
                'xai',
            ];

            const comparisons: CostComparison[] = [];

            for (const p of allProviders) {
                const providerInfo = getProvider(p);
                if (!providerInfo) continue;

                // Get the recommended or default model for each provider
                const recommendedModel =
                    providerInfo.models.find(m => m.recommended) ??
                    providerInfo.models.find(m => m.id === providerInfo.defaultModel) ??
                    providerInfo.models[0];

                if (recommendedModel) {
                    comparisons.push({
                        modelId: recommendedModel.id,
                        modelName: recommendedModel.name,
                        provider: p,
                        estimatedCostPerAnalysis: recommendedModel.estimatedCostPerAnalysis ?? 0,
                        monthlyCost: (recommendedModel.estimatedCostPerAnalysis ?? 0) * 10,
                        costTier: recommendedModel.costTier,
                    });
                }
            }

            return comparisons.sort((a, b) => a.estimatedCostPerAnalysis - b.estimatedCostPerAnalysis);
        },
        []
    );

    return {
        models,
        estimateCost,
        getCostEstimate,
        compareModels,
        compareProviders,
        getMonthlyCost,
    };
};
