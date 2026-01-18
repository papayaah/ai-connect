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
 * Uses Tailwind CSS classes for styling
 */
export const tailwindPreset: ComponentPreset = {
    Card: ({ children, onClick, selected, disabled, className = '', style }: CardProps) => (
        <div
            onClick={disabled ? undefined : onClick}
            className={`
                border-2 rounded-lg p-4 transition-all
                ${onClick && !disabled ? 'cursor-pointer hover:shadow-lg' : ''}
                ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
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
            primary: 'bg-blue-600 text-white hover:bg-blue-700',
            secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
            danger: 'bg-red-600 text-white hover:bg-red-700',
            outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
            ghost: 'text-gray-700 hover:bg-gray-100',
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
        <div className={`relative w-full ${className}`}>
            {leftIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
                    w-full px-3 py-2 border rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${leftIcon ? 'pl-10' : ''}
                    ${rightIcon ? 'pr-10' : ''}
                    ${error ? 'border-red-500' : 'border-gray-300'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                `}
            />
            {rightIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {rightIcon}
                </div>
            )}
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
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
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        w-full px-3 py-2 border rounded-md bg-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${error ? 'border-red-500' : 'border-gray-300'}
                        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
                    `}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            </div>
        );
    },

    Badge: ({ children, variant = 'default', className = '' }: BadgeProps) => {
        const variants = {
            default: 'bg-gray-100 text-gray-800',
            primary: 'bg-blue-100 text-blue-800',
            secondary: 'bg-purple-100 text-purple-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            danger: 'bg-red-100 text-red-800',
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
                    border-gray-200 border-t-blue-600
                    rounded-full animate-spin
                    ${className}
                `}
            />
        );
    },

    Alert: ({ children, variant = 'info', icon, className = '' }: AlertProps) => {
        const variants = {
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            success: 'bg-green-50 border-green-200 text-green-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            error: 'bg-red-50 border-red-200 text-red-800',
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
            {/* Note: For a proper tooltip, you'd need a more complex implementation or a library */}
        </div>
    ),

    Progress: ({ value, max = 100, className = '' }: ProgressProps) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));

        return (
            <div
                className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}
            >
                <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        );
    },
};
