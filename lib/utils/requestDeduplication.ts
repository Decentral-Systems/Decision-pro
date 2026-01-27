/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API requests by tracking in-flight requests
 * and returning existing promises for identical requests.
 */

type RequestKey = string;
type PendingRequest<T> = Promise<T>;

class RequestDeduplicator {
  private pendingRequests: Map<RequestKey, PendingRequest<any>> = new Map();

  /**
   * Generate a unique key for a request based on URL and params
   */
  private generateKey(url: string, params?: Record<string, any>): RequestKey {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}::${paramString}`;
  }

  /**
   * Execute a request with deduplication
   * If an identical request is already in flight, return the existing promise
   */
  async deduplicate<T>(
    url: string,
    requestFn: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<T> {
    const key = this.generateKey(url, params);

    // Check if request is already in flight
    if (this.pendingRequests.has(key)) {
      console.log(`[RequestDeduplication] Returning existing promise for: ${url}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request promise
    const requestPromise = requestFn()
      .then((result) => {
        // Clean up after successful completion
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Clean up after error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Clear all pending requests (useful for cleanup or testing)
   */
  clearAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clear a specific request by key
   */
  clear(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.pendingRequests.delete(key);
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Check if a specific request is pending
   */
  isPending(url: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(url, params);
    return this.pendingRequests.has(key);
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Export class for testing or custom instances
export { RequestDeduplicator };

/**
 * Decorator for automatic request deduplication
 * 
 * Usage:
 * @deduplicate
 * async function fetchData(url: string) {
 *   return await fetch(url).then(r => r.json());
 * }
 */
export function deduplicate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const url = args[0]; // Assume first argument is URL
    const params = args[1]; // Assume second argument is params

    return requestDeduplicator.deduplicate(
      url,
      () => originalMethod.apply(this, args),
      params
    );
  };

  return descriptor;
}

/**
 * Higher-order function for wrapping async functions with deduplication
 */
export function withDeduplication<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyExtractor?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const url = keyExtractor ? keyExtractor(...args) : String(args[0]);
    const params = args[1];

    return requestDeduplicator.deduplicate(
      url,
      () => fn(...args),
      params
    );
  }) as T;
}



