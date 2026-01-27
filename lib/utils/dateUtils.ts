/**
 * Date Utility Functions
 * Helper functions for date manipulation and formatting
 */

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: DateRangePreset;
}

/**
 * Get date range for a preset
 */
export function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today
  
  const startDate = new Date();

  switch (preset) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'custom':
      // Return current month as default for custom
      startDate.setDate(1);
      break;
  }

  startDate.setHours(0, 0, 0, 0); // Start of day

  return { startDate, endDate, preset };
}

/**
 * Format date for API calls (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date range for API calls
 */
export function formatDateRangeForAPI(range: DateRange): { start_date: string; end_date: string } {
  return {
    start_date: formatDateForAPI(range.startDate),
    end_date: formatDateForAPI(range.endDate),
  };
}

/**
 * Parse date from API format (YYYY-MM-DD)
 */
export function parseDateFromAPI(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

/**
 * Parse date range from URL query parameters
 */
export function parseDateRangeFromURL(searchParams: URLSearchParams): DateRange | null {
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const presetParam = searchParams.get('preset') as DateRangePreset | null;

  if (presetParam && presetParam !== 'custom') {
    return getDateRangeForPreset(presetParam);
  }

  if (startDateParam && endDateParam) {
    try {
      const startDate = parseDateFromAPI(startDateParam);
      const endDate = parseDateFromAPI(endDateParam);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      // Ensure start date is before end date
      if (startDate > endDate) {
        return null;
      }

      return {
        startDate,
        endDate,
        preset: 'custom',
      };
    } catch (error) {
      console.error('[dateUtils] Error parsing date range from URL:', error);
      return null;
    }
  }

  return null;
}

/**
 * Format date range to URL query parameters
 */
export function formatDateRangeToURL(range: DateRange): string {
  const params = new URLSearchParams();
  
  if (range.preset && range.preset !== 'custom') {
    params.set('preset', range.preset);
  } else {
    params.set('startDate', formatDateForAPI(range.startDate));
    params.set('endDate', formatDateForAPI(range.endDate));
  }

  return params.toString();
}

/**
 * Get human-readable date range label
 */
export function getDateRangeLabel(range: DateRange): string {
  if (range.preset) {
    const presetLabels: Record<DateRangePreset, string> = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '1y': 'Last year',
      'custom': 'Custom range',
    };
    return presetLabels[range.preset];
  }

  const startFormatted = range.startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endFormatted = range.endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Validate date range
 */
export function validateDateRange(range: DateRange): { valid: boolean; error?: string } {
  if (isNaN(range.startDate.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (isNaN(range.endDate.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }

  if (range.startDate > range.endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  // Check if range is too large (more than 5 years - matches backend validation)
  const daysDiff = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const maxDays = 365 * 5; // 5 years
  if (daysDiff > maxDays) {
    return { valid: false, error: `Date range cannot exceed ${maxDays} days (5 years). Your range is ${daysDiff} days.` };
  }

  // Check if dates are too old (more than 10 years ago - matches backend validation)
  const now = new Date();
  const minDate = new Date(now.getTime() - (365 * 10 * 24 * 60 * 60 * 1000)); // 10 years ago
  if (range.startDate < minDate) {
    return { valid: false, error: 'Date range cannot extend more than 10 years into the past' };
  }

  // Check if dates are in the future (matches backend validation)
  if (range.startDate > now || range.endDate > now) {
    return { valid: false, error: 'Date range cannot include future dates. Please use dates up to today.' };
  }

  return { valid: true };
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRange {
  return getDateRangeForPreset('30d');
}



