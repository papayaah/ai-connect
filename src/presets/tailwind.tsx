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
 * Tailwind CSS Component Preset
 * Uses CSS variables for automatic dark/light mode support
 */
export const tailwindPreset: ComponentPreset = {
    Card: ({ children, onClick, selected, disabled, className = '', style }: CardProps) => (
        <div
            onClick={disabled ? undefined : onClick}
            className={`
                border-2 rounded-lg p-4 transition-all
                ${onClick && !disabled ? 'cursor-pointer hover:shadow-lg' : ''}
                ${selected ? 'border-accent bg-accent-light' : 'border-card-border bg-card-bg'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
            style={style}
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
            primary: 'bg-accent text-white hover:opacity-90',
            secondary: 'bg-muted-bg text-foreground hover:opacity-80',
            danger: 'bg-loss text-white hover:opacity-90',
            outline: 'border border-card-border text-foreground hover:bg-muted-bg',
            ghost: 'text-foreground hover:bg-muted-bg',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        };

        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled || loading}
                aria-label={ariaLabel}
                className={`
                    rounded-md font-medium transition-colors
                    ${variants[variant]}
                    ${sizes[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
                    inline-flex items-center justify-center gap-2
                    ${className}
                `}
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
        <div className={`w-full ${className}`}>
            <div className="relative w-full">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                        {leftIcon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        w-full px-3 py-2 border rounded-md bg-card-bg text-foreground
                        focus:outline-none focus:ring-2 focus:ring-accent
                        placeholder:text-muted
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${error ? 'border-loss' : 'border-card-border'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                />
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && <div className="text-loss text-sm mt-1">{error}</div>}
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
            <div className={`w-full ${className}`}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-foreground mb-1"
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
                    className={`
                        w-full px-3 py-2 border rounded-md bg-card-bg text-foreground
                        focus:outline-none focus:ring-2 focus:ring-accent
                        ${error ? 'border-loss' : 'border-card-border'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <div className="text-loss text-sm mt-1">{error}</div>}
            </div>
        );
    },

    Badge: ({ children, variant = 'default', className = '' }: BadgeProps) => {
        const variants = {
            default: 'bg-muted-bg text-foreground',
            primary: 'bg-accent-light text-accent',
            secondary: 'bg-muted-bg text-muted',
            success: 'bg-profit/15 text-profit',
            warning: 'bg-amber-500/15 text-amber-500',
            danger: 'bg-loss/15 text-loss',
        };

        return (
            <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${variants[variant]} ${className}`}
            >
                {children}
            </span>
        );
    },

    Loader: ({ size = 'md', className = '' }: LoaderProps) => {
        const sizes = {
            sm: 'w-4 h-4 border-2',
            md: 'w-6 h-6 border-2',
            lg: 'w-8 h-8 border-3',
        };

        return (
            <div
                className={`
                    ${sizes[size]}
                    border-card-border border-t-accent
                    rounded-full animate-spin
                    ${className}
                `}
            />
        );
    },

    Alert: ({ children, variant = 'info', icon, className = '' }: AlertProps) => {
        const variants = {
            info: 'bg-accent-light border-accent/30 text-accent',
            success: 'bg-profit/10 border-profit/30 text-profit',
            warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
            error: 'bg-loss/10 border-loss/30 text-loss',
        };

        return (
            <div
                className={`
                    flex items-start gap-3 p-3 border rounded-lg text-sm
                    ${variants[variant]}
                    ${className}
                `}
            >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <div className="flex-1">{children}</div>
            </div>
        );
    },

    Tooltip: ({ children, content, className = '' }: TooltipProps) => (
        <div
            className={`relative inline-block group ${className}`}
            title={typeof content === 'string' ? content : undefined}
        >
            {children}
        </div>
    ),

    Progress: ({ value, max = 100, className = '' }: ProgressProps) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));

        return (
            <div
                className={`w-full h-2 bg-muted-bg rounded-full overflow-hidden ${className}`}
            >
                <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        );
    },
};
