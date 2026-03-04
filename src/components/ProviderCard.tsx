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
                return icons?.cpu ?? <span className="text-base font-bold">CPU</span>;
            case 'hosted-api':
                return icons?.cloud ?? <span className="text-base font-bold">API</span>;
            case 'custom-llm':
                return icons?.key ?? <span className="text-base font-bold">KEY</span>;
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
            <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0 flex items-center justify-center w-10 h-10">
                    {getProviderIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">{getProviderTitle()}</span>
                        {badge && <Badge variant="primary">{badge}</Badge>}
                        {recommended && <Badge variant="success">Recommended</Badge>}
                        {!available && <Badge variant="warning">Unavailable</Badge>}
                    </div>
                    <p className="m-0 text-muted text-sm">
                        {getProviderDescription()}
                    </p>
                </div>
                {selected && (
                    <div className="text-accent shrink-0 font-bold">
                        {icons?.check ?? 'Selected'}
                    </div>
                )}
            </div>
        </Card>
    );
};
