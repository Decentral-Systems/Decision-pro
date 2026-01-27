/**
 * Customer Intelligence Types
 */
export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers_today: number;
  new_customers_this_month: number;
  total_revenue: number;
  average_credit_score: number;
  average_loan_amount: number;
  customer_growth_rate: number;
  segments: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
    very_high_risk: number;
  };
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  credit_score: number;
  risk_category: "low" | "medium" | "high" | "very_high";
  total_loans: number;
  total_revenue: number;
  average_loan_amount: number;
  last_activity: string;
  status: "active" | "inactive";
}

export interface CustomerJourneyStage {
  stage: "onboarding" | "assessment" | "recommendation" | "application" | "active" | "maintenance";
  customer_count: number;
  percentage: number;
  average_duration_days: number;
  conversion_rate: number;
}

export interface CustomerJourneyInsights {
  stages: CustomerJourneyStage[];
  total_customers: number;
  conversion_funnel: Array<{
    from_stage: string;
    to_stage: string;
    conversion_rate: number;
    customer_count: number;
  }>;
  bottlenecks: Array<{
    stage: string;
    issue: string;
    impact: "low" | "medium" | "high";
    recommendation: string;
  }>;
}

export interface LifeEvent {
  event_id: string;
  customer_id: string;
  event_type: "job_change" | "income_change" | "address_change" | "marriage" | "divorce" | "health_issue" | "other";
  event_date: string;
  impact_on_credit: "positive" | "negative" | "neutral";
  description: string;
  metadata?: Record<string, any>;
}

export interface LifeEventsResponse {
  events: LifeEvent[];
  total_count: number;
  recent_events: LifeEvent[];
  impact_summary: {
    positive_events: number;
    negative_events: number;
    neutral_events: number;
  };
}

