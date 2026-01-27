/**
 * React Query hooks for Rules Engine operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rulesEngineService, LoanTermsRequest, EligibilityRequest, WorkflowEvaluationRequest } from "@/lib/api/services/rules-engine";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to calculate loan terms using Rules Engine
 */
export function useCalculateLoanTerms() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: LoanTermsRequest) =>
      rulesEngineService.calculateLoanTerms(request),
    onError: (error: any) => {
      toast({
        title: "Rules Engine Error",
        description: error.message || "Failed to calculate loan terms",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to evaluate eligibility
 */
export function useEvaluateEligibility() {
  return useMutation({
    mutationFn: (request: EligibilityRequest) =>
      rulesEngineService.evaluateEligibility(request),
  });
}

/**
 * Hook to evaluate workflow automation
 */
export function useEvaluateWorkflow() {
  return useMutation({
    mutationFn: (request: WorkflowEvaluationRequest) =>
      rulesEngineService.evaluateWorkflow(request),
  });
}

/**
 * Hook to get product recommendations
 */
export function useProductRecommendations(customerId?: string, enabled = true) {
  return useQuery({
    queryKey: ["productRecommendations", customerId],
    queryFn: () => rulesEngineService.getProductRecommendations(customerId!),
    enabled: enabled && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for real-time rules evaluation (debounced)
 */
export function useRealtimeRulesEvaluation(
  request: LoanTermsRequest | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["realtimeRulesEvaluation", request],
    queryFn: () => rulesEngineService.calculateLoanTerms(request!),
    enabled: enabled && !!request,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
