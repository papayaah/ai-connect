import type {
    LLMProvider,
    TokenUsage,
    UsageStats,
    ProviderUsageStats,
    UsageHistoryEntry,
    StorageAdapter,
} from '../types';
import { STORAGE_KEYS, localStorageAdapter, getJSON, setJSON } from './storage';
import { calculateCost } from '../providers';

// ============================================================================
// Types
// ============================================================================

interface StoredUsageData {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    lastUpdated: string;
    byProvider: Partial<Record<LLMProvider, ProviderUsageStats>>;
    history: UsageHistoryEntry[];
}

// ============================================================================
// Cost Tracking Service
// ============================================================================

/**
 * Service for tracking API usage and calculating costs
 * Only tracks usage for custom API keys, not for Chrome AI or shared services
 */
export class CostTrackingService {
    private storage: StorageAdapter;
    private maxHistoryEntries: number;

    constructor(
        storage: StorageAdapter = localStorageAdapter,
        maxHistoryEntries: number = 1000
    ) {
        this.storage = storage;
        this.maxHistoryEntries = maxHistoryEntries;
    }

    /**
     * Record an API call with token usage
     */
    recordApiCall(
        provider: LLMProvider,
        model: string,
        tokens: TokenUsage,
        /**
         * Optional explicit cost override in USD.
         *
         * This is useful for operations that are NOT token-billed (e.g. image generation),
         * where the backend can return the final cost directly.
         */
        costOverrideUsd?: number
    ): void {
        const data = this.getStoredData();
        const cost =
            typeof costOverrideUsd === 'number'
                ? costOverrideUsd
                : calculateCost(provider, model, tokens.inputTokens, tokens.outputTokens);
        const now = new Date().toISOString();

        // Update totals
        data.totalCalls += 1;
        data.totalInputTokens += tokens.inputTokens;
        data.totalOutputTokens += tokens.outputTokens;
        data.estimatedCost += cost;
        data.lastUpdated = now;

        // Update provider stats
        if (!data.byProvider[provider]) {
            data.byProvider[provider] = {
                provider,
                model,
                calls: 0,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                lastUsed: now,
            };
        }

        const providerStats = data.byProvider[provider]!;
        providerStats.calls += 1;
        providerStats.inputTokens += tokens.inputTokens;
        providerStats.outputTokens += tokens.outputTokens;
        providerStats.cost += cost;
        providerStats.lastUsed = now;
        providerStats.model = model; // Update to latest model used

        // Add to history
        data.history.push({
            timestamp: now,
            provider,
            model,
            inputTokens: tokens.inputTokens,
            outputTokens: tokens.outputTokens,
            cost,
        });

        // Trim history if needed
        if (data.history.length > this.maxHistoryEntries) {
            data.history = data.history.slice(-this.maxHistoryEntries);
        }

        this.saveStoredData(data);
    }

    /**
     * Get current usage statistics
     */
    getUsageStats(): UsageStats | null {
        const data = this.getStoredData();
        if (data.totalCalls === 0) return null;

        return {
            totalCalls: data.totalCalls,
            totalInputTokens: data.totalInputTokens,
            totalOutputTokens: data.totalOutputTokens,
            estimatedCost: data.estimatedCost,
            lastUpdated: data.lastUpdated,
            byProvider: data.byProvider,
        };
    }

    /**
     * Get usage statistics for a specific provider
     */
    getProviderStats(provider: LLMProvider): ProviderUsageStats | null {
        const data = this.getStoredData();
        return data.byProvider[provider] ?? null;
    }

    /**
     * Get usage history
     */
    getHistory(limit?: number): UsageHistoryEntry[] {
        const data = this.getStoredData();
        if (limit) {
            return data.history.slice(-limit);
        }
        return data.history;
    }

    /**
     * Get total cost across all providers
     */
    getTotalCost(): number {
        const data = this.getStoredData();
        return data.estimatedCost;
    }

    /**
     * Get cost for a specific provider
     */
    getProviderCost(provider: LLMProvider): number {
        const stats = this.getProviderStats(provider);
        return stats?.cost ?? 0;
    }

    /**
     * Reset usage statistics
     * @param provider - Optional provider to reset. If not provided, resets all stats.
     */
    resetUsageStats(provider?: LLMProvider): void {
        if (provider) {
            // Reset only the specific provider
            const data = this.getStoredData();
            const providerStats = data.byProvider[provider];

            if (providerStats) {
                // Subtract provider totals from overall totals
                data.totalCalls -= providerStats.calls;
                data.totalInputTokens -= providerStats.inputTokens;
                data.totalOutputTokens -= providerStats.outputTokens;
                data.estimatedCost -= providerStats.cost;

                // Remove provider stats
                delete data.byProvider[provider];

                // Remove history entries for this provider
                data.history = data.history.filter(h => h.provider !== provider);

                data.lastUpdated = new Date().toISOString();
                this.saveStoredData(data);
            }
        } else {
            // Reset all stats
            this.storage.removeItem(STORAGE_KEYS.USAGE_STATS);
        }
    }

    /**
     * Check if tracking is enabled (has any usage data)
     */
    isTrackingEnabled(): boolean {
        const data = this.getStoredData();
        return data.totalCalls > 0;
    }

    /**
     * Export usage data as JSON
     */
    exportData(): string {
        const data = this.getStoredData();
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import usage data from JSON
     */
    importData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData) as StoredUsageData;
            this.saveStoredData(data);
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private getStoredData(): StoredUsageData {
        const data = getJSON<StoredUsageData>(this.storage, STORAGE_KEYS.USAGE_STATS);
        return data ?? this.createEmptyData();
    }

    private saveStoredData(data: StoredUsageData): void {
        setJSON(this.storage, STORAGE_KEYS.USAGE_STATS, data);
    }

    private createEmptyData(): StoredUsageData {
        return {
            totalCalls: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            estimatedCost: 0,
            lastUpdated: new Date().toISOString(),
            byProvider: {},
            history: [],
        };
    }
}

/**
 * Create a cost tracking service instance
 */
export const createCostTrackingService = (
    storage?: StorageAdapter,
    maxHistoryEntries?: number
): CostTrackingService => {
    return new CostTrackingService(storage, maxHistoryEntries);
};
