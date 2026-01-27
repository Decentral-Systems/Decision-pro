/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by tracking failure rates and opening circuit when threshold is exceeded
 */

export enum CircuitState {
  CLOSED = "closed",      // Normal operation - requests pass through
  OPEN = "open",          // Circuit is open - requests fail immediately
  HALF_OPEN = "half_open", // Testing if service recovered - limited requests pass through
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeout: number;          // Time in ms before attempting to close circuit
  monitoringWindow: number;       // Time window in ms for tracking failures
  halfOpenMaxCalls: number;      // Max calls allowed in half-open state
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,           // Open circuit after 5 failures
  resetTimeout: 60000,           // Wait 60 seconds before attempting recovery
  monitoringWindow: 60000,       // Track failures in 60 second window
  halfOpenMaxCalls: 3,           // Allow 3 calls in half-open state
};

interface FailureRecord {
  timestamp: number;
  error: any;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenCalls: number = 0;
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit allows request
   */
  canExecute(): boolean {
    this.cleanupOldFailures();
    
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
      
      case CircuitState.OPEN:
        // Check if reset timeout has passed
        const timeSinceLastFailure = Date.now() - this.lastFailureTime;
        if (timeSinceLastFailure >= this.options.resetTimeout) {
          this.state = CircuitState.HALF_OPEN;
          this.halfOpenCalls = 0;
          return true;
        }
        return false;
      
      case CircuitState.HALF_OPEN:
        // Allow limited calls in half-open state
        if (this.halfOpenCalls < this.options.halfOpenMaxCalls) {
          return true;
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Record successful execution
   */
  recordSuccess(): void {
    this.cleanupOldFailures();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      this.halfOpenCalls++;
      
      // If we have enough successes, close the circuit
      if (this.successes >= this.options.halfOpenMaxCalls) {
        this.state = CircuitState.CLOSED;
        this.failures = [];
        this.successes = 0;
        this.halfOpenCalls = 0;
        
        if (process.env.NODE_ENV === 'development') {
          console.log("[Circuit Breaker] Circuit closed - service recovered");
        }
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      if (this.failures.length > 0) {
        this.failures = [];
      }
    }
  }

  /**
   * Record failed execution
   */
  recordFailure(error: any): void {
    this.cleanupOldFailures();
    
    const now = Date.now();
    this.failures.push({
      timestamp: now,
      error,
    });
    this.lastFailureTime = now;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail in half-open state, immediately open circuit
      this.state = CircuitState.OPEN;
      this.halfOpenCalls = 0;
      this.successes = 0;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn("[Circuit Breaker] Circuit opened - service still failing");
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've exceeded failure threshold
      if (this.failures.length >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
        
        if (process.env.NODE_ENV === 'development') {
          console.warn("[Circuit Breaker] Circuit opened - failure threshold exceeded", {
            failures: this.failures.length,
            threshold: this.options.failureThreshold,
          });
        }
      }
    }
  }

  /**
   * Remove old failure records outside monitoring window
   */
  private cleanupOldFailures(): void {
    const now = Date.now();
    const cutoff = now - this.options.monitoringWindow;
    
    this.failures = this.failures.filter(f => f.timestamp > cutoff);
  }

  /**
   * Get failure count in current window
   */
  getFailureCount(): number {
    this.cleanupOldFailures();
    return this.failures.length;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.log("[Circuit Breaker] Circuit reset manually");
    }
  }
}

/**
 * Circuit breaker instances per endpoint
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create circuit breaker for an endpoint
 */
export function getCircuitBreaker(endpoint: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!circuitBreakers.has(endpoint)) {
    circuitBreakers.set(endpoint, new CircuitBreaker(options));
  }
  return circuitBreakers.get(endpoint)!;
}

/**
 * Execute function with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  endpoint: string,
  fn: () => Promise<T>,
  options?: Partial<CircuitBreakerOptions>
): Promise<T> {
  const breaker = getCircuitBreaker(endpoint, options);
  
  if (!breaker.canExecute()) {
    throw new Error(`Circuit breaker is OPEN for ${endpoint}. Service unavailable.`);
  }
  
  try {
    const result = await fn();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure(error);
    throw error;
  }
}
