/**
 * Rules Engine Client Service
 * Handles all Rules Engine API calls for loan terms calculation, eligibility, and product recommendations
 */

import { apiGatewayClient } from "@/lib/api/clients/api-gateway";
import {
  APIServiceError,
  APITimeoutError,
  APINetworkError,
} from "@/types/api";

export interface LoanTermsRequest {
  customer_id: string;
  product_type: string;
  application_data: {
    loan_amount?: number;
    monthly_income?: number;
    loan_term_months?: number;
    credit_score?: number;
    risk_category?: string;
    [key: string]: any;
  };
  evaluation_scope?: "all" | "eligibility" | "scoring" | "pricing" | "approval";
}

export interface LoanTermsResponse {
  eligible: boolean;
  eligibility_reasons?: string[];
  max_loan_amount?: number;
  recommended_amount?: number;
  interest_rate?: number;
  processing_fee?: number;
  approval_level?: number;
  required_approvals?: number;
  product_recommendations?: ProductRecommendation[];
  fallback_used?: boolean;
}

export interface ProductRecommendation {
  product_type: string;
  product_name: string;
  recommended_amount: number;
  interest_rate: number;
  loan_term_months: number;
  eligibility_score: number;
  reasons: string[];
  terms_and_conditions?: string[];
}

export interface EligibilityRequest {
  customer_id: string;
  product_type: string;
  application_data?: Record<string, any>;
}

export interface EligibilityResponse {
  eligible: boolean;
  eligibility_reasons: string[];
  missing_requirements?: string[];
  alternative_products?: string[];
}

export interface WorkflowEvaluationRequest {
  application_data: Record<string, any>;
  product_type?: string;
  customer_segment?: string;
}

export interface WorkflowEvaluationResponse {
  decision: "approve" | "reject" | "review";
  decision_reason: string;
  approval_level?: number;
  required_approvals?: number;
  flags?: string[];
}

class RulesEngineService {
  /**
   * Calculate comprehensive loan terms using Rules Engine
   */
  async calculateLoanTerms(
    request: LoanTermsRequest
  ): Promise<LoanTermsResponse> {
    try {
      const response = await apiGatewayClient.client.post<any>(
        "/api/v1/product-rules/rules/evaluate",
        {
          product_type: request.product_type,
          application_data: request.application_data,
          evaluation_scope: request.evaluation_scope || "all",
        }
      );

      // Transform response to match our interface
      const result: LoanTermsResponse = {
        eligible: response.data?.evaluated_rules?.some(
          (r: any) => r.matched
        ) ?? true,
        eligibility_reasons: response.data?.evaluated_rules
          ?.filter((r: any) => r.matched_conditions)
          .flatMap((r: any) => r.matched_conditions) || [],
        max_loan_amount: response.data?.final_result?.limits?.max_amount,
        recommended_amount: response.data?.final_result?.limits?.recommended_amount,
        interest_rate: response.data?.final_result?.pricing?.interest_rate,
        processing_fee: response.data?.final_result?.pricing?.processing_fee,
        approval_level: response.data?.final_result?.decision?.approval_level,
        required_approvals: response.data?.final_result?.decision?.required_approvals,
        fallback_used: false,
      };

      return result;
    } catch (error: any) {
      // Fallback to default terms if Rules Engine fails
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        console.warn("Rules Engine failed, using fallback:", error.message);
        return this.getFallbackTerms(request);
      }
      throw error;
    }
  }

  /**
   * Evaluate customer eligibility for a product
   */
  async evaluateEligibility(
    request: EligibilityRequest
  ): Promise<EligibilityResponse> {
    try {
      const response = await apiGatewayClient.client.get<any>(
        `/api/v1/products/${request.product_type}/eligibility`,
        {
          params: {
            customer_id: request.customer_id,
            ...request.application_data,
          },
        }
      );

      return {
        eligible: response.data?.eligible ?? false,
        eligibility_reasons: response.data?.reasons || [],
        missing_requirements: response.data?.missing_requirements || [],
        alternative_products: response.data?.alternative_products || [],
      };
    } catch (error: any) {
      console.warn("Eligibility evaluation failed:", error.message);
      return {
        eligible: true, // Default to eligible if check fails
        eligibility_reasons: [],
      };
    }
  }

  /**
   * Evaluate workflow automation rules
   */
  async evaluateWorkflow(
    request: WorkflowEvaluationRequest
  ): Promise<WorkflowEvaluationResponse> {
    try {
      const response = await apiGatewayClient.client.post<any>(
        "/api/v1/workflow/evaluate",
        {
          application_data: request.application_data,
          product_type: request.product_type,
          customer_segment: request.customer_segment,
        }
      );

      return {
        decision: response.data?.decision || "review",
        decision_reason: response.data?.decision_reason || "Manual review required",
        approval_level: response.data?.approval_level,
        required_approvals: response.data?.required_approvals,
        flags: response.data?.flags || [],
      };
    } catch (error: any) {
      console.warn("Workflow evaluation failed:", error.message);
      return {
        decision: "review",
        decision_reason: "Workflow evaluation unavailable - manual review required",
      };
    }
  }

  /**
   * Get product recommendations for a customer
   */
  async getProductRecommendations(
    customerId: string,
    applicationData?: Record<string, any>
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await apiGatewayClient.client.get<any>(
        `/api/intelligence/products/recommendations`,
        {
          params: {
            customer_id: customerId,
            ...applicationData,
          },
        }
      );

      return response.data?.recommendations || [];
    } catch (error: any) {
      console.warn("Product recommendations failed:", error.message);
      return [];
    }
  }

  /**
   * Fallback terms when Rules Engine is unavailable
   */
  private getFallbackTerms(
    request: LoanTermsRequest
  ): LoanTermsResponse {
    const { application_data } = request;
    const monthlyIncome = application_data.monthly_income || 0;
    const creditScore = application_data.credit_score || 650;

    // Calculate basic terms based on NBE rules
    const maxAffordable = monthlyIncome * 12 * 5; // 5 years max
    const recommendedAmount = Math.min(
      application_data.loan_amount || maxAffordable * 0.8,
      maxAffordable
    );

    // Risk-based interest rate (12-25% range)
    const baseRate = 0.12;
    const riskAdjustment = (1000 - creditScore) / 1000 * 0.13;
    const interestRate = Math.min(
      Math.max(baseRate + riskAdjustment, 0.12),
      0.25
    );

    return {
      eligible: true,
      eligibility_reasons: ["Fallback calculation used - Rules Engine unavailable"],
      max_loan_amount: maxAffordable,
      recommended_amount: recommendedAmount,
      interest_rate: interestRate,
      processing_fee: recommendedAmount * 0.01, // 1% processing fee
      approval_level: creditScore >= 750 ? 1 : creditScore >= 650 ? 2 : 3,
      required_approvals: creditScore >= 750 ? 1 : 2,
      fallback_used: true,
    };
  }
}

export const rulesEngineService = new RulesEngineService();
