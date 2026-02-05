/**
 * React Query hooks for ML Center data
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { MLCenterData, TrainingJob } from "@/types/ml";
import { useAuth } from "@/lib/auth/auth-context";
import { retryWithBackoff } from "@/lib/utils/retry";
import { executeWithCircuitBreaker } from "@/lib/utils/circuitBreaker";
import { getErrorDetails, logError } from "@/lib/utils/errorHandler";
import { trackAPICall } from "@/lib/utils/performanceMetrics";
import { safeParseMLData, MLCenterDataSchema } from "@/lib/schemas/mlSchemas";

export function useMLCenterData() {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<MLCenterData | null>({
    queryKey: ["ml-center"],
    queryFn: async () => {
      let startTime: number | undefined;
      try {
        startTime = Date.now();
        const data = await executeWithCircuitBreaker(
          "/api/ml/dashboard",
          () => retryWithBackoff(
            () => apiGatewayClient.getMLDashboard(),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        const duration = Date.now() - (startTime || Date.now());
        trackAPICall("/api/ml/dashboard", duration, 200);
        
        // Validate data before returning
        const validatedData = safeParseMLData(MLCenterDataSchema, data, null);
        if (validatedData) {
          return validatedData as MLCenterData;
        }
        
        // If validation fails, try to return partial data
        console.warn("[ML Hook] Data validation failed, returning raw data");
        return data as MLCenterData;
      } catch (error: any) {
        const duration = Date.now() - (startTime || Date.now());
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall("/api/ml/dashboard", duration, statusCode, error);
        logError(error, "useMLCenterData");
        
        // If endpoint doesn't exist (404), return null instead of undefined (React Query requirement)
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        
        // Re-throw with enhanced error details
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes (optimized for ML data)
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useModelPerformance(modelId: string) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  return useQuery({
    queryKey: ["ml-center", "model", modelId, "performance"],
    queryFn: async () => {
      const data = await apiGatewayClient.get(`/api/ml/model/${modelId}/performance`);
      return data;
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken && !!modelId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useStartTraining() {
  return useMutation<TrainingJob, Error, { model_name: string; parameters?: any }>({
    mutationFn: async (params) => {
      try {
        const data = await executeWithCircuitBreaker(
          `/api/ml/model/${params.model_name}/train`,
          () => retryWithBackoff(
            () => apiGatewayClient.startModelTraining(params.model_name, params.parameters),
            {
              maxRetries: 2, // Fewer retries for mutations
              initialDelay: 2000,
              retryableErrors: [500, 502, 503, 504, 429],
            }
          )
        );
        return data as TrainingJob;
      } catch (error: any) {
        logError(error, `useStartTraining (${params.model_name})`);
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
  });
}

export function useModelComparison() {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery({
    queryKey: ["ml-center", "model-comparison"],
    queryFn: async () => {
      try {
        const data = await executeWithCircuitBreaker(
          "/api/ml/model/comparison",
          () => retryWithBackoff(
            () => apiGatewayClient.get("/api/ml/model/comparison"),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        return data;
      } catch (error: any) {
        logError(error, "useModelComparison");
        
        // If endpoint doesn't exist (404), return null
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function usePerformanceTrends(timeRange: string = "30d", groupBy: string = "day") {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery({
    queryKey: ["ml-center", "performance-trends", timeRange, groupBy],
    queryFn: async () => {
      try {
        const data = await executeWithCircuitBreaker(
          "/api/ml/performance/trends",
          () => retryWithBackoff(
            () => apiGatewayClient.get("/api/ml/performance/trends", {
              timeRange,
              groupBy,
            }),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        return data;
      } catch (error: any) {
        logError(error, "usePerformanceTrends");
        
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useDataDrift() {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery({
    queryKey: ["ml-center", "data-drift"],
    queryFn: async () => {
      try {
        const data = await executeWithCircuitBreaker(
          "/api/v1/mlops/monitoring/drift",
          () => retryWithBackoff(
            () => apiGatewayClient.getDataDrift(),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        return data;
      } catch (error: any) {
        logError(error, "useDataDrift");
        
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for drift data)
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}


