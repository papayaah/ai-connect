import type {
    ComponentPreset,
    CardProps,
    ButtonProps,
    TextInputProps,
    SelectProps,
    BadgeProps,
    LoaderProps,
    AlertProps,
    TooltipProps,
    ProgressProps,
} from '../types';

/**
 * Default Component Preset
 * Minimal styling with inline styles - no external dependencies
 */
export const defaultPreset: ComponentPreset = {
    Card: ({ children, onClick, selected, disabled, className = '', style }: CardProps) => (
        <div
            onClick={disabled ? undefined : onClick}
            className={className}
            style={{
                border: `2px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: onClick && !disabled ? 'pointer' : 'default',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
                backgroundColor: selected ? '#eff6ff' : '#ffffff',
                ...style,
            }}
        >
            {children}
        </div>
    ),

    Button: ({
        children,
        onClick,
        variant = 'primary',
        disabled,
        loading,
        size = 'md',
        fullWidth,
        leftIcon,
        rightIcon,
        className = '',
        type = 'button',
        'aria-label': ariaLabel,
    }: ButtonProps) => {
        const variants = {
            primary: { bg: '#3b82f6', color: '#ffffff', border: 'none' },
            secondary: { bg: '#e5e7eb', color: '#374151', border: 'none' },
            danger: { bg: '#ef4444', color: '#ffffff', border: 'none' },
            outline: { bg: 'transparent', color: '#374151', border: '1px solid #d1d5db' },
            ghost: { bg: 'transparent', color: '#374151', border: 'none' },
        };

        const sizes = {
            sm: { padding: '6px 12px', fontSize: '14px' },
            md: { padding: '8px 16px', fontSize: '16px' },
            lg: { padding: '12px 24px', fontSize: '18px' },
        };

        const v = variants[variant];
        const s = sizes[size];

        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled || loading}
                aria-label={ariaLabel}
                className={className}
                style={{
                    backgroundColor: v.bg,
                    color: v.color,
                    border: v.border,
                    borderRadius: '6px',
                    padding: s.padding,
                    fontSize: s.fontSize,
                    fontWeight: 500,
                    cursor: disabled || loading ? 'not-allowed' : 'pointer',
                    opacity: disabled || loading ? 0.5 : 1,
                    width: fullWidth ? '100%' : 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                }}
            >
                {leftIcon && <span>{leftIcon}</span>}
                {loading ? 'Loading...' : children}
                {rightIcon && <span>{rightIcon}</span>}
            </button>
        );
    },

    TextInput: ({
        value,
        onChange,
        placeholder,
        type = 'text',
        leftIcon,
        rightIcon,
        error,
        disabled,
        className = '',
    }: TextInputProps) => (
        <div style={{ position: 'relative', width: '100%' }} className={className}>
            {leftIcon && (
                <div
                    style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        pointerEvents: 'none',
                    }}
                >
                    {leftIcon}
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: leftIcon ? '40px' : '12px',
                    paddingRight: rightIcon ? '40px' : '12px',
                    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    opacity: disabled ? 0.5 : 1,
                    boxSizing: 'border-box',
                }}
            />
            {rightIcon && (
                <div
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                    }}
                >
                    {rightIcon}
                </div>
            )}
            {error && (
                <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                    {error}
                </div>
            )}
        </div>
    ),

    Select: ({
        value,
        onChange,
        options,
        placeholder,
        label,
        error,
        disabled,
        'aria-label': ariaLabel,
        className = '',
    }: SelectProps) => {
        const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
        return (
            <div style={{ width: '100%' }} className={className}>
                {label && (
                    <label
                        htmlFor={selectId}
                        style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '4px',
                        }}
                    >
                        {label}
                    </label>
                )}
                <select
                    id={selectId}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    aria-label={!label ? ariaLabel || placeholder : undefined}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '6px',
                        fontSize: '16px',
                        backgroundColor: '#ffffff',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                        {error}
                    </div>
                )}
            </div>
        );
    },

    Badge: ({ children, variant = 'default', className = '' }: BadgeProps) => {
        const variants = {
            default: { bg: '#f3f4f6', color: '#374151' },
            primary: { bg: '#dbeafe', color: '#1d4ed8' },
            secondary: { bg: '#f3e8ff', color: '#7c3aed' },
            success: { bg: '#dcfce7', color: '#15803d' },
            warning: { bg: '#fef3c7', color: '#b45309' },
            danger: { bg: '#fee2e2', color: '#b91c1c' },
        };

        const v = variants[variant];

        return (
            <span
                className={className}
                style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '9999px',
                    backgroundColor: v.bg,
                    color: v.color,
                }}
            >
                {children}
            </span>
        );
    },

    Loader: ({ size = 'md', className = '' }: LoaderProps) => {
        const sizes = {
            sm: { width: '16px', height: '16px', border: '2px' },
            md: { width: '24px', height: '24px', border: '3px' },
            lg: { width: '32px', height: '32px', border: '4px' },
        };

        const s = sizes[size];

        return (
            <div
                className={className}
                style={{
                    width: s.width,
                    height: s.height,
                    border: `${s.border} solid #e5e7eb`,
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            />
        );
    },

    Alert: ({ children, variant = 'info', icon, className = '' }: AlertProps) => {
        const variants = {
            info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
            success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
            warning: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
            error: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
        };

        const v = variants[variant];

        return (
            <div
                className={className}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: v.bg,
                    border: `1px solid ${v.border}`,
                    borderRadius: '8px',
                    color: v.color,
                    fontSize: '14px',
                }}
            >
                {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
                <div style={{ flex: 1 }}>{children}</div>
            </div>
        );
    },

    Tooltip: ({ children, content, className = '' }: TooltipProps) => (
        <div
            className={className}
            style={{ position: 'relative', display: 'inline-block' }}
            title={typeof content === 'string' ? content : undefined}
        >
            {children}
        </div>
    ),

    Progress: ({ value, max = 100, className = '' }: ProgressProps) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));

        return (
            <div
                className={className}
                style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.3s ease',
                    }}
                />
            </div>
        );
    },
};
