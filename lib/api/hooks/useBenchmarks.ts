/**
 * React Query hooks for Benchmarks
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

export function useBenchmarks() {
  const { isAuthenticated } = useAuth();
  
  return useQuery<any | null>({
    queryKey: ["benchmarks"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getBenchmarks();
        return data?.benchmarks || null;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        return null; // Return null on error to allow fallback
      }
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000, // 1 hour (benchmarks don't change often)
    retry: 1,
  });
}






