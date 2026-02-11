import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { APIServiceError, APITimeoutError, APINetworkError } from "@/types/api";
import {
  CreditScoreRequest,
  CreditScoreResponse,
  BatchCreditScoreRequest,
  BatchCreditScoreResponse,
} from "@/types/credit";

// Use API Gateway URL (port 4000) instead of direct Credit Scoring Service (port 4001)
const CREDIT_SCORING_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://196.188.249.48:4000";

class CreditScoringClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: CREDIT_SCORING_URL,
      timeout: 30000, // 30 seconds for ML predictions
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
          console.log(`[Credit Scoring] Token added to request: ${config.url}`);
        } else {
          console.warn(
            `[Credit Scoring] No token available for request: ${config.url}`
          );
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            console.log(
              "[Credit Scoring] 401 error detected, attempting token refresh"
            );

            // Wait for potential token refresh
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Get the latest token from the client
            if (this.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
              console.log(
                "[Credit Scoring] Retrying request with refreshed token"
              );
              return this.client(originalRequest);
            }

            throw new APIServiceError(
              401,
              "Authentication required - please login again"
            );
          } catch (refreshError: any) {
            console.error(
              "[Credit Scoring] Token refresh/retry failed:",
              refreshError
            );
            if (refreshError instanceof APIServiceError) {
              throw refreshError;
            }
            throw new APIServiceError(
              401,
              "Session expired - please login again"
            );
          }
        }

        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          throw new APITimeoutError("Request timeout");
        }

        if (error.code === "ERR_NETWORK" || !error.response) {
          throw new APINetworkError(
            "Network error - cannot reach Credit Scoring Service"
          );
        }

        const status = error.response?.status || 500;
        const message =
          (error.response?.data as any)?.detail ||
          error.message ||
          "API request failed";

        throw new APIServiceError(status, message);
      }
    );
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  async submitCreditScore(
    data: CreditScoreRequest
  ): Promise<CreditScoreResponse> {
    try {
      // Use the API Gateway endpoint which proxies to Credit Scoring Service
      // This endpoint expects Complete164FeatureRequest format (168 features)
      const response = (await this.client.post<any>(
        "/api/intelligence/credit-scoring/realtime",
        data
      )) as any;

      // API Gateway wraps the response
      const responseData = response.data?.data || response.data || response;

      // Transform API Gateway response to CreditScoreResponse format
      if (responseData) {
        return {
          success: true,
          customer_id: responseData.customer_id || data.customer_id,
          credit_score:
            responseData.credit_score || responseData.ensemble_score || 0,
          risk_category: (responseData.risk_level ||
            responseData.risk_category ||
            "medium") as "low" | "medium" | "high" | "very_high",
          approval_recommendation: (responseData.approval_recommendation ||
            (responseData.credit_score >= 700
              ? "approve"
              : responseData.credit_score >= 600
                ? "review"
                : "reject")) as "approve" | "reject" | "review",
          confidence:
            responseData.confidence_score || responseData.confidence || 0.8,
          ensemble_score:
            responseData.ensemble_score || responseData.credit_score || 0,
          model_predictions: responseData.ensemble_details
            ?.individual_predictions
            ? Object.entries(
                responseData.ensemble_details.individual_predictions
              ).map(([name, score]: [string, any]) => ({
                model_name: name,
                score: typeof score === "number" ? score : 0,
                probability: typeof score === "number" ? score / 1000 : 0,
                weight:
                  name === "xgboost" ? 0.6 : name === "lightgbm" ? 0.4 : 0.1,
              }))
            : [],
          compliance_check: {
            compliant:
              responseData.nbe_compliance_status?.overall_compliant ?? true,
            violations: responseData.nbe_compliance_status?.violations || [],
          },
          explanation: responseData.explainability
            ? {
                shap_values: responseData.explainability.shap_analysis,
                lime_explanation: responseData.explainability.lime_explanation,
                top_features:
                  responseData.explainability.feature_importance?.slice(
                    0,
                    10
                  ) || [],
              }
            : undefined,
          correlation_id:
            responseData.correlation_id || responseData.request_id,
        };
      }

      throw new APIServiceError(
        response?.status || 500,
        (response.data as any)?.error || "Credit scoring failed"
      );
    } catch (error) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Credit scoring request failed");
    }
  }

  async getCustomer360(customerId: string): Promise<any> {
    try {
      console.log(`Fetching customer 360 data for: ${customerId}`);

      // Try API Gateway unified customer endpoint with all sections
      const allSections =
        "profile,credit,risk,loans,payments,engagement,journey,intelligence";

      let response;
      let lastError: any;

      // Try primary endpoint: /api/customers/{customerId}
      try {
        response = await this.client.get(`/api/customers/${customerId}`, {
          params: {
            include: allSections,
            format: "detailed",
          },
        });
        console.log("Customer 360 response (primary endpoint):", response.data);
      } catch (err: any) {
        lastError = err;
        console.log(
          "Primary endpoint failed, trying alternative...",
          err.response?.status
        );

        // Try alternative endpoint: /api/intelligence/customer360/{customerId}
        if (
          err.response?.status === 404 ||
          err.response?.status === 400 ||
          err.response?.status === 502
        ) {
          try {
            response = await this.client.get(
              `/api/intelligence/customer360/${customerId}`,
              {
                params: {
                  include: allSections,
                  format: "detailed",
                },
              }
            );
            console.log(
              "Customer 360 response (alternative endpoint):",
              response.data
            );
          } catch (err2: any) {
            lastError = err2;
            console.error(
              "All endpoints failed:",
              err2.response?.status || err2.message
            );
            throw err2;
          }
        } else {
          throw err;
        }
      }

      // Handle different response structures
      if (response && response.data) {
        // Check for error response
        if (response.data.success === false) {
          const errorMsg =
            (response.data as any)?.error ||
            response.data.message ||
            (response.data as any)?.detail ||
            "Failed to fetch customer 360";
          throw new APIServiceError(
            response.status || 500,
            errorMsg,
            (response.data as any)?.correlation_id
          );
        }

        // Return data - handle nested structure
        const data = response.data.data || response.data;

        // Ensure customer_id is present
        if (!data.customer_id && customerId) {
          data.customer_id = customerId;
        }

        console.log("Returning customer data:", data);
        return data;
      }

      throw new APIServiceError(
        response?.status || 500,
        "Empty response from customer 360 endpoint"
      );
    } catch (error: any) {
      console.error("Customer 360 fetch error:", error);

      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }

      // Convert axios errors to APIServiceError
      if (error.response) {
        const status = error.response.status || 500;
        const errorMsg =
          error.response.data?.detail ||
          error.response.data?.message ||
          error.response.data?.error ||
          error.message ||
          "Customer 360 request failed";
        throw new APIServiceError(
          status,
          errorMsg,
          error.response.data?.correlation_id
        );
      }

      // Network/timeout errors
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        throw new APITimeoutError("Customer 360 request timeout");
      }

      if (error.code === "ERR_NETWORK" || !error.response) {
        throw new APINetworkError(
          "Network error - cannot reach Customer 360 endpoint"
        );
      }

      throw new APIServiceError(
        500,
        error.message || "Customer 360 request failed"
      );
    }
  }

  async getRealtimeScoring(customerId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/v1/realtime-scoring/live-dashboard/${customerId}`
      );

      if (response.data && response.data.success !== false) {
        return response.data;
      }

      throw new APIServiceError(
        response.status,
        (response.data as any)?.error || "Failed to fetch real-time scoring"
      );
    } catch (error) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Real-time scoring request failed");
    }
  }

  async calculateDynamicPricing(data: {
    customer_id: string;
    product_type: string;
    loan_amount: number;
    loan_term_months: number;
  }): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/pricing/calculate-rate",
        data
      );

      if (response.data && response.data.success !== false) {
        return response.data;
      }

      throw new APIServiceError(
        response.status,
        (response.data as any)?.error || "Dynamic pricing calculation failed"
      );
    } catch (error) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Dynamic pricing request failed");
    }
  }

  async submitBatchCreditScore(
    data: BatchCreditScoreRequest
  ): Promise<BatchCreditScoreResponse> {
    try {
      // For now, process items sequentially since batch endpoint may not exist
      // In the future, this can be replaced with a single batch API call
      const results = await Promise.allSettled(
        data.items.map((item) =>
          this.submitCreditScore(item).then(
            (response) => ({
              customer_id: item.customer_id,
              success: true,
              credit_score: response.credit_score,
              risk_category: response.risk_category,
              approval_recommendation: response.approval_recommendation,
            }),
            (error: any) => ({
              customer_id: item.customer_id,
              success: false,
              error: error.message || "Credit scoring failed",
            })
          )
        )
      );

      const batchResults = results.map((result) =>
        result.status === "fulfilled" ? result.value : result.reason
      );

      const successful = batchResults.filter((r) => r.success).length;
      const failed = batchResults.length - successful;

      return {
        success: failed === 0,
        total: data.items.length,
        successful,
        failed,
        results: batchResults,
      };
    } catch (error: any) {
      throw new APIServiceError(
        500,
        error.message || "Batch credit scoring request failed"
      );
    }
  }

  async submitBatchCreditScoreFromFile(
    file: File
  ): Promise<BatchCreditScoreResponse> {
    try {
      // Read and parse CSV file
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim());

      // Parse CSV rows to CreditScoreRequest objects
      const items: CreditScoreRequest[] = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const item: any = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Try to parse as number if possible
          if (value && !isNaN(Number(value))) {
            item[header] = Number(value);
          } else {
            item[header] = value;
          }
        });
        return item as CreditScoreRequest;
      });

      return this.submitBatchCreditScore({ items });
    } catch (error: any) {
      throw new APIServiceError(
        500,
        `Failed to process CSV file: ${error.message}`
      );
    }
  }

  // Custom Product Rules
  async getCustomProductRules(params?: {
    product_type?: string;
    evaluation_scope?: string;
    is_active?: boolean;
    is_mandatory?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.product_type)
        queryParams.append("product_type", params.product_type);
      if (params?.evaluation_scope)
        queryParams.append("evaluation_scope", params.evaluation_scope);
      if (params?.is_active !== undefined)
        queryParams.append("is_active", String(params.is_active));
      if (params?.is_mandatory !== undefined)
        queryParams.append("is_mandatory", String(params.is_mandatory));
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.offset) queryParams.append("offset", String(params.offset));
      if (params?.search) queryParams.append("search", params.search);

      const response = await this.client.get(
        `/api/v1/product-rules/rules${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch custom product rules");
    }
  }

  async getCustomProductRule(ruleId: number): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/v1/product-rules/rules/${ruleId}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch custom product rule");
    }
  }

  async createCustomProductRule(rule: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/product-rules/rules",
        rule
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to create custom product rule");
    }
  }

  async updateCustomProductRule(ruleId: number, rule: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/api/v1/product-rules/rules/${ruleId}`,
        rule
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to update custom product rule");
    }
  }

  async deleteCustomProductRule(ruleId: number): Promise<void> {
    try {
      await this.client.delete(`/api/v1/product-rules/rules/${ruleId}`);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to delete custom product rule");
    }
  }

  async evaluateRules(request: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/product-rules/rules/evaluate",
        request
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to evaluate rules");
    }
  }

  // Workflow Automation Rules
  async getWorkflowRules(params?: {
    rule_type?: string;
    product_type?: string;
    customer_segment?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.rule_type) queryParams.append("rule_type", params.rule_type);
      if (params?.product_type)
        queryParams.append("product_type", params.product_type);
      if (params?.customer_segment)
        queryParams.append("customer_segment", params.customer_segment);
      if (params?.is_active !== undefined)
        queryParams.append("is_active", String(params.is_active));
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.offset) queryParams.append("offset", String(params.offset));
      if (params?.search) queryParams.append("search", params.search);

      const response = await this.client.get(
        `/api/v1/workflow/rules${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch workflow rules");
    }
  }

  async getWorkflowRule(ruleId: number): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/v1/workflow/rules/${ruleId}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch workflow rule");
    }
  }

  async createWorkflowRule(rule: any): Promise<any> {
    try {
      const response = await this.client.post("/api/v1/workflow/rules", rule);
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to create workflow rule");
    }
  }

  async updateWorkflowRule(ruleId: number, rule: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/api/v1/workflow/rules/${ruleId}`,
        rule
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to update workflow rule");
    }
  }

  async deleteWorkflowRule(ruleId: number): Promise<void> {
    try {
      await this.client.delete(`/api/v1/workflow/rules/${ruleId}`);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to delete workflow rule");
    }
  }

  async evaluateWorkflow(request: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/workflow/evaluate",
        request
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to evaluate workflow");
    }
  }

  // Risk Appetite Configuration
  async getRiskAppetiteConfigs(params?: {
    config_type?: string;
    product_type?: string;
    customer_segment?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.config_type)
        queryParams.append("config_type", params.config_type);
      if (params?.product_type)
        queryParams.append("product_type", params.product_type);
      if (params?.customer_segment)
        queryParams.append("customer_segment", params.customer_segment);
      if (params?.is_active !== undefined)
        queryParams.append("is_active", String(params.is_active));
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.offset) queryParams.append("offset", String(params.offset));
      if (params?.search) queryParams.append("search", params.search);

      const response = await this.client.get(
        `/api/v1/risk-appetite/config${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch risk appetite configs");
    }
  }

  async getRiskAppetiteConfig(configId: number): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/v1/risk-appetite/config/${configId}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch risk appetite config");
    }
  }

  async createRiskAppetiteConfig(config: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/risk-appetite/config",
        config
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to create risk appetite config");
    }
  }

  async updateRiskAppetiteConfig(configId: number, config: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/api/v1/risk-appetite/config/${configId}`,
        config
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to update risk appetite config");
    }
  }

  async deleteRiskAppetiteConfig(configId: number): Promise<void> {
    try {
      await this.client.delete(`/api/v1/risk-appetite/config/${configId}`);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to delete risk appetite config");
    }
  }

  // Rule Versioning
  async getRuleVersionHistory(
    ruleId: number,
    ruleType: "product" | "workflow" | "risk"
  ): Promise<any> {
    try {
      const endpoint =
        ruleType === "product"
          ? `/api/v1/product-rules/rules/${ruleId}/versions`
          : ruleType === "workflow"
            ? `/api/v1/workflow/rules/${ruleId}/versions`
            : `/api/v1/risk-appetite/config/${ruleId}/versions`;
      const response = await this.client.get(endpoint);
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch rule version history");
    }
  }

  async rollbackRuleVersion(
    ruleId: number,
    ruleType: "product" | "workflow" | "risk",
    version: number
  ): Promise<any> {
    try {
      const endpoint =
        ruleType === "product"
          ? `/api/v1/product-rules/rules/${ruleId}/rollback`
          : ruleType === "workflow"
            ? `/api/v1/workflow/rules/${ruleId}/rollback`
            : `/api/v1/risk-appetite/config/${ruleId}/rollback`;
      const response = await this.client.post(endpoint, { version });
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to rollback rule version");
    }
  }

  // Bulk Operations for Product Rules
  async bulkDeleteProductRules(ruleIds: number[]): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/product-rules/rules/bulk-delete",
        { rule_ids: ruleIds }
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to bulk delete product rules");
    }
  }

  async bulkToggleProductRulesActive(
    ruleIds: number[],
    isActive: boolean
  ): Promise<any> {
    try {
      const response = await this.client.put(
        "/api/v1/product-rules/rules/bulk-toggle-active",
        {
          rule_ids: ruleIds,
          is_active: isActive,
        }
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(
        500,
        "Failed to bulk toggle product rules active status"
      );
    }
  }

  // Bulk Operations for Workflow Rules
  async bulkDeleteWorkflowRules(ruleIds: number[]): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/workflow/rules/bulk-delete",
        { rule_ids: ruleIds }
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to bulk delete workflow rules");
    }
  }

  async bulkToggleWorkflowRulesActive(
    ruleIds: number[],
    isActive: boolean
  ): Promise<any> {
    try {
      const response = await this.client.put(
        "/api/v1/workflow/rules/bulk-toggle-active",
        {
          rule_ids: ruleIds,
          is_active: isActive,
        }
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(
        500,
        "Failed to bulk toggle workflow rules active status"
      );
    }
  }

  // Bulk Operations for Risk Appetite Configs
  async bulkDeleteRiskAppetiteConfigs(configIds: number[]): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/v1/risk-appetite/config/bulk-delete",
        { config_ids: configIds }
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(
        500,
        "Failed to bulk delete risk appetite configs"
      );
    }
  }

  async bulkToggleRiskAppetiteConfigsActive(
    configIds: number[],
    isActive: boolean
  ): Promise<any> {
    try {
      const response = await this.client.put(
        "/api/v1/risk-appetite/config/bulk-toggle-active",
        {
          config_ids: configIds,
          is_active: isActive,
        }
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(
        500,
        "Failed to bulk toggle risk appetite configs active status"
      );
    }
  }

  // Approval Workflow Rules
  async getApprovalWorkflowRules(): Promise<any> {
    try {
      const response = await this.client.get("/api/v1/approval/rules");
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch approval workflow rules");
    }
  }

  async updateApprovalWorkflowRules(rules: any): Promise<any> {
    try {
      const response = await this.client.put("/api/v1/approval/rules", rules);
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(
        500,
        "Failed to update approval workflow rules"
      );
    }
  }

  // Execution Logs
  async getExecutionLogs(params?: {
    rule_type?: "product" | "workflow" | "risk" | "all";
    rule_id?: number;
    status?: "success" | "failure" | "partial" | "all";
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.rule_type && params.rule_type !== "all")
        queryParams.append("rule_type", params.rule_type);
      if (params?.rule_id)
        queryParams.append("rule_id", String(params.rule_id));
      if (params?.status && params.status !== "all")
        queryParams.append("status", params.status);
      if (params?.start_date)
        queryParams.append("start_date", params.start_date);
      if (params?.end_date) queryParams.append("end_date", params.end_date);
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.offset) queryParams.append("offset", String(params.offset));
      if (params?.search) queryParams.append("search", params.search);

      const response = await this.client.get(
        `/api/v1/rules-engine/execution-logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      );
      return response.data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      throw new APIServiceError(500, "Failed to fetch execution logs");
    }
  }
}

// Singleton instance
export const creditScoringClient = new CreditScoringClient();
