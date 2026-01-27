/**
 * Unified Error State Hook for Dashboard
 * Manages all dashboard error states in one place
 */

import { useMemo } from "react";
import type { Error } from "@/types/error";

export interface DashboardErrors {
  dashboard?: Error | null;
  executive?: Error | null;
  customerStats?: Error | null;
  recommendations?: Error | null;
}

export interface UseDashboardErrorsReturn {
  errors: DashboardErrors;
  hasErrors: boolean;
  errorCount: number;
  hasAnyError: boolean;
  errorMessages: string[];
  refetchAll: () => void;
}

interface UseDashboardErrorsOptions {
  errors: DashboardErrors;
  onRetry?: () => void;
}

/**
 * Hook for managing all dashboard error states
 * 
 * @example
 * ```tsx
 * const { hasErrors, errorCount, refetchAll } = useDashboardErrors({
 *   errors: {
 *     dashboard: error,
 *     executive: executiveError,
 *     customerStats: customerStatsError,
 *     recommendations: recommendationStatsError,
 *   },
 *   onRetry: handleRetry,
 * });
 * ```
 */
export function useDashboardErrors({
  errors,
  onRetry,
}: UseDashboardErrorsOptions): UseDashboardErrorsReturn {
  // Calculate error state
  const hasErrors = useMemo(() => {
    return Object.values(errors).some((error) => error !== null && error !== undefined);
  }, [errors]);

  const errorCount = useMemo(() => {
    return Object.values(errors).filter(
      (error) => error !== null && error !== undefined
    ).length;
  }, [errors]);

  const hasAnyError = hasErrors;

  const errorMessages = useMemo(() => {
    return Object.entries(errors)
      .filter(([, error]) => error !== null && error !== undefined)
      .map(([key, error]) => {
        const message = (error as any)?.message || "Unknown error occurred";
        const statusCode = (error as any)?.statusCode || (error as any)?.response?.status;
        return statusCode ? `${key}: ${message} (${statusCode})` : `${key}: ${message}`;
      });
  }, [errors]);

  const refetchAll = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return {
    errors,
    hasErrors,
    errorCount,
    hasAnyError,
    errorMessages,
    refetchAll,
  };
}






