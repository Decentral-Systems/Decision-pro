/**
 * Hook for updating training job priority
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { retryWithBackoff } from "@/lib/utils/retry";
import { executeWithCircuitBreaker } from "@/lib/utils/circuitBreaker";
import { getErrorDetails, logError } from "@/lib/utils/errorHandler";
import { trackAPICall } from "@/lib/utils/performanceMetrics";

export type JobPriority = "low" | "normal" | "high" | "urgent";

export function useUpdateJobPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, priority }: { jobId: string; priority: JobPriority }) => {
      const startTime = Date.now();
      try {
        const result = await executeWithCircuitBreaker(
          `/api/ml/training/${jobId}/priority`,
          () => retryWithBackoff(
            () => apiGatewayClient.updateJobPriority(jobId, priority),
            {
              maxRetries: 2,
              initialDelay: 500,
              retryableErrors: [500, 502, 503, 504],
            }
          )
        );
        
        const duration = Date.now() - startTime;
        trackAPICall(`/api/ml/training/${jobId}/priority`, duration, 200);
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(`/api/ml/training/${jobId}/priority`, duration, statusCode, error);
        logError(error, "useUpdateJobPriority");
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate training jobs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["ml-center"] });
      queryClient.invalidateQueries({ queryKey: ["training-jobs"] });
    },
  });
}

