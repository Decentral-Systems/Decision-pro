/**
 * React Query hooks for Default Prediction History
 */
import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

export interface DefaultPredictionHistoryParams {
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  min_probability?: number;
  max_probability?: number;
  risk_level?: string;
  page?: number;
  page_size?: number;
}

export interface DefaultPredictionHistoryItem {
  id: string;
  customer_id: string;
  customer_name?: string;
  default_probability: number;
  risk_level: string;
  survival_probability?: number;
  hazard_rate?: number;
  loan_amount?: number;
  loan_term_months?: number;
  created_at: string;
  key_factors?: string[];
  compliance_status?: any;
}

export interface DefaultPredictionHistoryResponse {
  items: DefaultPredictionHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export function useDefaultPredictionHistory(params: DefaultPredictionHistoryParams = {}) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<DefaultPredictionHistoryResponse>({
    queryKey: ["default-prediction-history", params],
    queryFn: async () => {
      try {
        // Try to fetch from API Gateway endpoint
        const response = await apiGatewayClient.get<DefaultPredictionHistoryResponse>(
          "/api/intelligence/default-prediction/history",
          params
        );
        return response;
      } catch (error: any) {
        // If endpoint doesn't exist, return empty response
        if (error?.statusCode === 404 || error?.statusCode === 401) {
          console.warn("Default prediction history endpoint not available, returning empty data");
          return {
            items: [],
            total: 0,
            page: params.page || 1,
            page_size: params.page_size || 50,
            has_more: false,
          };
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useDefaultPredictionHistoryByCustomer(customerId: string | null) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<DefaultPredictionHistoryItem[]>({
    queryKey: ["default-prediction-history", "customer", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      try {
        const response = await apiGatewayClient.get<DefaultPredictionHistoryResponse>(
          "/api/intelligence/default-prediction/history",
          { customer_id: customerId, page_size: 100 }
        );
        return response.items || [];
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 401) {
          return [];
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!customerId,
    staleTime: 1 * 60 * 1000,
  });
}






