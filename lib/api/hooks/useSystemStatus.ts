/**
 * React Query hooks for System Status
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { SystemStatus } from "@/types/system";
import { useAuth } from "@/lib/auth/auth-context";

export function useSystemStatus() {
  const { isAuthenticated } = useAuth();
  return useQuery<SystemStatus | undefined>({
    queryKey: ["system-status"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getSystemStatus();
        // Normalize API response: map 'status' to 'overall_status' if needed
        const normalized = data as any;
        if (normalized && !normalized.overall_status && normalized.status) {
          normalized.overall_status = normalized.status === "operational" ? "healthy" : normalized.status;
        }
        // Ensure services is an object, not null
        if (!normalized.services) {
          normalized.services = {};
        }
        // Ensure dependencies is an object, not null
        if (!normalized.dependencies) {
          normalized.dependencies = {};
        }
        // Add default values for missing fields
        if (!normalized.version) {
          normalized.version = "Unknown";
        }
        if (normalized.uptime_seconds === undefined) {
          normalized.uptime_seconds = 0;
        }
        return normalized as SystemStatus;
      } catch (error: any) {
        // If endpoint doesn't exist (404), return undefined to allow fallback data
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return undefined;
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}


