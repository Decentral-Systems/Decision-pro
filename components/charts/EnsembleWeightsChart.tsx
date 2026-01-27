"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface EnsembleWeight {
  model_name: string;
  weight: number;
}

interface EnsembleWeightsChartProps {
  data: EnsembleWeight[];
}

export function EnsembleWeightsChart({ data }: EnsembleWeightsChartProps) {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  const chartData = data.map((item, index) => ({
    name: item.model_name,
    value: item.weight * 100,
    color: colors[index % colors.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

