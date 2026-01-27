/**
 * Cache Manager
 * Comprehensive caching infrastructure with React Query persistence,
 * background refresh, and cache metadata tracking
 */

import { QueryClient } from "@tanstack/react-query";
import { CacheMetadata, getCacheMetadata, setCacheMetadata } from "./cacheMetadata";
import { getOrCreateCorrelationId } from "./correlationId";

export interface CacheConfig {
  key: string;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  persist?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  errors: number;
}

class CacheManager {
  private queryClient: QueryClient | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    errors: 0,
  };

  /**
   * Initialize cache manager with React Query client
   */
  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.loadPersistedCache();
  }

  /**
   * Load persisted cache from localStorage
   */
  private loadPersistedCache() {
    if (typeof window === "undefined" || !this.queryClient) {
      return;
    }

    try {
      const persistedCache = localStorage.getItem("react-query-cache");
      if (persistedCache) {
        const cache = JSON.parse(persistedCache);
        this.queryClient.setQueryData(cache);
      }
    } catch (error) {
      console.warn("[CacheManager] Failed to load persisted cache:", error);
      this.stats.errors++;
    }
  }

  /**
   * Persist cache to localStorage
   */
  private persistCache() {
    if (typeof window === "undefined" || !this.queryClient) {
      return;
    }

    try {
      const cache = this.queryClient.getQueryCache().getAll();
      const serialized = JSON.stringify(
        cache.map((query) => ({
          queryKey: query.queryKey,
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
        }))
      );
      localStorage.setItem("react-query-cache", serialized);
    } catch (error) {
      console.warn("[CacheManager] Failed to persist cache:", error);
      this.stats.errors++;
    }
  }

  /**
   * Get cached data with metadata
   */
  getCachedData<T>(queryKey: string[]): { data: T | null; metadata: CacheMetadata | null } {
    if (!this.queryClient) {
      return { data: null, metadata: null };
    }

    try {
      const data = this.queryClient.getQueryData<T>(queryKey);
      const metadata = getCacheMetadata(queryKey.join(":"));

      if (data) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }

      return { data: data || null, metadata };
    } catch (error) {
      console.warn("[CacheManager] Failed to get cached data:", error);
      this.stats.errors++;
      return { data: null, metadata: null };
    }
  }

  /**
   * Set cached data with metadata
   */
  setCachedData<T>(
    queryKey: string[],
    data: T,
    options?: { persist?: boolean; correlationId?: string; responseTime?: number }
  ) {
    if (!this.queryClient) {
      return;
    }

    try {
      this.queryClient.setQueryData(queryKey, data);
      this.stats.sets++;

      // Store metadata
      const correlationId = options?.correlationId || getOrCreateCorrelationId();
      setCacheMetadata(queryKey.join(":"), {
        correlationId,
        responseTime: options?.responseTime,
      });

      // Persist if requested
      if (options?.persist) {
        this.persistCache();
      }
    } catch (error) {
      console.warn("[CacheManager] Failed to set cached data:", error);
      this.stats.errors++;
    }
  }

  /**
   * Invalidate cache for specific query key
   */
  invalidateCache(queryKey: string[], options?: { refetch?: boolean }) {
    if (!this.queryClient) {
      return;
    }

    try {
      this.queryClient.invalidateQueries({ queryKey });
      this.stats.invalidations++;

      // Remove metadata
      if (typeof window !== "undefined") {
        localStorage.removeItem(`cache_metadata_${queryKey.join(":")}`);
      }
    } catch (error) {
      console.warn("[CacheManager] Failed to invalidate cache:", error);
      this.stats.errors++;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCacheByPattern(pattern: string) {
    if (!this.queryClient) {
      return;
    }

    try {
      const cache = this.queryClient.getQueryCache();
      const queries = cache.getAll();

      queries.forEach((query) => {
        const key = Array.isArray(query.queryKey)
          ? query.queryKey.join(":")
          : String(query.queryKey);

        if (key.includes(pattern)) {
          this.invalidateCache(
            Array.isArray(query.queryKey) ? query.queryKey : [String(query.queryKey)]
          );
        }
      });
    } catch (error) {
      console.warn("[CacheManager] Failed to invalidate cache by pattern:", error);
      this.stats.errors++;
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    if (!this.queryClient) {
      return;
    }

    try {
      this.queryClient.clear();
      this.stats.invalidations++;

      // Clear persisted cache
      if (typeof window !== "undefined") {
        localStorage.removeItem("react-query-cache");
        // Clear all metadata
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("cache_metadata_")) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn("[CacheManager] Failed to clear cache:", error);
      this.stats.errors++;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      errors: 0,
    };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }

  /**
   * Background refresh with stale-while-revalidate pattern
   */
  async backgroundRefresh<T>(
    queryKey: string[],
    fetchFn: () => Promise<T>,
    options?: { correlationId?: string }
  ): Promise<T | null> {
    if (!this.queryClient) {
      return null;
    }

    try {
      // Get stale data immediately
      const staleData = this.queryClient.getQueryData<T>(queryKey);

      // Fetch fresh data in background
      const freshData = await fetchFn();

      // Update cache with fresh data
      const correlationId = options?.correlationId || getOrCreateCorrelationId();
      this.setCachedData(queryKey, freshData, {
        correlationId,
        persist: true,
      });

      return freshData;
    } catch (error) {
      console.warn("[CacheManager] Background refresh failed:", error);
      this.stats.errors++;

      // Return stale data if available
      return this.queryClient.getQueryData<T>(queryKey) || null;
    }
  }

  /**
   * Optimistic update - update cache immediately, rollback on error
   */
  optimisticUpdate<T>(
    queryKey: string[],
    optimisticData: T,
    fetchFn: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T> {
    if (!this.queryClient) {
      return Promise.reject(new Error("Query client not initialized"));
    }

    // Store previous data for rollback
    const previousData = this.queryClient.getQueryData<T>(queryKey);

    // Update optimistically
    this.setCachedData(queryKey, optimisticData);

    // Fetch actual data
    return fetchFn()
      .then((actualData) => {
        this.setCachedData(queryKey, actualData);
        return actualData;
      })
      .catch((error) => {
        // Rollback on error
        if (previousData) {
          this.setCachedData(queryKey, previousData);
        } else {
          this.invalidateCache(queryKey);
        }

        if (onError) {
          onError(error);
        }

        throw error;
      });
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

/**
 * React Hook for cache management
 */
export function useCacheManager() {
  return cacheManager;
}

/**
 * Cache configuration presets
 */
export const cachePresets = {
  // Real-time data - short cache, frequent refresh
  realtime: {
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // 10 seconds
    refetchIntervalInBackground: true,
  },

  // Dashboard KPIs - medium cache, periodic refresh
  dashboard: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    refetchIntervalInBackground: true,
  },

  // Analytics - longer cache, less frequent refresh
  analytics: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: false,
  },

  // Historical data - long cache, manual refresh
  historical: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: false,
    refetchIntervalInBackground: false,
  },

  // User preferences - very long cache
  preferences: {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    persist: true,
  },
};

