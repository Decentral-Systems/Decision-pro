"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cacheManager } from "@/lib/utils/cache-manager";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SessionTimeoutWarning } from "@/components/auth/SessionTimeoutWarning";
import { NetworkRecoveryMonitor } from "@/components/common/NetworkRecoveryMonitor";
import { createQueryClient } from "@/lib/config/react-query-config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    cacheManager.initialize(client);
    return client;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      cacheManager.persistNow();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const healthCheckInterval = setInterval(
      () => {
        try {
          const queryCache = queryClient.getQueryCache();
          const allQueries = queryCache.getAll();

          const stuckQueries = allQueries.filter((query) => {
            const state = query.state;
            if (!state.error) return false;

            const errorAge = state.errorUpdatedAt
              ? Date.now() - state.errorUpdatedAt
              : Infinity;

            return errorAge > 5 * 60 * 1000 && state.fetchStatus !== "fetching";
          });

          if (stuckQueries.length > 0) {
            console.log(
              `[Providers] Found ${stuckQueries.length} stuck queries, attempting recovery`
            );

            stuckQueries.forEach((query) => {
              queryClient.resetQueries({ queryKey: query.queryKey });
              queryClient.invalidateQueries({ queryKey: query.queryKey });
            });
          }
        } catch (error) {
          console.error("[Providers] Error during query health check:", error);
        }
      },
      2 * 60 * 1000
    );

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
