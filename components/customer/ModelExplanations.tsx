/**
 * Model Explanations Component
 * Shows SHAP/LIME explanations for last credit decisions
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  impact: "positive" | "negative";
}

export interface ModelExplanation {
  model_version: string;
  prediction_id: string;
  score: number;
  features: FeatureContribution[];
  timestamp: string;
  correlation_id?: string;
}

interface ModelExplanationsProps {
  explanations: ModelExplanation[];
}

export function ModelExplanations({ explanations }: ModelExplanationsProps) {
  if (!explanations || explanations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Model Explanations
          </CardTitle>
          <CardDescription>No model explanations available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const latest = explanations[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Model Explanations
        </CardTitle>
        <CardDescription>
          Feature contributions to the last credit decision
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Model Version:</span>
          <Badge>{latest.model_version}</Badge>
        </div>
        {latest.correlation_id && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Correlation ID:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {latest.correlation_id.substring(0, 8)}...
            </Badge>
          </div>
        )}
        <div className="space-y-3">
          <div className="text-sm font-medium">Top Contributing Features:</div>
          {latest.features
            .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
            .slice(0, 10)
            .map((feature, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{feature.feature.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    {feature.impact === "positive" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={feature.impact === "positive" ? "text-green-600" : "text-red-600"}>
                      {feature.contribution > 0 ? "+" : ""}
                      {(feature.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.abs(feature.contribution) * 100}
                  className="h-2"
                />
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}



