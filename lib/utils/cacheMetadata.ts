/**
 * Cache Metadata Utilities
 * Manages cache metadata including last-updated timestamps
 */

export interface CacheMetadata {
  lastUpdated: Date;
  correlationId?: string;
  responseTime?: number;
}

/**
 * Get cache metadata from storage
 */
export function getCacheMetadata(key: string): CacheMetadata | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(`cache_metadata_${key}`);
    if (!stored) return null;

    const metadata = JSON.parse(stored);
    return {
      ...metadata,
      lastUpdated: new Date(metadata.lastUpdated),
    };
  } catch {
    return null;
  }
}

/**
 * Set cache metadata in storage
 */
export function setCacheMetadata(
  key: string,
  metadata: Omit<CacheMetadata, 'lastUpdated'> & { lastUpdated?: Date }
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const data: CacheMetadata = {
      lastUpdated: metadata.lastUpdated || new Date(),
      correlationId: metadata.correlationId,
      responseTime: metadata.responseTime,
    };

    localStorage.setItem(`cache_metadata_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn('[CacheMetadata] Failed to store metadata:', error);
  }
}

/**
 * Format last updated timestamp for display
 */
export function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  }

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

