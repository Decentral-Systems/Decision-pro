/**
 * React Query hooks for Credit Scoring History
 */
import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

export interface CreditScoringHistoryParams {
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  min_score?: number;
  max_score?: number;
  risk_category?: string;
  page?: number;
  page_size?: number;
}

export interface CreditScoringHistoryItem {
  id: string;
  customer_id: string;
  customer_name?: string;
  credit_score: number;
  risk_category: string;
  approval_recommendation: string;
  loan_amount?: number;
  monthly_income?: number;
  created_at: string;
  model_predictions?: any;
  compliance_status?: any;
}

export interface CreditScoringHistoryResponse {
  items: CreditScoringHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export function useCreditScoringHistory(params: CreditScoringHistoryParams = {}) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<CreditScoringHistoryResponse>({
    queryKey: ["credit-scoring-history", params],
    queryFn: async () => {
      try {
        // Try to fetch from API Gateway endpoint
        const response = await apiGatewayClient.get<CreditScoringHistoryResponse>(
          "/api/intelligence/credit-scoring/history",
          params
        );
        return response;
      } catch (error: any) {
        // If endpoint doesn't exist, return empty response
        if (error?.statusCode === 404 || error?.statusCode === 401) {
          console.warn("Credit scoring history endpoint not available, returning empty data");
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

export function useCreditScoringHistoryByCustomer(customerId: string | null) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<CreditScoringHistoryItem[]>({
    queryKey: ["credit-scoring-history", "customer", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      try {
        const response = await apiGatewayClient.get<CreditScoringHistoryResponse>(
          "/api/intelligence/credit-scoring/history",
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






