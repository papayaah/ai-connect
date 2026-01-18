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
                <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    <p style={{ margin: 0 }}>No usage data yet</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                        Usage statistics will appear here after making API calls.
                    </p>
                </div>
            </Card>
        );
    }

    const providerEntries = Object.entries(stats.byProvider) as [LLMProvider, typeof stats.byProvider[LLMProvider]][];

    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Summary Card */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Usage Statistics</h3>
                    {onReset && (
                        <Button variant="ghost" size="sm" onClick={() => onReset()}>
                            Reset All
                        </Button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div
                        style={{
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                            {stats.totalCalls}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>API Calls</div>
                    </div>

                    <div
                        style={{
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>
                            {formatNumber(stats.totalInputTokens + stats.totalOutputTokens)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Tokens</div>
                    </div>

                    <div
                        style={{
                            padding: '16px',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '8px',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                            {formatCost(stats.estimatedCost)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Cost</div>
                    </div>
                </div>

                <div style={{ marginTop: '16px', fontSize: '13px', color: '#9ca3af' }}>
                    Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                </div>
            </Card>

            {/* Per-Provider Breakdown */}
            {providerEntries.length > 0 && (
                <Card>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                        By Provider
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {providerEntries.map(([providerId, providerStats]) => {
                            if (!providerStats) return null;
                            const providerInfo = getProvider(providerId);
                            const percentage = stats.estimatedCost > 0
                                ? (providerStats.cost / stats.estimatedCost) * 100
                                : 0;

                            return (
                                <div
                                    key={providerId}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 500 }}>
                                                {providerInfo?.name ?? providerId}
                                            </span>
                                            <Badge variant="secondary">{providerStats.model}</Badge>
                                        </div>
                                        <span style={{ fontWeight: 600, color: '#059669' }}>
                                            {formatCost(providerStats.cost)}
                                        </span>
                                    </div>

                                    <Progress value={percentage} max={100} />

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginTop: '8px',
                                            fontSize: '13px',
                                            color: '#6b7280',
                                        }}
                                    >
                                        <span>{providerStats.calls} calls</span>
                                        <span>
                                            {formatNumber(providerStats.inputTokens)} in / {formatNumber(providerStats.outputTokens)} out
                                        </span>
                                    </div>

                                    {onReset && (
                                        <div style={{ marginTop: '8px' }}>
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
