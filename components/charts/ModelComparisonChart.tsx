"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ModelComparisonData {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
}

interface ModelComparisonChartProps {
  data: ModelComparisonData[];
  metric: "accuracy" | "precision" | "recall" | "f1_score" | "auc_roc";
}

export function ModelComparisonChart({
  data,
  metric,
}: ModelComparisonChartProps) {
  const metricLabels: Record<string, string> = {
    accuracy: "Accuracy",
    precision: "Precision",
    recall: "Recall",
    f1_score: "F1 Score",
    auc_roc: "AUC-ROC",
  };

  const chartData = data.map((model) => ({
    name: model.model_name,
    value: model[metric] * 100, // Keep as number for chart
    rawValue: model[metric],
  }));

  const getColor = (value: number) => {
    if (value >= 0.9) return "#10b981"; // green
    if (value >= 0.8) return "#3b82f6"; // blue
    if (value >= 0.7) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }} />
        <Tooltip
          formatter={(value: string, name: string) => [`${value}%`, metricLabels[metric]]}
          labelFormatter={(label) => `Model: ${label}`}
        />
        <Legend />
        <Bar dataKey="value" name={metricLabels[metric]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.rawValue)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

