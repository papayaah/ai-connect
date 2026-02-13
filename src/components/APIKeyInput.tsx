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

    const { validateApiKey, isValidating, lastError, clearError } = useProviderValidation();

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
        const result = await validateApiKey(provider, value);
        onValidate?.(result.isValid);
    }, [validateApiKey, provider, value, onValidate]);

    const displayError = externalError ?? (touched ? lastError : undefined) ?? undefined;

    const toggleVisibility = () => setShowKey(!showKey);

    const EyeIcon = showKey
        ? (icons?.eyeOff ?? <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>Hide</span>)
        : (icons?.eye ?? <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>Show</span>);

    return (
        <div className={className} style={{ width: '100%' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                }}
            >
                API Key
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <TextInput
                        type={showKey ? 'text' : 'password'}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        error={displayError}
                        rightIcon={
                            <div
                                onClick={toggleVisibility}
                                style={{ cursor: 'pointer' }}
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
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                    Get your API key from{' '}
                    <a
                        href={providerInfo.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'underline' }}
                    >
                        {providerInfo.name} Console
                    </a>
                </div>
            )}

            {displayError && (
                <div style={{ marginTop: '8px' }}>
                    <Alert variant="error">
                        {displayError}
                    </Alert>
                </div>
            )}
        </div>
    );
};
