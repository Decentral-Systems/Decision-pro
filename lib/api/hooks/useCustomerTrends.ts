import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Hook to fetch customer trends data
 */
export function useCustomerTrends(
  customerId: string | null,
  timeRange: string = "90d"
) {
  const { isAuthenticated } = useAuth();

  return useQuery<any | null>({
    queryKey: ["customer-trends", customerId, timeRange],
    queryFn: async () => {
      if (!customerId) return null;
      try {
        const data = await apiGatewayClient.getCustomerTrends(customerId, timeRange);
        return data;
      } catch (error: any) {
        console.error("Failed to fetch customer trends:", error);
        return null;
      }
    },
    enabled: isAuthenticated && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
