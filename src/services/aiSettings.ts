import type {
    LLMProvider,
    AIProviderType,
    AIProviderConfig,
    CustomLLMConfig,
    StorageAdapter,
    ValidationResult,
    RateLimitData,
} from '../types';
import {
    STORAGE_KEYS,
    localStorageAdapter,
    getJSON,
    setJSON,
    getOrCreateDeviceId,
} from './storage';
import { getProvider, getDefaultModel, validateApiKeyFormat } from '../providers';

// ============================================================================
// Constants
// ============================================================================

const HOSTED_API_RATE_LIMIT = 10; // 10 requests per day for hosted API

// ============================================================================
// AI Settings Service
// ============================================================================

/**
 * Service for managing AI provider settings and preferences
 */
export class AISettingsService {
    private storage: StorageAdapter;

    constructor(storage: StorageAdapter = localStorageAdapter) {
        this.storage = storage;
    }

    // ========================================================================
    // Provider Configuration
    // ========================================================================

    /**
     * Get the current AI provider configuration
     */
    getProviderConfig(): AIProviderConfig | null {
        return getJSON<AIProviderConfig>(this.storage, STORAGE_KEYS.PROVIDER_CONFIG);
    }

    /**
     * Set the AI provider configuration
     */
    setProviderConfig(config: AIProviderConfig): void {
        const configWithTimestamp: AIProviderConfig = {
            ...config,
            lastUpdated: new Date().toISOString(),
        };
        setJSON(this.storage, STORAGE_KEYS.PROVIDER_CONFIG, configWithTimestamp);
    }

    /**
     * Clear the provider configuration
     */
    clearProviderConfig(): void {
        this.storage.removeItem(STORAGE_KEYS.PROVIDER_CONFIG);
    }

    /**
     * Get the current provider type
     */
    getProviderType(): AIProviderType {
        const config = this.getProviderConfig();
        return config?.type ?? 'hosted-api';
    }

    // ========================================================================
    // Custom LLM Configuration
    // ========================================================================

    /**
     * Get the custom LLM configuration
     */
    getCustomLLMConfig(): CustomLLMConfig | null {
        const config = this.getProviderConfig();
        return config?.customLLM ?? null;
    }

    /**
     * Set a custom LLM configuration
     */
    setCustomLLMConfig(customLLM: CustomLLMConfig): void {
        this.setProviderConfig({
            type: 'custom-llm',
            customLLM,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Remove the custom LLM configuration (revert to shared)
     */
    removeCustomLLMConfig(): void {
        this.setProviderConfig({
            type: 'hosted-api',
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Get a masked version of the API key for display
     */
    getMaskedApiKey(): string | null {
        const config = this.getCustomLLMConfig();
        if (!config?.apiKey) return null;

        const key = config.apiKey;
        if (key.length <= 8) {
            return '*'.repeat(key.length);
        }
        return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
    }

    // ========================================================================
    // Model Management
    // ========================================================================

    /**
     * Get available models for a provider
     */
    getAvailableModels(provider: LLMProvider): string[] {
        const providerInfo = getProvider(provider);
        return providerInfo?.models.map(m => m.id) ?? [];
    }

    /**
     * Get the default model for a provider
     */
    getDefaultModelForProvider(provider: LLMProvider): string {
        return getDefaultModel(provider);
    }

    /**
     * Get the currently selected model
     */
    getCurrentModel(): string | null {
        const config = this.getCustomLLMConfig();
        return config?.model ?? null;
    }

    // ========================================================================
    // Validation
    // ========================================================================

    /**
     * Validate API key format
     */
    validateApiKeyFormat(provider: LLMProvider, apiKey: string): boolean {
        return validateApiKeyFormat(provider, apiKey);
    }

    /**
     * Validate API key by testing connectivity
     * Note: This is a placeholder - actual validation requires server-side call
     */
    async validateApiKey(
        provider: LLMProvider,
        apiKey: string
    ): Promise<ValidationResult> {
        // Basic format validation
        if (!apiKey || apiKey.trim().length === 0) {
            return {
                isValid: false,
                error: 'API key cannot be empty',
            };
        }

        // Format validation
        if (!validateApiKeyFormat(provider, apiKey)) {
            return {
                isValid: false,
                error: 'Invalid API key format for this provider',
            };
        }

        // In a real implementation, you would test the API key here
        // by making a lightweight API call to verify it works
        // For now, we just validate the format
        return {
            isValid: true,
            availableModels: this.getAvailableModels(provider),
            defaultModel: this.getDefaultModelForProvider(provider),
        };
    }

    /**
     * Test provider connection with current configuration
     */
    async testProviderConnection(): Promise<boolean> {
        const config = this.getCustomLLMConfig();
        if (!config) return false;

        const result = await this.validateApiKey(config.provider, config.apiKey);
        return result.isValid;
    }

    // ========================================================================
    // Rate Limiting (for Hosted API)
    // ========================================================================

    /**
     * Get current rate limit data
     */
    getRateLimitData(): RateLimitData {
        const data = getJSON<RateLimitData>(this.storage, STORAGE_KEYS.RATE_LIMIT);
        const deviceId = getOrCreateDeviceId(this.storage);

        if (!data || this.isRateLimitExpired(data)) {
            return {
                count: 0,
                resetTime: this.getNextResetTime(),
                deviceId,
            };
        }

        return { ...data, deviceId };
    }

    /**
     * Check if rate limit is reached
     */
    isRateLimitReached(): boolean {
        const data = this.getRateLimitData();
        return data.count >= HOSTED_API_RATE_LIMIT;
    }

    /**
     * Get remaining requests for hosted API
     */
    getRemainingRequests(): number {
        const data = this.getRateLimitData();
        return Math.max(0, HOSTED_API_RATE_LIMIT - data.count);
    }

    /**
     * Increment rate limit counter
     */
    incrementRateLimitCounter(): void {
        const data = this.getRateLimitData();

        const newData: RateLimitData = {
            count: data.count + 1,
            resetTime: data.resetTime,
            deviceId: data.deviceId,
        };

        setJSON(this.storage, STORAGE_KEYS.RATE_LIMIT, newData);
    }

    /**
     * Reset rate limit (for testing or manual override)
     */
    resetRateLimit(): void {
        this.storage.removeItem(STORAGE_KEYS.RATE_LIMIT);
    }

    /**
     * Get time until rate limit resets
     */
    getTimeUntilReset(): number {
        const data = this.getRateLimitData();
        const resetTime = new Date(data.resetTime).getTime();
        const now = Date.now();
        return Math.max(0, resetTime - now);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private isRateLimitExpired(data: RateLimitData): boolean {
        const resetTime = new Date(data.resetTime).getTime();
        return Date.now() >= resetTime;
    }

    private getNextResetTime(): string {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        return tomorrow.toISOString();
    }
}

/**
 * Create an AI settings service instance
 */
export const createAISettingsService = (
    storage?: StorageAdapter
): AISettingsService => {
    return new AISettingsService(storage);
};
