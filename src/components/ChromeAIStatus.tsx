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
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader size="sm" />
                <span className="text-muted text-sm">Checking Chrome AI availability...</span>
            </div>
        );
    }

    const getStatusContent = () => {
        switch (status) {
            case 'available':
                return (
                    <Alert variant="success">
                        <div className="flex items-center gap-2">
                            {icons?.check ?? <span className="font-bold">OK</span>}
                            <div>
                                <strong>Chrome AI Available</strong>
                                <p className="mt-1 mb-0 text-[13px] opacity-90">
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
                            <div className="flex items-center gap-2 mb-2">
                                {icons?.info ?? <span className="font-bold">Info:</span>}
                                <strong>Chrome AI Needs Download</strong>
                            </div>
                            <p className="mb-3 mt-0 text-[13px]">
                                Chrome AI is supported but the model needs to be downloaded first.
                            </p>
                            <ol className="m-0 pl-5 text-[13px]">
                                <li>Open Chrome Settings</li>
                                <li>Go to "AI" or "Experimental AI features"</li>
                                <li>Enable and download the built-in AI model</li>
                            </ol>
                            <div className="mt-3">
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
                            <div className="flex items-center gap-2 mb-2">
                                {icons?.info ?? <span className="font-bold">Info:</span>}
                                <strong>Chrome AI Not Available</strong>
                            </div>
                            <p className="m-0 text-[13px]">
                                Chrome AI requires Chrome 127+ with experimental features enabled.
                                Don't worry - you can still use the shared API or your own API key!
                            </p>
                        </div>
                    </Alert>
                );

            case 'error':
                return (
                    <Alert variant="error">
                        <div className="flex items-center gap-2">
                            {icons?.alertCircle ?? <span className="font-bold">Error:</span>}
                            <div>
                                <strong>Error Checking Chrome AI</strong>
                                {error && (
                                    <p className="mt-1 mb-0 text-[13px]">{error}</p>
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
