/**
 * Hosted Image API helpers
 *
 * This mirrors `utils/hostedAPI.ts` but for image generation.
 *
 * Key goals:
 * - Keep @reactkits.dev/ai-connect headless (no provider-specific image logic here)
 * - Let the consuming app implement `/api/...` however it wants (Gemini/Imagen, Vertex, etc.)
 * - Allow optional cost reporting from the server for non-token billing (e.g. per-image)
 */

import type { AIProviderConfig } from '../types';

export type ImageOutputFormat = 'png' | 'jpeg' | 'webp';

export interface HostedImageAPICallOptions {
    /** Prompt to generate an image from */
    prompt: string;
    /** Optional negative prompt (if your backend supports it) */
    negativePrompt?: string;

    /** Output image count */
    n?: number;

    /** Output format */
    format?: ImageOutputFormat;

    /** Convenience sizing fields (backend decides how to interpret) */
    width?: number;
    height?: number;
    aspectRatio?: string;

    /**
     * Optional provider configuration.
     *
     * This lets an app accept BYO-key configs (e.g. Google API key) without
     * hard-coding secrets on the server. If you don't want this, ignore it server-side.
     */
    providerConfig?: AIProviderConfig;

    /** Backend-specific knobs */
    metadata?: Record<string, unknown>;
}

export interface HostedImageAPIImage {
    /** MIME type of the returned image */
    mimeType: string;
    /** Optional filename hint */
    fileName?: string;
    /**
     * Base64-encoded raw bytes (preferred for easy client → File conversion).
     * Example: iVBORw0KGgoAAAANS...
     */
    dataBase64?: string;
    /**
     * Optional URL to the image (if you host it somewhere).
     * Note: client may hit CORS if it's not same-origin.
     */
    url?: string;
}

export interface HostedImageAPIResponse {
    images: HostedImageAPIImage[];

    /** Optional: echo the provider/model used by your backend */
    provider?: string;
    model?: string;

    /**
     * Optional: estimated cost in USD for this generation.
     * Useful for per-image billing where tokens don't apply.
     */
    costUsd?: number;

    /** Backend-specific extras */
    metadata?: Record<string, unknown>;
}

/**
 * Call a hosted image generation endpoint.
 */
export async function callHostedImageAPI(
    endpoint: string,
    options: HostedImageAPICallOptions
): Promise<HostedImageAPIResponse> {
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
 * Create a hosted image API service function with a pre-configured endpoint.
 */
export function createHostedImageAPIService(endpoint: string) {
    return (options: HostedImageAPICallOptions) => callHostedImageAPI(endpoint, options);
}

