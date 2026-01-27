"use client";

import React, { useMemo } from "react";
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

interface WaterfallDataPoint {
  name: string;
  value: number;
  cumulative?: number;
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  colors?: {
    positive: string;
    negative: string;
    total: string;
  };
}

export const WaterfallChart = React.memo(function WaterfallChart({
  data,
  colors = {
    positive: "#10b981", // green
    negative: "#ef4444", // red
    total: "#3b82f6", // blue
  },
}: WaterfallChartProps) {
  // Memoize data processing for waterfall visualization
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data.map((point, index) => {
      const isTotal = point.name.toLowerCase().includes("total");
      const isPositive = point.value >= 0;
      
      return {
        ...point,
        fill: isTotal
          ? colors.total
          : isPositive
          ? colors.positive
          : colors.negative,
      };
    });
  }, [data, colors]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [
            `$${value.toLocaleString()}`,
            "Amount",
          ]}
        />
        <Legend />
        <Bar dataKey="value" name="Amount">
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

