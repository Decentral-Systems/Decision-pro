/**
 * Integration Tests for Dashboard Data Aggregation
 * Tests the data aggregation utility with real backend data
 */

import { aggregateDashboardData } from '@/lib/utils/dashboardDataAggregator';
import { DashboardData } from '@/types/dashboard';

describe('Dashboard Data Aggregation Integration', () => {
  it('should aggregate data with priority: realtime > primary > fallback', () => {
    const sources = {
      primary: {
        revenue: { label: 'Revenue', value: 1000, format: 'currency' as const },
        customers: { label: 'Customers', value: 100, format: 'number' as const },
      },
      realtime: {
        revenue: { label: 'Revenue', value: 1200, format: 'currency' as const },
      },
      customerStats: {
        total_revenue: 1500,
        total_customers: 150,
        average_credit_score: 720,
        customer_growth_rate: 0.1,
      },
      recommendationStats: {
        acceptance_rate: 0.85,
        total_recommendations: 1000,
      },
    };

    const result = aggregateDashboardData(sources);

    // Real-time revenue should take priority
    expect(result.revenue?.value).toBe(1200);
    
    // Primary customers should be used (no real-time override)
    expect(result.customers?.value).toBe(100);
    
    // Risk score should use fallback from customerStats
    expect(result.risk_score?.value).toBe(720);
    
    // Approval rate should use fallback from recommendationStats
    expect(result.approval_rate?.value).toBe(85); // 0.85 * 100
  });

  it('should use fallback data when primary is missing', () => {
    const sources = {
      primary: null,
      realtime: null,
      customerStats: {
        total_revenue: 2000,
        total_customers: 200,
        average_credit_score: 750,
        customer_growth_rate: 0.15,
      },
      recommendationStats: {
        acceptance_rate: 0.9,
        total_recommendations: 2000,
      },
    };

    const result = aggregateDashboardData(sources);

    // Should use fallback data
    expect(result.revenue?.value).toBe(2000);
    expect(result.customers?.value).toBe(200);
    expect(result.risk_score?.value).toBe(750);
    expect(result.approval_rate?.value).toBe(90);
  });

  it('should handle missing optional fields gracefully', () => {
    const sources = {
      primary: {
        revenue: { label: 'Revenue', value: 1000, format: 'currency' as const },
      },
      realtime: null,
      customerStats: null,
      recommendationStats: null,
    };

    const result = aggregateDashboardData(sources);

    // Required fields should exist
    expect(result).toHaveProperty('revenue');
    expect(result.revenue?.value).toBe(1000);
    
    // Optional fields can be undefined
    expect(result.customers).toBeUndefined();
    expect(result.risk_score).toBeUndefined();
  });

  it('should transform customer growth rate correctly', () => {
    const sources = {
      primary: null,
      realtime: null,
      customerStats: {
        total_revenue: 1000,
        total_customers: 100,
        customer_growth_rate: 0.1, // 10% growth
      },
      recommendationStats: null,
    };

    const result = aggregateDashboardData(sources);

    expect(result.revenue?.change).toBe(0.1);
    expect(result.revenue?.changeType).toBe('increase');
    expect(result.customers?.change).toBe(0.1);
    expect(result.customers?.changeType).toBe('increase');
  });

  it('should handle negative growth rates', () => {
    const sources = {
      primary: null,
      realtime: null,
      customerStats: {
        total_revenue: 1000,
        total_customers: 100,
        customer_growth_rate: -0.05, // -5% growth (decline)
      },
      recommendationStats: null,
    };

    const result = aggregateDashboardData(sources);

    expect(result.revenue?.change).toBe(-0.05);
    expect(result.revenue?.changeType).toBe('decrease');
    expect(result.customers?.changeType).toBe('decrease');
  });

  it('should handle empty data sources', () => {
    const sources = {
      primary: null,
      realtime: null,
      customerStats: null,
      recommendationStats: null,
    };

    const result = aggregateDashboardData(sources);

    // Should return empty but valid structure
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should prioritize real-time updates over primary data', () => {
    const sources = {
      primary: {
        revenue: { label: 'Revenue', value: 1000, format: 'currency' as const },
        customers: { label: 'Customers', value: 100, format: 'number' as const },
        risk_score: { label: 'Risk', value: 700, format: 'number' as const },
      },
      realtime: {
        revenue: { label: 'Revenue', value: 1500, format: 'currency' as const },
        risk_score: { label: 'Risk', value: 750, format: 'number' as const },
      },
      customerStats: null,
      recommendationStats: null,
    };

    const result = aggregateDashboardData(sources);

    // Real-time values should override primary
    expect(result.revenue?.value).toBe(1500);
    expect(result.risk_score?.value).toBe(750);
    
    // Customers should use primary (no real-time override)
    expect(result.customers?.value).toBe(100);
  });
});






