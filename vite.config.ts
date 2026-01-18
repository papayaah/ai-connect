import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: false,
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'AIManagement',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'lucide-react',
                'ai',
                '@ai-sdk/openai',
                '@ai-sdk/anthropic',
                '@ai-sdk/google',
                '@ai-sdk/mistral',
                '@ai-sdk/cohere',
                '@ai-sdk/xai',
            ],
            output: {
                banner: '"use client";',
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'lucide-react': 'LucideReact',
                },
            },
        },
    },
});
