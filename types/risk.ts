/**
 * Risk Analytics Types
 */
export interface RiskAlert {
  id: string;
  customer_id: string;
  alert_type: "payment_delay" | "score_degradation" | "behavior_change" | "fraud_indicator" | "compliance_issue";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  risk_score: number;
  created_at: string;
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  metadata?: Record<string, any>;
}

export interface WatchlistCustomer {
  customer_id: string;
  customer_name: string;
  current_risk_score: number;
  risk_category: "low" | "medium" | "high" | "very_high";
  alert_count: number;
  last_alert_at: string;
  watchlist_reason: string;
  added_at: string;
}

export interface MarketRiskAnalysis {
  market_conditions: {
    economic_indicator: "positive" | "neutral" | "negative";
    unemployment_rate: number;
    inflation_rate: number;
    gdp_growth: number;
  };
  portfolio_impact: {
    estimated_default_rate: number;
    risk_adjustment: number;
    recommended_strategy: string;
  };
  risk_trends: Array<{
    date: string;
    risk_level: number;
    default_probability: number;
  }>;
  economic_factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
}

export interface RiskAlertsResponse {
  alerts: RiskAlert[];
  total_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface WatchlistResponse {
  customers: WatchlistCustomer[];
  total_count: number;
}

