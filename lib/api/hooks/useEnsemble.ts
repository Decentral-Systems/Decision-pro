/**
 * React Query hooks for Ensemble Model Operations
 */
import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

export function useEnsembleWeights() {
  const { isAuthenticated } = useAuth();
  
  return useQuery<any | null>({
    queryKey: ["ensemble-weights"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getEnsembleWeights();
        return data?.weights || null;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        return null; // Return null on error to allow fallback
      }
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

export function useEnsembleAgreement() {
  const { isAuthenticated } = useAuth();
  
  return useQuery<any | null>({
    queryKey: ["ensemble-agreement"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getEnsembleAgreement();
        return data?.agreement_metrics || null;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        return null; // Return null on error to allow fallback
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}






