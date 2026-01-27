/**
 * React Query hooks for Risk Alerts
 */
import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { RiskAlertsResponse, WatchlistResponse, MarketRiskAnalysis } from "@/types/risk";
import { useAuth } from "@/lib/auth/auth-context";
import {
  normalizeResponseFormat,
  validateMarketRiskAnalysis,
} from "@/lib/utils/responseFormatValidator";

export function useRiskAlerts(filters?: { severity?: string; status?: string }) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery<RiskAlertsResponse | null>({
    queryKey: ["risk-alerts", filters],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getRiskAlerts(filters);
        return data;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds (risk alerts should be fresh)
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1,
  });
}

export function useWatchlist() {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery<WatchlistResponse | null>({
    queryKey: ["watchlist"],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getWatchlist();
        return data;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 1,
  });
}

export function useMarketRiskAnalysis() {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery<MarketRiskAnalysis | null>({
    queryKey: ["market-risk-analysis"],
    queryFn: async () => {
      try {
        const rawData = await apiGatewayClient.getMarketRiskAnalysis();
        // Normalize and validate response format (transforms to camelCase)
        const normalized = normalizeResponseFormat<MarketRiskAnalysis>(
          rawData,
          validateMarketRiskAnalysis
        );
        return normalized;
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        const correlationId = error?.correlationId || error?.response?.headers?.["x-correlation-id"];
        
        // Log error for debugging (only in development)
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.error("[MarketRiskAnalysis] API Error:", {
            statusCode,
            correlationId,
            message: error?.message || "Unknown error",
            error: error
          });
        }
        
        // Return null for 404 (endpoint not found) to show empty state
        if (statusCode === 404) {
          return null;
        }
        
        // Re-throw other errors to trigger error state
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useMarketRiskHistorical(days: number = 30) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery<any | null>({
    queryKey: ["market-risk-historical", days],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getMarketRiskHistorical(days);
        return data?.historical_data || null;
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        const correlationId = error?.correlationId || error?.response?.headers?.["x-correlation-id"];
        
        // Log error for debugging (only in development)
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.error("[MarketRiskHistorical] API Error:", {
            statusCode,
            correlationId,
            message: error?.message || "Unknown error",
            days,
            error: error
          });
        }
        
        // Return null for 404 or other errors to allow fallback
        if (statusCode === 404) {
          return null;
        }
        
        // Return null on error to allow fallback (historical data is optional)
        return null;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useMarketRiskSectors() {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery<any | null>({
    queryKey: ["market-risk-sectors"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getMarketRiskSectors();
        return data?.sectors || null;
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        const correlationId = error?.correlationId || error?.response?.headers?.["x-correlation-id"];
        
        // Log error for debugging (only in development)
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.error("[MarketRiskSectors] API Error:", {
            statusCode,
            correlationId,
            message: error?.message || "Unknown error",
            error: error
          });
        }
        
        // Return null for 404 or other errors to allow fallback
        if (statusCode === 404) {
          return null;
        }
        
        // Return null on error to allow fallback (sectors data is optional)
        return null;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}







