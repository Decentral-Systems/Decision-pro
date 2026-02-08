/**
 * React Query hooks for Audit Logs
 */
import { useQuery } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { AuditLogEntry, AuditLogFilters } from "@/types/admin";
import { PaginatedResponse } from "@/types/api";
import { useAuth } from "@/lib/auth/auth-context";

export function useAuditLogs(
  filters?: AuditLogFilters & {
    page?: number;
    page_size?: number;
  }
) {
  const { isAuthenticated, tokenSynced } = useAuth();
  return useQuery<PaginatedResponse<AuditLogEntry> | null>({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.get<
          PaginatedResponse<AuditLogEntry>
        >("/api/v1/audit/logs", filters);
        return data;
      } catch (error: any) {
        // Handle 401/404 errors gracefully - return null to allow fallback UI
        if (error?.statusCode === 401 || error?.statusCode === 404) {
          console.warn("Audit logs API unavailable, using fallback data");
          return null;
        }
        // For other errors, let React Query handle them
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 1 * 60 * 1000, // 1 minute (audit logs should be relatively fresh)
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useAuditLog(logId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery<AuditLogEntry>({
    queryKey: ["audit-log", logId],
    queryFn: async () => {
      const data = await apiGatewayClient.get<AuditLogEntry>(
        `/api/v1/audit/logs/${logId}`
      );
      return data;
    },
    enabled: isAuthenticated && !!logId,
    staleTime: 5 * 60 * 1000,
  });
}
