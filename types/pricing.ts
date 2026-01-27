/**
 * Dynamic Pricing types
 */

export interface PricingRequest {
  customer_id: string;
  product_type: string;
  loan_amount: number;
  loan_term_months: number;
  credit_score?: number;
  risk_category?: "low" | "medium" | "high" | "very_high";
}

export interface PricingBreakdown {
  base_rate: number;
  risk_adjustment: number;
  product_adjustment: number;
  term_adjustment: number;
  final_rate: number;
}

export interface PricingResponse {
  success: boolean;
  customer_id: string;
  product_type: string;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  apr: number; // Annual Percentage Rate
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  pricing_breakdown: PricingBreakdown;
  compliance_check: {
    compliant: boolean;
    max_rate: number;
    min_rate: number;
  };
  alternatives?: Array<{
    term_months: number;
    interest_rate: number;
    monthly_payment: number;
  }>;
  correlation_id?: string;
}


