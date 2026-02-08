/**
 * React Query hooks for Compliance data
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { ComplianceData, ComplianceReport } from "@/types/compliance";
import { useAuth } from "@/lib/auth/auth-context";

export function useComplianceData() {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<ComplianceData | null>({
    queryKey: ["compliance"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getComplianceDashboard();
        // Normalize response if needed
        const { normalizeApiResponse } =
          await import("../../utils/api-response-normalizer");
        return normalizeApiResponse<ComplianceData>(data);
      } catch (error: any) {
        // If endpoint doesn't exist (404), return null instead of undefined (React Query requirement)
        const statusCode = error?.statusCode || error?.response?.status;
        if (statusCode === 404 || statusCode === 401) {
          console.warn(
            "[useComplianceData] Compliance data not available:",
            statusCode
          );
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useComplianceReport(reportId?: string) {
  return useQuery<ComplianceReport>({
    queryKey: ["compliance", "report", reportId],
    queryFn: async () => {
      if (!reportId) throw new Error("Report ID is required");
      const data = await apiGatewayClient.get<ComplianceReport>(
        `/api/compliance/reports/${reportId}`
      );
      return data;
    },
    enabled: !!reportId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useGenerateComplianceReport() {
  return useMutation<
    ComplianceReport,
    Error,
    { period_start: string; period_end: string; format?: string }
  >({
    mutationFn: async (params) => {
      // Build query string and include in URL since post() only accepts endpoint and data
      const queryParams = new URLSearchParams({
        period_start: params.period_start,
        period_end: params.period_end,
        format: params.format || "json",
      });
      const response = await apiGatewayClient.post<ComplianceReport>(
        `/api/compliance/reports/generate?${queryParams.toString()}`,
        {}
      );
      return response;
    },
  });
}

export function useReviewViolation() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    { violationId: string; action: string; notes?: string }
  >({
    mutationFn: async ({ violationId, action, notes }) => {
      const data = await apiGatewayClient.reviewViolation(
        violationId,
        action,
        notes
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
    },
  });
}
