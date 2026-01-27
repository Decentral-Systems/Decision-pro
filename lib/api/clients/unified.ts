/**
 * Unified API Client
 * Wrapper that routes requests to appropriate service
 */
import { apiGatewayClient } from "./api-gateway";
import { creditScoringClient } from "./credit-scoring";
import { CreditScoreRequest, CreditScoreResponse } from "@/types/credit";

class UnifiedAPIClient {
  private apiGateway = apiGatewayClient;
  private creditScoring = creditScoringClient;

  setAccessToken(token: string | null) {
    this.apiGateway.setAccessToken(token);
    this.creditScoring.setAccessToken(token);
  }

  // Auth methods (API Gateway)
  async login(username: string, password: string) {
    return this.apiGateway.login(username, password);
  }

  // Credit Scoring methods (Credit Scoring Service)
  async submitCreditScore(data: CreditScoreRequest): Promise<CreditScoreResponse> {
    return this.creditScoring.submitCreditScore(data);
  }

  async getCustomer360(customerId: string) {
    return this.creditScoring.getCustomer360(customerId);
  }

  async getRealtimeScoring(customerId: string) {
    return this.creditScoring.getRealtimeScoring(customerId);
  }

  async calculateDynamicPricing(data: {
    customer_id: string;
    product_type: string;
    loan_amount: number;
    loan_term_months: number;
  }) {
    return this.creditScoring.calculateDynamicPricing(data);
  }

  // Admin methods (API Gateway)
  async getUsers(params?: { limit?: number; offset?: number }) {
    return this.apiGateway.get("/api/v1/admin/users", params);
  }

  async getAuditLogs(params?: { limit?: number; offset?: number; page?: number; page_size?: number }) {
    // Use v1 endpoint with pagination support
    const v1Params = params?.page && params?.page_size 
      ? { page: params.page, page_size: params.page_size }
      : params;
    return this.apiGateway.get("/api/v1/audit/logs", v1Params);
  }

  // Generic methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // Try API Gateway first
    try {
      return await this.apiGateway.get<T>(endpoint, params);
    } catch {
      // If fails, could be credit scoring endpoint - but we should know which service
      throw new Error(`Unable to route request to ${endpoint}`);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      return await this.apiGateway.post<T>(endpoint, data);
    } catch {
      throw new Error(`Unable to route request to ${endpoint}`);
    }
  }
}

// Singleton instance
export const unifiedAPIClient = new UnifiedAPIClient();








