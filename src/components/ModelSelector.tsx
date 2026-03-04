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
        <div className={`w-full ${className}`}>
            <Select
                value={selectedModel}
                onChange={onModelSelect}
                options={options}
                placeholder="Select a model"
                label="Model"
            />

            {showPricing && selectedModelInfo && (
                <div className="mt-3 p-3 bg-muted-bg rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{selectedModelInfo.name}</span>
                        <Badge variant={
                            selectedModelInfo.costTier === 'budget' ? 'success' :
                            selectedModelInfo.costTier === 'standard' ? 'primary' :
                            'warning'
                        }>
                            {getCostTierLabel(selectedModelInfo.costTier)}
                        </Badge>
                    </div>

                    <p className="m-0 mb-2 text-muted">
                        {selectedModelInfo.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div>
                            <span className="text-muted">Input:</span>{' '}
                            <span className="font-medium">
                                ${selectedModelInfo.pricing.inputCostPer1M.toFixed(2)}/1M tokens
                            </span>
                        </div>
                        <div>
                            <span className="text-muted">Output:</span>{' '}
                            <span className="font-medium">
                                ${selectedModelInfo.pricing.outputCostPer1M.toFixed(2)}/1M tokens
                            </span>
                        </div>
                    </div>

                    {selectedModelInfo.estimatedCostPerAnalysis !== undefined && (
                        <div className="mt-2 pt-2 border-t border-card-border">
                            <span className="text-muted">Est. cost per analysis:</span>{' '}
                            <span className="font-semibold text-profit">
                                ~{formatCost(selectedModelInfo.estimatedCostPerAnalysis)}
                            </span>
                        </div>
                    )}

                    <div className="mt-1 text-muted text-xs">
                        Context: {(selectedModelInfo.contextLength / 1000).toFixed(0)}K tokens
                    </div>
                </div>
            )}
        </div>
    );
};
