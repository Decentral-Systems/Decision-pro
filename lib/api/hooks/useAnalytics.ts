/**
 * Analytics API Hooks
 * Provides hooks for fetching various analytics and dashboard data
 */
import { useQuery } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";
import { useQueryEnabled, shouldEnableQuery } from "./useQueryEnabled";
import { setCacheMetadata } from "@/lib/utils/cacheMetadata";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";

export interface AnalyticsParams {
  type?: string;
  customer_id?: string;
  time_range?: string;
  group_by?: string;
  format?: string;
  start_date?: string;
  end_date?: string;
}

type ParamsOrTimeframe = AnalyticsParams | string | undefined;

function getParams(params: ParamsOrTimeframe): AnalyticsParams {
  if (typeof params === "string") {
    return { time_range: params };
  }
  return params || {};
}

export function useCustomerAnalytics(params?: ParamsOrTimeframe) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();
  const p = getParams(params);

  return useQuery<any | null>({
    queryKey: ["analytics", "customer", p],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getAnalyticsData(
          p.type || "customer",
          p
        );
        return data;
      } catch (error: any) {
        console.error("Failed to fetch customer analytics:", error);
        return null;
      }
    },
    enabled: isQueryEnabled && !!p.customer_id, // Allow API key fallback
  });
}

/**
 * Use Aggregated Dashboard Data (Phase 5 - OPTIMIZED)
 * Fetches all dashboard data in a single request instead of multiple calls
 * This prevents connection pool exhaustion by reducing 8+ API calls to 1
 */
export function useAggregatedDashboardData(
  sections: string = "customers,analytics,revenue,portfolio,risk"
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();

  return useQuery<any | null>({
    queryKey: ["dashboard", "aggregated", sections],
    enabled: isQueryEnabled,
    queryFn: async () => {
      try {
        const startTime = Date.now();
        const correlationId = getOrCreateCorrelationId();

        const data =
          await apiGatewayClient.getAggregatedDashboardData(sections);

        // Store cache metadata
        const responseTime = Date.now() - startTime;
        setCacheMetadata("aggregated_dashboard", {
          correlationId,
          responseTime,
          timestamp: new Date().toISOString(),
        });

        if (typeof window !== "undefined") {
          console.log("[useAggregatedDashboardData] Fetched data (Phase 5):", {
            hasData: !!data,
            sections: data?.sections_loaded || [],
            responseTime: responseTime + "ms",
          });
        }

        return data;
      } catch (error: any) {
        console.error(
          "[useAggregatedDashboardData] Failed to fetch aggregated dashboard data:",
          error
        );

        // Return empty structure to allow components to render
        return {
          success: false,
          data: {
            customers: null,
            analytics: null,
            revenue: null,
            portfolio: null,
            risk: null,
          },
          sections_loaded: [],
          error: error.message,
        };
      }
    },
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - cache retention
    refetchInterval: 60 * 1000, // Background refetch every 60 seconds (less frequent than individual calls)
    refetchIntervalInBackground: false,
  });
}

export function useAnalyticsData(params?: ParamsOrTimeframe) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();
  const p = getParams(params);

  return useQuery<any | null>({
    queryKey: ["analytics", "unified", p],
    enabled: isQueryEnabled, // Allow API key fallback
    queryFn: async () => {
      try {
        const startTime = Date.now();
        const correlationId = getOrCreateCorrelationId();
        const data = await apiGatewayClient.getAnalyticsData(
          p.type || "dashboard",
          p
        );

        // Store cache metadata
        const responseTime = Date.now() - startTime;
        setCacheMetadata("analytics", {
          correlationId,
          responseTime,
        });
        // Safe logging for SSR
        if (typeof window !== "undefined") {
          console.log("[useAnalyticsData] Fetched data:", {
            hasData: !!data,
            hasAnalytics: !!data?.analytics,
            analyticsKeys: data?.analytics ? Object.keys(data.analytics) : [],
            type: p.type,
          });
        }
        return data;
      } catch (error: any) {
        console.error(
          "[useAnalyticsData] Failed to fetch analytics data:",
          error
        );
        // Return empty structure instead of null to allow components to render
        return {
          analytics: {
            portfolio: { customers: [], trends: [] },
            risk: {
              categories: [],
              trends: [],
              scoreDistribution: [],
              regionalData: [],
            },
          },
        };
      }
    },
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh (optimized for analytics)
    gcTime: 5 * 60 * 1000, // 5 minutes - cache retention
    refetchInterval: 30 * 1000, // Background refetch every 30 seconds (optimized for dashboard metrics)
    refetchIntervalInBackground: false, // Don't refetch in background to save resources
  });
}

export function usePortfolioMetrics(params?: ParamsOrTimeframe) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();
  const p = getParams(params);

  return useQuery<any | null>({
    queryKey: ["analytics", "portfolio", p],
    queryFn: async () => {
      try {
        return await apiGatewayClient.getAnalyticsData("portfolio", p);
      } catch (error: any) {
        console.error("Failed to fetch portfolio metrics:", error);
        return null;
      }
    },
    enabled: isQueryEnabled, // Allow API key fallback
  });
}

export function useRiskDistribution(params?: ParamsOrTimeframe) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();
  const p = getParams(params);

  return useQuery<any | null>({
    queryKey: ["analytics", "risk", p],
    queryFn: async () => {
      try {
        return await apiGatewayClient.getAnalyticsData("risk", p);
      } catch (error: any) {
        console.error("Failed to fetch risk distribution:", error);
        return null;
      }
    },
    enabled: isQueryEnabled, // Allow API key fallback
  });
}

export function useApprovalRates(params?: ParamsOrTimeframe) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();
  const p = getParams(params);

  return useQuery<any | null>({
    queryKey: ["analytics", "scoring", p],
    queryFn: async () => {
      try {
        return await apiGatewayClient.getAnalyticsData("scoring", p);
      } catch (error: any) {
        console.error("Failed to fetch approval rates:", error);
        return null;
      }
    },
    enabled: isQueryEnabled, // Allow API key fallback
  });
}

export function useRevenueBreakdown(
  timeframe: string = "monthly",
  months: number = 12,
  dateParams?: { start_date: string; end_date: string }
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();

  return useQuery<any[]>({
    queryKey: ["revenue-breakdown", timeframe, months, dateParams],
    enabled: isQueryEnabled, // Allow API key fallback
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getRevenueBreakdown(
          timeframe,
          months,
          dateParams
        );
        if (Array.isArray(data)) {
          return data;
        }
        if (data?.data && Array.isArray(data.data)) {
          return data.data;
        }
        return [];
      } catch (error: any) {
        console.error("Failed to fetch revenue breakdown:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenueTrends(
  timeframe: string = "monthly",
  months: number = 12,
  startDate?: string,
  endDate?: string
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<any>({
    queryKey: ["revenue-trends", timeframe, months, startDate, endDate],
    enabled: shouldEnableQuery(isAuthenticated, session?.accessToken),
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getRevenueTrends(
          timeframe,
          months,
          startDate,
          endDate
        );
        return data;
      } catch (error: any) {
        console.error("Failed to fetch revenue trends:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePreviousPeriodMetrics(time_range: string = "30d") {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const isQueryEnabled = useQueryEnabled();

  return useQuery<any | null>({
    queryKey: ["analytics", "previous-period", time_range],
    queryFn: async () => {
      try {
        const data =
          await apiGatewayClient.getPreviousPeriodAnalytics(time_range);
        return data?.data || data || null;
      } catch (error: any) {
        console.error("Failed to fetch previous period metrics:", error);
        return null;
      }
    },
    enabled: isQueryEnabled, // Allow API key fallback
    staleTime: 5 * 60 * 1000, // 5 minutes - previous period data doesn't change often
  });
}

export function useBankingRatiosTargets() {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<any | null>({
    queryKey: ["banking-ratios-targets"],
    enabled: shouldEnableQuery(isAuthenticated, session?.accessToken),
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getBankingRatiosTargets();
        return data?.data || data || null;
      } catch (error: any) {
        console.error("Failed to fetch banking ratios targets:", error);
        return null;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - targets don't change often
  });
}

export function useBankingRatiosStressScenario(
  scenario: string = "stress",
  defaultRateIncrease?: number,
  interestRateShock?: number,
  economicDownturn: boolean = true
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<any | null>({
    queryKey: [
      "banking-ratios-stress-scenario",
      scenario,
      defaultRateIncrease,
      interestRateShock,
      economicDownturn,
    ],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getBankingRatiosStressScenario(
          scenario,
          defaultRateIncrease,
          interestRateShock,
          economicDownturn
        );
        return data?.data || data || null;
      } catch (error: any) {
        console.error("Failed to fetch banking ratios stress scenario:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
