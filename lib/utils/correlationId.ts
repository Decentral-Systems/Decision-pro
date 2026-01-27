/**
 * Correlation ID Utilities
 * Generates and manages correlation IDs for request tracing
 */

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create correlation ID from storage
 * Uses sessionStorage to maintain correlation ID across page refreshes in same session
 */
export function getOrCreateCorrelationId(): string {
  if (typeof window === 'undefined') {
    return generateCorrelationId();
  }

  const key = 'ais_correlation_id';
  let correlationId = sessionStorage.getItem(key);

  if (!correlationId) {
    correlationId = generateCorrelationId();
    sessionStorage.setItem(key, correlationId);
  }

  return correlationId;
}

/**
 * Get current correlation ID without creating a new one
 */
export function getCorrelationId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return sessionStorage.getItem('ais_correlation_id');
}

/**
 * Set a specific correlation ID
 */
export function setCorrelationId(correlationId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('ais_correlation_id', correlationId);
  }
}

/**
 * Clear correlation ID from storage
 */
export function clearCorrelationId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('ais_correlation_id');
  }
}

/**
 * Get correlation ID history (last 10)
 */
export function getCorrelationIdHistory(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const history = sessionStorage.getItem('ais_correlation_id_history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Add correlation ID to history
 */
export function addToCorrelationIdHistory(correlationId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const history = getCorrelationIdHistory();
    // Add to front, keep last 10
    const updated = [correlationId, ...history.filter(id => id !== correlationId)].slice(0, 10);
    sessionStorage.setItem('ais_correlation_id_history', JSON.stringify(updated));
  } catch (error) {
    console.warn('[CorrelationID] Failed to add to history:', error);
  }
}

/**
 * Format correlation ID for display
 */
export function formatCorrelationId(correlationId: string): string {
  // Show first 8 and last 4 characters for readability
  if (correlationId.length > 12) {
    return `${correlationId.substring(0, 8)}...${correlationId.substring(correlationId.length - 4)}`;
  }
  return correlationId;
}

