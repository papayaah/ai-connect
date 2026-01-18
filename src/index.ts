// ============================================================================
// Components
// ============================================================================
export {
    AIManagementProvider,
    useAIManagementContext,
    useAIManagementContextOptional,
} from './components/AIManagementProvider';
export { AIProviderSelector } from './components/AIProviderSelector';
export { ProviderCard } from './components/ProviderCard';
export { ModelSelector } from './components/ModelSelector';
export { CostDisplay } from './components/CostDisplay';
export { APIKeyInput } from './components/APIKeyInput';
export { UsageStats } from './components/UsageStats';
export { ChromeAIStatus } from './components/ChromeAIStatus';

// ============================================================================
// Hooks
// ============================================================================
export { useAIProvider } from './hooks/useAIProvider';
export type { UseAIProviderOptions, UseAIProviderReturn } from './hooks/useAIProvider';

export { useProviderPricing } from './hooks/useProviderPricing';
export type { UseProviderPricingOptions, UseProviderPricingReturn, CostComparison } from './hooks/useProviderPricing';

export { useProviderValidation } from './hooks/useProviderValidation';
export type { UseProviderValidationReturn } from './hooks/useProviderValidation';

export { useCostTracking } from './hooks/useCostTracking';
export type { UseCostTrackingOptions, UseCostTrackingReturn } from './hooks/useCostTracking';

export { useChromeAI } from './hooks/useChromeAI';
export type { UseChromeAIReturn } from './hooks/useChromeAI';

export { useRateLimit } from './hooks/useRateLimit';
export type { UseRateLimitOptions, UseRateLimitReturn } from './hooks/useRateLimit';

export { useAIService } from './hooks/useAIService';
export type { UseAIServiceOptions, UseAIServiceReturn } from './hooks/useAIService';

export { useAIImageService } from './hooks/useAIImageService';
export type {
    UseAIImageServiceOptions,
    UseAIImageServiceReturn,
    GenerateImagesOptions,
    GenerateImagesResult,
    GeneratedImageFile,
} from './hooks/useAIImageService';

// ============================================================================
// Presets
// ============================================================================
export { defaultPreset } from './presets/default';
export { tailwindPreset } from './presets/tailwind';
export { lucideIcons } from './presets/lucide';

// ============================================================================
// Services
// ============================================================================
export {
    StorageService,
    createStorageService,
    localStorageAdapter,
    createMemoryStorageAdapter,
    STORAGE_KEYS,
} from './services/storage';

export {
    CostTrackingService,
    createCostTrackingService,
} from './services/costTracking';

export {
    AISettingsService,
    createAISettingsService,
} from './services/aiSettings';

export {
    AIService,
    createAIService,
    createVercelAIModel,
} from './services/aiService';
export type {
    AICallOptions,
    AICallResult,
    AIServiceOptions,
} from './services/aiService';

// ============================================================================
// Providers (Pricing & Configuration)
// ============================================================================
export {
    providers,
    getProvider,
    getAllProviders,
    getModels,
    getModel,
    getDefaultModel,
    getRecommendedModel,
    calculateCost,
    estimateMonthlyCost,
    validateApiKeyFormat,
    getCostTierEmoji,
    getCostTierLabel,
    formatCost,
    formatNumber,
} from './providers';

// ============================================================================
// Utilities
// ============================================================================
export {
    callHostedAPI,
    createHostedAPIService,
} from './utils/hostedAPI';
export type {
    HostedAPICallOptions,
    HostedAPIResponse,
} from './utils/hostedAPI';

export {
    callHostedImageAPI,
    createHostedImageAPIService,
} from './utils/hostedImageAPI';
export type {
    HostedImageAPICallOptions,
    HostedImageAPIResponse,
    HostedImageAPIImage,
    ImageOutputFormat,
} from './utils/hostedImageAPI';

// ============================================================================
// Types
// ============================================================================
export type {
    // Core types
    LLMProvider,
    AIProviderType,
    CostTier,

    // Configuration types
    CustomLLMConfig,
    AIProviderConfig,
    PricingModel,
    ModelInfo,
    ProviderInfo,

    // Usage & Cost types
    TokenUsage,
    CostEstimate,
    ProviderUsageStats,
    UsageStats as UsageStatsData,
    UsageHistoryEntry,

    // Rate limiting
    RateLimitData,

    // Validation
    ValidationResult,

    // AI Response
    AIResponse,

    // Storage
    StorageAdapter,

    // Chrome AI
    ChromeAIStatus as ChromeAIStatusType,
    ChromeAIConfig,

    // Icons
    IconComponent,
    AIManagementIcons,

    // Component Props
    CardProps,
    ButtonProps,
    TextInputProps,
    SelectProps,
    BadgeProps,
    LoaderProps,
    AlertProps,
    TooltipProps,
    ProgressProps,
    ComponentPreset,

    // Main Component Props
    AIProviderSelectorProps,
    ModelSelectorProps,
    CostDisplayProps,
    ProviderCardProps,
    APIKeyInputProps,
    UsageStatsProps,
    ChromeAIStatusProps,

    // Context
    AIManagementContextValue,
    AIManagementProviderProps,
} from './types';
