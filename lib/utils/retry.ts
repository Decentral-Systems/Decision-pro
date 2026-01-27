/**
 * Retry Utility with Exponential Backoff
 * Implements retry logic for transient failures
 */

export interface RetryOptions {
  maxRetries: number;           // Maximum number of retry attempts
  initialDelay: number;          // Initial delay in milliseconds
  maxDelay: number;              // Maximum delay in milliseconds
  backoffMultiplier: number;     // Multiplier for exponential backoff
  retryableErrors?: number[];    // HTTP status codes that should be retried
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,           // 1 second
  maxDelay: 10000,              // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [500, 502, 503, 504, 408, 429], // Server errors and timeouts
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableErrors?: number[]): boolean {
  // Network errors are always retryable
  if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
    return true;
  }
  
  // Check status code
  const statusCode = error.statusCode || error.response?.status;
  if (statusCode && retryableErrors) {
    return retryableErrors.includes(statusCode);
  }
  
  // Default: retry 5xx errors
  if (statusCode >= 500 && statusCode < 600) {
    return true;
  }
  
  // Don't retry 4xx errors (except 408, 429)
  if (statusCode >= 400 && statusCode < 500) {
    return statusCode === 408 || statusCode === 429;
  }
  
  return false;
}

/**
 * Calculate delay for retry attempt
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      
      // Log retry success if we retried
      if (attempt > 1 && process.env.NODE_ENV === 'development') {
        console.log(`[Retry] Success after ${attempt - 1} retries`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Retry] Error not retryable:`, error.statusCode || error.code);
        }
        throw error;
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt > opts.maxRetries) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[Retry] Max retries (${opts.maxRetries}) exceeded`);
        }
        throw error;
      }
      
      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, opts);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Retry] Attempt ${attempt}/${opts.maxRetries} failed, retrying in ${delay}ms...`, {
          error: error.message,
          statusCode: error.statusCode || error.response?.status,
        });
      }
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry with custom retry condition
 */
export async function retryWithCondition<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 1 && process.env.NODE_ENV === 'development') {
        console.log(`[Retry] Success after ${attempt - 1} retries`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check custom retry condition
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt > opts.maxRetries) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[Retry] Max retries (${opts.maxRetries}) exceeded`);
        }
        throw error;
      }
      
      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, opts);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Retry] Attempt ${attempt}/${opts.maxRetries} failed, retrying in ${delay}ms...`);
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Retry result type
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

/**
 * Retry with result wrapper (returns result object instead of throwing)
 */
export async function withRetryResult<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const data = await fn();
      
      return {
        success: true,
        data,
        attempts: attempt,
      };
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        return {
          success: false,
          error,
          attempts: attempt,
        };
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt > opts.maxRetries) {
        return {
          success: false,
          error,
          attempts: attempt,
        };
      }
      
      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, opts);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Retry] Attempt ${attempt}/${opts.maxRetries} failed, retrying in ${delay}ms...`);
      }
      
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: opts.maxRetries + 1,
  };
}
