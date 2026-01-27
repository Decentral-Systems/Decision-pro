"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  DateRange,
  DateRangePreset,
  getDateRangeForPreset,
  parseDateRangeFromURL,
  formatDateRangeToURL,
  getDefaultDateRange,
  validateDateRange,
} from "@/lib/utils/dateUtils";

export interface UseDateRangeOptions {
  /**
   * Default preset to use if no URL params
   * @default '30d'
   */
  defaultPreset?: DateRangePreset;

  /**
   * Whether to sync with URL query parameters
   * @default true
   */
  syncWithURL?: boolean;

  /**
   * Callback when date range changes
   */
  onRangeChange?: (range: DateRange) => void;
}

export interface UseDateRangeReturn {
  /**
   * Current date range
   */
  dateRange: DateRange;

  /**
   * Update date range
   */
  setDateRange: (range: DateRange) => void;

  /**
   * Set date range by preset
   */
  setPreset: (preset: DateRangePreset) => void;

  /**
   * Set custom date range
   */
  setCustomRange: (startDate: Date, endDate: Date) => void;

  /**
   * Reset to default range
   */
  reset: () => void;

  /**
   * Validation result
   */
  validation: { valid: boolean; error?: string };

  /**
   * Formatted date strings for API calls
   */
  apiParams: { start_date: string; end_date: string };
}

/**
 * Hook for managing date range state with URL synchronization
 * 
 * Features:
 * - Sync with URL query parameters
 * - Preset date ranges (7d, 30d, 90d, 1y, custom)
 * - Validation
 * - API-formatted date strings
 * 
 * @example
 * ```tsx
 * const { dateRange, setPreset, apiParams } = useDateRange({
 *   defaultPreset: '30d',
 *   syncWithURL: true,
 * });
 * 
 * // Use in API call
 * const { data } = useQuery({
 *   queryKey: ['revenue', apiParams],
 *   queryFn: () => fetchRevenue(apiParams),
 * });
 * ```
 */
export function useDateRange({
  defaultPreset = '30d',
  syncWithURL = true,
  onRangeChange,
}: UseDateRangeOptions = {}): UseDateRangeReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize date range from URL or default
  const initialRange = useMemo(() => {
    if (syncWithURL) {
      const urlRange = parseDateRangeFromURL(searchParams);
      if (urlRange) {
        return urlRange;
      }
    }
    return getDateRangeForPreset(defaultPreset);
  }, []); // Only compute once on mount

  const [dateRange, setDateRangeState] = useState<DateRange>(initialRange);

  // Validate date range
  const validation = useMemo(() => validateDateRange(dateRange), [dateRange]);

  // API-formatted date strings
  const apiParams = useMemo(
    () => ({
      start_date: dateRange.startDate.toISOString().split('T')[0],
      end_date: dateRange.endDate.toISOString().split('T')[0],
    }),
    [dateRange.startDate, dateRange.endDate]
  );

  // Sync with URL when date range changes
  useEffect(() => {
    if (!syncWithURL) return;

    const urlParams = formatDateRangeToURL(dateRange);
    const currentParams = searchParams.toString();

    // Only update URL if params changed
    if (urlParams !== currentParams) {
      const newUrl = urlParams ? `${pathname}?${urlParams}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [dateRange, syncWithURL, pathname, router, searchParams]);

  // Read from URL on mount and when URL changes
  useEffect(() => {
    if (!syncWithURL) return;

    const urlRange = parseDateRangeFromURL(searchParams);
    if (urlRange) {
      setDateRangeState(urlRange);
    }
  }, [searchParams, syncWithURL]);

  // Update date range
  const setDateRange = useCallback(
    (range: DateRange) => {
      const validationResult = validateDateRange(range);
      if (!validationResult.valid) {
        console.warn('[useDateRange] Invalid date range:', validationResult.error);
        return;
      }

      setDateRangeState(range);
      onRangeChange?.(range);
    },
    [onRangeChange]
  );

  // Set preset
  const setPreset = useCallback(
    (preset: DateRangePreset) => {
      const range = getDateRangeForPreset(preset);
      setDateRange(range);
    },
    [setDateRange]
  );

  // Set custom range
  const setCustomRange = useCallback(
    (startDate: Date, endDate: Date) => {
      const range: DateRange = {
        startDate,
        endDate,
        preset: 'custom',
      };
      setDateRange(range);
    },
    [setDateRange]
  );

  // Reset to default
  const reset = useCallback(() => {
    const defaultRange = getDateRangeForPreset(defaultPreset);
    setDateRange(defaultRange);
  }, [defaultPreset, setDateRange]);

  return {
    dateRange,
    setDateRange,
    setPreset,
    setCustomRange,
    reset,
    validation,
    apiParams,
  };
}



