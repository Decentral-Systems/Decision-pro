"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { createQueryClient } from "@/lib/react-query/config";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cacheManager } from "@/lib/utils/cacheManager";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SessionTimeoutWarning } from "@/components/auth/SessionTimeoutWarning";
import { NetworkRecoveryMonitor } from "@/components/common/NetworkRecoveryMonitor";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create query client once per app lifecycle using optimized config
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    // Initialize cache manager
    cacheManager.initialize(client);
    return client;
  });

  // Persist cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cacheManager.persistNow();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Periodic query health check to prevent stuck queries
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const healthCheckInterval = setInterval(
      () => {
        try {
          const queryCache = queryClient.getQueryCache();
          const allQueries = queryCache.getAll();

          // Find queries that are stuck (in error state for more than 5 minutes)
          const stuckQueries = allQueries.filter((query) => {
            const state = query.state;
            if (!state.error) return false;

            // Check if error has been present for more than 5 minutes
            const errorAge = state.errorUpdatedAt
              ? Date.now() - state.errorUpdatedAt
              : Infinity;

            // Only recover if not currently fetching and error is old
            return errorAge > 5 * 60 * 1000 && state.fetchStatus !== "fetching";
          });

          if (stuckQueries.length > 0) {
            console.log(
              `[Providers] Found ${stuckQueries.length} stuck queries, attempting recovery`
            );

            // Reset stuck queries to allow retry
            stuckQueries.forEach((query) => {
              queryClient.resetQueries({ queryKey: query.queryKey });
              // Invalidate to trigger refetch
              queryClient.invalidateQueries({ queryKey: query.queryKey });
            });
          }
        } catch (error) {
          console.error("[Providers] Error during query health check:", error);
        }
      },
      2 * 60 * 1000
    ); // Check every 2 minutes

    return () => clearInterval(healthCheckInterval);
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <NetworkRecoveryMonitor />
            {children}
            <Toaster />
            <SessionTimeoutWarning />
            {process.env.NODE_ENV === "development" && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
