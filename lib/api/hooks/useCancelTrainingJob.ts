/**
 * Hook for canceling training jobs
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { retryWithBackoff } from "@/lib/utils/retry";
import { executeWithCircuitBreaker } from "@/lib/utils/circuitBreaker";
import { getErrorDetails, logError } from "@/lib/utils/errorHandler";
import { trackAPICall } from "@/lib/utils/performanceMetrics";

export function useCancelTrainingJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const startTime = Date.now();
      try {
        const result = await executeWithCircuitBreaker(
          `/api/ml/training/${jobId}/cancel`,
          () => retryWithBackoff(
            () => apiGatewayClient.cancelTrainingJob(jobId),
            {
              maxRetries: 2,
              initialDelay: 500,
              retryableErrors: [500, 502, 503, 504],
            }
          )
        );
        
        const duration = Date.now() - startTime;
        trackAPICall(`/api/ml/training/${jobId}/cancel`, duration, 200);
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(`/api/ml/training/${jobId}/cancel`, duration, statusCode, error);
        logError(error, "useCancelTrainingJob");
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

