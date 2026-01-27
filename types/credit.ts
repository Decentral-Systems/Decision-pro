/**
 * Credit scoring types
 */

export interface CreditScoreRequest {
  customer_id: string;
  loan_amount: number;
  loan_term_months: number;
  monthly_income: number;
  monthly_expenses: number;
  savings_balance: number;
  checking_balance: number;
  total_debt: number;
  credit_history_length: number;
  number_of_credit_accounts: number;
  payment_history_score: number;
  credit_utilization_ratio: number;
  number_of_late_payments: number;
  number_of_defaults: number;
  employment_status: string;
  years_employed: number;
  age: number;
  region?: string;
  urban_rural?: string;
  business_sector?: string;
  phone_number?: string;
  id_number?: string;
  collateral_value?: number;
  guarantor_available?: boolean;
  loan_purpose?: string;
  [key: string]: any; // Allow additional fields
}

export interface ModelPrediction {
  model_name: string;
  score: number;
  probability: number;
  weight: number;
}

export interface CreditScoreResponse {
  success: boolean;
  customer_id: string;
  credit_score: number;
  risk_category: "low" | "medium" | "high" | "very_high";
  approval_recommendation: "approve" | "reject" | "review";
  confidence: number;
  model_predictions: ModelPrediction[];
  ensemble_score: number;
  compliance_check: {
    compliant: boolean;
    violations: Array<{
      rule: string;
      description: string;
    }>;
  };
  explanation?: {
    shap_values?: any;
    lime_explanation?: any;
    top_features: Array<{
      feature: string;
      importance: number;
      impact: "positive" | "negative";
    }>;
  };
  correlation_id?: string;
}

export interface BatchCreditScoreRequest {
  items: CreditScoreRequest[];
}

export interface BatchCreditScoreResult {
  customer_id: string;
  success: boolean;
  credit_score?: number;
  risk_category?: "low" | "medium" | "high" | "very_high";
  approval_recommendation?: "approve" | "reject" | "review";
  error?: string;
}

export interface BatchCreditScoreResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: BatchCreditScoreResult[];
  correlation_id?: string;
}

