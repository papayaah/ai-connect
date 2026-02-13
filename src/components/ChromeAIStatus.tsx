'use client';

import { useEffect } from 'react';
import type { ChromeAIStatusProps } from '../types';
import { defaultPreset } from '../presets/default';
import { useChromeAI } from '../hooks';

/**
 * Component for displaying Chrome AI availability status
 */
export const ChromeAIStatus = ({
    onStatusChange,
    preset = defaultPreset,
    icons,
    className = '',
}: ChromeAIStatusProps) => {
    const { Alert, Button, Loader } = preset;
    const { status, isInitialized, checkAvailability, error } = useChromeAI();

    useEffect(() => {
        if (isInitialized) {
            onStatusChange?.(status);
        }
    }, [status, isInitialized, onStatusChange]);

    if (!isInitialized) {
        return (
            <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader size="sm" />
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Checking Chrome AI availability...</span>
            </div>
        );
    }

    const getStatusContent = () => {
        switch (status) {
            case 'available':
                return (
                    <Alert variant="success">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {icons?.check ?? <span style={{ fontWeight: 'bold' }}>OK</span>}
                            <div>
                                <strong>Chrome AI Available</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                                    Your browser supports offline AI. Completely private and free!
                                </p>
                            </div>
                        </div>
                    </Alert>
                );

            case 'needs-download':
                return (
                    <Alert variant="warning">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                {icons?.info ?? <span style={{ fontWeight: 'bold' }}>Info:</span>}
                                <strong>Chrome AI Needs Download</strong>
                            </div>
                            <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
                                Chrome AI is supported but the model needs to be downloaded first.
                            </p>
                            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                                <li>Open Chrome Settings</li>
                                <li>Go to "AI" or "Experimental AI features"</li>
                                <li>Enable and download the built-in AI model</li>
                            </ol>
                            <div style={{ marginTop: '12px' }}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => checkAvailability()}
                                >
                                    {icons?.refresh ?? 'Refresh'} Check Again
                                </Button>
                            </div>
                        </div>
                    </Alert>
                );

            case 'not-available':
                return (
                    <Alert variant="info">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                {icons?.info ?? <span style={{ fontWeight: 'bold' }}>Info:</span>}
                                <strong>Chrome AI Not Available</strong>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px' }}>
                                Chrome AI requires Chrome 127+ with experimental features enabled.
                                Don't worry - you can still use the shared API or your own API key!
                            </p>
                        </div>
                    </Alert>
                );

            case 'error':
                return (
                    <Alert variant="error">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {icons?.alertCircle ?? <span style={{ fontWeight: 'bold' }}>Error:</span>}
                            <div>
                                <strong>Error Checking Chrome AI</strong>
                                {error && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{error}</p>
                                )}
                            </div>
                        </div>
                    </Alert>
                );

            default:
                return null;
        }
    };

    return <div className={className}>{getStatusContent()}</div>;
};
