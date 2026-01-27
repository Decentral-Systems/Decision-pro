/**
 * React Query hooks for Drift Detection data
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { DriftMetrics } from "@/types/ml";
import { useAuth } from "@/lib/auth/auth-context";

export function useDriftDetection() {
  const { isAuthenticated } = useAuth();

  return useQuery<DriftMetrics | null>({
    queryKey: ["drift-detection"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getDriftDetection();
        return data;
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 404) {
          console.warn("Drift detection data not available, using fallback:", error);
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




