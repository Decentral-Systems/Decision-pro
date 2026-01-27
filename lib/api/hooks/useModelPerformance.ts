/**
 * React Query hooks for Model Performance data
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { ModelPerformanceMetrics, ModelComparisonData } from "@/types/ml";
import { useAuth } from "@/lib/auth/auth-context";

export function useModelPerformance(modelName?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery<ModelPerformanceMetrics | null>({
    queryKey: ["model-performance", modelName],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getModelPerformance(modelName);
        return data;
      } catch (error: any) {
        // Return null for 401/404 errors to allow fallback data to be used
        if (error?.status === 401 || error?.status === 404) {
          console.warn("Model performance data not available, using fallback:", error);
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useModelComparison() {
  const { isAuthenticated } = useAuth();

  return useQuery<ModelComparisonData | null>({
    queryKey: ["model-comparison"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getModelComparison();
        return data;
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 404) {
          console.warn("Model comparison data not available, using fallback:", error);
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}




