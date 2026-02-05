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
import { formatPercentage } from "@/lib/utils/format";
import { AlertTriangle } from "lucide-react";

export interface ConcentrationRiskDataPoint {
  date: string;
  concentrationRisk: number; // percentage
  thresholdLow?: number;
  thresholdMedium?: number;
  thresholdHigh?: number;
}

interface ConcentrationRiskChartProps {
  data: ConcentrationRiskDataPoint[];
  height?: number;
  chartType?: "line" | "area";
  showThresholds?: boolean;
  className?: string;
}

function ConcentrationRiskChartComponent({
  data,
  height = 300,
  chartType = "area",
  showThresholds = true,
  className,
}: ConcentrationRiskChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No concentration risk data available</p>
        </div>
      </div>
    );
  }

  // Get thresholds from first data point or use defaults
  const thresholdLow = data[0]?.thresholdLow ?? 10;
  const thresholdMedium = data[0]?.thresholdMedium ?? 20;
  const thresholdHigh = data[0]?.thresholdHigh ?? 30;

  // Determine current risk level
  const latestRisk = data[data.length - 1]?.concentrationRisk || 0;
  const riskLevel = latestRisk >= thresholdHigh ? "high" : latestRisk >= thresholdMedium ? "medium" : "low";
  const riskColor = riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#f59e0b" : "#10b981";

  const ChartComponent = chartType === "area" ? AreaChart : LineChart;
  const DataComponent = chartType === "area" ? Area : Line;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Concentration Risk Over Time</h3>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            riskLevel === "high" ? "bg-red-100 text-red-700" :
            riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
            "bg-green-100 text-green-700"
          }`}>
            Current: {riskLevel.toUpperCase()} ({formatPercentage(latestRisk / 100)})
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          />
          <YAxis
            className="text-xs"
            tickFormatter={(value) => formatPercentage(value / 100)}
            domain={[0, 'dataMax + 5']}
          />
          <Tooltip
            formatter={(value: number) => formatPercentage(value / 100)}
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

          {/* Risk thresholds */}
          {showThresholds && (
            <>
              <ReferenceLine
                y={thresholdLow}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: "Low Threshold", position: "right" }}
              />
              <ReferenceLine
                y={thresholdMedium}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: "Medium Threshold", position: "right" }}
              />
              <ReferenceLine
                y={thresholdHigh}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: "High Threshold", position: "right" }}
              />
            </>
          )}

          {/* Concentration risk line/area */}
          {chartType === "area" ? (
            <Area
              type="monotone"
              dataKey="concentrationRisk"
              stroke={riskColor}
              fill={riskColor}
              fillOpacity={0.3}
              strokeWidth={2}
              name="Concentration Risk"
            />
          ) : (
            <Line
              type="monotone"
              dataKey="concentrationRisk"
              stroke={riskColor}
              strokeWidth={2}
              dot={{ r: 4, fill: riskColor }}
              name="Concentration Risk"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Risk level indicators */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Low (&lt;{formatPercentage(thresholdLow / 100)})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Medium ({formatPercentage(thresholdLow / 100)} - {formatPercentage(thresholdMedium / 100)})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>High (&gt;{formatPercentage(thresholdMedium / 100)})</span>
        </div>
      </div>
    </div>
  );
}

export const ConcentrationRiskChart = memo(ConcentrationRiskChartComponent);



