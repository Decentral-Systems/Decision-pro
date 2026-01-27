/**
 * Dashboard data types
 */

export interface KPIMetric {
  label: string;
  value: number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  format?: "currency" | "number" | "percentage";
  trend?: number[]; // Historical values for trend chart
}

export interface DashboardData {
  revenue?: KPIMetric;
  loans?: KPIMetric;
  customers?: KPIMetric;
  risk_score?: KPIMetric;
  npl_ratio?: KPIMetric;
  approval_rate?: KPIMetric;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  avg_score: number;
}

export interface PortfolioHealth {
  overall_score?: number;
  health_score?: number;
  concentration_risk?: number;
  diversification_index?: number;
  approval_rate?: number;
  default_rate?: number;
  average_loan_size?: number;
  active_loans?: number;
  components?: {
    credit_quality?: number;
    diversification?: number;
    liquidity?: number;
    profitability?: number;
  };
}

export interface MLPerformance {
  model_accuracy: number;
  auc_roc: number;
  precision: number;
  recall: number;
  f1_score: number;
  last_trained: string;
}

// Executive Dashboard Types

export interface BankingKPIs {
  total_assets: number;
  total_deposits: number;
  total_loans: number;
  net_income: number;
  assets_growth?: number;
  deposits_growth?: number;
  loans_growth?: number;
  income_growth?: number;
}

export interface BankingRatios {
  nim?: number; // Net Interest Margin
  roe?: number; // Return on Equity
  roa?: number; // Return on Assets
  npl?: number; // Non-Performing Loans Ratio
  car?: number; // Capital Adequacy Ratio
  cir?: number; // Cost-to-Income Ratio
  ldr?: number; // Loan-to-Deposit Ratio
}

export interface RevenueMetrics {
  total_revenue: number;
  interest_income?: number;
  non_interest_income?: number;
  growth_rate?: number;
  breakdown?: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface OperationalEfficiency {
  processing_time?: number; // milliseconds
  automation_rate?: number; // percentage
  throughput?: number; // requests per minute
  error_rate?: number; // percentage
  historical_data?: Array<{
    date: string;
    processing_time: number;
    automation_rate: number;
    throughput: number;
    error_rate: number;
  }>;
}

export interface SystemHealth {
  cpu_usage?: number; // percentage
  memory_usage?: number; // percentage
  disk_usage?: number; // percentage
  network_usage?: number; // percentage
  service_status?: Record<string, {
    status: "healthy" | "degraded" | "down";
    response_time?: number;
    uptime?: number;
  }>;
}

export interface ComplianceMetrics {
  compliance_rate?: number; // percentage
  violations_count?: number;
  violations_trend?: Array<{
    date: string;
    count: number;
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  }>;
  compliance_score?: number; // 0-100
}

export interface MLPerformanceMetrics {
  ensemble_model?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
  };
  individual_models?: Record<string, {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
  }>;
  prediction_metrics?: {
    average_latency: number; // milliseconds
    p95_latency: number; // milliseconds
    throughput: number; // requests per minute
    error_rate: number; // percentage
  };
  feature_importance?: Record<string, number>;
}

export interface ExecutiveDashboardData {
  banking_kpis: BankingKPIs;
  banking_ratios: BankingRatios;
  revenue_metrics: RevenueMetrics;
  portfolio_health: PortfolioHealth;
  operational_efficiency: OperationalEfficiency;
  system_health: SystemHealth;
  compliance_metrics: ComplianceMetrics;
  ml_performance: MLPerformanceMetrics;
  timestamp?: string;
}

