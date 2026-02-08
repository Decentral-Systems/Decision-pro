/**
 * React Query hooks for Real-Time Scoring
 */
import { useQuery } from "@tanstack/react-query";
import { creditScoringClient } from "../clients/credit-scoring";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";

export interface RealtimeScoreEntry {
  customer_id: string;
  score: number;
  risk_category: "low" | "medium" | "high" | "very_high";
  timestamp: string;
  loan_amount?: number;
}

export interface RealtimeMetrics {
  total_scores_today: number;
  average_score: number;
  scores_per_minute: number;
  active_customers: number;
  score_trend: Array<{ time: string; count: number; avg_score: number }>;
}

export function useRealtimeDashboard(customerId?: string) {
  const { isAuthenticated, accessToken } = useAuth();
  return useQuery<any>({
    queryKey: ["realtime-scoring", "dashboard", customerId],
    queryFn: async () => {
      if (customerId) {
        return creditScoringClient.getRealtimeScoring(customerId);
      }
      // Return general dashboard data
      return {};
    },
    enabled: isAuthenticated && !!accessToken,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates (optimized)
    staleTime: 0, // Always consider data stale for real-time
  });
}

export function useRealtimeScoringFeed(limit: number = 20) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<any[]>({
    queryKey: ["realtime-scoring-feed", limit],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getRealtimeScoring(limit);
        return data || [];
      } catch (error) {
        return [];
      }
    },
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates (optimized)
    staleTime: 0, // Always consider data stale for real-time
  });
}

export function useRealtimeScoreFeed() {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  return useQuery<RealtimeScoreEntry[]>({
    queryKey: ["realtime-scoring", "feed"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getRealtimeScoring(50);
        // Transform API response to RealtimeScoreEntry format
        if (Array.isArray(data)) {
          return data.map((item: any) => ({
            customer_id: item.customer_id || item.customerId || "",
            score: item.score || item.credit_score || 0,
            risk_category: item.risk_category || item.riskCategory || "medium",
            timestamp:
              item.timestamp || item.created_at || new Date().toISOString(),
            loan_amount: item.loan_amount || item.loanAmount,
          }));
        }
        return [];
      } catch (error: any) {
        // Return empty array on error, but log it
        console.warn(
          "[useRealtimeScoreFeed] Failed to fetch score feed:",
          error
        );
        return [];
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates (optimized)
    staleTime: 0,
  });
}

export function useRealtimeMetrics() {
  const { isAuthenticated, accessToken } = useAuth();
  return useQuery<RealtimeMetrics>({
    queryKey: ["realtime-scoring", "metrics"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getRealtimeScoringMetrics();
        return {
          total_scores_today: data.total_scores_today || 0,
          average_score: data.average_score || 0,
          scores_per_minute: data.scores_per_minute || 0,
          active_customers: data.active_customers || 0,
          score_trend: data.score_trend || [],
        };
      } catch (error) {
        // Return empty structure on error
        return {
          total_scores_today: 0,
          average_score: 0,
          scores_per_minute: 0,
          active_customers: 0,
          score_trend: [],
        };
      }
    },
    enabled: isAuthenticated && !!accessToken,
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
    refetchInterval: 3000, // Refetch every 3 seconds (optimized for real-time)
    staleTime: 0,
  });
}
