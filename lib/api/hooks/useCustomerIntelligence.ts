/**
 * React Query hooks for Customer Intelligence data
 */
import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

export function useCustomerIntelligence(customerId: string | undefined | null) {
  const { isAuthenticated } = useAuth();

  return useQuery<any | null>({
    queryKey: ["customer-intelligence", customerId],
    queryFn: async () => {
      if (!customerId) {
        return null;
      }
      try {
        const data = await apiGatewayClient.getCustomerIntelligence(customerId);
        return data;
      } catch (error: any) {
        console.error("Failed to fetch customer intelligence:", error);
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

