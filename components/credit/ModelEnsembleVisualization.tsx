/**
 * Model Ensemble Visualization Component
 * Shows individual model scores, weights, and ensemble analysis
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useModelEnsemble } from "@/lib/api/hooks/useExplainability";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface ModelEnsembleVisualizationProps {
  predictionId?: string;
  modelPredictions?: Array<{
    model_name: string;
    score: number;
    weight: number;
    confidence: number;
  }>;
  ensembleScore?: number;
  className?: string;
}

export function ModelEnsembleVisualization({
  predictionId,
  modelPredictions,
  ensembleScore,
  className,
}: ModelEnsembleVisualizationProps) {
  const { data: ensembleData, isLoading } = useModelEnsemble(
    predictionId || null,
    !!predictionId && !modelPredictions
  );

  const predictions =
    modelPredictions || ensembleData?.model_predictions || [];
  const variance = ensembleData?.variance || 0;
  const disagreementLevel = ensembleData?.disagreement_level || "low";
  const consensusScore = ensembleData?.consensus_score || 1;
  const finalScore = ensembleScore || ensembleData?.ensemble_score || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Ensemble Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Ensemble Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Model ensemble data is not available for this prediction.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = predictions.map((p) => ({
    model: p.model_name.replace(/_/g, " ").toUpperCase(),
    score: p.score,
    weight: p.weight * 100,
    confidence: p.confidence * 100,
  }));

  const maxScore = Math.max(...chartData.map((d) => d.score));
  const minScore = Math.min(...chartData.map((d) => d.score));
  const scoreRange = maxScore - minScore;

  // Disagreement detection
  const hasDisagreement = disagreementLevel !== "low";
  const disagreementThreshold = 100; // 100 points difference

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Model Ensemble Analysis
        </CardTitle>
        <CardDescription>
          Individual model predictions and ensemble consensus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Disagreement Warning */}
        {hasDisagreement && (
          <Alert
            variant={disagreementLevel === "high" ? "destructive" : "default"}
            className="border-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-semibold">
                  Model Disagreement Detected ({disagreementLevel.toUpperCase()})
                </div>
                <div className="text-sm">
                  Model predictions vary by {scoreRange.toFixed(0)} points.{" "}
                  {disagreementLevel === "high"
                    ? "Significant disagreement - manual review recommended."
                    : "Moderate disagreement - review recommended."}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Consensus Score */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Consensus Score</div>
            <div className="text-2xl font-bold">
              {(consensusScore * 100).toFixed(1)}%
            </div>
            <Progress value={consensusScore * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Variance</div>
            <div className="text-2xl font-bold">{variance.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">
              {disagreementLevel === "low"
                ? "Low variance - high agreement"
                : disagreementLevel === "medium"
                ? "Moderate variance"
                : "High variance - low agreement"}
            </div>
          </div>
        </div>

        {/* Model Comparison Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" angle={-45} textAnchor="end" height={80} />
              <YAxis
                label={{ value: "Credit Score", angle: -90, position: "insideLeft" }}
                domain={[0, 1000]}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "score") {
                    return [value.toFixed(0), "Score"];
                  }
                  if (name === "weight") {
                    return [`${value.toFixed(1)}%`, "Weight"];
                  }
                  if (name === "confidence") {
                    return [`${value.toFixed(1)}%`, "Confidence"];
                  }
                  return [value, name];
                }}
              />
              <ReferenceLine
                y={finalScore}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ value: "Ensemble", position: "right" }}
              />
              <Bar dataKey="score" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => {
                  const distanceFromEnsemble = Math.abs(entry.score - finalScore);
                  const color =
                    distanceFromEnsemble > disagreementThreshold
                      ? "#ef4444"
                      : distanceFromEnsemble > disagreementThreshold / 2
                      ? "#f59e0b"
                      : "#10b981";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Individual Model Details */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Individual Model Predictions</div>
          {predictions.map((model, index) => {
            const distanceFromEnsemble = Math.abs(model.score - finalScore);
            const isOutlier = distanceFromEnsemble > disagreementThreshold;

            return (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  isOutlier ? "border-destructive bg-destructive/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {model.model_name.replace(/_/g, " ").toUpperCase()}
                    </span>
                    {isOutlier && (
                      <Badge variant="destructive" className="text-xs">
                        Outlier
                      </Badge>
                    )}
                  </div>
                  <div className="text-lg font-bold">{model.score.toFixed(0)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Weight: </span>
                    <span className="font-medium">
                      {(model.weight * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className="font-medium">
                      {(model.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {isOutlier && (
                  <div className="text-xs text-destructive mt-2">
                    Differs from ensemble by {distanceFromEnsemble.toFixed(0)} points
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ensemble Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-semibold">Ensemble Score</span>
            </div>
            <div className="text-2xl font-bold">{finalScore.toFixed(0)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
