import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    framework: '@storybook/react-vite',
    viteFinal: async (config) => {
        config.resolve = config.resolve || {};
        config.resolve.dedupe = ['react', 'react-dom'];
        
        // Externalize peer dependencies to avoid bundling issues
        config.build = config.build || {};
        config.build.rollupOptions = config.build.rollupOptions || {};
        config.build.rollupOptions.external = [
            ...(Array.isArray(config.build.rollupOptions.external) 
                ? config.build.rollupOptions.external 
                : []),
            'react',
            'react-dom',
            'ai',
            '@ai-sdk/openai',
            '@ai-sdk/anthropic',
            '@ai-sdk/google',
            '@ai-sdk/mistral',
            '@ai-sdk/cohere',
            '@ai-sdk/xai',
        ];
        
        return config;
    },
};

export default config;
