import { METADATA_PREFIX, PERSIST_KEY } from "@/constants";
import { QueryClient } from "@tanstack/react-query";

class CacheManager {
  private queryClient: QueryClient | null = null;

  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.loadPersistedCache();
  }

  private loadPersistedCache() {
    if (typeof window === "undefined" || !this.queryClient) {
      return;
    }

    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return;

      const entries = JSON.parse(raw);
      if (!Array.isArray(entries)) return;

      entries.forEach(
        (entry: { queryKey?: readonly unknown[]; data?: unknown }) => {
          if (Array.isArray(entry?.queryKey)) {
            this.queryClient!.setQueryData(entry.queryKey, entry.data);
          }
        }
      );
    } catch (error) {
      console.warn("[CacheManager] Failed to load persisted cache:", error);
    }
  }

  persistNow() {
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
      localStorage.setItem(PERSIST_KEY, serialized);
    } catch (error) {
      console.warn("[CacheManager] Failed to persist cache:", error);
    }
  }

  clearAll() {
    if (!this.queryClient) return;

    try {
      this.queryClient.clear();

      if (typeof window !== "undefined") {
        localStorage.removeItem(PERSIST_KEY);
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(METADATA_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn("[CacheManager] Failed to clear cache:", error);
    }
  }
}

export const cacheManager = new CacheManager();

export function useCacheManager() {
  return cacheManager;
}
