"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardTrendProps {
  data: number[];
  currentValue: number;
  previousValue?: number;
  className?: string;
}

export function StatCardTrend({
  data,
  currentValue,
  previousValue,
  className,
}: StatCardTrendProps) {
  // Calculate trend percentage
  const trendPercentage =
    previousValue !== undefined && previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

  // Prepare chart data
  const chartData = data.map((value, index) => ({
    value,
    index,
  }));

  // Determine trend direction
  const isPositive = trendPercentage > 0;
  const isNegative = trendPercentage < 0;
  const isNeutral = trendPercentage === 0;

  const TrendIcon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Sparkline Chart */}
      <div className="w-16 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                isPositive
                  ? "hsl(var(--chart-1))"
                  : isNegative
                  ? "hsl(var(--destructive))"
                  : "hsl(var(--muted-foreground))"
              }
              strokeWidth={2}
              dot={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "12px",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Indicator */}
      {previousValue !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive && "text-green-600 dark:text-green-400",
            isNegative && "text-red-600 dark:text-red-400",
            isNeutral && "text-muted-foreground"
          )}
        >
          <TrendIcon className="h-3 w-3" />
          <span>
            {isPositive ? "+" : ""}
            {Math.abs(trendPercentage).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

