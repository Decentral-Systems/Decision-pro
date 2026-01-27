/**
 * ML Data Cache Utility
 * Provides persistent caching for ML Center data using localStorage
 */

const CACHE_PREFIX = "ml_cache_";
const CACHE_VERSION = "1.0.0";
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt: number;
}

interface CacheMetadata {
  size: number;
  entries: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Get cache key for a specific data type
 */
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * Get all cache keys
 */
function getAllCacheKeys(): string[] {
  if (typeof window === 'undefined') return [];
  
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Calculate size of data in bytes (approximate)
 */
function calculateSize(data: any): number {
  return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
}

/**
 * Get total cache size
 */
function getTotalCacheSize(): number {
  const keys = getAllCacheKeys();
  let totalSize = 0;
  
  keys.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // Rough estimate
      }
    } catch (e) {
      // Ignore errors
    }
  });
  
  return totalSize;
}

/**
 * Clean up old or expired cache entries
 */
function cleanupCache(): void {
  if (typeof window === 'undefined') return;
  
  const keys = getAllCacheKeys();
  const now = Date.now();
  
  keys.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const entry: CacheEntry<any> = JSON.parse(item);
        
        // Remove expired entries
        if (entry.expiresAt && entry.expiresAt < now) {
          localStorage.removeItem(key);
          return;
        }
        
        // Remove entries with old version
        if (entry.version !== CACHE_VERSION) {
          localStorage.removeItem(key);
          return;
        }
      }
    } catch (e) {
      // Remove invalid entries
      localStorage.removeItem(key);
    }
  });
  
  // If still over limit, remove oldest entries
  let currentSize = getTotalCacheSize();
  if (currentSize > MAX_CACHE_SIZE) {
    const entries: Array<{ key: string; timestamp: number }> = [];
    
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry: CacheEntry<any> = JSON.parse(item);
          entries.push({ key, timestamp: entry.timestamp });
        }
      } catch (e) {
        // Ignore
      }
    });
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries until under limit
    for (const entry of entries) {
      if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Leave some headroom
      
      try {
        const item = localStorage.getItem(entry.key);
        if (item) {
          currentSize -= item.length * 2;
          localStorage.removeItem(entry.key);
        }
      } catch (e) {
        // Ignore
      }
    }
  }
}

/**
 * Set cache entry
 */
export function setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  if (typeof window === 'undefined') return;
  
  try {
    cleanupCache();
    
    const cacheKey = getCacheKey(key);
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      version: CACHE_VERSION,
      expiresAt: now + ttl,
    };
    
    const serialized = JSON.stringify(entry);
    const size = calculateSize(entry);
    
    // Check if adding this would exceed limit
    const currentSize = getTotalCacheSize();
    if (currentSize + size > MAX_CACHE_SIZE) {
      // Clean up more aggressively
      cleanupCache();
    }
    
    localStorage.setItem(cacheKey, serialized);
  } catch (e) {
    // If quota exceeded, try to clean up and retry once
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      cleanupCache();
      try {
        const cacheKey = getCacheKey(key);
        const now = Date.now();
        const entry: CacheEntry<T> = {
          data,
          timestamp: now,
          version: CACHE_VERSION,
          expiresAt: now + ttl,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch (e2) {
        console.warn("[ML Cache] Failed to set cache after cleanup:", e2);
      }
    } else {
      console.warn("[ML Cache] Failed to set cache:", e);
    }
  }
}

/**
 * Get cache entry
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(key);
    const item = localStorage.getItem(cacheKey);
    
    if (!item) return null;
    
    const entry: CacheEntry<T> = JSON.parse(item);
    
    // Check version
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch (e) {
    console.warn("[ML Cache] Failed to get cache:", e);
    return null;
  }
}

/**
 * Remove cache entry
 */
export function removeCache(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(key);
    localStorage.removeItem(cacheKey);
  } catch (e) {
    console.warn("[ML Cache] Failed to remove cache:", e);
  }
}

/**
 * Clear all ML cache
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  
  const keys = getAllCacheKeys();
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  });
}

/**
 * Get cache metadata
 */
export function getCacheMetadata(): CacheMetadata {
  if (typeof window === 'undefined') {
    return { size: 0, entries: 0, oldestEntry: 0, newestEntry: 0 };
  }
  
  const keys = getAllCacheKeys();
  let totalSize = 0;
  let oldest = Date.now();
  let newest = 0;
  
  keys.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2;
        const entry: CacheEntry<any> = JSON.parse(item);
        if (entry.timestamp < oldest) oldest = entry.timestamp;
        if (entry.timestamp > newest) newest = entry.timestamp;
      }
    } catch (e) {
      // Ignore
    }
  });
  
  return {
    size: totalSize,
    entries: keys.length,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

/**
 * Check if cache entry exists and is valid
 */
export function hasCache(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const cacheKey = getCacheKey(key);
  const item = localStorage.getItem(cacheKey);
  
  if (!item) return false;
  
  try {
    const entry: CacheEntry<any> = JSON.parse(item);
    
    // Check version
    if (entry.version !== CACHE_VERSION) return false;
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get cache entry timestamp
 */
export function getCacheTimestamp(key: string): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(key);
    const item = localStorage.getItem(cacheKey);
    
    if (!item) return null;
    
    const entry: CacheEntry<any> = JSON.parse(item);
    return entry.timestamp;
  } catch (e) {
    return null;
  }
}

