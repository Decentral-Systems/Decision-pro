/**
 * LIME Explanation Modal Component
 * Shows detailed LIME (Local Interpretable Model-agnostic Explanations) for a specific feature
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SHAPFeature } from "./SHAPVisualization";
import { useLIMEExplanation } from "@/lib/api/hooks/useExplainability";
import {
  TrendingUp,
  TrendingDown,
  Info,
  BarChart3,
  Target,
  Zap,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface LIMEExplanationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: SHAPFeature | null;
  predictionId?: string;
  correlationId?: string;
  creditScore?: number;
}

export function LIMEExplanationModal({
  open,
  onOpenChange,
  feature,
  predictionId,
  correlationId,
  creditScore,
}: LIMEExplanationModalProps) {
  const { data: limeData, isLoading } = useLIMEExplanation(
    predictionId || correlationId || null,
    feature?.feature || null,
    open && !!feature
  );

  if (!feature) {
    return null;
  }

  const featureName = feature.feature.replace(/_/g, " ");
  const isPositive = feature.impact === "positive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            LIME Explanation: {featureName}
          </DialogTitle>
          <DialogDescription>
            Local interpretable model-agnostic explanation for this specific feature
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                Feature Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Feature Value</div>
                  <div className="text-xl font-bold">
                    {feature.feature_value?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">SHAP Value</div>
                  <div className={`text-xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? "+" : ""}{feature.shap_value.toFixed(3)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Impact</div>
                  <Badge variant={isPositive ? "default" : "destructive"} className="text-sm">
                    {feature.impact.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Importance</div>
                  <div className="text-xl font-bold">{(feature.importance * 100).toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LIME Analysis */}
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>LIME Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : limeData ? (
            <div className="space-y-4">
              {/* Local Importance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Local Importance Analysis
                  </CardTitle>
                  <CardDescription>
                    How this feature affects the prediction locally around this data point
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Local Importance</div>
                        <div className="text-2xl font-bold">
                          {limeData.local_importance.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Sensitivity</div>
                        <div className="text-2xl font-bold">
                          {limeData.impact_analysis.sensitivity.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Impact Analysis */}
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Impact Scenarios</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-red-50 rounded text-center">
                          <div className="text-muted-foreground">If Decreased</div>
                          <div className="font-bold text-red-600">
                            {limeData.impact_analysis.if_decreased.toFixed(0)}
                          </div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded text-center">
                          <div className="text-muted-foreground">Current</div>
                          <div className="font-bold text-blue-600">
                            {limeData.impact_analysis.current_impact.toFixed(0)}
                          </div>
                        </div>
                        <div className="p-2 bg-green-50 rounded text-center">
                          <div className="text-muted-foreground">If Increased</div>
                          <div className="font-bold text-green-600">
                            {limeData.impact_analysis.if_increased.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Explanation Text */}
                    {limeData.explanation_text && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {limeData.explanation_text}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Value Range Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Value Range Analysis
                  </CardTitle>
                  <CardDescription>
                    Statistical distribution of this feature in the training data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Minimum</div>
                        <div className="font-bold">{limeData.value_range.min.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Maximum</div>
                        <div className="font-bold">{limeData.value_range.max.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Mean</div>
                        <div className="font-bold">{limeData.value_range.mean.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Median</div>
                        <div className="font-bold">{limeData.value_range.median.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">25th Percentile</div>
                        <div className="font-bold">{limeData.value_range.percentile_25.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">75th Percentile</div>
                        <div className="font-bold">{limeData.value_range.percentile_75.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Visual Range Indicator */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Current Value Position</div>
                      <div className="relative h-6 bg-gray-200 rounded-full">
                        {/* Range indicators */}
                        <div
                          className="absolute top-1 bottom-1 bg-blue-300 rounded-full"
                          style={{
                            left: `${((limeData.value_range.percentile_25 - limeData.value_range.min) / (limeData.value_range.max - limeData.value_range.min)) * 100}%`,
                            right: `${100 - ((limeData.value_range.percentile_75 - limeData.value_range.min) / (limeData.value_range.max - limeData.value_range.min)) * 100}%`,
                          }}
                        />
                        {/* Current value */}
                        <div
                          className="absolute top-0 w-2 h-6 bg-red-500 rounded-full transform -translate-x-1"
                          style={{
                            left: `${((feature.feature_value || 0) - limeData.value_range.min) / (limeData.value_range.max - limeData.value_range.min) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Min: {limeData.value_range.min.toFixed(1)}</span>
                        <span>Current: {(feature.feature_value || 0).toFixed(1)}</span>
                        <span>Max: {limeData.value_range.max.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Cases */}
              {limeData.similar_cases && limeData.similar_cases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Similar Cases
                    </CardTitle>
                    <CardDescription>
                      Other customers with similar feature values and their outcomes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {limeData.similar_cases.slice(0, 5).map((case_item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <div className="font-medium">Case {case_item.case_id}</div>
                              <div className="text-muted-foreground">
                                Feature Value: {case_item.feature_value.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {case_item.credit_score.toFixed(0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(case_item.similarity * 100).toFixed(1)}% similar
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    LIME explanation data is not available for this feature. This may occur if:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>The feature was not included in the LIME analysis</li>
                      <li>The model version does not support LIME explanations</li>
                      <li>The explanation is still being processed</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Feature Improvement Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Improvement Suggestions
              </CardTitle>
              <CardDescription>
                How this feature could be optimized to improve the credit score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isPositive ? (
                  <Alert className="border-green-200 bg-green-50">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-green-800">
                          This feature is positively contributing to the credit score.
                        </div>
                        <div className="text-sm">
                          Maintaining or improving this feature value could further enhance the credit score.
                          Current contribution: +{feature.shap_value.toFixed(3)} points.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-red-800">
                          This feature is negatively impacting the credit score.
                        </div>
                        <div className="text-sm">
                          Improving this feature could significantly boost the credit score.
                          Current impact: {feature.shap_value.toFixed(3)} points.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Generic improvement suggestions based on feature name */}
                <div className="text-sm space-y-2">
                  <div className="font-medium">Potential improvement strategies:</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {feature.feature.includes("income") && (
                      <li>Consider documenting additional income sources</li>
                    )}
                    {feature.feature.includes("debt") && (
                      <li>Focus on reducing existing debt obligations</li>
                    )}
                    {feature.feature.includes("history") && (
                      <li>Maintain consistent payment history over time</li>
                    )}
                    {feature.feature.includes("employment") && (
                      <li>Provide additional employment verification documents</li>
                    )}
                    <li>Consult with a financial advisor for personalized guidance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}