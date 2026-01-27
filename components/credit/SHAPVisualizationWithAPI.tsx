/**
 * SHAP Visualization with Real API Integration
 * Wrapper component that fetches SHAP data from API
 */

"use client";

import { SHAPVisualization, SHAPExplanation } from "./SHAPVisualization";
import { useSHAPExplanation } from "@/lib/api/hooks/useExplainability";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface SHAPVisualizationWithAPIProps {
  correlationId?: string;
  customerId?: string;
  creditScore?: number;
  fallbackExplanation?: any;
}

export function SHAPVisualizationWithAPI({
  correlationId,
  customerId,
  creditScore,
  fallbackExplanation,
}: SHAPVisualizationWithAPIProps) {
  const { data: shapData, isLoading } = useSHAPExplanation(
    correlationId
      ? {
          prediction_id: correlationId,
          customer_id: customerId,
        }
      : null,
    !!correlationId
  );

  // Use API data if available, otherwise fallback to response data
  const explanation: SHAPExplanation | undefined = shapData
    ? {
        prediction_id: shapData.prediction_id,
        correlation_id: shapData.correlation_id,
        model_version: shapData.model_version,
        base_value: shapData.base_value,
        features: shapData.features,
        top_positive_features: shapData.top_positive_features,
        top_negative_features: shapData.top_negative_features,
      }
    : fallbackExplanation
    ? {
        prediction_id: correlationId,
        correlation_id: correlationId,
        base_value: 0,
        features: fallbackExplanation.top_features?.map((f: any) => ({
          feature: f.feature,
          shap_value: f.importance,
          feature_value: 0,
          impact: f.impact,
          importance: Math.abs(f.importance),
        })) || [],
        top_positive_features: fallbackExplanation.top_features
          ?.filter((f: any) => f.impact === "positive")
          .map((f: any) => ({
            feature: f.feature,
            shap_value: f.importance,
            feature_value: 0,
            impact: f.impact,
            importance: Math.abs(f.importance),
          })) || [],
        top_negative_features: fallbackExplanation.top_features
          ?.filter((f: any) => f.impact === "negative")
          .map((f: any) => ({
            feature: f.feature,
            shap_value: f.importance,
            feature_value: 0,
            impact: f.impact,
            importance: Math.abs(f.importance),
          })) || [],
      }
    : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SHAPVisualization
      explanation={explanation}
      creditScore={creditScore}
      isLoading={isLoading}
    />
  );
}
