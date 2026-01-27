/**
 * Product Intelligence Types
 */
export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  product_type: "PersonalLoan" | "PayBoost" | "BusinessLoan" | "MortgageLoan" | "InvoiceAdvance" | "TrustLoan" | "AutoLoan" | "BNPL" | "SecuredLoan" | "AgricultureLoan" | "StudentLoan" | "GreenLoan" | "RevolvingCredit" | "DeviceFinance" | "Overdraft" | "other";
  customer_id: string;
  recommendation_score: number;
  confidence_level: number;
  recommended_interest_rate: number;
  recommended_loan_amount: number;
  recommended_term_months: number;
  reason: string;
  expected_revenue: number;
  risk_assessment: "low" | "medium" | "high";
  created_at: string;
}

export interface RecommendationStatistics {
  total_recommendations: number;
  accepted_recommendations: number;
  rejected_recommendations: number;
  pending_recommendations: number;
  acceptance_rate: number;
  average_recommendation_score: number;
  top_recommended_products: Array<{
    product_type: string;
    count: number;
    acceptance_rate: number;
    average_revenue: number;
  }>;
  revenue_generated: number;
  trends: Array<{
    date: string;
    recommendations: number;
    acceptances: number;
    revenue: number;
  }>;
}

export interface ProductRecommendationsResponse {
  recommendations: ProductRecommendation[];
  statistics: RecommendationStatistics;
  total_count: number;
}

