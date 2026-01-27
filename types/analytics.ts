/**
 * Analytics types
 */

export interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  format?: "currency" | "number" | "percentage";
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface SegmentData {
  segment: string;
  count: number;
  percentage: number;
  value?: number;
}

export interface RiskDistribution {
  category: "low" | "medium" | "high" | "very_high";
  count: number;
  percentage: number;
  total_exposure: number;
}

export interface ApprovalRateData {
  period: string;
  approval_rate: number;
  rejection_rate: number;
  pending_rate?: number;
}

export interface PortfolioMetrics {
  total_loans: number;
  total_exposure: number;
  average_loan_size: number;
  average_credit_score: number;
  npl_ratio: number;
  default_rate: number;
}

export interface AnalyticsData {
  portfolio_metrics: PortfolioMetrics;
  risk_distribution: RiskDistribution[];
  approval_rates: ApprovalRateData[];
  revenue_trend: TimeSeriesData[];
  customer_segments: SegmentData[];
  top_performers?: {
    region: string;
    performance_score: number;
  }[];
}


