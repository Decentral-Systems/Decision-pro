"use client";

import { memo, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RevenueTrendDataPoint {
  date: string;
  revenue: number;
  interest_income?: number;
  non_interest_income?: number;
  forecast?: number;
  upperBound?: number; // Upper confidence interval
  lowerBound?: number; // Lower confidence interval
}

interface RevenueTrendChartProps {
  data: RevenueTrendDataPoint[];
  showForecast?: boolean;
  showConfidenceIntervals?: boolean;
  type?: "line" | "area";
  height?: number;
}

function RevenueTrendChartComponent({
  data,
  showForecast = false,
  showConfidenceIntervals = true,
  type = "area",
  height = 300,
}: RevenueTrendChartProps) {
  // Memoize formatters for performance
  const xAxisFormatter = useCallback((value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, []);

  const yAxisFormatter = useCallback((value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  }, []);

  const tooltipFormatter = useCallback((value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const tooltipLabelFormatter = useCallback((label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Memoize processed data
  const chartData = useMemo(() => data, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No revenue trend data available
      </div>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tickFormatter={xAxisFormatter}
          />
          <YAxis
            className="text-xs"
            tickFormatter={yAxisFormatter}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
          />
          <Legend />
          {data[0]?.interest_income !== undefined && (
            <Area
              type="monotone"
              dataKey="interest_income"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Interest Income"
            />
          )}
          {data[0]?.non_interest_income !== undefined && (
            <Area
              type="monotone"
              dataKey="non_interest_income"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Non-Interest Income"
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            name="Total Revenue"
          />
          {showForecast && data.some((d) => d.forecast !== undefined) && (
            <>
              {/* Confidence interval band */}
              {showConfidenceIntervals && data.some((d) => d.upperBound && d.lowerBound) && (
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                  connectNulls
                />
              )}
              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: "#f59e0b" }}
                name="Forecast"
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          }}
        />
        <YAxis
          className="text-xs"
          tickFormatter={(value) => {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
            return `$${value}`;
          }}
        />
        <Tooltip
          formatter={(value: number) => {
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "ETB",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
          }}
        />
        <Legend />
        {data[0]?.interest_income !== undefined && (
          <Line
            type="monotone"
            dataKey="interest_income"
            stroke="#3b82f6"
            name="Interest Income"
          />
        )}
        {data[0]?.non_interest_income !== undefined && (
          <Line
            type="monotone"
            dataKey="non_interest_income"
            stroke="#10b981"
            name="Non-Interest Income"
          />
        )}
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#8b5cf6"
          name="Total Revenue"
        />
        {showForecast && data[0]?.forecast !== undefined && (
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f59e0b"
            strokeDasharray="5 5"
            name="Forecast"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export const RevenueTrendChart = memo(RevenueTrendChartComponent);

