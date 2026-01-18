import type { StorageAdapter } from '../types';

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
    PROVIDER_CONFIG: 'ai_toolkit_provider_config',
    USAGE_STATS: 'ai_toolkit_usage_stats',
    RATE_LIMIT: 'ai_toolkit_rate_limit',
    DEVICE_ID: 'ai_toolkit_device_id',
} as const;

// ============================================================================
// Default LocalStorage Adapter
// ============================================================================

/**
 * Default storage adapter using localStorage
 */
export const localStorageAdapter: StorageAdapter = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch {
            console.warn('localStorage not available');
            return null;
        }
    },
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('localStorage not available or full', e);
        }
    },
    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch {
            console.warn('localStorage not available');
        }
    },
};

// ============================================================================
// Memory Storage Adapter (for testing/SSR)
// ============================================================================

/**
 * In-memory storage adapter for testing or SSR environments
 */
export const createMemoryStorageAdapter = (): StorageAdapter => {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
    };
};

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Get JSON data from storage
 */
export const getJSON = <T>(storage: StorageAdapter, key: string): T | null => {
    const value = storage.getItem(key);
    if (!value) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
};

/**
 * Set JSON data in storage
 */
export const setJSON = <T>(storage: StorageAdapter, key: string, value: T): void => {
    storage.setItem(key, JSON.stringify(value));
};

/**
 * Remove data from storage
 */
export const remove = (storage: StorageAdapter, key: string): void => {
    storage.removeItem(key);
};

/**
 * Generate a unique device ID for rate limiting
 */
export const getOrCreateDeviceId = (storage: StorageAdapter): string => {
    let deviceId = storage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
        deviceId = `device-${crypto.randomUUID()}`;
        storage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
};

// ============================================================================
// Storage Service Class
// ============================================================================

/**
 * Storage service for managing AI toolkit data
 */
export class StorageService {
    constructor(private adapter: StorageAdapter = localStorageAdapter) {}

    /**
     * Get the storage adapter
     */
    getAdapter(): StorageAdapter {
        return this.adapter;
    }

    /**
     * Get JSON data from storage
     */
    get<T>(key: string): T | null {
        return getJSON<T>(this.adapter, key);
    }

    /**
     * Set JSON data in storage
     */
    set<T>(key: string, value: T): void {
        setJSON(this.adapter, key, value);
    }

    /**
     * Remove data from storage
     */
    remove(key: string): void {
        remove(this.adapter, key);
    }

    /**
     * Clear all AI toolkit data
     */
    clearAll(): void {
        Object.values(STORAGE_KEYS).forEach(key => {
            this.adapter.removeItem(key);
        });
    }

    /**
     * Get device ID for rate limiting
     */
    getDeviceId(): string {
        return getOrCreateDeviceId(this.adapter);
    }
}

/**
 * Create a storage service instance
 */
export const createStorageService = (adapter?: StorageAdapter): StorageService => {
    return new StorageService(adapter);
};
