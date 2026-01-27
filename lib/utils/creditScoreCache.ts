/**
 * Credit Score Cache Utility
 * Provides in-memory caching for credit scores with TTL to improve performance
 */

interface CachedScore {
  score: number;
  timestamp: number;
}

class CreditScoreCache {
  private cache: Map<string, CachedScore> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get cached credit score for a customer
   * @param customerId Customer ID
   * @returns Cached score or null if not found or expired
   */
  get(customerId: string): number | null {
    const cached = this.cache.get(customerId);
    if (!cached) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(customerId);
      return null;
    }

    return cached.score;
  }

  /**
   * Set credit score in cache
   * @param customerId Customer ID
   * @param score Credit score
   */
  set(customerId: string, score: number): void {
    if (score > 0) {
      this.cache.set(customerId, {
        score,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Batch set multiple credit scores
   * @param scores Map of customer_id to credit_score
   */
  setBatch(scores: Map<string, number>): void {
    scores.forEach((score, customerId) => {
      this.set(customerId, score);
    });
  }

  /**
   * Check if customer score is cached and valid
   * @param customerId Customer ID
   * @returns true if cached and not expired
   */
  has(customerId: string): boolean {
    return this.get(customerId) !== null;
  }

  /**
   * Remove specific customer from cache
   * @param customerId Customer ID
   */
  delete(customerId: string): void {
    this.cache.delete(customerId);
  }

  /**
   * Clear all cached scores
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all cached customer IDs
   * @returns Array of customer IDs that are currently cached
   */
  getCachedCustomerIds(): string[] {
    const now = Date.now();
    const validIds: string[] = [];

    this.cache.forEach((cached, customerId) => {
      if (now - cached.timestamp <= this.ttl) {
        validIds.push(customerId);
      } else {
        this.cache.delete(customerId);
      }
    });

    return validIds;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((cached, customerId) => {
      if (now - cached.timestamp > this.ttl) {
        this.cache.delete(customerId);
      }
    });
  }
}

// Singleton instance
export const creditScoreCache = new CreditScoreCache();

// Cleanup expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    creditScoreCache.cleanup();
  }, 60 * 1000);
}


