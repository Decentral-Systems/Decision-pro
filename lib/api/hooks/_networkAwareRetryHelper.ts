/**
 * Network-Aware Retry Helper for React Query Hooks
 * 
 * This file provides a reusable pattern for hooks that need custom retry logic
 * but want to benefit from network-aware retry behavior.
 * 
 * Usage in hooks:
 * ```typescript
 * import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
 * 
 * retry: networkAwareRetry,
 * retryDelay: networkAwareRetryDelay,
 * ```
 * 
 * For hooks that need custom retry logic but still want network awareness:
 * ```typescript
 * import { isNetworkOffline, isNetworkError } from "@/lib/utils/networkAwareRetry";
 * 
 * retry: (failureCount, error) => {
 *   // Check network first
 *   if (isNetworkOffline()) return false;
 *   
 *   // Custom logic here
 *   if (error?.statusCode === 401) return false;
 *   return failureCount < 3;
 * },
 * ```
 */

export { 
  networkAwareRetry, 
  networkAwareRetryDelay,
  isNetworkOffline,
  isNetworkError
} from "@/lib/utils/networkAwareRetry";
