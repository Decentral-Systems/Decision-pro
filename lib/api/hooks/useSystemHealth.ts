"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "@/lib/api/clients/api-gateway";
import type { SystemHealth } from "@/types/dashboard";

export type SystemHealthTimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

export interface SystemHealthHistoricalOptions {
  /**
   * Time range for historical data
   * @default "24h"
   */
  timeRange?: SystemHealthTimeRange;

  /**
   * Whether to fetch historical data
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook for fetching system health historical data
 */
export function useSystemHealthHistorical({
  timeRange = "24h",
  enabled = true,
}: SystemHealthHistoricalOptions = {}) {
  return useQuery<Array<SystemHealth & { timestamp: string }>>({
    queryKey: ["system-health-historical", timeRange],
    queryFn: async () => {
      // For now, generate synthetic historical data
      // In a real implementation, this would call an API endpoint
      // that returns historical system health metrics
      
      const executiveData = await apiGatewayClient.getExecutiveDashboardData();
      const currentHealth = executiveData?.system_health as SystemHealth | undefined;

      if (!currentHealth) {
        return [];
      }

      // Generate historical data points based on time range
      const now = Date.now();
      const ranges: Record<SystemHealthTimeRange, number> = {
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };

      const rangeMs = ranges[timeRange];
      const dataPoints = timeRange === "1h" ? 60 : timeRange === "6h" ? 72 : timeRange === "24h" ? 96 : timeRange === "7d" ? 168 : 720;
      const intervalMs = rangeMs / dataPoints;

      const historicalData: Array<SystemHealth & { timestamp: string }> = [];

      for (let i = dataPoints; i >= 0; i--) {
        const timestamp = new Date(now - i * intervalMs);
        
        // Generate realistic variation around current values
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        
        historicalData.push({
          timestamp: timestamp.toISOString(),
          cpu_usage: currentHealth.cpu_usage ? Math.max(0, Math.min(100, (currentHealth.cpu_usage || 0) * (1 + variation))) : undefined,
          memory_usage: currentHealth.memory_usage ? Math.max(0, Math.min(100, (currentHealth.memory_usage || 0) * (1 + variation))) : undefined,
          disk_usage: currentHealth.disk_usage ? Math.max(0, Math.min(100, (currentHealth.disk_usage || 0) * (1 + variation * 0.5))) : undefined,
          network_usage: currentHealth.network_usage ? Math.max(0, Math.min(100, (currentHealth.network_usage || 0) * (1 + variation * 1.5))) : undefined,
          service_status: currentHealth.service_status,
        });
      }

      return historicalData;
    },
    enabled,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}



