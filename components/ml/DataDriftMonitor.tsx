"use client";
import React, { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Download, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Activity } from "lucide-react";

interface FeatureDrift {
  feature: string;
  category: string;
  baselineMean: number;
  currentMean: number;
  psiValue: number;
  driftStatus: "no_drift" | "minor" | "moderate" | "severe";
  importance: number;
}

interface DriftTrend {
  date: string;
  overallDrift: number;
  featuresDrifted: number;
  predictionDrift: number;
}

interface ModelDriftSummary {
  modelId: string;
  modelName: string;
  overallDriftScore: number;
  featuresDrifted: number;
  totalFeatures: number;
  lastChecked: string;
  status: "healthy" | "warning" | "critical";
  recommendations: string[];
}

interface DataDriftMonitorProps {
  summary: ModelDriftSummary;
  featureDrifts: FeatureDrift[];
  trends?: DriftTrend[];
  title?: string;
  description?: string;
  className?: string;
  onRetrain?: () => void;
  onRefresh?: () => void;
}

const DRIFT_COLORS = {
  no_drift: "#22c55e",
  minor: "#84cc16",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

const PSI_THRESHOLDS = {
  safe: 0.1,
  moderate: 0.25,
};

/**
 * Data Drift Monitor Component
 * 
 * Monitors and visualizes data drift for ML models
 */
export function DataDriftMonitor({
  summary,
  featureDrifts,
  trends,
  title = "Data Drift Monitoring",
  description = "Monitor feature and prediction drift in real-time",
  className,
  onRetrain,
  onRefresh,
}: DataDriftMonitorProps) {
  const [viewType, setViewType] = useState<"overview" | "features" | "trends">("overview");
  const [sortBy, setSortBy] = useState<"psi" | "importance">("psi");

  // Calculate drift statistics
  const driftStats = useMemo(() => {
    const severeDrift = featureDrifts.filter(f => f.driftStatus === "severe").length;
    const moderateDrift = featureDrifts.filter(f => f.driftStatus === "moderate").length;
    const minorDrift = featureDrifts.filter(f => f.driftStatus === "minor").length;
    const noDrift = featureDrifts.filter(f => f.driftStatus === "no_drift").length;
    
    const avgPSI = featureDrifts.reduce((sum, f) => sum + f.psiValue, 0) / featureDrifts.length;
    const maxPSI = Math.max(...featureDrifts.map(f => f.psiValue));
    const criticalFeatures = featureDrifts
      .filter(f => f.psiValue > PSI_THRESHOLDS.moderate && f.importance > 0.5)
      .sort((a, b) => b.psiValue - a.psiValue);

    return {
      severeDrift,
      moderateDrift,
      minorDrift,
      noDrift,
      avgPSI,
      maxPSI,
      criticalFeatures,
    };
  }, [featureDrifts]);

  // Sort features
  const sortedFeatures = useMemo(() => {
    const sorted = [...featureDrifts];
    if (sortBy === "psi") {
      sorted.sort((a, b) => b.psiValue - a.psiValue);
    } else {
      sorted.sort((a, b) => b.importance - a.importance);
    }
    return sorted;
  }, [featureDrifts, sortBy]);

  // Prepare category summary
  const categorySummary = useMemo(() => {
    const categories: Record<string, { count: number; avgPsi: number; drifted: number }> = {};
    
    featureDrifts.forEach(f => {
      if (!categories[f.category]) {
        categories[f.category] = { count: 0, avgPsi: 0, drifted: 0 };
      }
      categories[f.category].count++;
      categories[f.category].avgPsi += f.psiValue;
      if (f.driftStatus !== "no_drift") {
        categories[f.category].drifted++;
      }
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      count: data.count,
      avgPsi: data.avgPsi / data.count,
      drifted: data.drifted,
      percentDrifted: (data.drifted / data.count) * 100,
    }));
  }, [featureDrifts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "#22c55e";
      case "warning": return "#f59e0b";
      case "critical": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            {summary.status === "critical" && (
              <Button size="sm" onClick={onRetrain}>
                Retrain Model
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Alert */}
        {summary.status !== "healthy" && (
          <Alert variant={summary.status === "critical" ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {summary.status === "critical" ? "Critical Data Drift Detected" : "Data Drift Warning"}
            </AlertTitle>
            <AlertDescription>
              {summary.status === "critical" 
                ? `${driftStats.severeDrift} features have severe drift. Model retraining recommended.`
                : `${driftStats.moderateDrift} features show moderate drift. Monitor closely.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Model Status"
            value={summary.status.toUpperCase()}
            color={getStatusColor(summary.status)}
            icon={summary.status === "healthy" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          />
          <SummaryCard
            label="Overall Drift Score"
            value={summary.overallDriftScore.toFixed(3)}
            sublabel={summary.overallDriftScore < 0.1 ? "Acceptable" : summary.overallDriftScore < 0.25 ? "Moderate" : "High"}
            color={summary.overallDriftScore < 0.1 ? "#22c55e" : summary.overallDriftScore < 0.25 ? "#f59e0b" : "#ef4444"}
          />
          <SummaryCard
            label="Features Drifted"
            value={`${summary.featuresDrifted}/${summary.totalFeatures}`}
            sublabel={`${((summary.featuresDrifted / summary.totalFeatures) * 100).toFixed(0)}% of features`}
          />
          <SummaryCard
            label="Last Checked"
            value={new Date(summary.lastChecked).toLocaleDateString()}
            sublabel={new Date(summary.lastChecked).toLocaleTimeString()}
          />
        </div>

        {/* Drift Distribution Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Drift Distribution</span>
            <span className="text-muted-foreground">{featureDrifts.length} features</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div 
              className="h-full"
              style={{ 
                width: `${(driftStats.noDrift / featureDrifts.length) * 100}%`,
                backgroundColor: DRIFT_COLORS.no_drift 
              }}
              title={`No Drift: ${driftStats.noDrift}`}
            />
            <div 
              className="h-full"
              style={{ 
                width: `${(driftStats.minorDrift / featureDrifts.length) * 100}%`,
                backgroundColor: DRIFT_COLORS.minor 
              }}
              title={`Minor: ${driftStats.minorDrift}`}
            />
            <div 
              className="h-full"
              style={{ 
                width: `${(driftStats.moderateDrift / featureDrifts.length) * 100}%`,
                backgroundColor: DRIFT_COLORS.moderate 
              }}
              title={`Moderate: ${driftStats.moderateDrift}`}
            />
            <div 
              className="h-full"
              style={{ 
                width: `${(driftStats.severeDrift / featureDrifts.length) * 100}%`,
                backgroundColor: DRIFT_COLORS.severe 
              }}
              title={`Severe: ${driftStats.severeDrift}`}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <LegendItem color={DRIFT_COLORS.no_drift} label={`No Drift (${driftStats.noDrift})`} />
            <LegendItem color={DRIFT_COLORS.minor} label={`Minor (${driftStats.minorDrift})`} />
            <LegendItem color={DRIFT_COLORS.moderate} label={`Moderate (${driftStats.moderateDrift})`} />
            <LegendItem color={DRIFT_COLORS.severe} label={`Severe (${driftStats.severeDrift})`} />
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={viewType} onValueChange={(v: any) => setViewType(v)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Feature Details</TabsTrigger>
            <TabsTrigger value="trends">Drift Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Summary */}
              <div>
                <h4 className="font-medium mb-4">Drift by Category</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={categorySummary}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" domain={[0, 1]} />
                      <YAxis type="category" dataKey="category" />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(3), "Avg PSI"]}
                      />
                      <Bar 
                        dataKey="avgPsi" 
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Drifting Features */}
              <div>
                <h4 className="font-medium mb-4">Top Drifting Features</h4>
                <div className="space-y-3 max-h-[250px] overflow-auto">
                  {sortedFeatures.slice(0, 8).map((feature, index) => (
                    <div 
                      key={feature.feature}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <span className="text-sm font-medium w-6">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{feature.feature}</p>
                        <p className="text-xs text-muted-foreground">{feature.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: DRIFT_COLORS[feature.driftStatus] + "20",
                            borderColor: DRIFT_COLORS[feature.driftStatus],
                            color: DRIFT_COLORS[feature.driftStatus]
                          }}
                        >
                          PSI: {feature.psiValue.toFixed(3)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="features" className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {sortedFeatures.length} features
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSortBy(sortBy === "psi" ? "importance" : "psi")}
              >
                Sort by {sortBy === "psi" ? "Importance" : "PSI"}
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-medium">Feature</th>
                    <th className="p-3 text-left font-medium">Category</th>
                    <th className="p-3 text-right font-medium">Baseline Mean</th>
                    <th className="p-3 text-right font-medium">Current Mean</th>
                    <th className="p-3 text-right font-medium">PSI Value</th>
                    <th className="p-3 text-right font-medium">Importance</th>
                    <th className="p-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFeatures.map((feature, index) => (
                    <tr 
                      key={feature.feature}
                      className={cn("border-t", index % 2 === 0 && "bg-muted/30")}
                    >
                      <td className="p-3 font-medium">{feature.feature}</td>
                      <td className="p-3 text-muted-foreground">{feature.category}</td>
                      <td className="p-3 text-right">{feature.baselineMean.toFixed(3)}</td>
                      <td className="p-3 text-right">{feature.currentMean.toFixed(3)}</td>
                      <td className="p-3 text-right font-medium">{feature.psiValue.toFixed(4)}</td>
                      <td className="p-3 text-right">
                        <Progress 
                          value={feature.importance * 100} 
                          className="w-16 h-2" 
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: DRIFT_COLORS[feature.driftStatus] + "20",
                            borderColor: DRIFT_COLORS[feature.driftStatus],
                            color: DRIFT_COLORS[feature.driftStatus]
                          }}
                        >
                          {feature.driftStatus.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="pt-4">
            {trends && trends.length > 0 ? (
              <div className="space-y-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="overallDrift"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="Overall Drift"
                      />
                      <Area
                        type="monotone"
                        dataKey="predictionDrift"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                        name="Prediction Drift"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="featuresDrifted"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Features Drifted"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No trend data available</p>
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

// Demo data generator
export function generateDriftData(): {
  summary: ModelDriftSummary;
  featureDrifts: FeatureDrift[];
  trends: DriftTrend[];
} {
  const categories = ["Demographics", "Financial", "Credit History", "Alternative Data", "Behavioral"];
  const featureNames = [
    "age", "income", "employment_tenure", "credit_score", "debt_to_income",
    "payment_history", "credit_utilization", "num_accounts", "loan_amount",
    "mobile_usage", "utility_payments", "transaction_frequency", "savings_ratio",
  ];

  const featureDrifts: FeatureDrift[] = featureNames.map(name => {
    const psiValue = Math.random() * 0.4;
    let driftStatus: FeatureDrift["driftStatus"];
    if (psiValue < 0.1) driftStatus = "no_drift";
    else if (psiValue < 0.15) driftStatus = "minor";
    else if (psiValue < 0.25) driftStatus = "moderate";
    else driftStatus = "severe";

    return {
      feature: name,
      category: categories[Math.floor(Math.random() * categories.length)],
      baselineMean: 0.5 + Math.random() * 0.3,
      currentMean: 0.5 + Math.random() * 0.3,
      psiValue,
      driftStatus,
      importance: Math.random(),
    };
  });

  const featuresDrifted = featureDrifts.filter(f => f.driftStatus !== "no_drift").length;
  const overallDriftScore = featureDrifts.reduce((sum, f) => sum + f.psiValue, 0) / featureDrifts.length;

  const summary: ModelDriftSummary = {
    modelId: "xgboost-v2",
    modelName: "XGBoost Credit Scorer",
    overallDriftScore,
    featuresDrifted,
    totalFeatures: featureDrifts.length,
    lastChecked: new Date().toISOString(),
    status: overallDriftScore > 0.2 ? "critical" : overallDriftScore > 0.1 ? "warning" : "healthy",
    recommendations: [
      "Monitor income and employment features closely",
      "Consider retraining if drift continues for 2 more weeks",
      "Review data collection process for alternative data features",
    ],
  };

  const trends: DriftTrend[] = [];
  const dates = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
  dates.forEach(date => {
    trends.push({
      date,
      overallDrift: 0.05 + Math.random() * 0.15,
      featuresDrifted: Math.floor(2 + Math.random() * 6),
      predictionDrift: 0.02 + Math.random() * 0.08,
    });
  });

  return { summary, featureDrifts, trends };
}

export default DataDriftMonitor;


