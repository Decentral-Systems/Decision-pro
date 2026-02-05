"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Legend
} from "recharts";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface SurvivalDataPoint {
  month: number;
  survivalProbability: number;
  confidenceLower?: number;
  confidenceUpper?: number;
  hazardRate?: number;
}

interface SurvivalCurveProps {
  data: SurvivalDataPoint[];
  title?: string;
  description?: string;
  showConfidenceInterval?: boolean;
  showHazardRate?: boolean;
  selectedPoint?: number | null;
  onPointSelect?: (month: number | null) => void;
  className?: string;
}

/**
 * Interactive Survival Curve Component
 * 
 * Displays survival probability over time with hover tooltips and zoom
 */
export function SurvivalCurve({
  data,
  title = "Survival Analysis",
  description = "Probability of not defaulting over time",
  showConfidenceInterval = true,
  showHazardRate = false,
  selectedPoint,
  onPointSelect,
  className,
}: SurvivalCurveProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewRange, setViewRange] = useState<"6m" | "12m" | "24m" | "all">("all");

  const filteredData = useMemo(() => {
    if (viewRange === "all") return data;
    const maxMonth = viewRange === "6m" ? 6 : viewRange === "12m" ? 12 : 24;
    return data.filter(d => d.month <= maxMonth);
  }, [data, viewRange]);

  const chartHeight = 300 * zoomLevel;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleClick = (data: any) => {
    if (data && data.activePayload) {
      const month = data.activePayload[0]?.payload?.month;
      onPointSelect?.(month === selectedPoint ? null : month);
    }
  };

  // Find key metrics
  const metrics = useMemo(() => {
    if (data.length === 0) return null;
    
    const medianSurvival = data.find(d => d.survivalProbability <= 0.5)?.month;
    const survival6m = data.find(d => d.month === 6)?.survivalProbability;
    const survival12m = data.find(d => d.month === 12)?.survivalProbability;
    const finalSurvival = data[data.length - 1]?.survivalProbability;
    
    return { medianSurvival, survival6m, survival12m, finalSurvival };
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewRange} onValueChange={(v: any) => setViewRange(v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
                <SelectItem value="24m">24 Months</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleResetZoom} className="h-8 w-8">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <MetricBadge 
              label="6M Survival" 
              value={metrics.survival6m ? `${(metrics.survival6m * 100).toFixed(1)}%` : 'N/A'} 
            />
            <MetricBadge 
              label="12M Survival" 
              value={metrics.survival12m ? `${(metrics.survival12m * 100).toFixed(1)}%` : 'N/A'} 
            />
            <MetricBadge 
              label="Final Survival" 
              value={metrics.finalSurvival ? `${(metrics.finalSurvival * 100).toFixed(1)}%` : 'N/A'} 
            />
            <MetricBadge 
              label="Median Survival" 
              value={metrics.medianSurvival ? `${metrics.medianSurvival} months` : '>Term'} 
            />
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart 
            data={filteredData} 
            onClick={handleClick}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis 
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Confidence Interval */}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                name="95% CI Upper"
              />
            )}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="confidenceLower"
                stroke="none"
                fill="#fff"
                fillOpacity={1}
                name="95% CI Lower"
              />
            )}

            {/* Main Survival Curve */}
            <Line
              type="stepAfter"
              dataKey="survivalProbability"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
              name="Survival Probability"
            />

            {/* Hazard Rate */}
            {showHazardRate && (
              <Line
                type="monotone"
                dataKey="hazardRate"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                yAxisId="right"
                name="Hazard Rate"
              />
            )}

            {/* Reference lines */}
            <ReferenceLine y={0.5} stroke="#94a3b8" strokeDasharray="3 3" />
            
            {/* Selected point marker */}
            {selectedPoint && (
              <ReferenceLine x={selectedPoint} stroke="#f59e0b" strokeWidth={2} />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Selected Point Details */}
        {selectedPoint && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Month {selectedPoint}: {' '}
              {((filteredData.find(d => d.month === selectedPoint)?.survivalProbability || 0) * 100).toFixed(2)}% 
              survival probability
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">Month {label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.dataKey.includes('robability') || entry.dataKey.includes('Upper') || entry.dataKey.includes('Lower')
              ? `${(entry.value * 100).toFixed(2)}%`
              : entry.value?.toFixed(4)
            }
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Generate sample survival curve data
 */
export function generateSurvivalData(
  months: number = 24,
  baseHazard: number = 0.02
): SurvivalDataPoint[] {
  const data: SurvivalDataPoint[] = [];
  let survival = 1;

  for (let month = 0; month <= months; month++) {
    const hazard = baseHazard * (1 + month * 0.01); // Slightly increasing hazard
    survival *= (1 - hazard);
    
    // Add some noise for confidence intervals
    const noise = 0.05;
    
    data.push({
      month,
      survivalProbability: Math.max(0, survival),
      confidenceLower: Math.max(0, survival - noise),
      confidenceUpper: Math.min(1, survival + noise),
      hazardRate: hazard,
    });
  }

  return data;
}

export default SurvivalCurve;


