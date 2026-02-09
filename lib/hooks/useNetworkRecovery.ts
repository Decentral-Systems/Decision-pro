import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiHealth } from "@/lib/api/hooks/useApiHealth";

interface UseNetworkRecoveryOptions {
  /**
   * How often to check network status (in milliseconds)
   * @default 30000 (30 seconds)
   */
  checkInterval?: number;

  /**
   * Whether to enable automatic recovery
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when network recovery is detected
   */
  onRecovery?: () => void;
}

export function useNetworkRecovery(options: UseNetworkRecoveryOptions = {}) {
  const { checkInterval = 30000, enabled = true, onRecovery } = options;

  const queryClient = useQueryClient();
  const wasOfflineRef = useRef<boolean>(false);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor API health
  const { isOnline, isChecking } = useApiHealth(enabled, checkInterval);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    // Track previous offline state
    const wasOffline = wasOfflineRef.current;
    const isNowOnline = isOnline && !isChecking;

    // Detect network recovery: was offline, now online
    if (wasOffline && isNowOnline) {
      console.log(
        "[NetworkRecovery] Network recovered, invalidating failed queries"
      );

      // Clear any existing recovery timeout
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }

      // Delay recovery slightly to ensure network is stable
      recoveryTimeoutRef.current = setTimeout(() => {
        try {
          // Get all queries
          const queryCache = queryClient.getQueryCache();
          const allQueries = queryCache.getAll();

          // Find queries that are in error state or have stale data
          const queriesToRecover = allQueries.filter((query) => {
            const state = query.state;
            // Recover queries that:
            // 1. Are in error state
            // 2. Have stale data (dataUpdatedAt is old)
            // 3. Are not currently fetching
            return (
              (state.error && state.fetchStatus !== "fetching") ||
              (state.dataUpdatedAt &&
                Date.now() - state.dataUpdatedAt > 5 * 60 * 1000)
            );
          });

          if (queriesToRecover.length > 0) {
            console.log(
              `[NetworkRecovery] Recovering ${queriesToRecover.length} queries`
            );

            // CRITICAL FIX: Force refetch instead of just invalidate
            // This ensures queries actually refetch, even if refetchInterval is false
            queriesToRecover.forEach((query) => {
              // Reset query state to allow retry
              queryClient.resetQueries({ queryKey: query.queryKey });
              // Invalidate to mark as stale
              queryClient.invalidateQueries({ queryKey: query.queryKey });
              // Force refetch immediately
              queryClient.refetchQueries({ queryKey: query.queryKey });
            });

            // Also invalidate and refetch all queries to ensure fresh data
            queryClient.invalidateQueries();
            queryClient.refetchQueries();

            // Call recovery callback
            if (onRecovery) {
              onRecovery();
            }
          }
        } catch (error) {
          console.error("[NetworkRecovery] Error during recovery:", error);
        }
      }, 1000); // Wait 1 second for network to stabilize
    }

    // Update offline state
    wasOfflineRef.current = !isNowOnline;

    // Cleanup timeout on unmount
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, [isOnline, isChecking, enabled, queryClient, onRecovery]);

  // Also monitor browser online/offline events as backup
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
      console.log("[NetworkRecovery] Browser online event detected");
      // Small delay to let API health check catch up
      setTimeout(() => {
        // CRITICAL FIX: Force refetch instead of just invalidate
        queryClient.invalidateQueries();
        queryClient.refetchQueries(); // Force immediate refetch
        if (onRecovery) {
          onRecovery();
        }
      }, 2000);
    };

    const handleOffline = () => {
      console.log("[NetworkRecovery] Browser offline event detected");
      wasOfflineRef.current = true;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enabled, queryClient, onRecovery]);

  return {
    isOnline,
    isChecking,
  };
}
