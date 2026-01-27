/**
 * React Query hooks for Dashboard data
 */
import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { DashboardData, KPIMetric } from "@/types/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { setCacheMetadata, getCacheMetadata } from "@/lib/utils/cacheMetadata";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { shouldEnableQuery } from "./useQueryEnabled";

export function useDashboardData(dateParams?: { start_date: string; end_date: string }) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  // Allow query to run if authenticated OR if API key is available (for fallback auth)
  // The API client will use API key as fallback if token is not yet synced
  const shouldFetch = shouldEnableQuery(isAuthenticated, session?.accessToken);

  return useQuery<DashboardData | null>({
    queryKey: ["dashboard", dateParams],
    enabled: shouldFetch, // Only run when authenticated (token sync may be slightly delayed)
    queryFn: async () => {
      try {
        const startTime = Date.now();
        const correlationId = getOrCreateCorrelationId();
        
        console.log("[useDashboardData] Fetching dashboard data", { dateParams, correlationId });
        
        // Fetch dashboard data from analytics endpoint
        const data = await apiGatewayClient.getDashboardData(dateParams);
        
        console.log("[useDashboardData] Dashboard data received", { 
          hasData: !!data, 
          dataKeys: data ? Object.keys(data) : [],
          responseTime: Date.now() - startTime 
        });
        
        // Store cache metadata
        const responseTime = Date.now() - startTime;
        setCacheMetadata("dashboard", {
          correlationId,
          responseTime,
        });

        // Handle different response structures from analytics endpoint
        // The endpoint may return analytics object or direct metrics
        const analytics = (data as any)?.analytics || data;
        const dashboardMetrics = (analytics as any)?.dashboard || analytics || {};

        // If we truly have no metrics object, treat as no data instead of zeros
        if (!dashboardMetrics || typeof dashboardMetrics !== "object") {
          console.warn("[useDashboardData] Dashboard metrics missing or invalid, returning null", {
            data,
            analytics,
            dashboardMetrics
          });
          return null;
        }

        // Helper to safely map a raw metric into KPIMetric or undefined
        const toMetric = (
          raw: any,
          fallbackLabel: string,
          format: KPIMetric["format"]
        ): KPIMetric | undefined => {
          if (!raw) return undefined;

          // Already in KPIMetric shape
          if (typeof raw === "object" && typeof raw.value === "number") {
            return {
              label: raw.label || fallbackLabel,
              value: raw.value,
              change: raw.change,
              changeType: raw.changeType,
              format: raw.format || format,
              trend: raw.trend,
            };
          }

          // Primitive number from backend
          if (typeof raw === "number") {
            return {
              label: fallbackLabel,
              value: raw,
              format,
            };
          }

          return undefined;
        };

        const mapped: DashboardData = {
          // Only create KPIMetric objects when API actually returns something;
          // otherwise leave undefined so the UI can show a clear empty state.
          revenue:
            toMetric(
              (dashboardMetrics as any).revenue ??
                (dashboardMetrics as any).total_revenue,
              "Total Revenue",
              "currency"
            ) ?? undefined,
          loans:
            toMetric(
              (dashboardMetrics as any).loans ??
                (dashboardMetrics as any).active_loans,
              "Active Loans",
              "number"
            ) ?? undefined,
          customers:
            toMetric(
              (dashboardMetrics as any).customers ??
                (dashboardMetrics as any).total_customers,
              "Total Customers",
              "number"
            ) ?? undefined,
          risk_score:
            toMetric(
              (dashboardMetrics as any).risk_score ??
                (dashboardMetrics as any).portfolio_risk_score,
              "Portfolio Risk Score",
              "number"
            ) ?? undefined,
          npl_ratio: toMetric(
            (dashboardMetrics as any).npl_ratio,
            "NPL Ratio",
            "percentage"
          ),
          approval_rate: toMetric(
            (dashboardMetrics as any).approval_rate,
            "Approval Rate",
            "percentage"
          ),
        };

        // If all primary metrics are missing, treat as no data
        // Only warn in development mode to reduce noise in production
        if (
          !mapped.revenue &&
          !mapped.loans &&
          !mapped.customers &&
          !mapped.risk_score
        ) {
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "[useDashboardData] Dashboard response contained no usable KPI metrics, returning null (this is normal if using executive dashboard data)"
            );
          }
          return null;
        }

        return mapped;
      } catch (error: any) {
        // Enhanced error logging
        const statusCode = error?.statusCode || error?.response?.status || error?.status;
        console.error("[useDashboardData] Error fetching dashboard data", {
          statusCode,
          message: error?.message,
          errorType: error?.constructor?.name,
          dateParams
        });
        
        // Return null for 401/404 errors to allow fallback data to be used
        if (statusCode === 401 || statusCode === 404) {
          console.warn("[useDashboardData] Dashboard data not available, using fallback:", statusCode);
          return null;
        }
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - data considered fresh (reduced for better freshness)
    gcTime: 5 * 60 * 1000, // 5 minutes - cache retention
    refetchInterval: false, // Manual refresh only (was causing too many requests)
    refetchIntervalInBackground: false, // Don't refetch in background to save resources
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

/**
 * Get cache metadata for dashboard data
 */
export function useDashboardCacheMetadata() {
  const metadata = typeof window !== 'undefined' ? getCacheMetadata("dashboard") : null;
  return metadata;
}


