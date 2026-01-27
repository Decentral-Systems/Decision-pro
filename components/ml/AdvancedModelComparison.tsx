"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  ComposedChart,
  Area
} from "recharts";
import { Download, ArrowUpDown, Check, X, GitCompare, Trophy, Zap } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export-service";

interface ModelMetrics {
  id: string;
  name: string;
  version: string;
  type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  aucPr: number;
  logLoss: number;
  gini: number;
  ks: number;
  latency: number; // ms
  throughput: number; // predictions/sec
  trainedAt: string;
  status: "active" | "deployed" | "testing" | "archived";
}

interface PerformanceHistory {
  date: string;
  [modelId: string]: number | string;
}

interface AdvancedModelComparisonProps {
  models: ModelMetrics[];
  performanceHistory?: PerformanceHistory[];
  title?: string;
  description?: string;
  className?: string;
  onSelectModel?: (model: ModelMetrics) => void;
  onDeployModel?: (model: ModelMetrics) => void;
}

const STATUS_COLORS = {
  active: "#22c55e",
  deployed: "#3b82f6",
  testing: "#f59e0b",
  archived: "#6b7280",
};

const MODEL_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"
];

/**
 * Advanced Model Comparison Component
 * 
 * Side-by-side comparison of ML models with radar charts, performance history, and A/B testing
 */
export function AdvancedModelComparison({
  models,
  performanceHistory,
  title = "Model Comparison",
  description = "Compare performance metrics across models",
  className,
  onSelectModel,
  onDeployModel,
}: AdvancedModelComparisonProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(
    models.slice(0, 2).map(m => m.id)
  );
  const [viewType, setViewType] = useState<"metrics" | "radar" | "history" | "details">("metrics");
  const [sortBy, setSortBy] = useState<keyof ModelMetrics>("aucRoc");

  // Toggle model selection
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(id => id !== modelId));
      }
    } else if (selectedModels.length < 4) {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  // Get selected models data
  const comparedModels = useMemo(() => {
    return models.filter(m => selectedModels.includes(m.id));
  }, [models, selectedModels]);

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    const metrics = ["accuracy", "precision", "recall", "f1Score", "aucRoc"];
    return metrics.map(metric => {
      const dataPoint: Record<string, any> = { metric: formatMetricName(metric) };
      comparedModels.forEach((model, index) => {
        dataPoint[model.name] = (model as any)[metric];
      });
      return dataPoint;
    });
  }, [comparedModels]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    const metrics = ["accuracy", "precision", "recall", "f1Score", "aucRoc", "aucPr"];
    return metrics.map(metric => {
      const dataPoint: Record<string, any> = { metric: formatMetricName(metric) };
      comparedModels.forEach(model => {
        dataPoint[model.name] = (model as any)[metric] * 100;
      });
      return dataPoint;
    });
  }, [comparedModels]);

  // Sort models
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const aVal = a[sortBy] as number;
      const bVal = b[sortBy] as number;
      return bVal - aVal;
    });
  }, [models, sortBy]);

  // Find best model
  const bestModel = useMemo(() => {
    return models.reduce((best, current) => 
      current.aucRoc > best.aucRoc ? current : best
    , models[0]);
  }, [models]);

  const handleExport = () => {
    const exportData = models.map(m => ({
      "Model Name": m.name,
      "Version": m.version,
      "Type": m.type,
      "Accuracy": (m.accuracy * 100).toFixed(2) + "%",
      "Precision": (m.precision * 100).toFixed(2) + "%",
      "Recall": (m.recall * 100).toFixed(2) + "%",
      "F1 Score": (m.f1Score * 100).toFixed(2) + "%",
      "AUC-ROC": m.aucRoc.toFixed(4),
      "AUC-PR": m.aucPr.toFixed(4),
      "Gini": m.gini.toFixed(4),
      "KS": m.ks.toFixed(4),
      "Latency (ms)": m.latency,
      "Throughput": m.throughput,
      "Status": m.status,
    }));

    exportToExcel(exportData, {
      filename: `model-comparison-${Date.now()}`,
      sheetName: "Model Metrics",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="flex flex-wrap gap-3">
          {sortedModels.map((model, index) => (
            <div
              key={model.id}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                selectedModels.includes(model.id) 
                  ? "border-primary bg-primary/5" 
                  : "hover:border-muted-foreground/50"
              )}
              onClick={() => toggleModel(model.id)}
            >
              <Checkbox
                checked={selectedModels.includes(model.id)}
                onCheckedChange={() => toggleModel(model.id)}
              />
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }}
                />
                <div>
                  <p className="font-medium text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">{model.version}</p>
                </div>
              </div>
              {model.id === bestModel.id && (
                <Trophy className="h-4 w-4 text-amber-500" />
              )}
              <Badge 
                variant="outline"
                style={{ 
                  backgroundColor: STATUS_COLORS[model.status] + "20",
                  borderColor: STATUS_COLORS[model.status],
                  color: STATUS_COLORS[model.status]
                }}
              >
                {model.status}
              </Badge>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Select up to 4 models to compare ({selectedModels.length}/4 selected)
        </p>

        {/* View Tabs */}
        <Tabs value={viewType} onValueChange={(v: any) => setViewType(v)}>
          <TabsList>
            <TabsTrigger value="metrics">Bar Chart</TabsTrigger>
            <TabsTrigger value="radar">Radar Chart</TabsTrigger>
            <TabsTrigger value="history">Performance History</TabsTrigger>
            <TabsTrigger value="details">Detailed Table</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="pt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="metric" />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, ""]}
                  />
                  <Legend />
                  {comparedModels.map((model, index) => (
                    <Bar
                      key={model.id}
                      dataKey={model.name}
                      fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="radar" className="pt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                  />
                  <Legend />
                  {comparedModels.map((model, index) => (
                    <Radar
                      key={model.id}
                      name={model.name}
                      dataKey={model.name}
                      stroke={MODEL_COLORS[index % MODEL_COLORS.length]}
                      fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            {performanceHistory && performanceHistory.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0.8, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip 
                      formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, ""]}
                    />
                    <Legend />
                    {comparedModels.map((model, index) => (
                      <Line
                        key={model.id}
                        type="monotone"
                        dataKey={model.id}
                        name={model.name}
                        stroke={MODEL_COLORS[index % MODEL_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No performance history available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="pt-4">
            <div className="border rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-medium">Model</th>
                    <th className="p-3 text-right font-medium cursor-pointer" onClick={() => setSortBy("accuracy")}>
                      Accuracy {sortBy === "accuracy" && "↓"}
                    </th>
                    <th className="p-3 text-right font-medium cursor-pointer" onClick={() => setSortBy("precision")}>
                      Precision {sortBy === "precision" && "↓"}
                    </th>
                    <th className="p-3 text-right font-medium cursor-pointer" onClick={() => setSortBy("recall")}>
                      Recall {sortBy === "recall" && "↓"}
                    </th>
                    <th className="p-3 text-right font-medium cursor-pointer" onClick={() => setSortBy("f1Score")}>
                      F1 {sortBy === "f1Score" && "↓"}
                    </th>
                    <th className="p-3 text-right font-medium cursor-pointer" onClick={() => setSortBy("aucRoc")}>
                      AUC-ROC {sortBy === "aucRoc" && "↓"}
                    </th>
                    <th className="p-3 text-right font-medium cursor-pointer" onClick={() => setSortBy("latency")}>
                      Latency {sortBy === "latency" && "↓"}
                    </th>
                    <th className="p-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comparedModels.map((model, index) => (
                    <tr 
                      key={model.id}
                      className={cn("border-t", index % 2 === 0 && "bg-muted/30")}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.version}</p>
                          </div>
                          {model.id === bestModel.id && (
                            <Trophy className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">{(model.accuracy * 100).toFixed(2)}%</td>
                      <td className="p-3 text-right">{(model.precision * 100).toFixed(2)}%</td>
                      <td className="p-3 text-right">{(model.recall * 100).toFixed(2)}%</td>
                      <td className="p-3 text-right">{(model.f1Score * 100).toFixed(2)}%</td>
                      <td className="p-3 text-right font-medium">{model.aucRoc.toFixed(4)}</td>
                      <td className="p-3 text-right">
                        <span className={model.latency < 50 ? "text-green-600" : model.latency > 100 ? "text-red-600" : ""}>
                          {model.latency}ms
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onSelectModel?.(model)}
                          >
                            Details
                          </Button>
                          {model.status !== "deployed" && (
                            <Button 
                              size="sm"
                              onClick={() => onDeployModel?.(model)}
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Deploy
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          {comparedModels.map((model, index) => (
            <div key={model.id} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }}
                />
                <span className="font-medium text-sm">{model.name}</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AUC-ROC</span>
                  <span className="font-medium">{model.aucRoc.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gini</span>
                  <span>{model.gini.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KS</span>
                  <span>{model.ks.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Throughput</span>
                  <span>{model.throughput}/s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility functions
function formatMetricName(metric: string): string {
  const names: Record<string, string> = {
    accuracy: "Accuracy",
    precision: "Precision",
    recall: "Recall",
    f1Score: "F1 Score",
    aucRoc: "AUC-ROC",
    aucPr: "AUC-PR",
    logLoss: "Log Loss",
    gini: "Gini",
    ks: "KS",
  };
  return names[metric] || metric;
}

// Demo data generator
export function generateModelComparisonData(): {
  models: ModelMetrics[];
  performanceHistory: PerformanceHistory[];
} {
  const models: ModelMetrics[] = [
    {
      id: "xgboost-v2",
      name: "XGBoost",
      version: "v2.1.0",
      type: "Gradient Boosting",
      accuracy: 0.923,
      precision: 0.891,
      recall: 0.867,
      f1Score: 0.879,
      aucRoc: 0.945,
      aucPr: 0.912,
      logLoss: 0.234,
      gini: 0.89,
      ks: 0.72,
      latency: 45,
      throughput: 1200,
      trainedAt: "2025-01-15",
      status: "deployed",
    },
    {
      id: "lightgbm-v1",
      name: "LightGBM",
      version: "v1.3.0",
      type: "Gradient Boosting",
      accuracy: 0.918,
      precision: 0.885,
      recall: 0.873,
      f1Score: 0.879,
      aucRoc: 0.941,
      aucPr: 0.905,
      logLoss: 0.248,
      gini: 0.882,
      ks: 0.71,
      latency: 38,
      throughput: 1500,
      trainedAt: "2025-01-10",
      status: "active",
    },
    {
      id: "neural-net-v1",
      name: "Neural Network",
      version: "v1.0.0",
      type: "Deep Learning",
      accuracy: 0.912,
      precision: 0.878,
      recall: 0.882,
      f1Score: 0.880,
      aucRoc: 0.938,
      aucPr: 0.898,
      logLoss: 0.261,
      gini: 0.876,
      ks: 0.70,
      latency: 85,
      throughput: 600,
      trainedAt: "2025-01-08",
      status: "testing",
    },
    {
      id: "logistic-v3",
      name: "Logistic Regression",
      version: "v3.0.0",
      type: "Linear Model",
      accuracy: 0.875,
      precision: 0.842,
      recall: 0.821,
      f1Score: 0.831,
      aucRoc: 0.892,
      aucPr: 0.856,
      logLoss: 0.312,
      gini: 0.784,
      ks: 0.62,
      latency: 12,
      throughput: 5000,
      trainedAt: "2025-01-01",
      status: "active",
    },
    {
      id: "ensemble-v1",
      name: "Ensemble",
      version: "v1.0.0",
      type: "Meta Model",
      accuracy: 0.931,
      precision: 0.903,
      recall: 0.879,
      f1Score: 0.891,
      aucRoc: 0.952,
      aucPr: 0.921,
      logLoss: 0.218,
      gini: 0.904,
      ks: 0.75,
      latency: 120,
      throughput: 450,
      trainedAt: "2025-01-18",
      status: "testing",
    },
  ];

  const performanceHistory: PerformanceHistory[] = [];
  const dates = ["Jan 1", "Jan 8", "Jan 15", "Jan 22", "Jan 29", "Feb 5"];
  
  dates.forEach(date => {
    const point: PerformanceHistory = { date };
    models.forEach(model => {
      point[model.id] = model.aucRoc + (Math.random() * 0.02 - 0.01);
    });
    performanceHistory.push(point);
  });

  return { models, performanceHistory };
}

export default AdvancedModelComparison;


