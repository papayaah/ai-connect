import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ModelSelector } from '../components/ModelSelector';
import { tailwindPreset } from '../presets/tailwind';
import { defaultPreset } from '../presets/default';

const meta: Meta<typeof ModelSelector> = {
    title: 'Components/ModelSelector',
    component: ModelSelector,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        provider: {
            control: 'select',
            options: ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai', 'perplexity', 'openrouter'],
        },
        showPricing: {
            control: 'boolean',
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: '400px', padding: '20px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const ModelSelectorWrapper = (args: any) => {
    const [selectedModel, setSelectedModel] = useState(args.selectedModel || '');
    return (
        <ModelSelector
            {...args}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
        />
    );
};

export const OpenAI: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'openai',
        selectedModel: 'gpt-4o-mini',
        showPricing: true,
        preset: defaultPreset,
    },
};

export const Anthropic: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'anthropic',
        selectedModel: 'claude-sonnet-4-20250514',
        showPricing: true,
        preset: defaultPreset,
    },
};

export const Google: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'google',
        selectedModel: 'gemini-2.0-flash',
        showPricing: true,
        preset: defaultPreset,
    },
};

export const Mistral: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'mistral',
        selectedModel: 'mistral-small-latest',
        showPricing: true,
        preset: defaultPreset,
    },
};

export const OpenRouter: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'openrouter',
        selectedModel: 'google/gemini-2.0-flash-exp:free',
        showPricing: true,
        preset: defaultPreset,
    },
};

export const WithTailwindPreset: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'openai',
        selectedModel: 'gpt-4o',
        showPricing: true,
        preset: tailwindPreset,
    },
};

export const NoPricing: Story = {
    render: (args) => <ModelSelectorWrapper {...args} />,
    args: {
        provider: 'openai',
        selectedModel: 'gpt-4o-mini',
        showPricing: false,
        preset: defaultPreset,
    },
};
