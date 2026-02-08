/**
 * React Query Configuration
 * Optimized for performance with proper caching and stale times
 *
 * FIXED: Comprehensive fixes to prevent data fetching from stopping:
 * - Enabled refetchOnWindowFocus to refresh data when user returns to tab
 * - Reduced staleTime to ensure data is refreshed more frequently
 * - Increased retry attempts for better error recovery
 * - Enhanced retry logic to handle network errors better
 */

import { QueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: data is considered fresh for 1 minute (reduced from 5 minutes)
      // This ensures data is refetched more frequently to prevent stale data
      staleTime: 1 * 60 * 1000, // 1 minute
      // Cache time: unused data stays in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Refetch on window focus - ENABLED to fix data fetching stopping issue
      // When user returns to tab, refetch stale data automatically
      refetchOnWindowFocus: true,
      // Refetch on reconnect - enabled for consistency
      refetchOnReconnect: true,
      // Refetch on mount - always refetch if data is stale
      refetchOnMount: true,
      // Retry configuration - network-aware retry logic
      // Uses networkAwareRetry to check network state before retrying
      retry: networkAwareRetry,
      retryDelay: networkAwareRetryDelay,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
};

export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}
