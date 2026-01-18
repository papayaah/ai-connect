import type { AIManagementIcons } from '../types';
import {
    Check,
    X,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    Info,
    ChevronDown,
    Sparkles,
    Cloud,
    Key,
    Cpu,
    DollarSign,
    Zap,
    Shield,
    Globe,
    RefreshCw,
    Trash2,
} from 'lucide-react';

/**
 * Lucide Icons preset for AI Toolkit
 * Requires lucide-react to be installed as a peer dependency
 *
 * Usage:
 * import { lucideIcons } from '@reactkits.dev/react-ai-management/presets/lucide';
 * <AIProviderSelector icons={lucideIcons} />
 */

/**
 * Lucide icons preset
 * Icons are pre-rendered as JSX elements for direct use as ReactNode
 */
export const lucideIcons: AIManagementIcons = {
    check: <Check size={16} />,
    x: <X size={16} />,
    alertCircle: <AlertCircle size={16} />,
    loader: <Loader2 size={16} />,
    eye: <Eye size={16} />,
    eyeOff: <EyeOff size={16} />,
    info: <Info size={16} />,
    chevronDown: <ChevronDown size={16} />,
    sparkles: <Sparkles size={16} />,
    cloud: <Cloud size={16} />,
    key: <Key size={16} />,
    cpu: <Cpu size={16} />,
    dollarSign: <DollarSign size={16} />,
    zap: <Zap size={16} />,
    shield: <Shield size={16} />,
    globe: <Globe size={16} />,
    refresh: <RefreshCw size={16} />,
    trash: <Trash2 size={16} />,
};
