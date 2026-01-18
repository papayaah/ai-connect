import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
    LLMProvider,
    TokenUsage,
    UsageStats,
    UsageHistoryEntry,
    StorageAdapter,
} from '../types';
import { CostTrackingService, localStorageAdapter } from '../services';

export interface UseCostTrackingOptions {
    storage?: StorageAdapter;
    maxHistoryEntries?: number;
}

export interface UseCostTrackingReturn {
    /** Current usage statistics */
    usageStats: UsageStats | null;
    /** Record a new API call */
    recordUsage: (provider: LLMProvider, model: string, tokens: TokenUsage) => void;
    /** Reset usage statistics */
    resetStats: (provider?: LLMProvider) => void;
    /** Get total cost */
    totalCost: number;
    /** Get cost for a specific provider */
    getProviderCost: (provider: LLMProvider) => number;
    /** Get usage history */
    getHistory: (limit?: number) => UsageHistoryEntry[];
    /** Whether tracking is active */
    isTrackingEnabled: boolean;
    /** Monthly cost estimate based on current usage */
    monthlyEstimate: number;
    /** Refresh stats from storage */
    refreshStats: () => void;
}

/**
 * Hook for tracking API usage and costs
 */
export const useCostTracking = (
    options: UseCostTrackingOptions = {}
): UseCostTrackingReturn => {
    const { storage = localStorageAdapter, maxHistoryEntries } = options;

    const trackingService = useMemo(
        () => new CostTrackingService(storage, maxHistoryEntries),
        [storage, maxHistoryEntries]
    );

    const [usageStats, setUsageStats] = useState<UsageStats | null>(() =>
        trackingService.getUsageStats()
    );

    const refreshStats = useCallback(() => {
        setUsageStats(trackingService.getUsageStats());
    }, [trackingService]);

    // Sync with storage on mount
    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const recordUsage = useCallback(
        (provider: LLMProvider, model: string, tokens: TokenUsage) => {
            trackingService.recordApiCall(provider, model, tokens);
            refreshStats();
        },
        [trackingService, refreshStats]
    );

    const resetStats = useCallback(
        (provider?: LLMProvider) => {
            trackingService.resetUsageStats(provider);
            refreshStats();
        },
        [trackingService, refreshStats]
    );

    const getProviderCost = useCallback(
        (provider: LLMProvider): number => {
            return trackingService.getProviderCost(provider);
        },
        [trackingService]
    );

    const getHistory = useCallback(
        (limit?: number): UsageHistoryEntry[] => {
            return trackingService.getHistory(limit);
        },
        [trackingService]
    );

    const totalCost = usageStats?.estimatedCost ?? 0;
    const isTrackingEnabled = trackingService.isTrackingEnabled();

    // Calculate monthly estimate based on current usage pattern
    const monthlyEstimate = useMemo(() => {
        if (!usageStats || usageStats.totalCalls === 0) return 0;

        // Calculate average cost per call
        const avgCostPerCall = usageStats.estimatedCost / usageStats.totalCalls;

        // Estimate based on 10 calls per month (configurable baseline)
        return avgCostPerCall * 10;
    }, [usageStats]);

    return {
        usageStats,
        recordUsage,
        resetStats,
        totalCost,
        getProviderCost,
        getHistory,
        isTrackingEnabled,
        monthlyEstimate,
        refreshStats,
    };
};
