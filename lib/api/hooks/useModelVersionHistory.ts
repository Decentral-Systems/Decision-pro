/**
 * Hooks for Model Version History
 * Fetches version history, comparison, and handles rollback
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { retryWithBackoff } from "@/lib/utils/retry";
import { executeWithCircuitBreaker } from "@/lib/utils/circuitBreaker";
import { getErrorDetails, logError } from "@/lib/utils/errorHandler";
import { trackAPICall } from "@/lib/utils/performanceMetrics";

export interface ModelVersion {
  version_id: string;
  version: string;
  model_id: string;
  model_name: string;
  created_at: string;
  created_by?: string;
  accuracy: number;
  auc_roc: number;
  f1_score: number;
  configuration?: Record<string, any>;
  changelog?: string;
  is_active: boolean;
  is_deployed: boolean;
}

export interface VersionComparison {
  version1: ModelVersion;
  version2: ModelVersion;
  metrics_diff: {
    accuracy_diff: number;
    auc_roc_diff: number;
    f1_score_diff: number;
  };
  config_diff?: Record<string, any>;
  feature_importance_diff?: Array<{
    feature: string;
    diff: number;
  }>;
}

/**
 * Hook to fetch model version history
 */
export function useModelVersionHistory(
  modelId: string,
  enabled: boolean = true
) {
  return useQuery<ModelVersion[]>({
    queryKey: ["model-version-history", modelId],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const data = await executeWithCircuitBreaker(
          `/api/ml/model/${modelId}/versions`,
          () =>
            retryWithBackoff(() => apiGatewayClient.getModelVersions(modelId), {
              maxRetries: 3,
              initialDelay: 1000,
              retryableErrors: [500, 502, 503, 504, 408, 429],
            })
        );

        const duration = Date.now() - startTime;
        trackAPICall(`/api/ml/model/${modelId}/versions`, duration, 200);

        return data as ModelVersion[];
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(
          `/api/ml/model/${modelId}/versions`,
          duration,
          statusCode,
          error
        );
        logError(error, "useModelVersionHistory");

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

/**
 * Hook to fetch version comparison
 */
export function useVersionComparison(
  modelId: string,
  versionId1: string,
  versionId2: string,
  enabled: boolean = true
) {
  return useQuery<VersionComparison>({
    queryKey: ["version-comparison", modelId, versionId1, versionId2],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const data = await executeWithCircuitBreaker(
          `/api/ml/model/${modelId}/versions/${versionId1}/compare`,
          () =>
            retryWithBackoff(
              () =>
                apiGatewayClient.compareModelVersions(
                  modelId,
                  versionId1,
                  versionId2
                ),
              {
                maxRetries: 3,
                initialDelay: 1000,
                retryableErrors: [500, 502, 503, 504, 408, 429],
              }
            )
        );

        const duration = Date.now() - startTime;
        trackAPICall(
          `/api/ml/model/${modelId}/versions/${versionId1}/compare`,
          duration,
          200
        );

        return data as VersionComparison;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(
          `/api/ml/model/${modelId}/versions/${versionId1}/compare`,
          duration,
          statusCode,
          error
        );
        logError(error, "useVersionComparison");

        const errorDetails = getErrorDetails(error);
        const enhancedError = new Error(errorDetails.userMessage);
        (enhancedError as any).errorDetails = errorDetails;
        throw enhancedError;
      }
    },
    enabled: enabled && !!modelId && !!versionId1 && !!versionId2,
    staleTime: 5 * 60 * 1000,
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

/**
 * Hook to rollback model version
 */
export function useVersionRollback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modelId,
      versionId,
    }: {
      modelId: string;
      versionId: string;
    }) => {
      const startTime = Date.now();
      try {
        const result = await executeWithCircuitBreaker(
          `/api/ml/model/${modelId}/versions/${versionId}/rollback`,
          () =>
            retryWithBackoff(
              () => apiGatewayClient.rollbackModelVersion(modelId, versionId),
              {
                maxRetries: 2,
                initialDelay: 1000,
                retryableErrors: [500, 502, 503, 504],
              }
            )
        );

        const duration = Date.now() - startTime;
        trackAPICall(
          `/api/ml/model/${modelId}/versions/${versionId}/rollback`,
          duration,
          200
        );

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const statusCode = error?.statusCode || error?.response?.status || 500;
        trackAPICall(
          `/api/ml/model/${modelId}/versions/${versionId}/rollback`,
          duration,
          statusCode,
          error
        );
        logError(error, "useVersionRollback");
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["model-version-history", variables.modelId],
      });
      queryClient.invalidateQueries({ queryKey: ["ml-center"] });
      queryClient.invalidateQueries({ queryKey: ["model", variables.modelId] });
    },
  });
}
