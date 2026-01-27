"use client";

import React, { useMemo } from "react";
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

interface MetricTrendProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
}

export const MetricTrend = React.memo(function MetricTrend({ data, color = "#0ea5e9" }: MetricTrendProps) {
  // Memoize data transformation
  const memoizedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.name || "",
      value: typeof item.value === "number" ? item.value : 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={memoizedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

