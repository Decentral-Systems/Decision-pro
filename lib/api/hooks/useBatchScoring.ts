import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Hook to fetch batch scoring job status
 */
export function useBatchScoringJobStatus(jobId: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery<any | null>({
    queryKey: ["batch-scoring-job", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      try {
        const data = await apiGatewayClient.getBatchScoringJobStatus(jobId);
        return data;
      } catch (error: any) {
        console.error("Failed to fetch batch job status:", error);
        return null;
      }
    },
    enabled: isAuthenticated && !!jobId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if job is still in progress
      if (data?.status === "running" || data?.status === "pending") {
        return 2000;
      }
      return false;
    },
  });
}

/**
 * Hook to fetch batch scoring results
 */
export function useBatchScoringResults(
  jobId: string | null,
  format: string = "json"
) {
  const { isAuthenticated } = useAuth();

  return useQuery<any | null>({
    queryKey: ["batch-scoring-results", jobId, format],
    queryFn: async () => {
      if (!jobId) return null;
      try {
        const data = await apiGatewayClient.getBatchScoringResults(jobId, format);
        return data;
      } catch (error: any) {
        console.error("Failed to fetch batch results:", error);
        return null;
      }
    },
    enabled: isAuthenticated && !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
