export { defaultPreset } from './default';
export { tailwindPreset } from './tailwind';
export { lucideIcons } from './lucide';

// Mantine preset is NOT exported here to avoid eager loading
// This prevents Mantine from being bundled when not used
// Import directly: import { mantinePreset } from '@reactkits.dev/react-ai-management/presets/mantine'
