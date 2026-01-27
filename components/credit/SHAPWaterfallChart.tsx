/**
 * SHAP Waterfall Chart Component
 * Shows how features contribute to the final prediction from base value
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SHAPExplanation } from "./SHAPVisualization";
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
import { TrendingUp, TrendingDown } from "lucide-react";

interface SHAPWaterfallChartProps {
  explanation: SHAPExplanation;
  creditScore?: number;
  baseValue?: number;
}

export function SHAPWaterfallChart({
  explanation,
  creditScore,
  baseValue = 0,
}: SHAPWaterfallChartProps) {
  if (!explanation?.features || explanation.features.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No SHAP data available for waterfall chart
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort features by absolute SHAP value for waterfall effect
  const sortedFeatures = [...explanation.features]
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 10); // Top 10 features

  // Calculate cumulative values for waterfall effect
  let cumulativeValue = baseValue;
  const waterfallData = [
    {
      feature: "Base Value",
      value: baseValue,
      cumulative: baseValue,
      type: "base",
      shap_value: 0,
    },
  ];

  sortedFeatures.forEach((feature, index) => {
    cumulativeValue += feature.shap_value;
    waterfallData.push({
      feature: feature.feature.replace(/_/g, " "),
      value: feature.shap_value,
      cumulative: cumulativeValue,
      type: feature.impact,
      shap_value: feature.shap_value,
    });
  });

  // Add final prediction
  waterfallData.push({
    feature: "Final Score",
    value: creditScore || cumulativeValue,
    cumulative: creditScore || cumulativeValue,
    type: "final",
    shap_value: 0,
  });

  const maxValue = Math.max(...waterfallData.map((d) => Math.abs(d.cumulative)));
  const yAxisDomain = [-maxValue * 1.1, maxValue * 1.1];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Waterfall chart showing how each feature contributes to the final credit score
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="feature"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  label={{
                    value: "Credit Score Contribution",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  domain={yAxisDomain}
                />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    const data = props.payload;
                    if (data.type === "base") {
                      return [value.toFixed(2), "Base Value"];
                    }
                    if (data.type === "final") {
                      return [value.toFixed(0), "Final Score"];
                    }
                    return [
                      `${value > 0 ? "+" : ""}${value.toFixed(3)}`,
                      "SHAP Contribution",
                    ];
                  }}
                  labelFormatter={(label) => `Feature: ${label}`}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                <Bar dataKey="cumulative" radius={[2, 2, 2, 2]}>
                  {waterfallData.map((entry, index) => {
                    let color = "#8884d8";
                    if (entry.type === "base") color = "#94a3b8";
                    else if (entry.type === "final") color = "#10b981";
                    else if (entry.type === "positive") color = "#22c55e";
                    else if (entry.type === "negative") color = "#ef4444";
                    
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Contributions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-green-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Positive Contributors
              </div>
              <div className="space-y-1">
                {sortedFeatures
                  .filter((f) => f.impact === "positive")
                  .slice(0, 5)
                  .map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs p-2 bg-green-50 rounded"
                    >
                      <span className="font-medium">
                        {feature.feature.replace(/_/g, " ")}
                      </span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        +{feature.shap_value.toFixed(3)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Negative Contributors
              </div>
              <div className="space-y-1">
                {sortedFeatures
                  .filter((f) => f.impact === "negative")
                  .slice(0, 5)
                  .map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs p-2 bg-red-50 rounded"
                    >
                      <span className="font-medium">
                        {feature.feature.replace(/_/g, " ")}
                      </span>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        {feature.shap_value.toFixed(3)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Base Value</div>
                <div className="text-lg font-bold">{baseValue.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Contribution</div>
                <div className="text-lg font-bold">
                  {sortedFeatures
                    .reduce((sum, f) => sum + f.shap_value, 0)
                    .toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="text-lg font-bold">
                  {(creditScore || cumulativeValue).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}