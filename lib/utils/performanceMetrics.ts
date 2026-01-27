/**
 * Performance Metrics Collection Utility
 * Tracks page load time, API response times, and component render times
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: "page_load" | "api_call" | "component_render" | "custom";
  metadata?: Record<string, any>;
}

interface PerformanceBudget {
  name: string;
  threshold: number;
  unit: "ms" | "bytes" | "count";
}

const metrics: PerformanceMetric[] = [];
const budgets: PerformanceBudget[] = [
  { name: "page_load_time", threshold: 3000, unit: "ms" },
  { name: "api_response_time", threshold: 500, unit: "ms" },
  { name: "time_to_interactive", threshold: 5000, unit: "ms" },
];

/**
 * Track page load time
 */
export function trackPageLoad(): void {
  if (typeof window === 'undefined') return;
  
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    const timeToInteractive = timing.domInteractive - timing.navigationStart;
    
    recordMetric({
      name: "page_load_time",
      value: loadTime,
      type: "page_load",
      metadata: {
        domContentLoaded,
        timeToInteractive,
        navigationStart: timing.navigationStart,
      },
    });
    
    // Check against budget
    checkBudget("page_load_time", loadTime);
    checkBudget("time_to_interactive", timeToInteractive);
  }
  
  // Use PerformanceObserver for modern browsers
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
            recordMetric({
              name: "page_load_time",
              value: loadTime,
              type: "page_load",
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                timeToInteractive: navEntry.domInteractive - navEntry.fetchStart,
              },
            });
            checkBudget("page_load_time", loadTime);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

/**
 * Track API call performance
 */
export function trackAPICall(
  endpoint: string,
  duration: number,
  statusCode?: number,
  error?: any
): void {
  recordMetric({
    name: `api_call_${endpoint}`,
    value: duration,
    type: "api_call",
    metadata: {
      endpoint,
      statusCode,
      error: error ? error.message : undefined,
    },
  });
  
  // Check against budget
  checkBudget("api_response_time", duration);
  
  // Log slow API calls
  if (duration > 500 && process.env.NODE_ENV === 'development') {
    console.warn(`[Performance] Slow API call: ${endpoint} took ${duration}ms`);
  }
}

/**
 * Track component render time
 */
export function trackComponentRender(componentName: string, renderTime: number): void {
  recordMetric({
    name: `component_render_${componentName}`,
    value: renderTime,
    type: "component_render",
    metadata: {
      componentName,
    },
  });
}

/**
 * Record a custom metric
 */
export function recordMetric(metric: PerformanceMetric): void {
  metrics.push({
    ...metric,
    timestamp: Date.now(),
  });
  
  // Keep only last 1000 metrics to prevent memory issues
  if (metrics.length > 1000) {
    metrics.shift();
  }
  
  // In development, log metrics
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: ${metric.value}ms`, metric.metadata);
  }
}

/**
 * Check metric against budget
 */
function checkBudget(metricName: string, value: number): void {
  const budget = budgets.find(b => b.name === metricName);
  if (budget && value > budget.threshold) {
    console.warn(
      `[Performance Budget] ${metricName} exceeded: ${value}${budget.unit} > ${budget.threshold}${budget.unit}`
    );
    
    // Send alert if configured
    if (typeof window !== 'undefined' && (window as any).performanceAlert) {
      (window as any).performanceAlert({
        metric: metricName,
        value,
        threshold: budget.threshold,
        unit: budget.unit,
      });
    }
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceSummary(): {
  pageLoadTime?: number;
  averageAPITime?: number;
  slowestAPI?: { endpoint: string; time: number };
  componentRenderTimes: Array<{ component: string; time: number }>;
  metricsCount: number;
} {
  const pageLoadMetrics = metrics.filter(m => m.name === "page_load_time");
  const apiMetrics = metrics.filter(m => m.type === "api_call");
  const componentMetrics = metrics.filter(m => m.type === "component_render");
  
  const pageLoadTime = pageLoadMetrics.length > 0
    ? pageLoadMetrics[pageLoadMetrics.length - 1].value
    : undefined;
  
  const averageAPITime = apiMetrics.length > 0
    ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
    : undefined;
  
  const slowestAPI = apiMetrics.length > 0
    ? apiMetrics.reduce((slowest, m) => 
        m.value > slowest.time 
          ? { endpoint: m.metadata?.endpoint || "unknown", time: m.value }
          : slowest,
        { endpoint: "unknown", time: 0 }
      )
    : undefined;
  
  const componentRenderTimes = componentMetrics.map(m => ({
    component: m.metadata?.componentName || "unknown",
    time: m.value,
  }));
  
  return {
    pageLoadTime,
    averageAPITime,
    slowestAPI,
    componentRenderTimes,
    metricsCount: metrics.length,
  };
}

/**
 * Get metrics for a specific time range
 */
export function getMetricsInRange(startTime: number, endTime: number): PerformanceMetric[] {
  return metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Set performance budget
 */
export function setPerformanceBudget(budget: PerformanceBudget): void {
  const index = budgets.findIndex(b => b.name === budget.name);
  if (index >= 0) {
    budgets[index] = budget;
  } else {
    budgets.push(budget);
  }
}

/**
 * Initialize performance tracking
 */
export function initializePerformanceTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Track page load when DOM is ready
  if (document.readyState === 'complete') {
    trackPageLoad();
  } else {
    window.addEventListener('load', trackPageLoad);
  }
  
  // Track Web Vitals if available
  if (typeof window !== 'undefined' && (window as any).webVitals) {
    try {
      const { onCLS, onFID, onLCP, onFCP, onTTFB } = (window as any).webVitals;
      
      onCLS((metric: any) => {
        recordMetric({
          name: "cumulative_layout_shift",
          value: metric.value,
          type: "custom",
          metadata: { metric: "CLS" },
        });
      });
      
      onFID((metric: any) => {
        recordMetric({
          name: "first_input_delay",
          value: metric.value,
          type: "custom",
          metadata: { metric: "FID" },
        });
      });
      
      onLCP((metric: any) => {
        recordMetric({
          name: "largest_contentful_paint",
          value: metric.value,
          type: "custom",
          metadata: { metric: "LCP" },
        });
      });
      
      onFCP((metric: any) => {
        recordMetric({
          name: "first_contentful_paint",
          value: metric.value,
          type: "custom",
          metadata: { metric: "FCP" },
        });
      });
      
      onTTFB((metric: any) => {
        recordMetric({
          name: "time_to_first_byte",
          value: metric.value,
          type: "custom",
          metadata: { metric: "TTFB" },
        });
      });
    } catch (e) {
      // Web Vitals not available
    }
  }
}

