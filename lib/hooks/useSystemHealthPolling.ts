"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "@/lib/api/clients/api-gateway";
import type { SystemHealth } from "@/types/dashboard";

export interface UseSystemHealthPollingOptions {
  /**
   * Poll interval in milliseconds
   * @default 10000 (10 seconds)
   */
  interval?: number;

  /**
   * Whether polling is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Pause polling when tab is not visible
   * @default true
   */
  pauseWhenHidden?: boolean;

  /**
   * Auto-retry on failure
   * @default true
   */
  retryOnFailure?: boolean;

  /**
   * Maximum retry attempts
   * @default 3
   */
  maxRetries?: number;
}

export interface UseSystemHealthPollingReturn {
  /**
   * System health data
   */
  data: SystemHealth | undefined;

  /**
   * Whether data is currently being fetched
   */
  isLoading: boolean;

  /**
   * Error if fetch failed
   */
  error: Error | null;

  /**
   * Whether polling is currently active
   */
  isPolling: boolean;

  /**
   * Manually trigger a poll
   */
  poll: () => Promise<void>;

  /**
   * Pause polling
   */
  pause: () => void;

  /**
   * Resume polling
   */
  resume: () => void;

  /**
   * Time until next poll (in seconds)
   */
  timeUntilNextPoll: number;
}

/**
 * Hook for polling system health data
 * 
 * Features:
 * - Configurable poll interval
 * - Pause when tab is hidden
 * - Auto-retry on failure
 * - Manual poll trigger
 * - Pause/resume controls
 * - Countdown to next poll
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isPolling, pause, resume } = useSystemHealthPolling({
 *   interval: 5000, // 5 seconds
 *   enabled: true,
 * });
 * ```
 */
export function useSystemHealthPolling({
  interval = 10000,
  enabled = true,
  pauseWhenHidden = true,
  retryOnFailure = true,
  maxRetries = 3,
}: UseSystemHealthPollingOptions = {}): UseSystemHealthPollingReturn {
  const queryClient = useQueryClient();
  const [isPaused, setIsPaused] = useState(false);
  const [timeUntilNextPoll, setTimeUntilNextPoll] = useState(interval / 1000);
  const [retryCount, setRetryCount] = useState(0);
  const lastPollRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Use React Query for data fetching and caching
  const { data, isLoading, error, refetch } = useQuery<SystemHealth>({
    queryKey: ["system-health-polling"],
    queryFn: async () => {
      // Fetch system health from executive dashboard endpoint
      const executiveData = await apiGatewayClient.getExecutiveDashboardData();
      
      if (!executiveData || !executiveData.system_health) {
        throw new Error("System health data not available");
      }

      return executiveData.system_health as SystemHealth;
    },
    enabled: enabled && !isPaused,
    staleTime: interval / 2, // Consider data stale after half the interval
    gcTime: interval * 2, // Keep in cache for 2 intervals
    retry: retryOnFailure ? maxRetries : 0,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: enabled && !isPaused ? interval : false,
  });

  /**
   * Manually trigger a poll
   */
  const poll = useCallback(async () => {
    lastPollRef.current = Date.now();
    setTimeUntilNextPoll(interval / 1000);
    setRetryCount(0);
    await refetch();
  }, [refetch, interval]);

  /**
   * Pause polling
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
   * Resume polling
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    lastPollRef.current = Date.now();
    setTimeUntilNextPoll(interval / 1000);
    poll();
  }, [poll, interval]);

  /**
   * Setup countdown timer
   */
  useEffect(() => {
    if (!enabled || isPaused) {
      return;
    }

    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastPollRef.current;
      const remaining = Math.max(0, Math.ceil((interval - elapsed) / 1000));
      setTimeUntilNextPoll(remaining);
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enabled, isPaused, interval]);

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
        // Poll immediately when tab becomes visible
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pauseWhenHidden, pause, resume, poll]);

  /**
   * Update last poll time when data is fetched
   */
  useEffect(() => {
    if (data) {
      lastPollRef.current = Date.now();
      setRetryCount(0);
    }
  }, [data]);

  /**
   * Handle errors and retries
   */
  useEffect(() => {
    if (error && retryOnFailure && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        refetch();
      }, 1000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timeout);
    }
  }, [error, retryOnFailure, retryCount, maxRetries, refetch]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    isPolling: enabled && !isPaused,
    poll,
    pause,
    resume,
    timeUntilNextPoll,
  };
}



