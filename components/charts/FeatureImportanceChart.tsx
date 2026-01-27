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

interface FeatureImportanceItem {
  feature_name: string;
  importance_score: number;
  rank?: number;
}

interface FeatureImportanceChartProps {
  data: FeatureImportanceItem[];
  maxItems?: number;
}

export function FeatureImportanceChart({
  data,
  maxItems = 20,
}: FeatureImportanceChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.importance_score - a.importance_score)
    .slice(0, maxItems)
    .reverse(); // Reverse for horizontal bar chart

  const getColor = (score: number, maxScore: number) => {
    const ratio = score / maxScore;
    if (ratio >= 0.8) return "#10b981"; // green
    if (ratio >= 0.6) return "#3b82f6"; // blue
    if (ratio >= 0.4) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const maxScore = Math.max(...sortedData.map((d) => d.importance_score));

  return (
    <ResponsiveContainer width="100%" height={Math.min(400, sortedData.length * 40)}>
      <BarChart
        layout="vertical"
        data={sortedData}
        margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" label={{ value: "Importance Score", position: "insideBottom", offset: -5 }} />
        <YAxis
          type="category"
          dataKey="feature_name"
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number) => [value.toFixed(4), "Importance"]}
          labelFormatter={(label) => `Feature: ${label}`}
        />
        <Bar dataKey="importance_score" name="Importance Score">
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColor(entry.importance_score, maxScore)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

