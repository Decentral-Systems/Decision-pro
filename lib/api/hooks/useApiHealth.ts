/**
 * React Query hook for checking API Gateway health status
 * Returns real-time connectivity status based on actual API health checks
 */
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URLS } from "@/lib/config/api-endpoints";

export interface ApiHealthStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: Error | null;
  responseTime: number | null;
}

/**
 * Check API Gateway health
 */
async function checkApiHealth(): Promise<{
  online: boolean;
  responseTime: number;
}> {
  const startTime = Date.now();
  try {
    // Use a lightweight health check endpoint
    const response = await fetch(`${API_BASE_URLS.apiGateway}/health`, {
      method: "GET",
      headers: {
        "X-API-Key":
          process.env.NEXT_PUBLIC_API_KEY ||
          "ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4",
      },
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    // Consider online if response is ok (200-299) or if it's an auth error (401/403)
    // Auth errors mean the endpoint is online and responding, just needs authentication
    if (response.ok || response.status === 401 || response.status === 403) {
      return { online: true, responseTime };
    }

    return { online: false, responseTime };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    // When fetch fails (CORS, timeout, connection refused), do NOT assume offline
    // if the browser reports navigator.onLine. This avoids false "Network Offline"
    // on the login page when the health check fails due to CORS or API unreachable.
    if (typeof navigator !== "undefined" && navigator.onLine) {
      return { online: true, responseTime }; // optimistic: let login/real requests show actual errors
    }
    return { online: false, responseTime };
  }
}

/**
 * Hook to check API Gateway health status
 * @param enabled - Whether to enable the health check (default: true)
 * @param refetchInterval - How often to refetch in milliseconds (default: 30000 = 30 seconds)
 */
export function useApiHealth(
  enabled: boolean = true,
  refetchInterval: number = 30000
): ApiHealthStatus {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["api-health"],
    queryFn: checkApiHealth,
    enabled,
    refetchInterval, // Check every 30 seconds
    refetchOnWindowFocus: true, // Check when user returns to tab
    refetchOnReconnect: true, // Check when network reconnects
    retry: 1, // Only retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return {
    isOnline: data?.online ?? false,
    isChecking: isLoading,
    lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    error: error as Error | null,
    responseTime: data?.responseTime ?? null,
  };
}

/**
 * Hook to check a specific API endpoint health
 * Useful for pages that depend on specific services
 *
 * All endpoints are API Gateway endpoints and should use the full URL
 * If endpoint already starts with http:// or https://, use it as-is
 * Otherwise, prepend the API Gateway base URL
 */
export function useEndpointHealth(
  endpoint: string,
  enabled: boolean = true,
  refetchInterval: number = 30000
): ApiHealthStatus {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["endpoint-health", endpoint],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        // Build the full URL
        let url: string;

        // If endpoint already has a protocol, use it as-is
        if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
          url = endpoint;
        }
        // If endpoint starts with /, it's a path - prepend API Gateway base URL
        else if (endpoint.startsWith("/")) {
          url = `${API_BASE_URLS.apiGateway}${endpoint}`;
        }
        // Otherwise, assume it's a path and prepend API Gateway base URL with /
        else {
          url = `${API_BASE_URLS.apiGateway}/${endpoint}`;
        }

        // Try GET first, if it fails with 405 (Method Not Allowed), try OPTIONS
        let response = await fetch(url, {
          method: "GET",
          headers: {
            "X-API-Key":
              process.env.NEXT_PUBLIC_API_KEY ||
              "ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4",
          },
          signal: AbortSignal.timeout(5000),
        });

        // If GET returns 405 (Method Not Allowed), try OPTIONS to check if endpoint exists
        if (response.status === 405) {
          response = await fetch(url, {
            method: "OPTIONS",
            headers: {
              "X-API-Key":
                process.env.NEXT_PUBLIC_API_KEY ||
                "ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4",
            },
            signal: AbortSignal.timeout(5000),
          });
        }

        const responseTime = Date.now() - startTime;
        // Consider endpoint online if:
        // - Status is 200-299 (success)
        // - Status is 401/403 (auth required - endpoint is online, just needs auth)
        // - Status is 405 (exists but wrong method)
        const isOnline =
          response.ok ||
          response.status === 401 ||
          response.status === 403 ||
          response.status === 405;
        return { online: isOnline, responseTime };
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        return { online: false, responseTime };
      }
    },
    enabled,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 2000,
    staleTime: 10000,
  });

  return {
    isOnline: data?.online ?? false,
    isChecking: isLoading,
    lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    error: error as Error | null,
    responseTime: data?.responseTime ?? null,
  };
}
