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
import { formatPercentage } from "@/lib/utils/format";

interface RatioComparison {
  ratio: string;
  current: number;
  baseline?: number;
  target?: number;
  benchmark?: number;
  stress?: number;
}

interface BankingRatiosComparisonChartProps {
  data: RatioComparison[];
  height?: number;
  showTarget?: boolean;
  showBenchmark?: boolean;
  scenario?: "baseline" | "stress";
}

export function BankingRatiosComparisonChart({
  data,
  height = 300,
  showTarget = true,
  showBenchmark = true,
  scenario = "baseline",
}: BankingRatiosComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No banking ratios data available
      </div>
    );
  }

  const getColor = (value: number, target?: number): string => {
    if (target !== undefined) {
      const diff = Math.abs(value - target) / target;
      if (diff <= 0.05) return "#10b981"; // Within 5% of target - green
      if (diff <= 0.10) return "#f59e0b"; // Within 10% of target - amber
      return "#ef4444"; // More than 10% off - red
    }
    return "#3b82f6"; // Default blue
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="ratio"
          className="text-xs"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          className="text-xs"
          tickFormatter={(value) => formatPercentage(value)}
        />
        <Tooltip
          formatter={(value: number) => formatPercentage(value)}
        />
        <Legend />
        <Bar dataKey="baseline" name="Baseline" fill="#3b82f6">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.baseline || entry.current, entry.target)} />
          ))}
        </Bar>
        {scenario === "stress" && data[0]?.stress !== undefined && (
          <Bar dataKey="stress" name="Stress Scenario" fill="#ef4444" />
        )}
        {showTarget && data[0]?.target !== undefined && (
          <Bar dataKey="target" name="Target" fill="#10b981" />
        )}
        {showBenchmark && data[0]?.benchmark !== undefined && (
          <Bar dataKey="benchmark" name="Industry Benchmark" fill="#8b5cf6" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}



