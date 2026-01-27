"use client";

import { memo, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface SystemHealthDataPoint {
  timestamp: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_usage?: number;
}

interface SystemHealthChartProps {
  data: SystemHealthDataPoint[];
  height?: number;
  showThresholds?: boolean;
  timeRange?: "1h" | "6h" | "24h" | "7d" | "30d";
  onTimeRangeChange?: (range: "1h" | "6h" | "24h" | "7d" | "30d") => void;
  showAnomalyDetection?: boolean;
}

function SystemHealthChartComponent({
  data,
  height = 300,
  showThresholds = true,
  timeRange,
  onTimeRangeChange,
  showAnomalyDetection = true,
}: SystemHealthChartProps) {
  // Memoize formatters
  const xAxisFormatter = useCallback((value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, []);

  const yAxisFormatter = useCallback((value: number) => `${value}%`, []);

  // Detect anomalies (values outside thresholds)
  const anomalyData = useMemo(() => {
    if (!showAnomalyDetection) return [];
    
    const anomalies: Array<{ timestamp: string; metric: string; value: number }> = [];
    const thresholds = { cpu: 90, memory: 90, disk: 90, network: 90 };
    
    data.forEach((point) => {
      if (point.cpu_usage !== undefined && point.cpu_usage > thresholds.cpu) {
        anomalies.push({ timestamp: point.timestamp, metric: 'CPU', value: point.cpu_usage });
      }
      if (point.memory_usage !== undefined && point.memory_usage > thresholds.memory) {
        anomalies.push({ timestamp: point.timestamp, metric: 'Memory', value: point.memory_usage });
      }
      if (point.disk_usage !== undefined && point.disk_usage > thresholds.disk) {
        anomalies.push({ timestamp: point.timestamp, metric: 'Disk', value: point.disk_usage });
      }
      if (point.network_usage !== undefined && point.network_usage > thresholds.network) {
        anomalies.push({ timestamp: point.timestamp, metric: 'Network', value: point.network_usage });
      }
    });
    
    return anomalies;
  }, [data, showAnomalyDetection]);

  // Memoize processed data
  const chartData = useMemo(() => data, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No system health data available
      </div>
    );
  }

  const timeRangeOptions: Array<{ value: "1h" | "6h" | "24h" | "7d" | "30d"; label: string }> = [
    { value: "1h", label: "1h" },
    { value: "6h", label: "6h" },
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
  ];

  return (
    <div className="space-y-4">
      {/* Time range selector */}
      {timeRange && onTimeRangeChange && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time Range:</span>
            <div className="flex gap-1">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimeRangeChange?.(option.value)}
                  className="h-7 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          {showAnomalyDetection && anomalyData.length > 0 && (
            <div className="text-xs text-amber-600">
              {anomalyData.length} anomaly{anomalyData.length !== 1 ? 'ies' : ''} detected
            </div>
          )}
        </div>
      )}
      
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
          domain={[0, 100]}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip
          formatter={(value: number) => `${value.toFixed(1)}%`}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleString("en-US");
          }}
        />
        <Legend />
        {showThresholds && (
          <>
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label="Warning (80%)" />
            <ReferenceLine y={90} stroke="#dc2626" strokeDasharray="3 3" label="Critical (90%)" />
          </>
        )}
        {data[0]?.cpu_usage !== undefined && (
          <Line
            key="cpu_usage"
            type="monotone"
            dataKey="cpu_usage"
            stroke="#ef4444"
            strokeWidth={2}
            name="CPU Usage"
            dot={{ r: 3 }}
          />
        )}
        {data[0]?.memory_usage !== undefined && (
          <Line
            key="memory_usage"
            type="monotone"
            dataKey="memory_usage"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Memory Usage"
            dot={(props: any) => {
              const isAnomaly = showAnomalyDetection && props.payload?.memory_usage > 90;
              return (
                <circle
                  key={`memory-dot-${props.payload?.timestamp || props.index}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={isAnomaly ? 6 : 3}
                  fill={isAnomaly ? "#dc2626" : "#3b82f6"}
                  stroke={isAnomaly ? "#fff" : "none"}
                  strokeWidth={isAnomaly ? 2 : 0}
                />
              );
            }}
          />
        )}
        {data[0]?.disk_usage !== undefined && (
          <Line
            key="disk_usage"
            type="monotone"
            dataKey="disk_usage"
            stroke="#10b981"
            strokeWidth={2}
            name="Disk Usage"
            dot={{ r: 3 }}
          />
        )}
        {data[0]?.network_usage !== undefined && (
          <Line
            key="network_usage"
            type="monotone"
            dataKey="network_usage"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Network Usage"
            dot={{ r: 3 }}
          />
        )}
      </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const SystemHealthChart = memo(SystemHealthChartComponent);

