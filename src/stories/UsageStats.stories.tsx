import type { Meta, StoryObj } from '@storybook/react';
import { UsageStats } from '../components/UsageStats';
import { tailwindPreset } from '../presets/tailwind';
import { defaultPreset } from '../presets/default';
import type { UsageStats as UsageStatsType } from '../types';

const meta: Meta<typeof UsageStats> = {
    title: 'Components/UsageStats',
    component: UsageStats,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        onReset: { action: 'reset' },
    },
    decorators: [
        (Story) => (
            <div style={{ width: '500px', padding: '20px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStats: UsageStatsType = {
    totalCalls: 47,
    totalInputTokens: 23500,
    totalOutputTokens: 18200,
    estimatedCost: 0.0825,
    lastUpdated: new Date().toISOString(),
    byProvider: {
        openai: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            calls: 32,
            inputTokens: 16000,
            outputTokens: 12800,
            cost: 0.045,
            lastUsed: new Date().toISOString(),
        },
        anthropic: {
            provider: 'anthropic',
            model: 'claude-3-5-haiku-20241022',
            calls: 15,
            inputTokens: 7500,
            outputTokens: 5400,
            cost: 0.0375,
            lastUsed: new Date(Date.now() - 86400000).toISOString(),
        },
    },
};

const minimalStats: UsageStatsType = {
    totalCalls: 3,
    totalInputTokens: 900,
    totalOutputTokens: 700,
    estimatedCost: 0.00125,
    lastUpdated: new Date().toISOString(),
    byProvider: {
        google: {
            provider: 'google',
            model: 'gemini-2.0-flash',
            calls: 3,
            inputTokens: 900,
            outputTokens: 700,
            cost: 0.00125,
            lastUsed: new Date().toISOString(),
        },
    },
};

export const Default: Story = {
    args: {
        stats: mockStats,
        preset: defaultPreset,
    },
};

export const WithTailwindPreset: Story = {
    args: {
        stats: mockStats,
        preset: tailwindPreset,
    },
};

export const MinimalUsage: Story = {
    args: {
        stats: minimalStats,
        preset: defaultPreset,
    },
};

export const NoStats: Story = {
    args: {
        stats: null,
        preset: defaultPreset,
    },
};

export const WithResetHandler: Story = {
    args: {
        stats: mockStats,
        preset: defaultPreset,
        onReset: (provider?: string) => console.log('Reset:', provider || 'all'),
    },
};

export const SingleProvider: Story = {
    args: {
        stats: {
            ...mockStats,
            byProvider: {
                openai: mockStats.byProvider.openai!,
            },
        },
        preset: defaultPreset,
    },
};
