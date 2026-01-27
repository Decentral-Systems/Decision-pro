/**
 * React Query hooks for Customer Statistics
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { CustomerStats } from "@/types/customer-intelligence";
import { useAuth } from "@/lib/auth/auth-context";
import { shouldEnableQuery } from "./useQueryEnabled";

export function useCustomerStats(dateParams?: { start_date: string; end_date: string }) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  // Allow query to run if authenticated OR if API key is available (for fallback auth)
  const shouldFetch = shouldEnableQuery(isAuthenticated, session?.accessToken);
  
  return useQuery<CustomerStats | null>({
    queryKey: ["customer-stats", dateParams],
    enabled: shouldFetch, // Allow API key fallback
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getCustomerStats(dateParams);
        return data;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}







