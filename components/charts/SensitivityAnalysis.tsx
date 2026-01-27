"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Download, ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-service";

interface SensitivityFactor {
  name: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  lowOutcome: number;
  baseOutcome: number;
  highOutcome: number;
  impact: number; // Percentage impact
  elasticity: number; // Sensitivity elasticity
}

interface SensitivityScenario {
  name: string;
  values: Record<string, number>;
}

interface SensitivityAnalysisProps {
  factors: SensitivityFactor[];
  baseOutcome: number;
  scenarios?: SensitivityScenario[];
  title?: string;
  description?: string;
  outcomeLabel?: string;
  className?: string;
}

/**
 * Sensitivity Analysis Component
 * 
 * Tornado chart and sensitivity visualizations for risk analysis
 */
export function SensitivityAnalysis({
  factors,
  baseOutcome,
  scenarios,
  title = "Sensitivity Analysis",
  description = "Impact of input variations on outcomes",
  outcomeLabel = "Outcome",
  className,
}: SensitivityAnalysisProps) {
  const [viewType, setViewType] = useState<"tornado" | "spider" | "table">("tornado");
  const [sortBy, setSortBy] = useState<"impact" | "name">("impact");

  // Sort factors by impact
  const sortedFactors = useMemo(() => {
    const sorted = [...factors];
    if (sortBy === "impact") {
      sorted.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [factors, sortBy]);

  // Prepare tornado chart data
  const tornadoData = useMemo(() => {
    return sortedFactors.map(factor => ({
      name: factor.name,
      lowDelta: factor.lowOutcome - baseOutcome,
      highDelta: factor.highOutcome - baseOutcome,
      lowValue: factor.lowValue,
      highValue: factor.highValue,
      baseValue: factor.baseValue,
      impact: factor.impact,
      elasticity: factor.elasticity,
    }));
  }, [sortedFactors, baseOutcome]);

  // Prepare spider chart data
  const spiderData = useMemo(() => {
    const percentages = [-20, -10, 0, 10, 20];
    return percentages.map(pct => {
      const point: Record<string, number> = { percentage: pct };
      factors.forEach(factor => {
        const range = factor.highValue - factor.lowValue;
        const normalizedPct = (pct + 20) / 40; // 0 to 1
        const value = factor.lowValue + range * normalizedPct;
        
        // Linear interpolation for outcome
        if (pct <= 0) {
          point[factor.name] = factor.lowOutcome + 
            ((factor.baseOutcome - factor.lowOutcome) * (pct + 20) / 20);
        } else {
          point[factor.name] = factor.baseOutcome + 
            ((factor.highOutcome - factor.baseOutcome) * pct / 20);
        }
      });
      return point;
    });
  }, [factors]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const impacts = factors.map(f => Math.abs(f.impact));
    const maxImpact = Math.max(...impacts);
    const avgImpact = impacts.reduce((a, b) => a + b, 0) / impacts.length;
    const mostSensitive = factors.reduce((a, b) => 
      Math.abs(a.impact) > Math.abs(b.impact) ? a : b
    );
    const leastSensitive = factors.reduce((a, b) => 
      Math.abs(a.impact) < Math.abs(b.impact) ? a : b
    );

    return {
      maxImpact,
      avgImpact,
      mostSensitive,
      leastSensitive,
      totalFactors: factors.length,
    };
  }, [factors]);

  const handleExport = async (format: "pdf" | "excel") => {
    const exportData = sortedFactors.map(f => ({
      Factor: f.name,
      "Base Value": f.baseValue,
      "Low Value": f.lowValue,
      "High Value": f.highValue,
      "Low Outcome": f.lowOutcome.toFixed(2),
      "Base Outcome": f.baseOutcome.toFixed(2),
      "High Outcome": f.highOutcome.toFixed(2),
      "Impact (%)": f.impact.toFixed(2),
      Elasticity: f.elasticity.toFixed(3),
    }));

    if (format === "excel") {
      exportToExcel(exportData, {
        filename: `sensitivity-analysis-${Date.now()}`,
        sheetName: "Sensitivity",
      });
    } else {
      await exportToPDF(exportData, {
        title: "Sensitivity Analysis Report",
        filename: `sensitivity-analysis-${Date.now()}`,
      });
    }
  };

  const getImpactColor = (impact: number) => {
    const absImpact = Math.abs(impact);
    if (absImpact > 20) return "#ef4444";
    if (absImpact > 10) return "#f59e0b";
    if (absImpact > 5) return "#3b82f6";
    return "#22c55e";
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (impact < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === "impact" ? "name" : "impact")}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Sort by {sortBy === "impact" ? "Name" : "Impact"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Most Sensitive</p>
            <p className="font-medium">{summary.mostSensitive.name}</p>
            <p className="text-xs text-muted-foreground">
              {summary.mostSensitive.impact > 0 ? "+" : ""}{summary.mostSensitive.impact.toFixed(1)}% impact
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Least Sensitive</p>
            <p className="font-medium">{summary.leastSensitive.name}</p>
            <p className="text-xs text-muted-foreground">
              {summary.leastSensitive.impact > 0 ? "+" : ""}{summary.leastSensitive.impact.toFixed(1)}% impact
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Max Impact</p>
            <p className="font-medium">{summary.maxImpact.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Base Outcome</p>
            <p className="font-medium">{baseOutcome.toLocaleString()}</p>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={viewType} onValueChange={(v: any) => setViewType(v)}>
          <TabsList>
            <TabsTrigger value="tornado">Tornado Chart</TabsTrigger>
            <TabsTrigger value="spider">Spider Chart</TabsTrigger>
            <TabsTrigger value="table">Data Table</TabsTrigger>
          </TabsList>

          <TabsContent value="tornado" className="pt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tornadoData}
                  layout="vertical"
                  margin={{ top: 20, right: 40, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    type="number"
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => v.toFixed(0)}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<TornadoTooltip baseOutcome={baseOutcome} />} />
                  <ReferenceLine x={0} stroke="#000" strokeWidth={2} />
                  <Bar dataKey="lowDelta" stackId="a" fill="#ef4444" name="Low">
                    {tornadoData.map((entry, index) => (
                      <Cell 
                        key={`low-${index}`} 
                        fill={entry.lowDelta < 0 ? "#ef4444" : "#22c55e"} 
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="highDelta" stackId="b" fill="#22c55e" name="High">
                    {tornadoData.map((entry, index) => (
                      <Cell 
                        key={`high-${index}`} 
                        fill={entry.highDelta > 0 ? "#22c55e" : "#ef4444"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 text-sm mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>Negative Impact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>Positive Impact</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="spider" className="pt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={spiderData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="percentage" 
                    tickFormatter={(v) => `${v}%`}
                    label={{ value: 'Input Change (%)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: outcomeLabel, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<SpiderTooltip />} />
                  <Legend />
                  <ReferenceLine x={0} stroke="#000" strokeDasharray="5 5" />
                  <ReferenceLine y={baseOutcome} stroke="#666" strokeDasharray="5 5" />
                  {factors.slice(0, 6).map((factor, index) => (
                    <Line
                      key={factor.name}
                      type="monotone"
                      dataKey={factor.name}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="table" className="pt-4">
            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-medium">Factor</th>
                    <th className="p-3 text-right font-medium">Low</th>
                    <th className="p-3 text-right font-medium">Base</th>
                    <th className="p-3 text-right font-medium">High</th>
                    <th className="p-3 text-right font-medium">Low Outcome</th>
                    <th className="p-3 text-right font-medium">High Outcome</th>
                    <th className="p-3 text-right font-medium">Impact</th>
                    <th className="p-3 text-center font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFactors.map((factor, index) => (
                    <tr 
                      key={factor.name}
                      className={cn("border-t", index % 2 === 0 && "bg-muted/30")}
                    >
                      <td className="p-3 font-medium">{factor.name}</td>
                      <td className="p-3 text-right">{factor.lowValue.toLocaleString()}</td>
                      <td className="p-3 text-right">{factor.baseValue.toLocaleString()}</td>
                      <td className="p-3 text-right">{factor.highValue.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-600">
                        {factor.lowOutcome.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {factor.highOutcome.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: getImpactColor(factor.impact) + "20",
                            borderColor: getImpactColor(factor.impact),
                            color: getImpactColor(factor.impact)
                          }}
                        >
                          {factor.impact > 0 ? "+" : ""}{factor.impact.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {getImpactIcon(factor.impact)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Scenarios */}
        {scenarios && scenarios.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Scenario Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scenarios.map((scenario, index) => {
                // Calculate scenario outcome (simplified)
                const outcomeChange = Object.entries(scenario.values).reduce((sum, [key, value]) => {
                  const factor = factors.find(f => f.name === key);
                  if (factor) {
                    const pctChange = (value - factor.baseValue) / factor.baseValue;
                    return sum + (factor.elasticity * pctChange * baseOutcome);
                  }
                  return sum;
                }, 0);
                const scenarioOutcome = baseOutcome + outcomeChange;
                const pctChange = ((scenarioOutcome - baseOutcome) / baseOutcome) * 100;

                return (
                  <div 
                    key={scenario.name}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{scenario.name}</span>
                      <Badge variant={pctChange >= 0 ? "default" : "destructive"}>
                        {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      {scenarioOutcome.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vs Base: {baseOutcome.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom Tooltips
function TornadoTooltip({ active, payload, label, baseOutcome }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base Value:</span>
          <span>{data.baseValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Low ({data.lowValue.toLocaleString()}):</span>
          <span>{(baseOutcome + data.lowDelta).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>High ({data.highValue.toLocaleString()}):</span>
          <span>{(baseOutcome + data.highDelta).toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-1 border-t">
          <span className="text-muted-foreground">Impact Range:</span>
          <span>{Math.abs(data.highDelta - data.lowDelta).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function SpiderTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">Input Change: {label}%</p>
      <div className="space-y-1 text-sm">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Demo data generator
export function generateSensitivityData(): {
  factors: SensitivityFactor[];
  scenarios: SensitivityScenario[];
} {
  const factors: SensitivityFactor[] = [
    {
      name: "Interest Rate",
      baseValue: 0.15,
      lowValue: 0.12,
      highValue: 0.20,
      lowOutcome: 85000,
      baseOutcome: 80000,
      highOutcome: 72000,
      impact: -10.0,
      elasticity: -0.8,
    },
    {
      name: "Loan Amount",
      baseValue: 100000,
      lowValue: 80000,
      highValue: 120000,
      lowOutcome: 75000,
      baseOutcome: 80000,
      highOutcome: 85000,
      impact: 6.25,
      elasticity: 0.25,
    },
    {
      name: "Monthly Income",
      baseValue: 25000,
      lowValue: 20000,
      highValue: 30000,
      lowOutcome: 70000,
      baseOutcome: 80000,
      highOutcome: 95000,
      impact: 18.75,
      elasticity: 0.75,
    },
    {
      name: "Credit Score",
      baseValue: 700,
      lowValue: 600,
      highValue: 800,
      lowOutcome: 65000,
      baseOutcome: 80000,
      highOutcome: 92000,
      impact: 15.0,
      elasticity: 0.85,
    },
    {
      name: "Loan Term",
      baseValue: 36,
      lowValue: 24,
      highValue: 48,
      lowOutcome: 78000,
      baseOutcome: 80000,
      highOutcome: 82000,
      impact: 2.5,
      elasticity: 0.15,
    },
    {
      name: "Default Rate",
      baseValue: 0.05,
      lowValue: 0.02,
      highValue: 0.10,
      lowOutcome: 90000,
      baseOutcome: 80000,
      highOutcome: 68000,
      impact: -15.0,
      elasticity: -3.0,
    },
  ];

  const scenarios: SensitivityScenario[] = [
    {
      name: "Optimistic",
      values: {
        "Interest Rate": 0.12,
        "Monthly Income": 30000,
        "Credit Score": 750,
        "Default Rate": 0.03,
      },
    },
    {
      name: "Pessimistic",
      values: {
        "Interest Rate": 0.20,
        "Monthly Income": 22000,
        "Credit Score": 650,
        "Default Rate": 0.08,
      },
    },
    {
      name: "Stress Test",
      values: {
        "Interest Rate": 0.22,
        "Monthly Income": 20000,
        "Credit Score": 600,
        "Default Rate": 0.12,
      },
    },
  ];

  return { factors, scenarios };
}

export default SensitivityAnalysis;


