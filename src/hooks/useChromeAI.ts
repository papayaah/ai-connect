import { useState, useEffect, useCallback } from 'react';
import type { ChromeAIStatus, ChromeAIConfig } from '../types';

// Chrome AI type definitions (from Chrome's experimental AI API)
interface AILanguageModel {
    prompt: (input: string) => Promise<string>;
    promptStreaming?: (input: string) => ReadableStream<string>;
    destroy: () => void;
}

interface LanguageModelConfig {
    expectedInputs: Array<{ type: string; languages: string[] }>;
    expectedOutputs: Array<{ type: string; languages: string[] }>;
    temperature?: number;
    topK?: number;
}

interface LanguageModelFactory {
    availability: (config: LanguageModelConfig) => Promise<'available' | 'after-download' | 'no'>;
    create: (config: LanguageModelConfig) => Promise<AILanguageModel>;
}

interface AIWindow extends Window {
    LanguageModel?: LanguageModelFactory;
}

export interface UseChromeAIReturn {
    /** Whether Chrome AI is available */
    isAvailable: boolean;
    /** Current status of Chrome AI */
    status: ChromeAIStatus;
    /** Check availability of Chrome AI */
    checkAvailability: () => Promise<ChromeAIStatus>;
    /** Whether the hook is initialized */
    isInitialized: boolean;
    /** Error message if any */
    error: string | null;
    /** Send a prompt to Chrome AI */
    prompt: (input: string) => Promise<string>;
    /** Send a streaming prompt to Chrome AI */
    promptStreaming: (input: string) => Promise<ReadableStream<string>>;
    /** Chrome AI configuration */
    config: ChromeAIConfig;
    /** Update Chrome AI configuration */
    setConfig: (config: ChromeAIConfig) => void;
}

const DEFAULT_CONFIG: ChromeAIConfig = {
    temperature: 0.1,
    topK: 1,
};

const LANGUAGE_MODEL_CONFIG = {
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

/**
 * Hook for interacting with Chrome's built-in AI (Gemini Nano)
 */
export const useChromeAI = (
    initialConfig: ChromeAIConfig = DEFAULT_CONFIG
): UseChromeAIReturn => {
    const [status, setStatus] = useState<ChromeAIStatus>('checking');
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<ChromeAIConfig>(initialConfig);
    const [session, setSession] = useState<AILanguageModel | null>(null);

    const isAvailable = status === 'available';

    const checkAvailability = useCallback(async (): Promise<ChromeAIStatus> => {
        setStatus('checking');
        setError(null);

        try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
                setStatus('not-available');
                return 'not-available';
            }

            const aiWindow = window as AIWindow;

            // Check if the LanguageModel API exists
            if (!('LanguageModel' in window)) {
                console.warn('LanguageModel not available in window object');
                setStatus('not-available');
                return 'not-available';
            }

            if (!aiWindow.LanguageModel?.availability) {
                console.warn('LanguageModel.availability not available');
                setStatus('not-available');
                return 'not-available';
            }

            // Check availability status with proper config
            const availability = await aiWindow.LanguageModel.availability(LANGUAGE_MODEL_CONFIG);
            console.log('Chrome AI availability check result:', availability);

            switch (availability) {
                case 'available':
                    setStatus('available');
                    return 'available';
                case 'after-download':
                    setStatus('needs-download');
                    return 'needs-download';
                case 'no':
                default:
                    setStatus('not-available');
                    return 'not-available';
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error checking Chrome AI availability:', err);
            setError(errorMessage);
            setStatus('error');
            return 'error';
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Check availability on mount
    useEffect(() => {
        checkAvailability();
    }, [checkAvailability]);

    // Clean up session on unmount
    useEffect(() => {
        return () => {
            if (session) {
                session.destroy();
            }
        };
    }, [session]);

    const getOrCreateSession = useCallback(async (): Promise<AILanguageModel> => {
        if (session) return session;

        const aiWindow = window as AIWindow;
        if (!aiWindow.LanguageModel?.create) {
            throw new Error('Chrome AI is not available');
        }

        // Create session with proper config including expectedInputs and expectedOutputs
        const createConfig: LanguageModelConfig = {
            ...LANGUAGE_MODEL_CONFIG,
            temperature: config.temperature,
            topK: config.topK,
        };

        const newSession = await aiWindow.LanguageModel.create(createConfig);
        setSession(newSession);
        return newSession;
    }, [session, config]);

    const prompt = useCallback(
        async (input: string): Promise<string> => {
            if (!isAvailable) {
                throw new Error('Chrome AI is not available');
            }

            try {
                const aiSession = await getOrCreateSession();
                return await aiSession.prompt(input);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Prompt failed';
                setError(errorMessage);
                throw err;
            }
        },
        [isAvailable, getOrCreateSession]
    );

    const promptStreaming = useCallback(
        async (input: string): Promise<ReadableStream<string>> => {
            if (!isAvailable) {
                throw new Error('Chrome AI is not available');
            }

            try {
                const aiSession = await getOrCreateSession();
                if (!aiSession.promptStreaming) {
                    throw new Error('Streaming is not supported by this Chrome AI version');
                }
                return aiSession.promptStreaming(input);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Streaming prompt failed';
                setError(errorMessage);
                throw err;
            }
        },
        [isAvailable, getOrCreateSession]
    );

    const updateConfig = useCallback((newConfig: ChromeAIConfig) => {
        setConfig(newConfig);
        // Destroy existing session so a new one is created with updated config
        if (session) {
            session.destroy();
            setSession(null);
        }
    }, [session]);

    return {
        isAvailable,
        status,
        checkAvailability,
        isInitialized,
        error,
        prompt,
        promptStreaming,
        config,
        setConfig: updateConfig,
    };
};
