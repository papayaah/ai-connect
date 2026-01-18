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
        <div
            className={className}
            style={{
                padding: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>$</span>
                <span style={{ fontWeight: 600, fontSize: '16px' }}>Cost Estimate</span>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
                {/* Per Analysis Cost */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ color: '#374151' }}>Per analysis</span>
                    <span style={{ fontWeight: 600, color: '#059669', fontSize: '18px' }}>
                        ~{formatCost(perAnalysisCost)}
                    </span>
                </div>

                {/* Monthly Estimate */}
                {showMonthlyEstimate && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '12px',
                            borderTop: '1px solid #bbf7d0',
                        }}
                    >
                        <span style={{ color: '#374151' }}>
                            Est. monthly ({analysesPerMonth} analyses)
                        </span>
                        <span style={{ fontWeight: 600, color: '#059669' }}>
                            ~{formatCost(monthlyCost)}
                        </span>
                    </div>
                )}

                {/* Cost Tier */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ color: '#374151' }}>Cost tier</span>
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
            <div
                style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #bbf7d0',
                    fontSize: '13px',
                    color: '#6b7280',
                }}
            >
                <div>Input: ${modelInfo.pricing.inputCostPer1M.toFixed(2)}/1M tokens</div>
                <div>Output: ${modelInfo.pricing.outputCostPer1M.toFixed(2)}/1M tokens</div>
            </div>
        </div>
    );
};
