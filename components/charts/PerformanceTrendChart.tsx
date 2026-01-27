"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PerformanceTrendDataPoint {
  date: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  prediction_count: number;
  average_latency_ms: number;
}

interface PerformanceTrendChartProps {
  data: PerformanceTrendDataPoint[];
  metrics?: ("accuracy" | "precision" | "recall" | "f1_score")[];
}

export function PerformanceTrendChart({
  data,
  metrics = ["accuracy", "precision", "recall", "f1_score"],
}: PerformanceTrendChartProps) {
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString(),
    Accuracy: (point.accuracy * 100).toFixed(2),
    Precision: (point.precision * 100).toFixed(2),
    Recall: (point.recall * 100).toFixed(2),
    "F1 Score": (point.f1_score * 100).toFixed(2),
    raw_accuracy: point.accuracy,
    raw_precision: point.precision,
    raw_recall: point.recall,
    raw_f1_score: point.f1_score,
  }));

  const colors: Record<string, string> = {
    Accuracy: "#3b82f6", // blue
    Precision: "#10b981", // green
    Recall: "#f59e0b", // amber
    "F1 Score": "#ef4444", // red
  };

  const metricLabels: Record<string, string> = {
    accuracy: "Accuracy",
    precision: "Precision",
    recall: "Recall",
    f1_score: "F1 Score",
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }} />
        <Tooltip
          formatter={(value: string, name: string) => [`${value}%`, name]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        {metrics.map((metric) => {
          const label = metricLabels[metric];
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={label}
              stroke={colors[label]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

