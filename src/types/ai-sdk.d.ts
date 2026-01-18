// Type declarations for optional peer dependencies
// These packages are peer dependencies and may not be installed

declare module '@ai-sdk/openai' {
    export function openai(model: string, options?: { apiKey?: string; baseURL?: string }): any;
}

declare module '@ai-sdk/anthropic' {
    export function anthropic(model: string, options?: { apiKey?: string; baseURL?: string }): any;
}

declare module '@ai-sdk/google' {
    export function google(model: string, options?: { apiKey?: string; baseURL?: string }): any;
}

declare module '@ai-sdk/mistral' {
    export function mistral(model: string, options?: { apiKey?: string; baseURL?: string }): any;
}

declare module '@ai-sdk/cohere' {
    export function cohere(model: string, options?: { apiKey?: string; baseURL?: string }): any;
}

declare module '@ai-sdk/xai' {
    export function createXai(options?: { apiKey?: string; baseURL?: string }): (model: string) => any;
}

declare module 'ai' {
    export function generateText(options: any): Promise<any>;
    export function streamText(options: any): Promise<{ textStream: ReadableStream<string> }>;
}
