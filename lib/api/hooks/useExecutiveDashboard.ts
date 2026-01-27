/**
 * React Query hooks for Executive Dashboard data
 */
import { useQuery } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { ExecutiveDashboardData } from "@/types/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { transformExecutiveDashboardData } from "@/lib/utils/executiveDashboardTransform";
import { setCacheMetadata, getCacheMetadata } from "@/lib/utils/cacheMetadata";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { shouldEnableQuery } from "./useQueryEnabled";

export function useExecutiveDashboardData(dateParams?: { start_date: string; end_date: string }) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  // Allow query to run if authenticated OR if API key is available (for fallback auth)
  // The API client will use API key as fallback if token is not yet synced
  const shouldFetch = shouldEnableQuery(isAuthenticated, session?.accessToken);

  return useQuery<ExecutiveDashboardData | null>({
    queryKey: ["executive-dashboard", dateParams],
    queryFn: async () => {
      try {
        const startTime = Date.now();
        const correlationId = getOrCreateCorrelationId();
        
        console.log("[useExecutiveDashboardData] Fetching executive dashboard data", { 
          dateParams, 
          correlationId,
          isAuthenticated,
          tokenSynced,
          hasToken: !!session?.accessToken
        });
        
        const rawData = await apiGatewayClient.getExecutiveDashboardData(dateParams);
        
        console.log("[useExecutiveDashboardData] Raw data received", {
          hasData: !!rawData,
          dataKeys: rawData ? Object.keys(rawData) : [],
          responseTime: Date.now() - startTime,
          rawDataType: typeof rawData,
          rawDataSample: rawData ? JSON.stringify(rawData).substring(0, 200) : null
        });
        
        // Check if rawData is empty or null
        if (!rawData || (typeof rawData === 'object' && Object.keys(rawData).length === 0)) {
          console.warn("[useExecutiveDashboardData] Raw data is empty or null", {
            rawData,
            rawDataType: typeof rawData
          });
          return null;
        }
        
        // Transform the raw API response to structured format
        const transformedData = transformExecutiveDashboardData(rawData);
        
        if (!transformedData) {
          console.warn("[useExecutiveDashboardData] Failed to transform executive dashboard data", {
            rawData,
            rawDataKeys: rawData ? Object.keys(rawData) : [],
            rawDataSample: rawData ? JSON.stringify(rawData).substring(0, 500) : null
          });
          return null;
        }

        console.log("[useExecutiveDashboardData] Data transformed successfully", {
          hasBankingKPIs: !!transformedData.banking_kpis,
          hasRevenueMetrics: !!transformedData.revenue_metrics,
          hasPortfolioHealth: !!transformedData.portfolio_health,
          transformedKeys: Object.keys(transformedData)
        });

        // Store cache metadata
        const responseTime = Date.now() - startTime;
        setCacheMetadata("executive-dashboard", {
          correlationId,
          responseTime,
        });

        return transformedData;
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status || error?.status;
        console.error("[useExecutiveDashboardData] Error fetching executive dashboard data", {
          statusCode,
          message: error?.message,
          errorType: error?.constructor?.name,
          errorDetails: error?.response?.data,
          error
        });
        
        if (statusCode === 401 || statusCode === 404) {
          console.warn("[useExecutiveDashboardData] Executive dashboard data not available:", statusCode);
          return null;
        }
        throw error;
      }
    },
    enabled: shouldFetch,
    staleTime: 30 * 1000, // 30 seconds - data considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - cache retention
    refetchInterval: false, // Auto-refresh disabled - manual refresh only
    refetchIntervalInBackground: false, // Background refetch disabled
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}
/**
 * Get cache metadata for executive dashboard data
 */
export function useExecutiveDashboardCacheMetadata() {
  const metadata = typeof window !== 'undefined' ? getCacheMetadata("executive-dashboard") : null;
  return metadata;
}




