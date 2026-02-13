import type { Meta, StoryObj } from '@storybook/react';
import { CostDisplay } from '../components/CostDisplay';
import { tailwindPreset } from '../presets/tailwind';
import { defaultPreset } from '../presets/default';

const meta: Meta<typeof CostDisplay> = {
    title: 'Components/CostDisplay',
    component: CostDisplay,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        provider: {
            control: 'select',
            options: ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai', 'perplexity', 'openrouter'],
        },
        showMonthlyEstimate: {
            control: 'boolean',
        },
        analysesPerMonth: {
            control: { type: 'number', min: 1, max: 100 },
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: '350px', padding: '20px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BudgetModel: Story = {
    args: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        showMonthlyEstimate: true,
        analysesPerMonth: 10,
        preset: defaultPreset,
    },
};

export const StandardModel: Story = {
    args: {
        provider: 'openai',
        model: 'gpt-4o',
        showMonthlyEstimate: true,
        analysesPerMonth: 10,
        preset: defaultPreset,
    },
};

export const PremiumModel: Story = {
    args: {
        provider: 'anthropic',
        model: 'claude-opus-4-20250514',
        showMonthlyEstimate: true,
        analysesPerMonth: 10,
        preset: defaultPreset,
    },
};

export const GoogleGemini: Story = {
    args: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        showMonthlyEstimate: true,
        analysesPerMonth: 10,
        preset: defaultPreset,
    },
};

export const OpenRouterFree: Story = {
    args: {
        provider: 'openrouter',
        model: 'google/gemini-2.0-flash-exp:free',
        showMonthlyEstimate: true,
        analysesPerMonth: 10,
        preset: defaultPreset,
    },
};

export const HighUsage: Story = {
    args: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        showMonthlyEstimate: true,
        analysesPerMonth: 50,
        preset: defaultPreset,
    },
};

export const NoMonthlyEstimate: Story = {
    args: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        showMonthlyEstimate: false,
        preset: defaultPreset,
    },
};

export const WithTailwindPreset: Story = {
    args: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        showMonthlyEstimate: true,
        analysesPerMonth: 10,
        preset: tailwindPreset,
    },
};
