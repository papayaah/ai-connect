import type { CostDisplayProps } from '../types';
import { defaultPreset } from '../presets/default';
import { getModel, formatCost, getCostTierEmoji, estimateMonthlyCost } from '../providers';

/**
 * Component for displaying cost estimates and comparisons
 */
export const CostDisplay = ({
    provider,
    model,
    showMonthlyEstimate = true,
    analysesPerMonth = 10,
    preset = defaultPreset,
    className = '',
}: CostDisplayProps) => {
    const { Badge } = preset;
    const modelInfo = getModel(provider, model);

    if (!modelInfo) {
        return null;
    }

    const perAnalysisCost = modelInfo.estimatedCostPerAnalysis ?? 0;
    const monthlyCost = estimateMonthlyCost(provider, model, analysesPerMonth);

    return (
        <div className={`p-4 bg-profit/10 border border-profit/30 rounded-lg ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold">$</span>
                <span className="font-semibold text-base">Cost Estimate</span>
            </div>

            <div className="grid gap-3">
                {/* Per Analysis Cost */}
                <div className="flex justify-between items-center">
                    <span className="text-foreground">Per analysis</span>
                    <span className="font-semibold text-profit text-lg">
                        ~{formatCost(perAnalysisCost)}
                    </span>
                </div>

                {/* Monthly Estimate */}
                {showMonthlyEstimate && (
                    <div className="flex justify-between items-center pt-3 border-t border-profit/30">
                        <span className="text-foreground">
                            Est. monthly ({analysesPerMonth} analyses)
                        </span>
                        <span className="font-semibold text-profit">
                            ~{formatCost(monthlyCost)}
                        </span>
                    </div>
                )}

                {/* Cost Tier */}
                <div className="flex justify-between items-center">
                    <span className="text-foreground">Cost tier</span>
                    <Badge
                        variant={
                            modelInfo.costTier === 'budget' ? 'success' :
                            modelInfo.costTier === 'standard' ? 'primary' :
                            'warning'
                        }
                    >
                        {getCostTierEmoji(modelInfo.costTier)} {modelInfo.costTier.charAt(0).toUpperCase() + modelInfo.costTier.slice(1)}
                    </Badge>
                </div>
            </div>

            {/* Pricing Details */}
            <div className="mt-3 pt-3 border-t border-profit/30 text-[13px] text-muted">
                <div>Input: ${modelInfo.pricing.inputCostPer1M.toFixed(2)}/1M tokens</div>
                <div>Output: ${modelInfo.pricing.outputCostPer1M.toFixed(2)}/1M tokens</div>
            </div>
        </div>
    );
};
