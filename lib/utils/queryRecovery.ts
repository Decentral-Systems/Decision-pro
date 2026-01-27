/**
 * Query Recovery Utilities
 * 
 * Helper functions to recover stuck queries and ensure data fetching continues
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Reset and invalidate a query to force refetch
 */
export function recoverQuery(
  queryClient: QueryClient,
  queryKey: unknown[]
): void {
  try {
    // Reset the query state
    queryClient.resetQueries({ queryKey });
    // Invalidate to trigger refetch
    queryClient.invalidateQueries({ queryKey });
    console.log("[QueryRecovery] Recovered query:", queryKey);
  } catch (error) {
    console.error("[QueryRecovery] Error recovering query:", error);
  }
}

/**
 * Find and recover all stuck queries (queries in error state for too long)
 */
export function recoverStuckQueries(
  queryClient: QueryClient,
  maxErrorAge: number = 5 * 60 * 1000 // 5 minutes default
): number {
  try {
    const queryCache = queryClient.getQueryCache();
    const allQueries = queryCache.getAll();
    
    const stuckQueries = allQueries.filter((query) => {
      const state = query.state;
      if (!state.error) return false;
      
      // Check if error has been present for too long
      const errorAge = state.errorUpdatedAt 
        ? Date.now() - state.errorUpdatedAt 
        : Infinity;
      
      // Only recover if not currently fetching and error is old
      return errorAge > maxErrorAge && state.fetchStatus !== "fetching";
    });
    
    if (stuckQueries.length > 0) {
      console.log(`[QueryRecovery] Found ${stuckQueries.length} stuck queries`);
      
      stuckQueries.forEach((query) => {
        recoverQuery(queryClient, query.queryKey);
      });
    }
    
    return stuckQueries.length;
  } catch (error) {
    console.error("[QueryRecovery] Error finding stuck queries:", error);
    return 0;
  }
}

/**
 * Invalidate all stale queries (queries with old data)
 */
export function refreshStaleQueries(
  queryClient: QueryClient,
  maxAge: number = 5 * 60 * 1000 // 5 minutes default
): number {
  try {
    const queryCache = queryClient.getQueryCache();
    const allQueries = queryCache.getAll();
    
    const staleQueries = allQueries.filter((query) => {
      const state = query.state;
      if (!state.dataUpdatedAt) return false;
      
      const age = Date.now() - state.dataUpdatedAt;
      return age > maxAge && state.fetchStatus !== "fetching";
    });
    
    if (staleQueries.length > 0) {
      console.log(`[QueryRecovery] Found ${staleQueries.length} stale queries`);
      
      staleQueries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });
    }
    
    return staleQueries.length;
  } catch (error) {
    console.error("[QueryRecovery] Error refreshing stale queries:", error);
    return 0;
  }
}

/**
 * Comprehensive query health check and recovery
 */
export function performQueryHealthCheck(
  queryClient: QueryClient
): {
  stuckQueries: number;
  staleQueries: number;
  totalRecovered: number;
} {
  const stuckCount = recoverStuckQueries(queryClient);
  const staleCount = refreshStaleQueries(queryClient);
  
  return {
    stuckQueries: stuckCount,
    staleQueries: staleCount,
    totalRecovered: stuckCount + staleCount,
  };
}
