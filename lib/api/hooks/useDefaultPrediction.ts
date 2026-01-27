/**
 * React Query hooks for Default Prediction
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import {
  DefaultPredictionRequest,
  DefaultPredictionResponse,
} from "@/types/prediction";
import { useAuth } from "@/lib/auth/auth-context";

export function useDefaultPrediction() {
  const queryClient = useQueryClient();
  return useMutation<DefaultPredictionResponse, Error, DefaultPredictionRequest>({
    mutationFn: async (data) => {
      // Check if endpoint exists in API Gateway or Credit Scoring Service
      try {
        const response = await apiGatewayClient.post<DefaultPredictionResponse>(
          "/api/default-prediction/predict",
          data
        );
        return response;
      } catch (error) {
        // If endpoint doesn't exist, return mock response structure
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate prediction history for this customer
      if (variables.customer_id) {
        queryClient.invalidateQueries({ queryKey: ["prediction-history", variables.customer_id] });
      }
      // Invalidate analytics data as new prediction affects metrics
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function usePredictionHistory(customerId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery<DefaultPredictionResponse[]>({
    queryKey: ["prediction-history", customerId],
    queryFn: async () => {
      const data = await apiGatewayClient.get<DefaultPredictionResponse[]>(
        `/api/default-prediction/history/${customerId}`
      );
      return data;
    },
    enabled: isAuthenticated && !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}


