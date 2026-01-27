/**
 * Analytics Tracking Utility
 * 
 * Provides a centralized analytics tracking system for Customer Intelligence features.
 * Supports multiple analytics providers and can be extended as needed.
 */

/**
 * Analytics event types for Customer Intelligence
 */
export type AnalyticsEventType =
  | "recommendation_applied"
  | "recommendation_dismissed"
  | "recommendation_feedback"
  | "recommendation_viewed"
  | "insight_viewed"
  | "life_event_viewed"
  | "export_performed"
  | "filter_applied"
  | "sort_applied"
  | "pagination_navigated"
  | "timeline_interacted"
  | "modal_opened"
  | "modal_closed"
  | "tab_switched"
  | "refresh_clicked";

/**
 * Analytics event properties
 */
export interface AnalyticsEventProperties {
  /** Customer ID */
  customer_id?: string;
  /** Recommendation ID (if applicable) */
  recommendation_id?: string | number;
  /** Insight ID (if applicable) */
  insight_id?: string;
  /** Life event ID (if applicable) */
  event_id?: string;
  /** Product name */
  product_name?: string;
  /** Recommendation score */
  recommendation_score?: number;
  /** Feedback type (helpful/not_helpful) */
  feedback_type?: "helpful" | "not_helpful";
  /** Filter type */
  filter_type?: string;
  /** Filter value */
  filter_value?: string;
  /** Sort field */
  sort_field?: string;
  /** Sort order */
  sort_order?: "asc" | "desc";
  /** Page number */
  page?: number;
  /** Page size */
  page_size?: number;
  /** Tab name */
  tab_name?: string;
  /** Modal type */
  modal_type?: "recommendation" | "insight" | "life_event";
  /** Export format */
  export_format?: "csv" | "excel" | "pdf";
  /** Export type */
  export_type?: "recommendations" | "insights" | "life_events" | "combined";
  /** Timeline action */
  timeline_action?: "zoom_in" | "zoom_out" | "filter" | "event_clicked";
  /** Additional custom properties */
  [key: string]: any;
}

/**
 * Analytics configuration
 */
interface AnalyticsConfig {
  /** Whether analytics is enabled */
  enabled: boolean;
  /** Analytics provider (e.g., 'custom', 'google-analytics', 'mixpanel') */
  provider?: string;
  /** API endpoint for custom analytics */
  endpoint?: string;
}

/**
 * Default analytics configuration
 */
const defaultConfig: AnalyticsConfig = {
  enabled: typeof window !== "undefined" && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  provider: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "custom",
  endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || "/api/analytics/track",
};

/**
 * Current analytics configuration
 */
let analyticsConfig: AnalyticsConfig = { ...defaultConfig };

/**
 * Initialize analytics configuration
 */
export function initAnalytics(config?: Partial<AnalyticsConfig>) {
  analyticsConfig = { ...defaultConfig, ...config };
}

/**
 * Track an analytics event
 * 
 * @param eventType - Type of event to track
 * @param properties - Event properties
 */
export function trackEvent(
  eventType: AnalyticsEventType,
  properties?: AnalyticsEventProperties
): void {
  // Don't track if analytics is disabled
  if (!analyticsConfig.enabled) {
    return;
  }

  // Prepare event data
  const eventData = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventType, eventData);
  }

  // Send to analytics endpoint if configured
  if (analyticsConfig.endpoint && typeof window !== "undefined") {
    // Use fetch API to send analytics event
    fetch(analyticsConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
      // Don't wait for response - fire and forget
    }).catch((error) => {
      // Silently fail - analytics should not break the app
      if (process.env.NODE_ENV === "development") {
        console.warn("[Analytics] Failed to send event:", error);
      }
    });
  }

  // Support for Google Analytics (if configured)
  if (analyticsConfig.provider === "google-analytics" && typeof window !== "undefined") {
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag("event", eventType, {
        ...properties,
      });
    }
  }

  // Support for other analytics providers can be added here
}

/**
 * Track recommendation applied event
 */
export function trackRecommendationApplied(
  customerId: string,
  recommendationId: string | number,
  productName?: string,
  score?: number
): void {
  trackEvent("recommendation_applied", {
    customer_id: customerId,
    recommendation_id: recommendationId,
    product_name: productName,
    recommendation_score: score,
  });
}

/**
 * Track recommendation dismissed event
 */
export function trackRecommendationDismissed(
  customerId: string,
  recommendationId: string | number,
  productName?: string
): void {
  trackEvent("recommendation_dismissed", {
    customer_id: customerId,
    recommendation_id: recommendationId,
    product_name: productName,
  });
}

/**
 * Track recommendation feedback event
 */
export function trackRecommendationFeedback(
  customerId: string,
  recommendationId: string | number,
  feedbackType: "helpful" | "not_helpful",
  productName?: string
): void {
  trackEvent("recommendation_feedback", {
    customer_id: customerId,
    recommendation_id: recommendationId,
    feedback_type: feedbackType,
    product_name: productName,
  });
}

/**
 * Track recommendation viewed event
 */
export function trackRecommendationViewed(
  customerId: string,
  recommendationId: string | number,
  productName?: string
): void {
  trackEvent("recommendation_viewed", {
    customer_id: customerId,
    recommendation_id: recommendationId,
    product_name: productName,
  });
}

/**
 * Track export performed event
 */
export function trackExportPerformed(
  exportType: "recommendations" | "insights" | "life_events" | "combined",
  exportFormat: "csv" | "excel" | "pdf",
  customerId?: string,
  itemCount?: number
): void {
  trackEvent("export_performed", {
    export_type: exportType,
    export_format: exportFormat,
    customer_id: customerId,
    item_count: itemCount,
  });
}

/**
 * Track filter applied event
 */
export function trackFilterApplied(
  filterType: string,
  filterValue: string,
  customerId?: string
): void {
  trackEvent("filter_applied", {
    filter_type: filterType,
    filter_value: filterValue,
    customer_id: customerId,
  });
}

/**
 * Track sort applied event
 */
export function trackSortApplied(
  sortField: string,
  sortOrder: "asc" | "desc",
  customerId?: string
): void {
  trackEvent("sort_applied", {
    sort_field: sortField,
    sort_order: sortOrder,
    customer_id: customerId,
  });
}

/**
 * Track pagination navigated event
 */
export function trackPaginationNavigated(
  page: number,
  pageSize: number,
  customerId?: string
): void {
  trackEvent("pagination_navigated", {
    page,
    page_size: pageSize,
    customer_id: customerId,
  });
}

/**
 * Track tab switched event
 */
export function trackTabSwitched(tabName: string, customerId?: string): void {
  trackEvent("tab_switched", {
    tab_name: tabName,
    customer_id: customerId,
  });
}

/**
 * Track modal opened event
 */
export function trackModalOpened(
  modalType: "recommendation" | "insight" | "life_event",
  itemId: string | number,
  customerId?: string
): void {
  trackEvent("modal_opened", {
    modal_type: modalType,
    recommendation_id: modalType === "recommendation" ? itemId : undefined,
    insight_id: modalType === "insight" ? String(itemId) : undefined,
    event_id: modalType === "life_event" ? String(itemId) : undefined,
    customer_id: customerId,
  });
}

/**
 * Track timeline interaction event
 */
export function trackTimelineInteraction(
  action: "zoom_in" | "zoom_out" | "filter" | "event_clicked",
  customerId?: string,
  eventId?: string
): void {
  trackEvent("timeline_interacted", {
    timeline_action: action,
    customer_id: customerId,
    event_id: eventId,
  });
}

/**
 * Detect anomalies in data using Z-score method
 */
export function detectAnomalies(data: number[], threshold: number = 2.5): number[] {
  if (!data || data.length === 0) return [];
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return [];
  
  return data.map((val, index) => {
    const zScore = Math.abs((val - mean) / stdDev);
    return zScore > threshold ? index : -1;
  }).filter(index => index !== -1);
}

/**
 * Calculate trend from time series data
 */
export function calculateTrend(data: { date: string; value: number }[]): { slope: number; direction: "up" | "down" | "stable" } {
  if (!data || data.length < 2) {
    return { slope: 0, direction: "stable" };
  }
  
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, item) => sum + item.value, 0);
  const sumXY = data.reduce((sum, item, i) => sum + i * item.value, 0);
  const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return {
    slope,
    direction: slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable"
  };
}

/**
 * Forecast linear trend
 */
export function forecastLinear(data: { date: string; value: number }[], periods: number = 1): number[] {
  if (!data || data.length < 2) return [];
  
  const trend = calculateTrend(data);
  const lastValue = data[data.length - 1].value;
  
  return Array.from({ length: periods }, (_, i) => lastValue + trend.slope * (i + 1));
}
