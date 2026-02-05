/**
 * SHAP (SHapley Additive exPlanations) Visualization Component
 * Displays feature importance and impact on credit score
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Info, Download, BarChart3, Eye, Droplet, Zap } from "lucide-react";
import { useState } from "react";
import { LIMEExplanationModal } from "./LIMEExplanationModal";
import { SHAPWaterfallChart } from "./SHAPWaterfallChart";
import { SHAPForcePlot } from "./SHAPForcePlot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface SHAPFeature {
  feature: string;
  shap_value: number;
  feature_value: number;
  impact: "positive" | "negative";
  importance: number; // Absolute importance for ranking
}

export interface SHAPExplanation {
  prediction_id?: string;
  correlation_id?: string;
  model_version?: string;
  base_value: number;
  features: SHAPFeature[];
  top_positive_features: SHAPFeature[];
  top_negative_features: SHAPFeature[];
}

interface SHAPVisualizationProps {
  explanation?: SHAPExplanation;
  creditScore?: number;
  isLoading?: boolean;
  onFeatureClick?: (feature: SHAPFeature) => void;
}

export function SHAPVisualization({
  explanation,
  creditScore,
  isLoading = false,
  onFeatureClick,
}: SHAPVisualizationProps) {
  const [selectedFeature, setSelectedFeature] = useState<SHAPFeature | null>(null);
  const [limeModalOpen, setLimeModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SHAP Feature Importance
          </CardTitle>
          <CardDescription>Loading explainability data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <Progress value={0} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!explanation || !explanation.features || explanation.features.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SHAP Feature Importance
          </CardTitle>
          <CardDescription>Model explainability data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              SHAP explanation data is not available for this credit score. 
              This may occur if the model version does not support explainability or the data is still processing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Sort features by absolute importance
  const sortedFeatures = [...explanation.features].sort(
    (a, b) => Math.abs(b.importance) - Math.abs(a.importance)
  );

  // Get top 10 features
  const topFeatures = sortedFeatures.slice(0, 10);

  // Calculate max importance for scaling
  const maxImportance = Math.max(...topFeatures.map((f) => Math.abs(f.importance)));

  const handleFeatureClick = (feature: SHAPFeature) => {
    setSelectedFeature(feature);
    onFeatureClick?.(feature);
  };

  const handleExportPDF = async () => {
    if (!explanation) return;
    
    // Use enhanced PDF generator
    const { generateExplainabilityPDF } = await import("@/lib/utils/explainabilityPDF");
    
    generateExplainabilityPDF({
      creditScore: creditScore || 0,
      correlationId: explanation.correlation_id || "",
      timestamp: new Date().toISOString(),
      shapExplanation: explanation,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              SHAP Explainability
            </CardTitle>
            <CardDescription>
              Multiple views of feature contributions to the credit score
              {explanation.model_version && (
                <span className="ml-2">
                  (Model: {explanation.model_version})
                </span>
              )}
              {explanation.correlation_id && (
                <span className="ml-2 text-xs">
                  ID: {explanation.correlation_id.substring(0, 8)}...
                </span>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="importance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="importance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Importance
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Waterfall
            </TabsTrigger>
            <TabsTrigger value="force" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Force Plot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="importance" className="space-y-4 mt-4">
        {/* Base Value Display */}
        {explanation.base_value !== undefined && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Base Score</div>
            <div className="text-2xl font-bold">{explanation.base_value.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Starting point before feature contributions
            </div>
          </div>
        )}

        {/* Top Features List */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Top Contributing Features:</div>
          {topFeatures.map((feature, index) => {
            const importancePercent = (Math.abs(feature.importance) / maxImportance) * 100;
            const isPositive = feature.impact === "positive";

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFeature?.feature === feature.feature
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleFeatureClick(feature)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-semibold capitalize">
                      {feature.feature.replace(/_/g, " ")}
                    </span>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <Badge variant={isPositive ? "default" : "destructive"}>
                    {isPositive ? "+" : ""}
                    {feature.shap_value.toFixed(2)}
                  </Badge>
                </div>
                <Progress
                  value={importancePercent}
                  className={`h-2 ${
                    isPositive ? "bg-green-100" : "bg-red-100"
                  }`}
                />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Feature Value: {feature.feature_value?.toFixed(2) || "N/A"}</span>
                  <span>
                    Impact: {isPositive ? "+" : ""}
                    {(feature.importance * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Positive vs Negative Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-green-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Positive Contributors
            </div>
            <div className="text-2xl font-bold text-green-600">
              {explanation.top_positive_features?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Features increasing credit score
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-red-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Negative Contributors
            </div>
            <div className="text-2xl font-bold text-red-600">
              {explanation.top_negative_features?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Features decreasing credit score
            </div>
          </div>
        </div>

        {/* Selected Feature Details */}
        {selectedFeature && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div className="font-semibold">
                  {selectedFeature.feature.replace(/_/g, " ")}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">SHAP Value:</span>{" "}
                    {selectedFeature.shap_value.toFixed(4)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Feature Value:</span>{" "}
                    {selectedFeature.feature_value?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div className="text-sm">
                  Impact: {selectedFeature.impact === "positive" ? "Increases" : "Decreases"} credit score
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLimeModalOpen(true)}
                  className="w-full mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View LIME Explanation
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

            {/* Correlation ID */}
            {explanation.correlation_id && (
              <div className="pt-4 border-t text-xs text-muted-foreground">
                Correlation ID: <code className="font-mono">{explanation.correlation_id}</code>
              </div>
            )}
          </TabsContent>

          <TabsContent value="waterfall" className="mt-4">
            <SHAPWaterfallChart
              explanation={explanation}
              creditScore={creditScore}
              baseValue={explanation.base_value}
            />
          </TabsContent>

          <TabsContent value="force" className="mt-4">
            <SHAPForcePlot
              explanation={explanation}
              creditScore={creditScore}
              baseValue={explanation.base_value}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* LIME Explanation Modal */}
      <LIMEExplanationModal
        open={limeModalOpen}
        onOpenChange={setLimeModalOpen}
        feature={selectedFeature}
        predictionId={explanation.prediction_id}
        correlationId={explanation.correlation_id}
        creditScore={creditScore}
      />
    </Card>
  );
}
