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
} from "recharts";

interface FeatureImportanceComparisonItem {
  feature_name: string;
  [modelName: string]: string | number;
}

interface FeatureImportanceComparisonChartProps {
  data: FeatureImportanceComparisonItem[];
  models: string[];
  maxItems?: number;
}

export function FeatureImportanceComparisonChart({
  data,
  models,
  maxItems = 15,
}: FeatureImportanceComparisonChartProps) {
  const sortedData = data.slice(0, maxItems);

  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={sortedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="feature_name"
          angle={-45}
          textAnchor="end"
          height={120}
          tick={{ fontSize: 10 }}
        />
        <YAxis label={{ value: "Importance Score", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        {models.map((model, index) => (
          <Bar
            key={model}
            dataKey={model}
            fill={colors[index % colors.length]}
            name={model}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

