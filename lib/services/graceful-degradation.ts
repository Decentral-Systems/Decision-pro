/**
 * Graceful Degradation Service
 * Handles service unavailability and provides fallback functionality
 */

import { CircuitState } from "@/lib/utils/circuitBreaker";
import { getCircuitBreaker } from "@/lib/utils/circuitBreaker";

export interface ServiceStatus {
  service: string;
  available: boolean;
  circuitState: CircuitState;
  lastCheck: Date;
  fallbackAvailable: boolean;
}

export interface DegradationOptions {
  useFallback: boolean;
  showOfflineMode: boolean;
  allowManualSync: boolean;
}

export class GracefulDegradationService {
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private offlineMode: boolean = false;

  /**
   * Check if service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return true; // Assume available if not checked

    const breaker = getCircuitBreaker(`/${serviceName}`);
    const circuitState = breaker.getState();

    return circuitState === CircuitState.CLOSED || circuitState === CircuitState.HALF_OPEN;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName: string): ServiceStatus {
    const breaker = getCircuitBreaker(`/${serviceName}`);
    const circuitState = breaker.getState();

    return {
      service: serviceName,
      available: circuitState === CircuitState.CLOSED || circuitState === CircuitState.HALF_OPEN,
      circuitState,
      lastCheck: new Date(),
      fallbackAvailable: this.hasFallback(serviceName),
    };
  }

  /**
   * Check if offline mode is active
   */
  isOfflineMode(): boolean {
    if (typeof window === "undefined") return false;
    return this.offlineMode || !navigator.onLine;
  }

  /**
   * Set offline mode
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }

  /**
   * Check if fallback is available for service
   */
  hasFallback(serviceName: string): boolean {
    // Define which services have fallbacks
    const servicesWithFallback: Record<string, boolean> = {
      "credit-scoring": true, // Can use cached scores
      "customer-360": true, // Can use local storage
      "rules-engine": true, // Can use default rules
      "audit": false, // No fallback - must queue
    };

    return servicesWithFallback[serviceName] || false;
  }

  /**
   * Get fallback data for service
   */
  async getFallbackData(serviceName: string, key: string): Promise<any | null> {
    if (!this.hasFallback(serviceName)) return null;

    try {
      const cached = localStorage.getItem(`fallback_${serviceName}_${key}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const age = Date.now() - (data.timestamp || 0);
        if (age < 24 * 60 * 60 * 1000) {
          return data.value;
        }
      }
    } catch (error) {
      console.warn(`Failed to get fallback data for ${serviceName}:`, error);
    }

    return null;
  }

  /**
   * Store fallback data
   */
  storeFallbackData(serviceName: string, key: string, value: any): void {
    if (!this.hasFallback(serviceName) || typeof window === "undefined") return;

    try {
      localStorage.setItem(
        `fallback_${serviceName}_${key}`,
        JSON.stringify({
          value,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn(`Failed to store fallback data for ${serviceName}:`, error);
    }
  }

  /**
   * Get degradation options
   */
  getDegradationOptions(): DegradationOptions {
    return {
      useFallback: this.isOfflineMode(),
      showOfflineMode: this.isOfflineMode(),
      allowManualSync: true,
    };
  }

  /**
   * Get all service statuses
   */
  getAllServiceStatuses(): ServiceStatus[] {
    const services = ["credit-scoring", "customer-360", "rules-engine", "audit"];
    return services.map((service) => this.getServiceStatus(service));
  }
}

// Singleton instance
export const gracefulDegradationService = new GracefulDegradationService();
