import { useCallback, useMemo, useState } from 'react';
import type { StorageAdapter, TokenUsage, LLMProvider } from '../types';
import { useAIProvider } from './useAIProvider';
import { CostTrackingService, localStorageAdapter } from '../services';
import type {
    HostedImageAPICallOptions,
    HostedImageAPIResponse,
    HostedImageAPIImage,
} from '../utils/hostedImageAPI';
import { callHostedImageAPI } from '../utils/hostedImageAPI';

export interface UseAIImageServiceOptions {
    /**
     * Hosted endpoint that performs image generation (recommended).
     * Example: `/api/ai/image`
     */
    endpoint: string;
    /** Storage adapter (defaults to localStorage) */
    storage?: StorageAdapter;
}

export interface GeneratedImageFile {
    file: File;
    mimeType: string;
    raw: HostedImageAPIImage;
}

export interface GenerateImagesOptions
    extends Omit<HostedImageAPICallOptions, 'providerConfig'> {
    /**
     * Whether to track costs (default: true).
     * Requires the hosted endpoint to return `costUsd`.
     */
    trackCosts?: boolean;
}

export interface GenerateImagesResult {
    images: GeneratedImageFile[];
    provider?: string;
    model?: string;
    costUsd?: number;
    rawResponse: HostedImageAPIResponse;
}

export interface UseAIImageServiceReturn {
    isLoading: boolean;
    error: string | null;
    /**
     * Generate images via the hosted endpoint.
     *
     * The hook automatically forwards the current `AIProviderConfig` as `providerConfig`
     * so your server can choose to use it (or ignore it).
     */
    generateImages: (options: GenerateImagesOptions) => Promise<GenerateImagesResult>;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
}

async function imageToFile(image: HostedImageAPIImage, index: number): Promise<File> {
    const mimeType = image.mimeType || 'image/png';
    const fileName = image.fileName || `generated-${index + 1}`;

    if (image.dataBase64) {
        const blob = base64ToBlob(image.dataBase64, mimeType);
        return new File([blob], fileName, { type: mimeType });
    }

    if (image.url) {
        const res = await fetch(image.url);
        if (!res.ok) {
            throw new Error(`Failed to fetch generated image: ${res.statusText}`);
        }
        const blob = await res.blob();
        return new File([blob], fileName, { type: blob.type || mimeType });
    }

    throw new Error('Hosted image response missing `dataBase64` or `url`');
}

/**
 * Hosted-image generation hook.
 *
 * This does NOT implement Gemini/Imagen directly—your app provides an endpoint.
 * The main value here is:
 * - uses ai-management's provider selection/config
 * - optionally records per-image costs when server returns `costUsd`
 */
export const useAIImageService = (
    options: UseAIImageServiceOptions
): UseAIImageServiceReturn => {
    const { endpoint, storage = localStorageAdapter } = options;
    const { config } = useAIProvider({ storage });

    const trackingService = useMemo(
        () => new CostTrackingService(storage),
        [storage]
    );

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateImages = useCallback(
        async (generateOptions: GenerateImagesOptions): Promise<GenerateImagesResult> => {
            setIsLoading(true);
            setError(null);

            try {
                const { trackCosts = true, ...rest } = generateOptions;

                const rawResponse = await callHostedImageAPI(endpoint, {
                    ...rest,
                    providerConfig: config ?? undefined,
                });

                const files = await Promise.all(
                    (rawResponse.images ?? []).map(async (img, idx) => {
                        const file = await imageToFile(img, idx);
                        return { file, mimeType: img.mimeType, raw: img };
                    })
                );

                // Optional cost tracking (non-token billing supported via cost override)
                if (trackCosts && typeof rawResponse.costUsd === 'number') {
                    const providerFromConfig = config?.customLLM?.provider as LLMProvider | undefined;
                    const modelFromConfig = config?.customLLM?.model;
                    if (providerFromConfig && modelFromConfig) {
                        const zeroTokens: TokenUsage = {
                            inputTokens: 0,
                            outputTokens: 0,
                            totalTokens: 0,
                        };
                        trackingService.recordApiCall(
                            providerFromConfig,
                            modelFromConfig,
                            zeroTokens,
                            rawResponse.costUsd
                        );
                    }
                }

                return {
                    images: files,
                    provider: rawResponse.provider,
                    model: rawResponse.model,
                    costUsd: rawResponse.costUsd,
                    rawResponse,
                };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Image generation failed';
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [endpoint, config, trackingService]
    );

    return {
        isLoading,
        error,
        generateImages,
    };
};

