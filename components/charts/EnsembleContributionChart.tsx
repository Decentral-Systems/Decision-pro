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

interface EnsembleContribution {
  model_name: string;
  contribution_percentage: number;
  predictions_contributed: number;
}

interface EnsembleContributionChartProps {
  data: EnsembleContribution[];
}

export function EnsembleContributionChart({ data }: EnsembleContributionChartProps) {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  const chartData = data.map((item) => ({
    name: item.model_name,
    contribution: item.contribution_percentage,
    predictions: item.predictions_contributed,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: "Contribution (%)", angle: -90, position: "insideLeft" }} />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "contribution") {
              return [`${value.toFixed(2)}%`, "Contribution"];
            }
            return [value.toLocaleString(), "Predictions"];
          }}
        />
        <Legend />
        <Bar dataKey="contribution" name="Contribution %">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

