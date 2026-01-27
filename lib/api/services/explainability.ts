/**
 * Explainability Service
 * Handles SHAP and LIME explanation API calls
 */

import { apiGatewayClient } from "@/lib/api/clients/api-gateway";
import {
  APIServiceError,
  APITimeoutError,
  APINetworkError,
} from "@/types/api";

export interface ExplainabilityRequest {
  prediction_id?: string;
  customer_id?: string;
  features?: Record<string, any>;
  model_name?: string;
}

export interface SHAPExplanationResponse {
  prediction_id: string;
  correlation_id: string;
  model_version?: string;
  base_value: number;
  features: Array<{
    feature: string;
    shap_value: number;
    feature_value: number;
    impact: "positive" | "negative";
    importance: number;
  }>;
  top_positive_features: Array<{
    feature: string;
    shap_value: number;
    feature_value: number;
    impact: "positive";
    importance: number;
  }>;
  top_negative_features: Array<{
    feature: string;
    shap_value: number;
    feature_value: number;
    impact: "negative";
    importance: number;
  }>;
}

export interface LIMEExplanationResponse {
  feature: string;
  local_importance: number;
  feature_value: number;
  value_range: {
    min: number;
    max: number;
    mean: number;
    median: number;
    percentile_25: number;
    percentile_75: number;
  };
  similar_cases: Array<{
    case_id: string;
    feature_value: number;
    credit_score: number;
    similarity: number;
  }>;
  impact_analysis: {
    current_impact: number;
    if_increased: number;
    if_decreased: number;
    sensitivity: number;
  };
  explanation_text?: string;
}

export interface ModelEnsembleResponse {
  model_predictions: Array<{
    model_name: string;
    score: number;
    weight: number;
    confidence: number;
  }>;
  ensemble_score: number;
  variance: number;
  disagreement_level: "low" | "medium" | "high";
  consensus_score: number;
}

class ExplainabilityService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get SHAP explanation for a prediction
   */
  async getSHAPExplanation(
    request: ExplainabilityRequest
  ): Promise<SHAPExplanationResponse | null> {
    const cacheKey = `shap_${request.prediction_id || request.customer_id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      let response: any;

      if (request.prediction_id) {
        // Get explanation by prediction ID using new model explainability service
        response = await apiGatewayClient.client.get<any>(
          `/api/v1/explainability/shap/${request.prediction_id}`
        );
      } else if (request.features && request.customer_id) {
        // Generate SHAP explanation from features using new service
        response = await apiGatewayClient.client.post<any>(
          `/api/v1/explainability/generate`,
          {
            customer_id: request.customer_id,
            prediction_id: request.prediction_id,
            features: request.features,
            model_name: request.model_name || "ensemble",
            explanation_type: "shap"
          }
        );
      } else {
        return null;
      }

      const explainabilityData = response.data;
      if (!explainabilityData) return null;

      // Transform from new model explainability service format
      const result: SHAPExplanationResponse = {
        prediction_id: explainabilityData.customer_id || request.prediction_id || `pred_${Date.now()}`,
        correlation_id: explainabilityData.correlation_id || `corr_${Date.now()}`,
        model_version: explainabilityData.model_version || "ensemble",
        base_value: explainabilityData.base_value || 0,
        features: this.transformNewSHAPFeatures(explainabilityData.shap_values || []),
        top_positive_features: [],
        top_negative_features: [],
      };

      // Separate positive and negative features
      result.top_positive_features = result.features
        .filter((f) => f.impact === "positive")
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10);
      result.top_negative_features = result.features
        .filter((f) => f.impact === "negative")
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10);

      this.setCached(cacheKey, result);
      return result;
    } catch (error: any) {
      console.warn("SHAP explanation failed:", error.message);
      return null;
    }
  }

  /**
   * Get LIME explanation for a specific feature
   */
  async getLIMEExplanation(
    predictionId: string,
    feature: string
  ): Promise<LIMEExplanationResponse | null> {
    const cacheKey = `lime_${predictionId}_${feature}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiGatewayClient.client.get<any>(
        `/api/v1/explainability/lime/${predictionId}`,
        {
          params: { feature },
        }
      );

      const limeData = response.data;
      if (!limeData) return null;

      // Transform from new model explainability service format
      const result: LIMEExplanationResponse = {
        feature,
        local_importance: limeData.local_importance || 0,
        feature_value: limeData.feature_value || 0,
        value_range: limeData.value_range || {
          min: 0,
          max: 0,
          mean: 0,
          median: 0,
          percentile_25: 0,
          percentile_75: 0,
        },
        similar_cases: limeData.similar_cases || [],
        impact_analysis: limeData.impact_analysis || {
          current_impact: limeData.local_importance || 0,
          if_increased: (limeData.local_importance || 0) * 1.2,
          if_decreased: (limeData.local_importance || 0) * 0.8,
          sensitivity: Math.abs(limeData.local_importance || 0) / 10,
        },
        explanation_text: limeData.explanation_text,
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (error: any) {
      console.warn("LIME explanation failed:", error.message);
      return null;
    }
  }

  /**
   * Get model ensemble information
   */
  async getModelEnsemble(
    predictionId: string
  ): Promise<ModelEnsembleResponse | null> {
    try {
      const response = await apiGatewayClient.client.get<any>(
        `/api/v1/explainability/ensemble/${predictionId}`
      );

      const ensembleData = response.data;
      if (!ensembleData) return null;

      // Use new model explainability service data
      const predictions = ensembleData.model_predictions || [];
      if (predictions.length === 0) return null;

      return {
        model_predictions: predictions.map((p: any) => ({
          model_name: p.model_name || "unknown",
          score: p.score || 0,
          weight: p.weight || 1 / predictions.length,
          confidence: p.confidence || 0.8,
        })),
        ensemble_score: ensembleData.credit_score || 0,
        variance: ensembleData.model_agreement || 0,
        disagreement_level: this.calculateDisagreementLevel(ensembleData.model_agreement || 1),
        consensus_score: ensembleData.model_agreement || 1,
      };
    } catch (error: any) {
      console.warn("Model ensemble data failed:", error.message);
      return null;
    }
  }

  /**
   * Get comprehensive explainability data
   */
  async getComprehensiveExplanation(
    customerId: string,
    creditScoreResult: any,
    correlationId: string
  ): Promise<any> {
    try {
      const response = await apiGatewayClient.client.post<any>(
        `/api/v1/explainability/comprehensive`,
        {
          customer_id: customerId,
          credit_score_result: creditScoreResult,
          correlation_id: correlationId,
        }
      );

      return response.data;
    } catch (error: any) {
      console.warn("Comprehensive explanation failed:", error.message);
      return null;
    }
  }

  /**
   * Generate explanation report
   */
  async generateExplanationReport(
    explainabilityResult: any,
    format: "json" | "text" | "html" = "json"
  ): Promise<any> {
    try {
      const response = await apiGatewayClient.client.post<any>(
        `/api/v1/explainability/report`,
        {
          explainability_result: explainabilityResult,
          format,
        }
      );

      return response.data;
    } catch (error: any) {
      console.warn("Explanation report generation failed:", error.message);
      return null;
    }
  }

  /**
   * Calculate disagreement level from model agreement score
   */
  private calculateDisagreementLevel(agreement: number): "low" | "medium" | "high" {
    if (agreement >= 0.8) return "low";
    if (agreement >= 0.6) return "medium";
    return "high";
  }

  /**
   * Transform SHAP features to our format (legacy)
   */
  private transformSHAPFeatures(features: any[]): SHAPExplanationResponse["features"] {
    if (!Array.isArray(features)) return [];

    return features.map((f: any) => {
      const shapValue = typeof f === "object" ? f.shap_value || f.value || 0 : f;
      const featureName = typeof f === "object" ? f.feature || f.name || "unknown" : "unknown";
      const featureValue = typeof f === "object" ? f.feature_value || f.actual_value || 0 : 0;

      return {
        feature: featureName,
        shap_value: shapValue,
        feature_value: featureValue,
        impact: shapValue >= 0 ? "positive" : "negative",
        importance: Math.abs(shapValue),
      };
    });
  }

  /**
   * Transform new SHAP features from model explainability service
   */
  private transformNewSHAPFeatures(shapValues: any[]): SHAPExplanationResponse["features"] {
    if (!Array.isArray(shapValues)) return [];

    return shapValues.map((shap: any) => ({
      feature: shap.feature || "unknown",
      shap_value: shap.value || 0,
      feature_value: shap.feature_value || 0,
      impact: shap.impact || (shap.value >= 0 ? "positive" : "negative"),
      importance: shap.importance || Math.abs(shap.value || 0),
    }));
  }

  /**
   * Cache management
   */
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const explainabilityService = new ExplainabilityService();
