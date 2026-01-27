/**
 * Hooks for Feature Importance
 * Fetches feature importance, correlation, and drift data
 */

import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { retryWithBackoff } from "@/lib/utils/retry";
import { executeWithCircuitBreaker } from "@/lib/utils/circuitBreaker";
import { getErrorDetails, logError } from "@/lib/utils/errorHandler";
import { trackAPICall } from "@/lib/utils/performanceMetrics";

export interface FeatureImportance {
  feature_name: string;
  importance_score: number;
  shap_value?: number;
  lime_value?: number;
  category?: string;
  rank?: number;
}

export interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation: number;
}

export interface FeatureDrift {
  feature: string;
  drift_score: number;
  threshold: number;
  status: "drifted" | "stable" | "unknown";
  baseline_mean?: number;
  current_mean?: number;
  psi_value?: number;
}

/**
 * Hook to fetch feature importance
 */
export function useFeatureImportance(modelId: string, enabled: boolean = true) {
  return useQuery<FeatureImportance[]>({
    queryKey: ["feature-importance", modelId],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const data = await executeWithCircuitBreaker(
          `/api/ml/model/${modelId}/features/importance`,
          () => retryWithBackoff(
            () => apiGatewayClient.getFeatureImportance(modelId),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        
        const duration = Date.now() - startTime;
        trackAPICall(`/api/ml/model/${modelId}/features/importance`, duration, 200);
        
        return data as FeatureImportance[];
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(`/api/ml/model/${modelId}/features/importance`, duration, statusCode, error);
        logError(error, "useFeatureImportance");
        
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: enabled && !!modelId,
    staleTime: 10 * 60 * 1000, // 10 minutes (feature importance changes less frequently)
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

/**
 * Hook to fetch feature correlation
 */
export function useFeatureCorrelation(modelId: string, enabled: boolean = true) {
  return useQuery<FeatureCorrelation[]>({
    queryKey: ["feature-correlation", modelId],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const data = await executeWithCircuitBreaker(
          `/api/ml/model/${modelId}/features/correlation`,
          () => retryWithBackoff(
            () => apiGatewayClient.getFeatureCorrelation(modelId),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        
        const duration = Date.now() - startTime;
        trackAPICall(`/api/ml/model/${modelId}/features/correlation`, duration, 200);
        
        return data as FeatureCorrelation[];
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(`/api/ml/model/${modelId}/features/correlation`, duration, statusCode, error);
        logError(error, "useFeatureCorrelation");
        
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: enabled && !!modelId,
    staleTime: 10 * 60 * 1000,
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

/**
 * Hook to fetch feature drift
 */
export function useFeatureDrift(modelId: string, enabled: boolean = true) {
  return useQuery<FeatureDrift[]>({
    queryKey: ["feature-drift", modelId],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const data = await executeWithCircuitBreaker(
          `/api/ml/model/${modelId}/features/drift`,
          () => retryWithBackoff(
            () => apiGatewayClient.getFeatureDrift(modelId),
            {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            }
          )
        );
        
        const duration = Date.now() - startTime;
        trackAPICall(`/api/ml/model/${modelId}/features/drift`, duration, 200);
        
        return data as FeatureDrift[];
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(`/api/ml/model/${modelId}/features/drift`, duration, statusCode, error);
        logError(error, "useFeatureDrift");
        
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        
        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: enabled && !!modelId,
    staleTime: 5 * 60 * 1000, // 5 minutes (drift data changes more frequently)
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}
