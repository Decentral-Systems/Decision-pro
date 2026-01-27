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

interface DriftTrendDataPoint {
  date: string;
  drift_score: number;
  feature_name: string;
}

interface DriftTrendChartProps {
  data: DriftTrendDataPoint[];
}

export function DriftTrendChart({ data }: DriftTrendChartProps) {
  // Group by date for multiple features
  const dates = [...new Set(data.map((d) => d.date))].sort();
  const features = [...new Set(data.map((d) => d.feature_name))];

  const chartData = dates.map((date) => {
    const point: any = { date };
    features.forEach((feature) => {
      const value = data.find(
        (d) => d.date === date && d.feature_name === feature
      );
      point[feature] = value?.drift_score || 0;
    });
    return point;
  });

  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 1]} label={{ value: "Drift Score", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        {features.map((feature, index) => (
          <Line
            key={feature}
            type="monotone"
            dataKey={feature}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

