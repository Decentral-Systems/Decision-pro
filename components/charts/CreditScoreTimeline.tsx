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

interface CreditScoreDataPoint {
  date: string;
  score: number;
  model_name?: string;
}

interface CreditScoreTimelineProps {
  data: CreditScoreDataPoint[];
  height?: number;
}

export function CreditScoreTimeline({
  data,
  height = 400,
}: CreditScoreTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No credit score history available
      </div>
    );
  }

  // Group by date and show multiple models if available
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    rawDate: point.date,
    "Credit Score": point.score,
    ...(point.model_name && { [point.model_name]: point.score }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          domain={[300, 850]}
          label={{ value: "Credit Score", angle: -90, position: "insideLeft" }}
        />
        <Tooltip
          formatter={(value: number) => [value.toFixed(0), "Score"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Credit Score"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}



