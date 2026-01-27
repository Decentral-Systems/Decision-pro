/**
 * SHAP Force Plot Component
 * Shows feature forces pushing the prediction higher or lower
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SHAPExplanation } from "./SHAPVisualization";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface SHAPForcePlotProps {
  explanation: SHAPExplanation;
  creditScore?: number;
  baseValue?: number;
}

export function SHAPForcePlot({
  explanation,
  creditScore,
  baseValue = 0,
}: SHAPForcePlotProps) {
  if (!explanation?.features || explanation.features.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No SHAP data available for force plot
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort features by SHAP value (positive first, then negative)
  const positiveFeatures = explanation.features
    .filter((f) => f.impact === "positive")
    .sort((a, b) => b.shap_value - a.shap_value)
    .slice(0, 8);

  const negativeFeatures = explanation.features
    .filter((f) => f.impact === "negative")
    .sort((a, b) => a.shap_value - b.shap_value)
    .slice(0, 8);

  const totalPositive = positiveFeatures.reduce((sum, f) => sum + f.shap_value, 0);
  const totalNegative = negativeFeatures.reduce((sum, f) => sum + f.shap_value, 0);
  const finalScore = creditScore || baseValue + totalPositive + totalNegative;

  // Calculate widths for visual representation
  const maxAbsValue = Math.max(
    Math.abs(totalPositive),
    Math.abs(totalNegative),
    Math.abs(baseValue)
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Force plot showing how features push the prediction above or below the base value
          </div>

          {/* Force Plot Visualization */}
          <div className="space-y-4">
            {/* Base Value */}
            <div className="flex items-center justify-center">
              <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <div className="text-sm text-muted-foreground">Base Value</div>
                <div className="text-2xl font-bold">{baseValue.toFixed(0)}</div>
              </div>
            </div>

            {/* Forces */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Forces */}
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                    <TrendingUp className="h-5 w-5" />
                    Positive Forces
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Push score higher (+{totalPositive.toFixed(2)})
                  </div>
                </div>

                <div className="space-y-2">
                  {positiveFeatures.map((feature, index) => {
                    const width = Math.max(
                      10,
                      (Math.abs(feature.shap_value) / maxAbsValue) * 100
                    );
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-green-50 rounded border-l-4 border-green-500"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {feature.feature.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Value: {feature.feature_value?.toFixed(2) || "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-green-500 rounded"
                            style={{ width: `${width}px` }}
                          />
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            +{feature.shap_value.toFixed(3)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Negative Forces */}
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-red-600 font-semibold">
                    <TrendingDown className="h-5 w-5" />
                    Negative Forces
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Push score lower ({totalNegative.toFixed(2)})
                  </div>
                </div>

                <div className="space-y-2">
                  {negativeFeatures.map((feature, index) => {
                    const width = Math.max(
                      10,
                      (Math.abs(feature.shap_value) / maxAbsValue) * 100
                    );
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-red-50 rounded border-l-4 border-red-500"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {feature.feature.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Value: {feature.feature_value?.toFixed(2) || "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-red-500 rounded"
                            style={{ width: `${width}px` }}
                          />
                          <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
                            {feature.shap_value.toFixed(3)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Arrow and Final Score */}
            <div className="flex items-center justify-center space-x-4">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="text-3xl font-bold text-primary">
                  {finalScore.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Force Balance Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Base</div>
                <div className="text-lg font-bold">{baseValue.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-sm text-green-600">Positive</div>
                <div className="text-lg font-bold text-green-600">
                  +{totalPositive.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-red-600">Negative</div>
                <div className="text-lg font-bold text-red-600">
                  {totalNegative.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-primary">Final</div>
                <div className="text-lg font-bold text-primary">
                  {finalScore.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Force Balance Indicator */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Force Balance</div>
            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
              {/* Positive side */}
              <div
                className="absolute left-1/2 top-0 h-full bg-green-500"
                style={{
                  width: `${Math.min(50, (Math.abs(totalPositive) / (Math.abs(totalPositive) + Math.abs(totalNegative))) * 50)}%`,
                }}
              />
              {/* Negative side */}
              <div
                className="absolute right-1/2 top-0 h-full bg-red-500"
                style={{
                  width: `${Math.min(50, (Math.abs(totalNegative) / (Math.abs(totalPositive) + Math.abs(totalNegative))) * 50)}%`,
                }}
              />
              {/* Center line */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-600 transform -translate-x-0.5" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>← Negative Forces</span>
              <span>Positive Forces →</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}