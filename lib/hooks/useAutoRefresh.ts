"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface UseAutoRefreshOptions {
  /**
   * Refresh interval in milliseconds
   * @default 60000 (1 minute)
   */
  interval?: number;

  /**
   * Query keys to refresh
   */
  queryKeys: string[][];

  /**
   * Whether auto-refresh is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Pause refresh when tab is not visible
   * @default true
   */
  pauseWhenHidden?: boolean;

  /**
   * Callback when refresh occurs
   */
  onRefresh?: () => void;
}

export interface UseAutoRefreshReturn {
  /**
   * Whether auto-refresh is currently active
   */
  isRefreshing: boolean;

  /**
   * Manually trigger a refresh
   */
  refresh: () => Promise<void>;

  /**
   * Pause auto-refresh
   */
  pause: () => void;

  /**
   * Resume auto-refresh
   */
  resume: () => void;

  /**
   * Time until next refresh (in seconds)
   */
  timeUntilNextRefresh: number;
}

/**
 * Hook for auto-refreshing React Query data
 * 
 * Features:
 * - Configurable refresh interval
 * - Pause when tab is hidden
 * - Manual refresh trigger
 * - Pause/resume controls
 * - Countdown to next refresh
 * 
 * @example
 * ```tsx
 * const { isRefreshing, refresh, timeUntilNextRefresh } = useAutoRefresh({
 *   interval: 30000, // 30 seconds
 *   queryKeys: [['dashboard'], ['executive-dashboard']],
 *   enabled: true,
 * });
 * ```
 */
export function useAutoRefresh({
  interval = 60000,
  queryKeys,
  enabled = true,
  pauseWhenHidden = true,
  onRefresh,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(interval / 1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  /**
   * Perform the refresh
   */
  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    lastRefreshRef.current = Date.now();
    setTimeUntilNextRefresh(interval / 1000);

    try {
      // Invalidate all specified query keys
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );

      onRefresh?.();
    } catch (error) {
      console.error("[useAutoRefresh] Error refreshing queries:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, queryKeys, queryClient, onRefresh, interval]);

  /**
   * Pause auto-refresh
   */
  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  /**
   * Resume auto-refresh
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    lastRefreshRef.current = Date.now();
    setTimeUntilNextRefresh(interval / 1000);
  }, [interval]);

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    if (!enabled || isPaused) {
      return;
    }

    // Setup refresh interval
    intervalRef.current = setInterval(() => {
      refresh();
    }, interval);

    // Setup countdown interval (update every second)
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastRefreshRef.current;
      const remaining = Math.max(0, Math.ceil((interval - elapsed) / 1000));
      setTimeUntilNextRefresh(remaining);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enabled, isPaused, interval, refresh]);

  /**
   * Pause when tab is hidden
   */
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
        // Refresh immediately when tab becomes visible
        refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pauseWhenHidden, pause, resume, refresh]);

  return {
    isRefreshing,
    refresh,
    pause,
    resume,
    timeUntilNextRefresh,
  };
}



