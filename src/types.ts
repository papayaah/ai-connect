import { ReactNode } from 'react';

// ============================================================================
// Core Provider Types
// ============================================================================

/** Supported LLM provider identifiers */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'mistral' | 'xai' | 'perplexity' | 'openrouter';

/** AI provider type selection */
export type AIProviderType = 'chrome' | 'hosted-api' | 'custom-llm';

/** Cost tier for models */
export type CostTier = 'budget' | 'standard' | 'premium';

// ============================================================================
// Configuration Types
// ============================================================================

/** Configuration for a custom LLM provider */
export interface CustomLLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey: string;
    baseUrl?: string;
}

/** Full AI provider configuration */
export interface AIProviderConfig {
    type: AIProviderType;
    customLLM?: CustomLLMConfig;
    lastUpdated: string;
}

/** Pricing model for a specific model */
export interface PricingModel {
    inputCostPer1M: number;
    outputCostPer1M: number;
    cachedInputCostPer1M?: number;
    currency: string;
    lastUpdated: string;
}

/** Information about a specific model */
export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    pricing: PricingModel;
    contextLength: number;
    costTier: CostTier;
    recommended?: boolean;
    estimatedCostPerAnalysis?: number;
}

/** Provider information with available models */
export interface ProviderInfo {
    id: LLMProvider;
    name: string;
    description: string;
    models: ModelInfo[];
    defaultModel: string;
    apiKeyPattern?: RegExp;
    apiKeyPlaceholder?: string;
    docsUrl?: string;
}

// ============================================================================
// Usage & Cost Tracking Types
// ============================================================================

/** Token usage from an API call */
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

/** Cost estimate for operations */
export interface CostEstimate {
    perAnalysis: number;
    monthlyEstimate: number;
    provider: LLMProvider;
    model: string;
}

/** Usage statistics for a single provider */
export interface ProviderUsageStats {
    provider: LLMProvider;
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    lastUsed: string;
}

/** Aggregated usage statistics */
export interface UsageStats {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    lastUpdated: string;
    byProvider: Partial<Record<LLMProvider, ProviderUsageStats>>;
}

/** Usage history entry */
export interface UsageHistoryEntry {
    timestamp: string;
    provider: LLMProvider;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

/** Rate limit data for hosted API */
export interface RateLimitData {
    count: number;
    resetTime: string;
    deviceId: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/** Result of API key validation */
export interface ValidationResult {
    isValid: boolean;
    error?: string;
    availableModels?: string[];
    defaultModel?: string;
}

// ============================================================================
// AI Response Types
// ============================================================================

/** Response from AI service */
export interface AIResponse<T = unknown> {
    success: boolean;
    data: T;
    usage?: TokenUsage;
    provider: string;
    model: string;
    error?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

/** Storage adapter interface for custom implementations */
export interface StorageAdapter {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}

// ============================================================================
// Chrome AI Types
// ============================================================================

/** Chrome AI availability status */
export type ChromeAIStatus = 'available' | 'not-available' | 'needs-download' | 'checking' | 'error';

/** Chrome AI configuration */
export interface ChromeAIConfig {
    temperature?: number;
    topK?: number;
}

// ============================================================================
// Icon Types
// ============================================================================

/** Icon component type - can be a component or a ReactNode */
export type IconComponent = React.ComponentType<{ size?: number | string }>;

/** Icons used in AI management components */
export interface AIManagementIcons {
    check?: ReactNode;
    x?: ReactNode;
    alertCircle?: ReactNode;
    loader?: ReactNode;
    eye?: ReactNode;
    eyeOff?: ReactNode;
    info?: ReactNode;
    chevronDown?: ReactNode;
    sparkles?: ReactNode;
    cloud?: ReactNode;
    key?: ReactNode;
    cpu?: ReactNode;
    dollarSign?: ReactNode;
    zap?: ReactNode;
    shield?: ReactNode;
    globe?: ReactNode;
    refresh?: ReactNode;
    trash?: ReactNode;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface CardProps {
    children: ReactNode;
    onClick?: () => void;
    selected?: boolean;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    'aria-label'?: string;
}

export interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    'aria-label'?: string;
    className?: string;
}

export interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    className?: string;
}

export interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export interface AlertProps {
    children: ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'error';
    icon?: ReactNode;
    className?: string;
}

export interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    className?: string;
}

export interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
}

// ============================================================================
// Component Preset Interface
// ============================================================================

export interface ComponentPreset {
    Card: React.FC<CardProps>;
    Button: React.FC<ButtonProps>;
    TextInput: React.FC<TextInputProps>;
    Select: React.FC<SelectProps>;
    Badge: React.FC<BadgeProps>;
    Loader: React.FC<LoaderProps>;
    Alert: React.FC<AlertProps>;
    Tooltip: React.FC<TooltipProps>;
    Progress: React.FC<ProgressProps>;
}

// ============================================================================
// Main Component Props
// ============================================================================

/** Props for AIProviderSelector component */
export interface AIProviderSelectorProps {
    /** Callback when provider is selected */
    onProviderSelect: (config: AIProviderConfig) => void;
    /** Callback when validation completes */
    onValidationComplete?: (isValid: boolean, provider: string) => void;
    /** Callback when cost estimate changes */
    onCostEstimate?: (estimate: CostEstimate) => void;
    /** Default provider to select */
    defaultProvider?: AIProviderType;
    /** Show cost comparison UI */
    showCostComparison?: boolean;
    /** Filter which providers are available */
    enabledProviders?: LLMProvider[];
    /** Custom pricing overrides */
    customPricing?: Partial<Record<LLMProvider, Record<string, Partial<PricingModel>>>>;
    /** Theme mode */
    theme?: 'light' | 'dark' | 'auto';
    /** Custom class name */
    className?: string;
    /** Custom storage adapter */
    storage?: StorageAdapter;
    /** Component preset for styling */
    preset?: ComponentPreset;
    /** Custom icons */
    icons?: AIManagementIcons;
    /** Number of analyses per month for cost estimate */
    analysesPerMonth?: number;
}

/** Props for ModelSelector component */
export interface ModelSelectorProps {
    provider: LLMProvider;
    selectedModel: string;
    onModelSelect: (modelId: string) => void;
    showPricing?: boolean;
    preset?: ComponentPreset;
    className?: string;
}

/** Props for CostDisplay component */
export interface CostDisplayProps {
    provider: LLMProvider;
    model: string;
    showMonthlyEstimate?: boolean;
    analysesPerMonth?: number;
    preset?: ComponentPreset;
    className?: string;
}

/** Props for ProviderCard component */
export interface ProviderCardProps {
    providerType: AIProviderType;
    selected: boolean;
    onSelect: () => void;
    badge?: string;
    available?: boolean;
    recommended?: boolean;
    description?: string;
    preset?: ComponentPreset;
    icons?: AIManagementIcons;
    className?: string;
}

/** Props for APIKeyInput component */
export interface APIKeyInputProps {
    provider: LLMProvider;
    value: string;
    onChange: (value: string) => void;
    onValidate?: (isValid: boolean) => void;
    error?: string;
    preset?: ComponentPreset;
    icons?: AIManagementIcons;
    className?: string;
}

/** Props for UsageStats component */
export interface UsageStatsProps {
    stats: UsageStats | null;
    onReset?: (provider?: LLMProvider) => void;
    preset?: ComponentPreset;
    className?: string;
}

/** Props for ChromeAIStatus component */
export interface ChromeAIStatusProps {
    onStatusChange?: (status: ChromeAIStatus) => void;
    preset?: ComponentPreset;
    icons?: AIManagementIcons;
    className?: string;
}

// ============================================================================
// Context Types
// ============================================================================

/** AI Management context value */
export interface AIManagementContextValue {
    config: AIProviderConfig | null;
    setConfig: (config: AIProviderConfig) => void;
    clearConfig: () => void;
    isValid: boolean;
    isLoading: boolean;
    error: string | null;
    usageStats: UsageStats | null;
    recordUsage: (provider: LLMProvider, model: string, tokens: TokenUsage) => void;
    resetUsageStats: (provider?: LLMProvider) => void;
    storage: StorageAdapter;
}

/** Provider context props */
export interface AIManagementProviderProps {
    children: ReactNode;
    storage?: StorageAdapter;
    initialConfig?: AIProviderConfig;
}
