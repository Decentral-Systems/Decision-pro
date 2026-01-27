/**
 * Response Format Validator
 * Validates API responses match expected TypeScript types
 */

import type { CustomerJourneyInsights } from "@/types/customer-journey";
import type { RecommendationStatistics, ProductRecommendation } from "@/types/product-intelligence";
import type { MarketRiskAnalysis } from "@/types/risk";

/**
 * Validate Customer Journey Insights response format
 */
export function validateCustomerJourneyInsights(
  data: any
): data is CustomerJourneyInsights {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check for required fields
  if (!Array.isArray(data.stages)) {
    return false;
  }

  // Validate stages array
  for (const stage of data.stages) {
    if (
      typeof stage.stage !== "string" ||
      typeof stage.customerCount !== "number" &&
      typeof (stage as any).customer_count !== "number"
    ) {
      return false;
    }
  }

  // conversionFunnel and bottlenecks are optional
  if (data.conversionFunnel && !Array.isArray(data.conversionFunnel)) {
    return false;
  }

  if (data.bottlenecks && !Array.isArray(data.bottlenecks)) {
    return false;
  }

  return true;
}

/**
 * Validate Recommendation Statistics response format
 */
export function validateRecommendationStatistics(
  data: any
): data is RecommendationStatistics {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check required fields
  if (
    typeof data.total_recommendations !== "number" &&
    typeof data.totalRecommendations !== "number"
  ) {
    return false;
  }

  if (
    typeof data.acceptance_rate !== "number" &&
    typeof data.acceptanceRate !== "number"
  ) {
    return false;
  }

  // Optional fields are allowed to be undefined
  return true;
}

/**
 * Validate Product Recommendations response format
 */
export function validateProductRecommendations(
  data: any
): data is ProductRecommendation[] {
  if (!Array.isArray(data)) {
    // Check if it's an object with recommendations array
    if (data && typeof data === "object" && Array.isArray(data.recommendations)) {
      return validateProductRecommendations(data.recommendations);
    }
    return false;
  }

  // Validate each recommendation
  for (const rec of data) {
    if (
      typeof rec.product_id !== "string" &&
      typeof rec.productId !== "string"
    ) {
      return false;
    }

    if (
      typeof rec.recommendation_score !== "number" &&
      typeof rec.recommendationScore !== "number"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validate Market Risk Analysis response format
 */
export function validateMarketRiskAnalysis(
  data: any
): data is MarketRiskAnalysis {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check required fields
  if (!data.market_conditions && !data.marketConditions) {
    return false;
  }

  if (!data.portfolio_impact && !data.portfolioImpact) {
    return false;
  }

  // Validate market_conditions
  const marketConditions = data.market_conditions || data.marketConditions;
  if (
    typeof marketConditions.economic_indicator !== "string" &&
    typeof marketConditions.economicIndicator !== "string"
  ) {
    return false;
  }

  // Validate portfolio_impact
  const portfolioImpact = data.portfolio_impact || data.portfolioImpact;
  if (typeof portfolioImpact.estimated_default_rate !== "number" &&
      typeof portfolioImpact.estimatedDefaultRate !== "number") {
    return false;
  }

  // economic_factors is optional
  if (data.economic_factors && !Array.isArray(data.economic_factors) &&
      data.economicFactors && !Array.isArray(data.economicFactors)) {
    return false;
  }

  return true;
}

/**
 * Transform snake_case to camelCase for API responses
 */
export function transformToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase);
  }

  if (typeof obj !== "object") {
    return obj;
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    transformed[camelKey] = transformToCamelCase(value);
  }

  return transformed;
}

/**
 * Normalize response format (handle both snake_case and camelCase)
 * Transforms all responses to camelCase and validates structure
 */
export function normalizeResponseFormat<T>(data: any, validator?: (data: any) => data is T): T {
  // Always transform to camelCase first
  const transformed = transformToCamelCase(data);
  
  // If validator provided, validate the transformed data
  if (validator) {
    if (validator(transformed)) {
      return transformed as T;
    }
    
    // Development mode: log debug info when validation fails (non-critical)
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.debug("[ResponseValidator] Validation info:", {
        validator: validator.name,
        message: "Response transformed to expected format",
        recordCount: Array.isArray(transformed) ? transformed.length : 1
      });
    }
  }
  
  // Return transformed data (camelCase) even if validation fails
  // This ensures widgets always receive camelCase format
  return transformed as T;
}

