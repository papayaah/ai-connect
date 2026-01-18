import { useState, useEffect, useCallback, useMemo } from 'react';
import type { StorageAdapter, RateLimitData } from '../types';
import { AISettingsService, localStorageAdapter } from '../services';

export interface UseRateLimitOptions {
    storage?: StorageAdapter;
}

export interface UseRateLimitReturn {
    /** Whether the rate limit is reached */
    isLimitReached: boolean;
    /** Number of remaining requests */
    remainingRequests: number;
    /** Total daily limit */
    dailyLimit: number;
    /** Current request count */
    currentCount: number;
    /** Time until rate limit resets (in milliseconds) */
    timeUntilReset: number;
    /** Formatted time until reset */
    formattedTimeUntilReset: string;
    /** Increment the rate limit counter */
    incrementCounter: () => void;
    /** Reset the rate limit (for testing) */
    resetLimit: () => void;
    /** Refresh rate limit data */
    refresh: () => void;
    /** Rate limit data */
    rateLimitData: RateLimitData;
}

const DAILY_LIMIT = 10; // Daily limit for hosted API

/**
 * Hook for managing rate limiting for shared API access
 */
export const useRateLimit = (
    options: UseRateLimitOptions = {}
): UseRateLimitReturn => {
    const { storage = localStorageAdapter } = options;

    const settingsService = useMemo(
        () => new AISettingsService(storage),
        [storage]
    );

    const [rateLimitData, setRateLimitData] = useState<RateLimitData>(() =>
        settingsService.getRateLimitData()
    );

    const [timeUntilReset, setTimeUntilReset] = useState<number>(() =>
        settingsService.getTimeUntilReset()
    );

    const refresh = useCallback(() => {
        setRateLimitData(settingsService.getRateLimitData());
        setTimeUntilReset(settingsService.getTimeUntilReset());
    }, [settingsService]);

    // Update time until reset every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const newTime = settingsService.getTimeUntilReset();
            setTimeUntilReset(newTime);

            // If reset time has passed, refresh the rate limit data
            if (newTime === 0) {
                refresh();
            }
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [settingsService, refresh]);

    const incrementCounter = useCallback(() => {
        settingsService.incrementRateLimitCounter();
        refresh();
    }, [settingsService, refresh]);

    const resetLimit = useCallback(() => {
        settingsService.resetRateLimit();
        refresh();
    }, [settingsService, refresh]);

    const isLimitReached = rateLimitData.count >= DAILY_LIMIT;
    const remainingRequests = Math.max(0, DAILY_LIMIT - rateLimitData.count);
    const currentCount = rateLimitData.count;

    // Format time until reset
    const formattedTimeUntilReset = useMemo(() => {
        if (timeUntilReset <= 0) return 'Now';

        const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }, [timeUntilReset]);

    return {
        isLimitReached,
        remainingRequests,
        dailyLimit: DAILY_LIMIT,
        currentCount,
        timeUntilReset,
        formattedTimeUntilReset,
        incrementCounter,
        resetLimit,
        refresh,
        rateLimitData,
    };
};
