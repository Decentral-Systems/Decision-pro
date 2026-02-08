/**
 * Network-Aware Retry Utility
 * 
 * Provides retry logic that checks network state before retrying.
 * Prevents infinite retries when network is clearly offline.
 */

import { apiGatewayClient } from "@/lib/api/clients/api-gateway";

/**
 * Check if network is currently offline
 */
export function isNetworkOffline(): boolean {
  if (typeof window === "undefined") {
    return false; // Server-side, assume online
  }
  
  // Check browser online state
  if (!navigator.onLine) {
    return true;
  }
  
  // Check API Gateway client network state (if available)
  try {
    if (apiGatewayClient && typeof (apiGatewayClient as any).isOffline === 'function') {
      return (apiGatewayClient as any).isOffline();
    }
  } catch (error) {
    // If check fails, use browser state
  }
  
  return false;
}

/**
 * Network-aware retry function for React Query
 * 
 * @param failureCount - Current failure count
 * @param error - The error that occurred
 * @returns true if should retry, false otherwise
 */
export function networkAwareRetry(
  failureCount: number,
  error: any
): boolean {
  // Check network state first
  if (isNetworkOffline()) {
    console.log('[NetworkAwareRetry] Network is offline, skipping retry');
    return false; // Don't retry when network is offline
  }
  
  const statusCode = error?.statusCode || error?.response?.status;
  const errorCode = error?.code;
  
  // Don't retry on client errors (4xx) except 429 (rate limit)
  if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return false;
  }
  
  // Network errors - only retry if network is online
  if (errorCode === "ERR_NETWORK" || errorCode === "ECONNABORTED" || errorCode === "ETIMEDOUT") {
    // Only retry network errors once if network appears online
    // This prevents infinite retries if network check is wrong
    return failureCount < 1;
  }
  
  // Retry up to 3 times for server errors and rate limits
  return failureCount < 3;
}

/**
 * Network-aware retry delay with exponential backoff
 * 
 * @param attemptIndex - Current attempt index (0-based)
 * @returns Delay in milliseconds
 */
export function networkAwareRetryDelay(attemptIndex: number): number {
  // Exponential backoff: 1000ms * 2^attempt, capped at 30s
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  const errorCode = error?.code;
  const statusCode = error?.statusCode || error?.response?.status;
  
  // Network errors
  if (errorCode === "ERR_NETWORK" || errorCode === "ECONNABORTED" || errorCode === "ETIMEDOUT") {
    return true;
  }
  
  // Check error type
  if (error?.constructor?.name === "APINetworkError" || error?.constructor?.name === "APITimeoutError") {
    return true;
  }
  
  // Check error message
  const message = error?.message || "";
  if (message.includes("Network") || message.includes("timeout") || message.includes("ECONN")) {
    return true;
  }
  
  return false;
}
