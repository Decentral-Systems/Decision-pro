/**
 * Dashboard Data Aggregator Utility
 * Aggregates data from multiple sources with priority: realtime > primary > fallback
 */

import { DashboardData, KPIMetric } from '@/types/dashboard';

interface AggregationSources {
  primary?: Partial<DashboardData> | null;
  realtime?: Partial<DashboardData> | null;
  customerStats?: {
    total_revenue?: number;
    total_customers?: number;
    average_credit_score?: number;
    customer_growth_rate?: number;
  } | null;
  recommendationStats?: {
    acceptance_rate?: number;
    total_recommendations?: number;
  } | null;
}

/**
 * Aggregates dashboard data from multiple sources with priority:
 * 1. Real-time data (highest priority)
 * 2. Primary data
 * 3. Fallback data from customerStats and recommendationStats
 */
export function aggregateDashboardData(sources: AggregationSources): DashboardData {
  const { primary, realtime, customerStats, recommendationStats } = sources;

  // Helper to get value with priority: realtime > primary > fallback
  const getMetric = (
    key: keyof DashboardData,
    fallbackValue?: number,
    fallbackLabel?: string,
    fallbackFormat?: KPIMetric['format']
  ): KPIMetric | undefined => {
    // Priority 1: Real-time data
    if (realtime?.[key]) {
      return realtime[key] as KPIMetric;
    }
    
    // Priority 2: Primary data
    if (primary?.[key]) {
      return primary[key] as KPIMetric;
    }
    
    // Priority 3: Fallback data
    if (fallbackValue !== undefined) {
      const change = customerStats?.customer_growth_rate || 0;
      return {
        label: fallbackLabel || key.toString(),
        value: fallbackValue,
        change: change, // Preserve sign for negative growth rates
        changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
        format: fallbackFormat || 'number',
      };
    }
    
    return undefined;
  };

  // Build aggregated dashboard data
  const result: DashboardData = {
    // Revenue: realtime > primary > customerStats.total_revenue
    revenue: getMetric(
      'revenue',
      customerStats?.total_revenue,
      'Total Revenue',
      'currency'
    ),
    
    // Customers: realtime > primary > customerStats.total_customers
    customers: getMetric(
      'customers',
      customerStats?.total_customers,
      'Total Customers',
      'number'
    ),
    
    // Risk Score: realtime > primary > customerStats.average_credit_score
    risk_score: getMetric(
      'risk_score',
      customerStats?.average_credit_score ? Math.round(customerStats.average_credit_score) : undefined,
      'Average Credit Score',
      'number'
    ),
    
    // Loans: realtime > primary (no fallback)
    loans: realtime?.loans || primary?.loans,
    
    // NPL Ratio: realtime > primary (no fallback)
    npl_ratio: realtime?.npl_ratio || primary?.npl_ratio,
    
    // Approval Rate: realtime > primary > recommendationStats.acceptance_rate
    approval_rate: getMetric(
      'approval_rate',
      recommendationStats?.acceptance_rate ? recommendationStats.acceptance_rate * 100 : undefined,
      'Approval Rate',
      'percentage'
    ),
  };

  return result;
}
