'use client';

import { useState, useCallback } from 'react';
import type { APIKeyInputProps } from '../types';
import { defaultPreset } from '../presets/default';
import { getProvider } from '../providers';
import { useProviderValidation } from '../hooks';

/**
 * API key input component with validation and masking
 */
export const APIKeyInput = ({
    provider,
    model,
    value,
    onChange,
    onValidate,
    error: externalError,
    preset = defaultPreset,
    icons,
    className = '',
}: APIKeyInputProps) => {
    const { TextInput, Button, Alert } = preset;
    const [showKey, setShowKey] = useState(false);
    const [touched, setTouched] = useState(false);

    const { validateApiKey, isValidating, lastError, lastSuccess, clearError } = useProviderValidation();

    const providerInfo = getProvider(provider);
    const placeholder = providerInfo?.apiKeyPlaceholder ?? 'Enter your API key';

    const handleChange = useCallback(
        (newValue: string) => {
            onChange(newValue);
            setTouched(true);
            clearError();
        },
        [onChange, clearError]
    );

    const handleValidate = useCallback(async () => {
        const result = await validateApiKey(provider, value, model);
        onValidate?.(result.isValid);
    }, [validateApiKey, provider, value, model, onValidate]);

    const displayError = externalError ?? (touched ? lastError : undefined) ?? undefined;

    const toggleVisibility = () => setShowKey(!showKey);

    const EyeIcon = showKey
        ? (icons?.eyeOff ?? <span className="cursor-pointer font-bold">Hide</span>)
        : (icons?.eye ?? <span className="cursor-pointer font-bold">Show</span>);

    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium text-foreground mb-1">
                API Key
            </label>

            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <TextInput
                        type={showKey ? 'text' : 'password'}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        error={displayError}
                        rightIcon={
                            <div
                                onClick={toggleVisibility}
                                className="cursor-pointer"
                            >
                                {EyeIcon}
                            </div>
                        }
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={handleValidate}
                    disabled={!value || isValidating}
                    loading={isValidating}
                >
                    Validate
                </Button>
            </div>

            {providerInfo?.docsUrl && (
                <div className="mt-2 text-[13px] text-muted">
                    Get your API key from{' '}
                    <a
                        href={providerInfo.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline"
                    >
                        {providerInfo.name} Console
                    </a>
                </div>
            )}

            {lastSuccess && !displayError && (
                <div className="mt-2">
                    <Alert variant="success">
                        API key is valid!
                    </Alert>
                </div>
            )}


        </div>
    );
};
