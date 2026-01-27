"use client";

import { memo } from "react";
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
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ViolationDataPoint {
  timestamp: string;
  critical_violations?: number;
  high_violations?: number;
  medium_violations?: number;
  low_violations?: number;
  total_violations?: number;
  compliance_rate?: number;
}

interface ComplianceViolationsTrendChartProps {
  data: ViolationDataPoint[];
  height?: number;
  chartType?: "line" | "area";
  showComplianceRate?: boolean;
  className?: string;
}

function ComplianceViolationsTrendChartComponent({
  data,
  height = 300,
  chartType = "area",
  showComplianceRate = true,
  className,
}: ComplianceViolationsTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No compliance violations data available</p>
        </div>
      </div>
    );
  }

  // Calculate trend
  const firstValue = data[0]?.total_violations || 0;
  const lastValue = data[data.length - 1]?.total_violations || 0;
  const trendDirection = lastValue < firstValue ? "down" : lastValue > firstValue ? "up" : "stable";
  const trendPercentage = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  const ChartComponent = chartType === "area" ? AreaChart : LineChart;

  return (
    <div className={className}>
      {/* Trend Indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Violations Trend</h4>
          {trendDirection === "down" ? (
            <div className="flex items-center text-green-600 text-xs">
              <TrendingDown className="h-4 w-4 mr-1" />
              <span>{Math.abs(trendPercentage).toFixed(1)}% decrease</span>
            </div>
          ) : trendDirection === "up" ? (
            <div className="flex items-center text-red-600 text-xs">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{Math.abs(trendPercentage).toFixed(1)}% increase</span>
            </div>
          ) : (
            <div className="flex items-center text-muted-foreground text-xs">
              <span>No change</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {data.length} data points
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="timestamp"
            className="text-xs"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }}
          />
          <YAxis
            yAxisId="left"
            className="text-xs"
            label={{ value: "Violations", angle: -90, position: "insideLeft" }}
          />
          {showComplianceRate && (
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              domain={[0, 100]}
              label={{ value: "Compliance Rate (%)", angle: 90, position: "insideRight" }}
            />
          )}
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "compliance_rate") {
                return [`${value.toFixed(1)}%`, "Compliance Rate"];
              }
              return [value, name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())];
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            }}
          />
          <Legend />

          {/* Violation severity levels */}
          {chartType === "area" ? (
            <>
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="critical_violations"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Critical Violations"
                stackId="violations"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="high_violations"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.5}
                strokeWidth={2}
                name="High Violations"
                stackId="violations"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="medium_violations"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.4}
                strokeWidth={2}
                name="Medium Violations"
                stackId="violations"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="low_violations"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Low Violations"
                stackId="violations"
              />
            </>
          ) : (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="critical_violations"
                stroke="#ef4444"
                strokeWidth={2}
                name="Critical Violations"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="high_violations"
                stroke="#f97316"
                strokeWidth={2}
                name="High Violations"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="medium_violations"
                stroke="#eab308"
                strokeWidth={2}
                name="Medium Violations"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="low_violations"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Low Violations"
              />
            </>
          )}

          {/* Compliance rate line */}
          {showComplianceRate && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="compliance_rate"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Compliance Rate"
              dot={{ r: 4, fill: "#10b981" }}
            />
          )}

          {/* Reference line for target compliance rate */}
          {showComplianceRate && (
            <ReferenceLine
              yAxisId="right"
              y={95}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: "Target: 95%", position: "right", fill: "#10b981" }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Legend for severity levels */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}

export const ComplianceViolationsTrendChart = memo(ComplianceViolationsTrendChartComponent);

