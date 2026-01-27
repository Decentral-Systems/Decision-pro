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
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { Download, AlertTriangle, TrendingUp, Shield, Users, AlertCircle } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export-service";

interface RiskCategory {
  level: "very_low" | "low" | "medium" | "high" | "very_high";
  label: string;
  count: number;
  percentage: number;
  averageScore: number;
  defaultRate: number;
  color: string;
}

interface RiskTrendData {
  period: string;
  veryLow: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  averageRisk: number;
}

interface RiskScoreData {
  score: number;
  riskLevel: string;
  count: number;
}

interface RegionalRisk {
  region: string;
  averageScore: number;
  riskLevel: string;
  customerCount: number;
  defaultRate: number;
}

interface RiskDistributionProps {
  categories: RiskCategory[];
  trends?: RiskTrendData[];
  scoreDistribution?: RiskScoreData[];
  regionalData?: RegionalRisk[];
  title?: string;
  description?: string;
  className?: string;
}

const RISK_COLORS = {
  very_low: "#22c55e",
  low: "#84cc16",
  medium: "#f59e0b",
  high: "#f97316",
  very_high: "#ef4444",
};

/**
 * Risk Distribution Analytics Component
 * 
 * Visualizes portfolio risk distribution and trends
 */
export function RiskDistribution({
  categories,
  trends,
  scoreDistribution,
  regionalData,
  title = "Risk Distribution Analysis",
  description = "Portfolio risk metrics and distribution",
  className,
}: RiskDistributionProps) {
  const [viewType, setViewType] = useState<"distribution" | "trends" | "regional">("distribution");

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (categories.length === 0) return null;

    const totalCustomers = categories.reduce((sum, c) => sum + c.count, 0);
    const highRiskCount = categories
      .filter(c => c.level === "high" || c.level === "very_high")
      .reduce((sum, c) => sum + c.count, 0);
    const lowRiskCount = categories
      .filter(c => c.level === "low" || c.level === "very_low")
      .reduce((sum, c) => sum + c.count, 0);
    
    const weightedAvgScore = categories.reduce((sum, c) => sum + c.averageScore * c.count, 0) / totalCustomers;
    const avgDefaultRate = categories.reduce((sum, c) => sum + c.defaultRate * c.count, 0) / totalCustomers;

    return {
      totalCustomers,
      highRiskCount,
      lowRiskCount,
      highRiskPercentage: (highRiskCount / totalCustomers) * 100,
      lowRiskPercentage: (lowRiskCount / totalCustomers) * 100,
      weightedAvgScore,
      avgDefaultRate,
    };
  }, [categories]);

  // Radial bar data for gauge
  const gaugeData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.label,
      value: cat.percentage,
      fill: cat.color,
    }));
  }, [categories]);

  const handleExport = () => {
    const exportData = categories.map(c => ({
      "Risk Level": c.label,
      "Count": c.count,
      "Percentage": `${c.percentage.toFixed(1)}%`,
      "Average Score": c.averageScore.toFixed(0),
      "Default Rate": `${(c.defaultRate * 100).toFixed(2)}%`,
    }));

    exportToExcel(exportData, {
      filename: `risk-distribution-${Date.now()}`,
      sheetName: "Risk Distribution",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show summary cards even if empty - helps user understand what data is expected */}
        {summary ? (
          <>
            {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              label="Total Customers"
              value={summary.totalCustomers.toLocaleString()}
            />
            <SummaryCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="High Risk"
              value={`${summary.highRiskPercentage.toFixed(1)}%`}
              sublabel={`${summary.highRiskCount} customers`}
              color="#ef4444"
            />
            <SummaryCard
              icon={<Shield className="h-4 w-4" />}
              label="Low Risk"
              value={`${summary.lowRiskPercentage.toFixed(1)}%`}
              sublabel={`${summary.lowRiskCount} customers`}
              color="#22c55e"
            />
            <SummaryCard
              label="Avg Default Rate"
              value={`${(summary.avgDefaultRate * 100).toFixed(2)}%`}
              color={summary.avgDefaultRate > 0.05 ? "#ef4444" : "#22c55e"}
            />
          </div>
          </>
        ) : (
          <div className="py-8 text-center border rounded-lg bg-muted/50">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium mb-1">No risk distribution data available</p>
            <p className="text-sm text-muted-foreground">
              Risk analytics data will appear here once customer data is available in the database.
            </p>
          </div>
        )}

        {/* View Tabs - Always show tabs even if empty */}
        <Tabs value={viewType} onValueChange={(v: any) => setViewType(v)}>
          <TabsList>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="pt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bar Chart Distribution */}
              <div>
                <h4 className="font-medium mb-4">Risk Category Distribution</h4>
                {categories.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={categories}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="label" />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === "percentage") return [`${value.toFixed(1)}%`, "Percentage"];
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                          {categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>No distribution data available</p>
                  </div>
                )}
              </div>

              {/* Pie Chart */}
              <div>
                <h4 className="font-medium mb-4">Portfolio Composition</h4>
                {categories.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="label"
                          label={({ label, percentage }) => `${percentage.toFixed(0)}%`}
                        >
                          {categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} customers (${props.payload.percentage.toFixed(1)}%)`,
                            props.payload.label
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>No composition data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Score Distribution Histogram */}
            {scoreDistribution && scoreDistribution.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-4">Credit Score Distribution</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="score" 
                        label={{ value: 'Credit Score', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Risk Category Details */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">Risk Category Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {categories.map(cat => (
                  <div
                    key={cat.level}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: cat.color }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{cat.count}</p>
                    <p className="text-sm text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                    <div className="mt-2 pt-2 border-t text-xs">
                      <p>Avg Score: {cat.averageScore.toFixed(0)}</p>
                      <p>Default Rate: {(cat.defaultRate * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="pt-4">
            {trends && trends.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} customers`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="veryLow" stackId="a" fill={RISK_COLORS.very_low} name="Very Low" />
                    <Bar dataKey="low" stackId="a" fill={RISK_COLORS.low} name="Low" />
                    <Bar dataKey="medium" stackId="a" fill={RISK_COLORS.medium} name="Medium" />
                    <Bar dataKey="high" stackId="a" fill={RISK_COLORS.high} name="High" />
                    <Bar dataKey="veryHigh" stackId="a" fill={RISK_COLORS.very_high} name="Very High" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No trend data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="regional" className="pt-4">
            {regionalData && regionalData.length > 0 ? (
              <div className="space-y-6">
                {/* Scatter Plot */}
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        dataKey="averageScore" 
                        name="Average Score"
                        label={{ value: 'Average Credit Score', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="defaultRate" 
                        name="Default Rate"
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        label={{ value: 'Default Rate', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis type="number" dataKey="customerCount" range={[50, 500]} name="Customers" />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === "Default Rate") return [`${(value * 100).toFixed(2)}%`, name];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Score: ${label}`}
                      />
                      <Scatter 
                        name="Regions" 
                        data={regionalData} 
                        fill="#3b82f6"
                      >
                        {regionalData.map((entry, index) => {
                          const color = entry.riskLevel === "high" ? "#ef4444" 
                            : entry.riskLevel === "low" ? "#22c55e" 
                            : "#f59e0b";
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Regional Table */}
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Region</th>
                        <th className="p-3 text-right font-medium">Customers</th>
                        <th className="p-3 text-right font-medium">Avg Score</th>
                        <th className="p-3 text-right font-medium">Default Rate</th>
                        <th className="p-3 text-center font-medium">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.map((region, index) => (
                        <tr 
                          key={region.region}
                          className={cn("border-t", index % 2 === 0 && "bg-muted/30")}
                        >
                          <td className="p-3 font-medium">{region.region}</td>
                          <td className="p-3 text-right">{region.customerCount.toLocaleString()}</td>
                          <td className="p-3 text-right">{region.averageScore.toFixed(0)}</td>
                          <td className="p-3 text-right">{(region.defaultRate * 100).toFixed(2)}%</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={region.riskLevel === "high" ? "destructive" : "outline"}
                              className={region.riskLevel === "low" ? "bg-green-100 text-green-700 border-green-300" : ""}
                            >
                              {region.riskLevel}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No regional data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper Components
function SummaryCard({ 
  icon, 
  label, 
  value,
  sublabel,
  color,
}: { 
  icon?: React.ReactNode;
  label: string; 
  value: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

// Demo data generator
export function generateRiskDistributionData(): {
  categories: RiskCategory[];
  trends: RiskTrendData[];
  scoreDistribution: RiskScoreData[];
  regionalData: RegionalRisk[];
} {
  const categories: RiskCategory[] = [
    { level: "very_low", label: "Very Low", count: 450, percentage: 30, averageScore: 780, defaultRate: 0.005, color: RISK_COLORS.very_low },
    { level: "low", label: "Low", count: 375, percentage: 25, averageScore: 720, defaultRate: 0.015, color: RISK_COLORS.low },
    { level: "medium", label: "Medium", count: 300, percentage: 20, averageScore: 650, defaultRate: 0.035, color: RISK_COLORS.medium },
    { level: "high", label: "High", count: 225, percentage: 15, averageScore: 580, defaultRate: 0.08, color: RISK_COLORS.high },
    { level: "very_high", label: "Very High", count: 150, percentage: 10, averageScore: 500, defaultRate: 0.15, color: RISK_COLORS.very_high },
  ];

  const trends: RiskTrendData[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  for (const month of months) {
    trends.push({
      period: month,
      veryLow: Math.floor(40 + Math.random() * 20),
      low: Math.floor(30 + Math.random() * 15),
      medium: Math.floor(20 + Math.random() * 10),
      high: Math.floor(10 + Math.random() * 10),
      veryHigh: Math.floor(5 + Math.random() * 5),
      averageRisk: 0.3 + Math.random() * 0.2,
    });
  }

  const scoreDistribution: RiskScoreData[] = [];
  for (let score = 300; score <= 850; score += 50) {
    scoreDistribution.push({
      score,
      riskLevel: score < 550 ? "high" : score < 700 ? "medium" : "low",
      count: Math.floor(50 + Math.random() * 150 * (score > 600 ? 1.5 : 0.5)),
    });
  }

  const regionalData: RegionalRisk[] = [
    { region: "Addis Ababa", averageScore: 710, riskLevel: "low", customerCount: 500, defaultRate: 0.02 },
    { region: "Oromia", averageScore: 650, riskLevel: "medium", customerCount: 350, defaultRate: 0.04 },
    { region: "Amhara", averageScore: 630, riskLevel: "medium", customerCount: 280, defaultRate: 0.045 },
    { region: "SNNPR", averageScore: 600, riskLevel: "medium", customerCount: 220, defaultRate: 0.05 },
    { region: "Tigray", averageScore: 580, riskLevel: "high", customerCount: 150, defaultRate: 0.065 },
  ];

  return { categories, trends, scoreDistribution, regionalData };
}

export default RiskDistribution;


