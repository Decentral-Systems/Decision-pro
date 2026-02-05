/**
 * React Query hooks for Explainability operations
 */

import { useQuery } from "@tanstack/react-query";
import {
  explainabilityService,
  ExplainabilityRequest,
} from "@/lib/api/services/explainability";

/**
 * Hook to get SHAP explanation
 */
export function useSHAPExplanation(
  request: ExplainabilityRequest | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["shapExplanation", request?.prediction_id, request?.customer_id],
    queryFn: () => explainabilityService.getSHAPExplanation(request!),
    enabled: enabled && !!request && (!!request.prediction_id || !!request.features),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get LIME explanation for a feature
 */
export function useLIMEExplanation(
  predictionId: string | null,
  feature: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["limeExplanation", predictionId, feature],
    queryFn: () =>
      explainabilityService.getLIMEExplanation(predictionId!, feature!),
    enabled: enabled && !!predictionId && !!feature,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get model ensemble information
 */
export function useModelEnsemble(
  predictionId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["modelEnsemble", predictionId],
    queryFn: () => explainabilityService.getModelEnsemble(predictionId!),
    enabled: enabled && !!predictionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
