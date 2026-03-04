import type { UsageStatsProps, LLMProvider } from '../types';
import { defaultPreset } from '../presets/default';
import { formatCost, formatNumber, getProvider } from '../providers';

/**
 * Component for displaying usage statistics and cost tracking
 */
export const UsageStats = ({
    stats,
    onReset,
    preset = defaultPreset,
    className = '',
}: UsageStatsProps) => {
    const { Card, Button, Badge, Progress } = preset;

    if (!stats) {
        return (
            <Card className={className}>
                <div className="text-center py-6 text-muted">
                    <p className="m-0">No usage data yet</p>
                    <p className="mt-2 mb-0 text-sm">
                        Usage statistics will appear here after making API calls.
                    </p>
                </div>
            </Card>
        );
    }

    const providerEntries = Object.entries(stats.byProvider) as [LLMProvider, typeof stats.byProvider[LLMProvider]][];

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Summary Card */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="m-0 text-lg font-semibold">Usage Statistics</h3>
                    {onReset && (
                        <Button variant="ghost" size="sm" onClick={() => onReset()}>
                            Reset All
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted-bg rounded-lg text-center">
                        <div className="text-2xl font-bold text-accent">
                            {stats.totalCalls}
                        </div>
                        <div className="text-sm text-muted">API Calls</div>
                    </div>

                    <div className="p-4 bg-muted-bg rounded-lg text-center">
                        <div className="text-2xl font-bold text-accent">
                            {formatNumber(stats.totalInputTokens + stats.totalOutputTokens)}
                        </div>
                        <div className="text-sm text-muted">Total Tokens</div>
                    </div>

                    <div className="p-4 bg-profit/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-profit">
                            {formatCost(stats.estimatedCost)}
                        </div>
                        <div className="text-sm text-muted">Total Cost</div>
                    </div>
                </div>

                <div className="mt-4 text-[13px] text-muted">
                    Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                </div>
            </Card>

            {/* Per-Provider Breakdown */}
            {providerEntries.length > 0 && (
                <Card>
                    <h4 className="m-0 mb-4 text-base font-semibold">
                        By Provider
                    </h4>

                    <div className="flex flex-col gap-3">
                        {providerEntries.map(([providerId, providerStats]) => {
                            if (!providerStats) return null;
                            const providerInfo = getProvider(providerId);
                            const percentage = stats.estimatedCost > 0
                                ? (providerStats.cost / stats.estimatedCost) * 100
                                : 0;

                            return (
                                <div
                                    key={providerId}
                                    className="p-3 bg-muted-bg rounded-lg"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {providerInfo?.name ?? providerId}
                                            </span>
                                            <Badge variant="secondary">{providerStats.model}</Badge>
                                        </div>
                                        <span className="font-semibold text-profit">
                                            {formatCost(providerStats.cost)}
                                        </span>
                                    </div>

                                    <Progress value={percentage} max={100} />

                                    <div className="flex justify-between mt-2 text-[13px] text-muted">
                                        <span>{providerStats.calls} calls</span>
                                        <span>
                                            {formatNumber(providerStats.inputTokens)} in / {formatNumber(providerStats.outputTokens)} out
                                        </span>
                                    </div>

                                    {onReset && (
                                        <div className="mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onReset(providerId)}
                                            >
                                                Reset {providerInfo?.name ?? providerId}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
};
