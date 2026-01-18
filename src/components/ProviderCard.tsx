import type { ProviderCardProps } from '../types';
import { defaultPreset } from '../presets/default';

/**
 * Card component for displaying AI provider options
 */
export const ProviderCard = ({
    providerType,
    selected,
    onSelect,
    badge,
    available = true,
    recommended,
    description,
    preset = defaultPreset,
    icons,
    className = '',
}: ProviderCardProps) => {
    const { Card, Badge } = preset;

    const getProviderTitle = () => {
        switch (providerType) {
            case 'chrome':
                return 'Chrome AI';
            case 'hosted-api':
                return 'Hosted API';
            case 'custom-llm':
                return 'Your API Key';
            default:
                return providerType;
        }
    };

    const getProviderDescription = () => {
        if (description) return description;
        switch (providerType) {
            case 'chrome':
                return 'Offline & private. Runs locally in your browser.';
            case 'hosted-api':
                return 'Works everywhere. Usage billed per request.';
            case 'custom-llm':
                return 'Unlimited usage with your own API key.';
            default:
                return '';
        }
    };

    const getProviderIcon = () => {
        switch (providerType) {
            case 'chrome':
                return icons?.cpu ?? <span style={{ fontSize: '16px', fontWeight: 'bold' }}>CPU</span>;
            case 'hosted-api':
                return icons?.cloud ?? <span style={{ fontSize: '16px', fontWeight: 'bold' }}>API</span>;
            case 'custom-llm':
                return icons?.key ?? <span style={{ fontSize: '16px', fontWeight: 'bold' }}>KEY</span>;
            default:
                return null;
        }
    };

    return (
        <Card
            onClick={available ? onSelect : undefined}
            selected={selected}
            disabled={!available}
            className={className}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                    style={{
                        fontSize: '24px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                    }}
                >
                    {getProviderIcon()}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '16px' }}>{getProviderTitle()}</span>
                        {badge && <Badge variant="primary">{badge}</Badge>}
                        {recommended && <Badge variant="success">Recommended</Badge>}
                        {!available && <Badge variant="warning">Unavailable</Badge>}
                    </div>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                        {getProviderDescription()}
                    </p>
                </div>
                {selected && (
                    <div style={{ color: '#3b82f6', flexShrink: 0, fontWeight: 'bold' }}>
                        {icons?.check ?? 'Selected'}
                    </div>
                )}
            </div>
        </Card>
    );
};
