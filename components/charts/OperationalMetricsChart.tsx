"use client";

import { memo, useMemo, useCallback } from "react";
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

interface OperationalMetricDataPoint {
  timestamp: string;
  processing_time?: number;
  throughput?: number;
  automation_rate?: number;
  error_rate?: number;
}

interface OperationalMetricsChartProps {
  data: OperationalMetricDataPoint[];
  height?: number;
  metrics?: string[]; // Which metrics to display
}

function OperationalMetricsChartComponent({
  data,
  height = 300,
  metrics = ["processing_time", "throughput", "automation_rate", "error_rate"],
}: OperationalMetricsChartProps) {
  // Memoize metric configuration
  const metricConfig: Record<string, { color: string; name: string; formatter: (value: number) => string }> = useMemo(() => ({
    processing_time: {
      color: "#3b82f6",
      name: "Processing Time (ms)",
      formatter: (value) => `${value.toFixed(0)}ms`,
    },
    throughput: {
      color: "#10b981",
      name: "Throughput (req/min)",
      formatter: (value) => `${value.toFixed(0)} req/min`,
    },
    automation_rate: {
      color: "#8b5cf6",
      name: "Automation Rate (%)",
      formatter: (value) => `${value.toFixed(1)}%`,
    },
    error_rate: {
      color: "#ef4444",
      name: "Error Rate (%)",
      formatter: (value) => `${value.toFixed(2)}%`,
    },
  }), []);

  // Memoize processed data
  const chartData = useMemo(() => data, [data]);

  // Memoize formatters
  const xAxisFormatter = useCallback((value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, []);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No operational metrics data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="timestamp"
          className="text-xs"
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          className="text-xs"
          yAxisId="left"
          tickFormatter={(value) => {
            if (metrics.includes("processing_time") && data[0]?.processing_time !== undefined) {
              return `${value}ms`;
            }
            if (metrics.includes("throughput") && data[0]?.throughput !== undefined) {
              return `${value}`;
            }
            return `${value}`;
          }}
        />
        {metrics.includes("automation_rate") || metrics.includes("error_rate") ? (
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-xs"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
        ) : null}
        <Tooltip
          formatter={(value: number, name: string) => {
            const config = metricConfig[name];
            return config ? config.formatter(value) : value;
          }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleString("en-US");
          }}
        />
        <Legend />
        {metrics.includes("processing_time") && data[0]?.processing_time !== undefined && (
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="processing_time"
            stroke={metricConfig.processing_time.color}
            strokeWidth={2}
            name={metricConfig.processing_time.name}
            dot={{ r: 3 }}
          />
        )}
        {metrics.includes("throughput") && data[0]?.throughput !== undefined && (
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="throughput"
            stroke={metricConfig.throughput.color}
            strokeWidth={2}
            name={metricConfig.throughput.name}
            dot={{ r: 3 }}
          />
        )}
        {metrics.includes("automation_rate") && data[0]?.automation_rate !== undefined && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="automation_rate"
            stroke={metricConfig.automation_rate.color}
            strokeWidth={2}
            name={metricConfig.automation_rate.name}
            dot={{ r: 3 }}
          />
        )}
        {metrics.includes("error_rate") && data[0]?.error_rate !== undefined && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="error_rate"
            stroke={metricConfig.error_rate.color}
            strokeWidth={2}
            name={metricConfig.error_rate.name}
            dot={{ r: 3 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export const OperationalMetricsChart = memo(OperationalMetricsChartComponent);

