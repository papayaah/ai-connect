/**
 * Utility functions for integrating with hosted API endpoints
 * 
 * These helpers make it easier for consumers to implement their own
 * hosted API endpoints that work with this package.
 */

export interface HostedAPICallOptions {
    /** The prompt/message to send */
    prompt: string;
    /** Optional system prompt */
    systemPrompt?: string;
    /** Temperature setting (0-1) */
    temperature?: number;
    /** Maximum tokens in response */
    maxTokens?: number;
}

export interface HostedAPIResponse {
    /** The response text */
    text: string;
    /** Token usage information */
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    /** Any additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Call a hosted API endpoint
 * 
 * This is a helper function that consumers can use or customize
 * to call their own hosted API endpoints.
 * 
 * @param endpoint - The URL of your hosted API endpoint
 * @param options - Call options
 * @returns Promise resolving to the API response
 */
export async function callHostedAPI(
    endpoint: string,
    options: HostedAPICallOptions
): Promise<HostedAPIResponse> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.message || `API error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Create a hosted API service function
 * 
 * This factory function helps create a service function with a pre-configured endpoint.
 * 
 * @param endpoint - Your hosted API endpoint URL
 * @returns A function that calls your hosted API
 * 
 * @example
 * ```typescript
 * const myHostedAPI = createHostedAPIService('/api/ai/hosted');
 * const result = await myHostedAPI({ prompt: 'Hello' });
 * ```
 */
export function createHostedAPIService(endpoint: string) {
    return (options: HostedAPICallOptions) => callHostedAPI(endpoint, options);
}
