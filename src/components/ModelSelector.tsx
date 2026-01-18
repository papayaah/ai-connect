import type { ModelSelectorProps } from '../types';
import { defaultPreset } from '../presets/default';
import { getModels, getCostTierEmoji, getCostTierLabel, formatCost } from '../providers';

/**
 * Model selection component with pricing information
 */
export const ModelSelector = ({
    provider,
    selectedModel,
    onModelSelect,
    showPricing = true,
    preset = defaultPreset,
    className = '',
}: ModelSelectorProps) => {
    const { Select, Badge } = preset;
    const models = getModels(provider);

    const options = models.map((model) => ({
        value: model.id,
        label: showPricing
            ? `${model.name} ${getCostTierEmoji(model.costTier)}`
            : model.name,
    }));

    const selectedModelInfo = models.find((m) => m.id === selectedModel);

    return (
        <div className={className} style={{ width: '100%' }}>
            <Select
                value={selectedModel}
                onChange={onModelSelect}
                options={options}
                placeholder="Select a model"
                label="Model"
            />

            {showPricing && selectedModelInfo && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        fontSize: '14px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 500 }}>{selectedModelInfo.name}</span>
                        <Badge variant={
                            selectedModelInfo.costTier === 'budget' ? 'success' :
                            selectedModelInfo.costTier === 'standard' ? 'primary' :
                            'warning'
                        }>
                            {getCostTierLabel(selectedModelInfo.costTier)}
                        </Badge>
                    </div>

                    <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>
                        {selectedModelInfo.description}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        <div>
                            <span style={{ color: '#6b7280' }}>Input:</span>{' '}
                            <span style={{ fontWeight: 500 }}>
                                ${selectedModelInfo.pricing.inputCostPer1M.toFixed(2)}/1M tokens
                            </span>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280' }}>Output:</span>{' '}
                            <span style={{ fontWeight: 500 }}>
                                ${selectedModelInfo.pricing.outputCostPer1M.toFixed(2)}/1M tokens
                            </span>
                        </div>
                    </div>

                    {selectedModelInfo.estimatedCostPerAnalysis !== undefined && (
                        <div
                            style={{
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid #e5e7eb',
                            }}
                        >
                            <span style={{ color: '#6b7280' }}>Est. cost per analysis:</span>{' '}
                            <span style={{ fontWeight: 600, color: '#059669' }}>
                                ~{formatCost(selectedModelInfo.estimatedCostPerAnalysis)}
                            </span>
                        </div>
                    )}

                    <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>
                        Context: {(selectedModelInfo.contextLength / 1000).toFixed(0)}K tokens
                    </div>
                </div>
            )}
        </div>
    );
};
