"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeFormatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { useModelPerformance, useModelComparison } from "@/lib/api/hooks/useModelPerformance";
import { ModelComparisonChart } from "@/components/charts/ModelComparisonChart";
import { ConfusionMatrixChart } from "@/components/charts/ConfusionMatrixChart";
import { MetricsGaugeChart } from "@/components/charts/MetricsGaugeChart";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import type { MLPerformanceMetrics } from "@/types/dashboard";
import { EmptyState } from "@/components/common/EmptyState";

const MODEL_NAMES = [
  "ensemble",
  "xgboost",
  "lightgbm",
  "neural_network",
  "lstm",
  "transformer",
  "meta_learner",
];

interface ModelPerformanceWidgetProps {
  executiveMLData?: MLPerformanceMetrics;
}

export function ModelPerformanceWidget({ executiveMLData }: ModelPerformanceWidgetProps) {
  const [selectedModel, setSelectedModel] = useState<string>("ensemble");
  const { data: performanceData, isLoading: isLoadingPerformance } = useModelPerformance(selectedModel);
  const { data: comparisonData, isLoading: isLoadingComparison } = useModelComparison();
  
  // Transform executiveMLData to match the expected format
  const transformedExecutiveData = useMemo(() => {
    if (!executiveMLData?.ensemble_model) {
      return null;
    }
    
    // Transform ensemble_model to the format expected by the widget
    const transformed = {
      model_name: selectedModel || "ensemble",
      metrics: {
        accuracy: executiveMLData.ensemble_model.accuracy ?? 0,
        precision: executiveMLData.ensemble_model.precision ?? 0,
        recall: executiveMLData.ensemble_model.recall ?? 0,
        f1_score: executiveMLData.ensemble_model.f1_score ?? 0,
        auc_roc: executiveMLData.ensemble_model.auc_roc ?? 0,
      },
      timestamp: new Date().toISOString(),
    };
    
    return transformed;
  }, [executiveMLData, selectedModel]);

  const transformedComparisonData = useMemo(() => {
    if (!executiveMLData?.individual_models) return null;
    
    // Transform individual_models to comparison format
    const models = Object.entries(executiveMLData.individual_models).map(([name, metrics]: [string, any]) => ({
      model_name: name,
      metrics: {
        accuracy: metrics?.accuracy || 0,
        precision: metrics?.precision || 0,
        recall: metrics?.recall || 0,
        f1_score: metrics?.f1_score || 0,
        auc_roc: metrics?.auc_roc || 0,
      },
    }));
    
    // Also include ensemble model in comparison
    if (executiveMLData.ensemble_model) {
      models.unshift({
        model_name: "ensemble",
        metrics: {
          accuracy: executiveMLData.ensemble_model.accuracy || 0,
          precision: executiveMLData.ensemble_model.precision || 0,
          recall: executiveMLData.ensemble_model.recall || 0,
          f1_score: executiveMLData.ensemble_model.f1_score || 0,
          auc_roc: executiveMLData.ensemble_model.auc_roc || 0,
        },
      });
    }
    
    return { models };
  }, [executiveMLData]);

  // Check if API data has valid metrics (non-zero values)
  const apiPerfHasValidMetrics = performanceData && 
    performanceData.metrics && 
    (performanceData.metrics.accuracy || 0) > 0;
  
  const apiCompHasValidMetrics = comparisonData && 
    comparisonData.models && 
    Array.isArray(comparisonData.models) && 
    comparisonData.models.length > 0 &&
    comparisonData.models.some((m: any) => (m.metrics?.accuracy || m.accuracy || 0) > 0);

  // Prioritize executive data when available (it has valid metrics from executive dashboard API)
  // Only use API hook data if executive data is not available AND API data has valid metrics
  const perfData = transformedExecutiveData || (apiPerfHasValidMetrics ? (performanceData as any) : null);
  const compData = transformedComparisonData || (apiCompHasValidMetrics ? (comparisonData as any) : null);
  const usingExecutiveData = !!transformedExecutiveData || !!transformedComparisonData;
  

  const getStatusColor = (value: number) => {
    if (value >= 0.9) return "bg-green-500";
    if (value >= 0.8) return "bg-blue-500";
    if (value >= 0.7) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusBadge = (value: number) => {
    if (value >= 0.9) return <Badge className="bg-green-500">Excellent</Badge>;
    if (value >= 0.8) return <Badge className="bg-blue-500">Good</Badge>;
    if (value >= 0.7) return <Badge className="bg-amber-500">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const isLoading = isLoadingPerformance || isLoadingComparison;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Performance Metrics
          </CardTitle>
          <CardDescription>Comprehensive model performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Only show empty state if we truly have no data from API or executive dashboard
  if (!perfData && !compData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Performance Metrics
          </CardTitle>
          <CardDescription>Comprehensive model performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No Model Performance Data"
            description="Model performance metrics are not available. This may be due to models not being trained or data not being loaded."
            variant="empty"
            icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
            action={{
              label: "Retry",
              onClick: () => window.location.reload(),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Model Performance Metrics
          {usingExecutiveData && (
            <Badge variant="outline" className="ml-auto text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Executive Data
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Comprehensive model performance analysis
          {usingExecutiveData && " (sourced from executive dashboard)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {perfData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                    <div className="text-2xl font-bold">
                      {((perfData?.metrics?.accuracy || 0) * 100).toFixed(2)}%
                    </div>
                    {getStatusBadge(perfData?.metrics?.accuracy || 0)}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Precision</div>
                    <div className="text-2xl font-bold">
                      {((perfData?.metrics?.precision || 0) * 100).toFixed(2)}%
                    </div>
                    {getStatusBadge(perfData?.metrics?.precision || 0)}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Recall</div>
                    <div className="text-2xl font-bold">
                      {((perfData?.metrics?.recall || 0) * 100).toFixed(2)}%
                    </div>
                    {getStatusBadge(perfData?.metrics?.recall || 0)}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">F1 Score</div>
                    <div className="text-2xl font-bold">
                      {((perfData?.metrics?.f1_score || 0) * 100).toFixed(2)}%
                    </div>
                    {getStatusBadge(perfData?.metrics?.f1_score || 0)}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">AUC-ROC</div>
                    <div className="text-2xl font-bold">
                      {((perfData?.metrics?.auc_roc || 0) * 100).toFixed(2)}%
                    </div>
                    {getStatusBadge(perfData?.metrics?.auc_roc || 0)}
                  </div>
                </div>

                {perfData?.confusion_matrix && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Confusion Matrix</h3>
                    <ConfusionMatrixChart data={perfData.confusion_matrix} />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6 mt-4">
            {compData && compData.models && (
              <>
                <div className="space-y-4">
                  <ModelComparisonChart
                    data={
                      Array.isArray(compData.models)
                        ? compData.models.map((m: any) => ({
                            model_name: m.model_name || m.name || "",
                            accuracy: m.metrics?.accuracy || m.accuracy || 0,
                            precision: m.metrics?.precision || m.precision || 0,
                            recall: m.metrics?.recall || m.recall || 0,
                            f1_score: m.metrics?.f1_score || m.f1_score || 0,
                            auc_roc: m.metrics?.auc_roc || m.auc_roc || 0,
                          }))
                        : Object.entries(compData.models).map(([name, data]: [string, any]) => ({
                            model_name: name,
                            accuracy: data?.accuracy || data?.metrics?.accuracy || 0,
                            precision: data?.precision || data?.metrics?.precision || 0,
                            recall: data?.recall || data?.metrics?.recall || 0,
                            f1_score: data?.f1_score || data?.metrics?.f1_score || 0,
                            auc_roc: data?.auc_roc || data?.metrics?.auc_roc || 0,
                          }))
                    }
                    metric="accuracy"
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-4">
            {perfData && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
                <MetricsGaugeChart
                  accuracy={perfData?.metrics?.accuracy || 0}
                  precision={perfData?.metrics?.precision || 0}
                  recall={perfData?.metrics?.recall || 0}
                  f1Score={perfData?.metrics?.f1_score || 0}
                  aucRoc={perfData?.metrics?.auc_roc || 0}
                />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Calibration Score</span>
                    <span className="font-semibold">
                      {((perfData?.metrics?.calibration_score || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Model</span>
                    <span className="font-semibold">{perfData?.model_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="font-semibold">
                      {safeFormatDate(perfData?.timestamp, "PPpp", "N/A")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

