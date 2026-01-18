import type { Meta, StoryObj } from '@storybook/react';
import { AIProviderSelector } from '../components/AIProviderSelector';
import { tailwindPreset } from '../presets/tailwind';
import { defaultPreset } from '../presets/default';

const meta: Meta<typeof AIProviderSelector> = {
    title: 'Components/AIProviderSelector',
    component: AIProviderSelector,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        onProviderSelect: { action: 'provider selected' },
        onValidationComplete: { action: 'validation complete' },
        onCostEstimate: { action: 'cost estimate' },
        theme: {
            control: 'radio',
            options: ['light', 'dark', 'auto'],
        },
        showCostComparison: {
            control: 'boolean',
        },
        analysesPerMonth: {
            control: { type: 'number', min: 1, max: 100 },
        },
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

export const Default: Story = {
    args: {
        showCostComparison: true,
        analysesPerMonth: 10,
    },
};

export const WithTailwindPreset: Story = {
    args: {
        preset: tailwindPreset,
        showCostComparison: true,
        analysesPerMonth: 10,
    },
};

export const WithDefaultPreset: Story = {
    args: {
        preset: defaultPreset,
        showCostComparison: true,
        analysesPerMonth: 10,
    },
};

export const LimitedProviders: Story = {
    args: {
        enabledProviders: ['openai', 'anthropic', 'google'],
        showCostComparison: true,
    },
};

export const NoCostComparison: Story = {
    args: {
        showCostComparison: false,
    },
};

export const HighUsage: Story = {
    args: {
        showCostComparison: true,
        analysesPerMonth: 50,
    },
};

export const DefaultToChrome: Story = {
    args: {
        defaultProvider: 'chrome',
        showCostComparison: true,
    },
};

export const DefaultToCustomLLM: Story = {
    args: {
        defaultProvider: 'custom-llm',
        showCostComparison: true,
    },
};
