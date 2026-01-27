/**
 * React Query hooks for Performance Trends data
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { PerformanceTrends } from "@/types/ml";
import { useAuth } from "@/lib/auth/auth-context";

export function usePerformanceTrends(timeRange: string = "30d", groupBy: string = "day") {
  const { isAuthenticated } = useAuth();

  return useQuery<PerformanceTrends | null>({
    queryKey: ["performance-trends", timeRange, groupBy],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getPerformanceTrends(timeRange, groupBy);
        return data;
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 404) {
          console.warn("Performance trends data not available, using fallback:", error);
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




