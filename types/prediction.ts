/**
 * Default Prediction types
 */

export interface DefaultPredictionRequest {
  customer_id: string;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  monthly_income: number;
  existing_debt?: number;
  employment_status: string;
  years_employed?: number;
  credit_score?: number;
  [key: string]: any;
}

export interface SurvivalAnalysisResult {
  time_period: number; // months
  survival_probability: number; // 0-1
  hazard_rate: number;
  cumulative_default_probability: number;
}

export interface DefaultPredictionResponse {
  success: boolean;
  customer_id: string;
  default_probability: number; // Overall default probability (0-1)
  risk_category: "low" | "medium" | "high" | "very_high";
  survival_analysis: SurvivalAnalysisResult[];
  expected_default_time?: number; // months
  confidence_interval: {
    lower: number;
    upper: number;
  };
  key_factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  correlation_id?: string;
}


