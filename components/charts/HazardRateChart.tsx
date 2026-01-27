"use client";
import React, { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from "recharts";
import { Download, Info, TrendingUp, AlertTriangle, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HazardDataPoint {
  time: number;
  hazardRate: number;
  cumulativeHazard: number;
  survivalProbability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface HazardRateChartProps {
  data: HazardDataPoint[];
  title?: string;
  description?: string;
  timeUnit?: "months" | "years" | "days";
  showCumulativeHazard?: boolean;
  showSurvivalOverlay?: boolean;
  showRiskZones?: boolean;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  className?: string;
}

const DEFAULT_THRESHOLDS = {
  low: 0.02,
  medium: 0.05,
  high: 0.10,
};

/**
 * Hazard Rate Chart Component
 * 
 * Visualizes hazard rates over time with risk level indicators
 */
export function HazardRateChart({
  data,
  title = "Hazard Rate Analysis",
  description = "Default hazard rate over time",
  timeUnit = "months",
  showCumulativeHazard = false,
  showSurvivalOverlay = false,
  showRiskZones = true,
  thresholds = DEFAULT_THRESHOLDS,
  className,
}: HazardRateChartProps) {
  const [activeMetric, setActiveMetric] = useState<"hazard" | "cumulative" | "both">("hazard");
  const [hoveredPoint, setHoveredPoint] = useState<HazardDataPoint | null>(null);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const hazardRates = data.map(d => d.hazardRate);
    const maxHazard = Math.max(...hazardRates);
    const avgHazard = hazardRates.reduce((a, b) => a + b, 0) / hazardRates.length;
    const peakTime = data.find(d => d.hazardRate === maxHazard)?.time || 0;
    
    // Find when hazard crosses thresholds
    const highRiskTime = data.find(d => d.hazardRate >= thresholds.high)?.time;
    const criticalTime = data.find(d => d.hazardRate >= thresholds.high * 1.5)?.time;

    // Overall risk assessment
    let overallRisk: "low" | "medium" | "high" | "critical" = "low";
    if (avgHazard >= thresholds.high) overallRisk = "critical";
    else if (avgHazard >= thresholds.medium) overallRisk = "high";
    else if (avgHazard >= thresholds.low) overallRisk = "medium";

    return {
      maxHazard,
      avgHazard,
      peakTime,
      highRiskTime,
      criticalTime,
      overallRisk,
      finalCumulativeHazard: data[data.length - 1]?.cumulativeHazard || 0,
    };
  }, [data, thresholds]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "#22c55e";
      case "medium": return "#f59e0b";
      case "high": return "#ef4444";
      case "critical": return "#dc2626";
      default: return "#6b7280";
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low": return "outline";
      case "medium": return "secondary";
      case "high": return "destructive";
      case "critical": return "destructive";
      default: return "outline";
    }
  };

  const formatTimeLabel = (time: number) => {
    switch (timeUnit) {
      case "years": return `Year ${time}`;
      case "days": return `Day ${time}`;
      default: return `Month ${time}`;
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Time", "Hazard Rate", "Cumulative Hazard", "Survival Probability", "Risk Level"].join(","),
      ...data.map(d => [d.time, d.hazardRate.toFixed(4), d.cumulativeHazard.toFixed(4), d.survivalProbability.toFixed(4), d.riskLevel].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hazard-rate-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Info className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">About Hazard Rate</h4>
                      <p className="text-sm text-muted-foreground">
                        The hazard rate (λ) represents the instantaneous rate of default 
                        at time t, given survival up to that point. Higher hazard rates 
                        indicate increased risk of default.
                      </p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Low Risk: &lt;{(thresholds.low * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span>Medium Risk: {(thresholds.low * 100).toFixed(0)}-{(thresholds.medium * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>High Risk: &gt;{(thresholds.medium * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {stats && (
              <Badge variant={getRiskBadgeVariant(stats.overallRisk)}>
                {stats.overallRisk.charAt(0).toUpperCase() + stats.overallRisk.slice(1)} Risk
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={activeMetric} onValueChange={(v: any) => setActiveMetric(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hazard">Hazard Rate</SelectItem>
                <SelectItem value="cumulative">Cumulative Hazard</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Peak Hazard Rate"
              value={`${(stats.maxHazard * 100).toFixed(2)}%`}
              sublabel={formatTimeLabel(stats.peakTime)}
              icon={<TrendingUp className="h-4 w-4" />}
              color={getRiskColor(data.find(d => d.hazardRate === stats.maxHazard)?.riskLevel || "medium")}
            />
            <StatCard
              label="Average Hazard"
              value={`${(stats.avgHazard * 100).toFixed(2)}%`}
              sublabel="Across period"
            />
            <StatCard
              label="Cumulative Hazard"
              value={stats.finalCumulativeHazard.toFixed(3)}
              sublabel="End of period"
            />
            {stats.highRiskTime && (
              <StatCard
                label="High Risk Point"
                value={formatTimeLabel(stats.highRiskTime)}
                sublabel={`Hazard ≥ ${(thresholds.high * 100).toFixed(0)}%`}
                icon={<AlertTriangle className="h-4 w-4" />}
                color="#ef4444"
              />
            )}
          </div>
        )}

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onMouseMove={(e) => {
                if (e.activePayload && e.activePayload[0]) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              
              {/* Risk zone backgrounds */}
              {showRiskZones && (
                <>
                  <ReferenceArea 
                    yAxisId="left"
                    y1={0} 
                    y2={thresholds.low} 
                    fill="#22c55e" 
                    fillOpacity={0.1} 
                  />
                  <ReferenceArea 
                    yAxisId="left"
                    y1={thresholds.low} 
                    y2={thresholds.medium} 
                    fill="#f59e0b" 
                    fillOpacity={0.1} 
                  />
                  <ReferenceArea 
                    yAxisId="left"
                    y1={thresholds.medium} 
                    y2={thresholds.high} 
                    fill="#ef4444" 
                    fillOpacity={0.1} 
                  />
                  <ReferenceArea 
                    yAxisId="left"
                    y1={thresholds.high} 
                    y2={1} 
                    fill="#dc2626" 
                    fillOpacity={0.1} 
                  />
                </>
              )}

              {/* Threshold lines */}
              <ReferenceLine 
                yAxisId="left"
                y={thresholds.low} 
                stroke="#22c55e" 
                strokeDasharray="3 3" 
                label={{ value: "Low", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                yAxisId="left"
                y={thresholds.medium} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ value: "Medium", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                yAxisId="left"
                y={thresholds.high} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{ value: "High", position: "right", fontSize: 10 }}
              />

              <XAxis 
                dataKey="time" 
                label={{ value: timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1), position: 'insideBottom', offset: -5 }}
              />
              
              <YAxis 
                yAxisId="left"
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                domain={[0, "auto"]}
                label={{ value: 'Hazard Rate', angle: -90, position: 'insideLeft' }}
              />

              {(activeMetric === "cumulative" || activeMetric === "both") && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, "auto"]}
                  label={{ value: 'Cumulative Hazard', angle: 90, position: 'insideRight' }}
                />
              )}

              <Tooltip content={<CustomTooltip thresholds={thresholds} timeUnit={timeUnit} />} />

              {(activeMetric === "hazard" || activeMetric === "both") && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="hazardRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  dot={false}
                  activeDot={{ r: 6, fill: "#3b82f6" }}
                  name="Hazard Rate"
                />
              )}

              {(activeMetric === "cumulative" || activeMetric === "both") && (
                <Line
                  yAxisId={activeMetric === "both" ? "right" : "left"}
                  type="monotone"
                  dataKey="cumulativeHazard"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: "#8b5cf6" }}
                  name="Cumulative Hazard"
                />
              )}

              {showSurvivalOverlay && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="survivalProbability"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Survival Probability"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Hovered Point Details */}
        {hoveredPoint && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-muted-foreground">{formatTimeLabel(hoveredPoint.time)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Hazard: </span>
                <span className="font-medium">{(hoveredPoint.hazardRate * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Cumulative: </span>
                <span className="font-medium">{hoveredPoint.cumulativeHazard.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Survival: </span>
                <span className="font-medium">{(hoveredPoint.survivalProbability * 100).toFixed(1)}%</span>
              </div>
            </div>
            <Badge 
              variant={getRiskBadgeVariant(hoveredPoint.riskLevel)}
              style={{ backgroundColor: getRiskColor(hoveredPoint.riskLevel), color: "white" }}
            >
              {hoveredPoint.riskLevel.charAt(0).toUpperCase() + hoveredPoint.riskLevel.slice(1)} Risk
            </Badge>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-muted-foreground">Hazard Rate</span>
          </div>
          {(activeMetric === "cumulative" || activeMetric === "both") && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500" />
              <span className="text-muted-foreground">Cumulative Hazard</span>
            </div>
          )}
          {showSurvivalOverlay && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-500 border-dashed" style={{ borderTop: "2px dashed" }} />
              <span className="text-muted-foreground">Survival Probability</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  sublabel,
  icon,
  color,
}: { 
  label: string; 
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label, thresholds, timeUnit }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as HazardDataPoint;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium mb-2">
        {timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)} {label}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hazard Rate:</span>
          <span className="font-medium">{(data.hazardRate * 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cumulative Hazard:</span>
          <span className="font-medium">{data.cumulativeHazard.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Survival Prob:</span>
          <span className="font-medium">{(data.survivalProbability * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t">
          <span className="text-muted-foreground">Risk Level:</span>
          <Badge variant="outline" className="text-xs">
            {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Demo data generator for testing
export function generateHazardData(months: number = 60): HazardDataPoint[] {
  const data: HazardDataPoint[] = [];
  let cumulativeHazard = 0;

  for (let i = 1; i <= months; i++) {
    // Simulate increasing hazard rate with some variation
    const baseHazard = 0.01 + (i / months) * 0.08 + Math.random() * 0.02;
    const hazardRate = Math.min(baseHazard, 0.15);
    
    cumulativeHazard += hazardRate;
    const survivalProbability = Math.exp(-cumulativeHazard);

    let riskLevel: "low" | "medium" | "high" | "critical";
    if (hazardRate < 0.02) riskLevel = "low";
    else if (hazardRate < 0.05) riskLevel = "medium";
    else if (hazardRate < 0.10) riskLevel = "high";
    else riskLevel = "critical";

    data.push({
      time: i,
      hazardRate,
      cumulativeHazard,
      survivalProbability,
      riskLevel,
    });
  }

  return data;
}

export default HazardRateChart;

