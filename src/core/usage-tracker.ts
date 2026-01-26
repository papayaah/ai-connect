/**
 * Usage Tracker - Logs AI usage to database
 * Compatible with existing Supabase usage table schema
 * Works on both Supabase and dedicated servers
 */

export interface UsageRecord {
  // Required fields (match existing Supabase schema)
  device_id: string;
  request_type: string;
  model_name: string;

  // Token tracking
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;

  // Cost tracking
  cost_usd?: number;
  credits_used?: number;

  // Performance
  response_time_ms?: number;

  // Status
  success?: boolean;
  error_message?: string;

  // Request/Response data (sanitized)
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;

  // Client info
  ip_address?: string;
  user_agent?: string;

  // Prompt template association
  prompt_id?: string;
  prompt_title?: string;
  temperature?: number;

  // User association (optional - null for admin/system usage)
  user_id?: string;
}

export interface UsageTrackerConfig {
  /**
   * Function to insert usage record into database
   * For Supabase: (record) => supabase.from('usage').insert(record)
   * For PostgreSQL: (record) => pool.query('INSERT INTO usage...')
   */
  insertRecord: (record: UsageRecord) => Promise<void>;

  /**
   * Default device ID for server-side requests
   */
  defaultDeviceId?: string;

  /**
   * Default request type
   */
  defaultRequestType?: string;
}

/**
 * Creates a usage tracker that logs to your database
 */
export function createUsageTracker(config: UsageTrackerConfig) {
  const {
    insertRecord,
    defaultDeviceId = 'server',
    defaultRequestType = 'ai-connect',
  } = config;

  return {
    /**
     * Log a successful AI request
     */
    async logSuccess(params: {
      model: string;
      requestType?: string;
      deviceId?: string;
      inputTokens?: number;
      outputTokens?: number;
      responseTimeMs?: number;
      costUsd?: number;
      promptTitle?: string;
      requestData?: Record<string, any>;
      responseData?: Record<string, any>;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    }): Promise<void> {
      const record: UsageRecord = {
        device_id: params.deviceId || defaultDeviceId,
        request_type: params.requestType || defaultRequestType,
        model_name: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        total_tokens: (params.inputTokens || 0) + (params.outputTokens || 0),
        cost_usd: params.costUsd,
        response_time_ms: params.responseTimeMs,
        success: true,
        prompt_title: params.promptTitle,
        request_data: params.requestData,
        response_data: params.responseData,
        user_id: params.userId,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      };

      await insertRecord(record);
    },

    /**
     * Log a failed AI request
     */
    async logError(params: {
      model: string;
      error: Error | string;
      requestType?: string;
      deviceId?: string;
      inputTokens?: number;
      responseTimeMs?: number;
      promptTitle?: string;
      requestData?: Record<string, any>;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    }): Promise<void> {
      const record: UsageRecord = {
        device_id: params.deviceId || defaultDeviceId,
        request_type: params.requestType || defaultRequestType,
        model_name: params.model,
        input_tokens: params.inputTokens,
        response_time_ms: params.responseTimeMs,
        success: false,
        error_message: typeof params.error === 'string' ? params.error : params.error.message,
        prompt_title: params.promptTitle,
        request_data: params.requestData,
        user_id: params.userId,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      };

      await insertRecord(record);
    },
  };
}

/**
 * Calculate cost based on model pricing
 * Add your model pricing here
 */
export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Pricing per 1M tokens (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    // Google
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    // OpenAI
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    // Anthropic
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku': { input: 0.25, output: 1.25 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
  };

  const modelPricing = pricing[modelName];
  if (!modelPricing) {
    return 0; // Unknown model, can't calculate cost
  }

  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * SQL schema for the usage table (for dedicated servers)
 * This matches the existing Supabase schema
 */
export const USAGE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    device_id TEXT NOT NULL,
    request_type TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10,6),
    credits_used INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    request_data JSONB,
    response_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    prompt_id UUID,
    prompt_title TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.3
);

CREATE INDEX IF NOT EXISTS idx_usage_device_id ON usage(device_id);
CREATE INDEX IF NOT EXISTS idx_usage_request_type ON usage(request_type);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_model_name ON usage(model_name);
`;
