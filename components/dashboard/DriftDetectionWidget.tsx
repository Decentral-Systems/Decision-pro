"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeFormatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDriftDetection } from "@/lib/api/hooks/useDriftDetection";
import { DriftTrendChart } from "@/components/charts/DriftTrendChart";
import { DriftHeatmapChart } from "@/components/charts/DriftHeatmapChart";
import { AlertTriangle, Info, XCircle, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import type { MLPerformanceMetrics } from "@/types/dashboard";

interface DriftDetectionWidgetProps {
  executiveMLData?: MLPerformanceMetrics;
}

export function DriftDetectionWidget({ executiveMLData }: DriftDetectionWidgetProps = {}) {
  const { data: driftData, isLoading, refetch } = useDriftDetection();
  
  // Use API data only - no fallback
  const finalDriftData = driftData as any;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Drift Detection
          </CardTitle>
          <CardDescription>Model drift monitoring and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!finalDriftData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Drift Detection
          </CardTitle>
          <CardDescription>Model drift monitoring and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No drift detection data available"
            description="Drift detection data is not available. Drift monitoring may not be configured yet."
            icon={<AlertTriangle className="h-8 w-8 text-muted-foreground" />}
            action={{
              label: "Retry",
              onClick: () => refetch()
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const featureDrift: Array<{severity: string; drift_detected: boolean; [key: string]: any}> = finalDriftData?.feature_drift || [];
  
  // Use finalDriftData instead of driftData throughout
  const driftDataForDisplay = finalDriftData;
  const highSeverityDrifts = featureDrift.filter(
    (d) => d.severity === "high" && d.drift_detected
  ) || [];
  const detectedDrifts = featureDrift.filter((d) => d.drift_detected) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Drift Detection
        </CardTitle>
        <CardDescription>Model drift monitoring and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Feature Drift</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {highSeverityDrifts.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{highSeverityDrifts.length}</strong> high-severity drift alerts detected.
                  Immediate action may be required.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Feature Drift Detected</div>
                <div className="text-2xl font-bold">{detectedDrifts.length}</div>
                <div className="text-xs text-muted-foreground">
                  {highSeverityDrifts.length} high,{" "}
                  {detectedDrifts.filter((d) => d.severity === "medium").length} medium,{" "}
                  {detectedDrifts.filter((d) => d.severity === "low").length} low
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Prediction Drift</div>
                <div className="text-2xl font-bold">
                  {driftDataForDisplay?.prediction_drift?.drift_detected ? "Yes" : "No"}
                </div>
                {driftDataForDisplay?.prediction_drift && (
                  <div className="flex items-center gap-2">
                    Score: {((driftDataForDisplay.prediction_drift.drift_score || 0) * 100).toFixed(1)}%
                    {getSeverityBadge(driftDataForDisplay.prediction_drift.severity || "low")}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Performance Drift</div>
                <div className="text-2xl font-bold">
                  {driftDataForDisplay?.performance_drift?.drift_detected ? "Yes" : "No"}
                </div>
                {driftDataForDisplay?.performance_drift && (
                  <div className="text-xs text-muted-foreground">
                    Accuracy change:{" "}
                    {(driftDataForDisplay.performance_drift.accuracy_change || 0) > 0 ? "+" : ""}
                    {((driftDataForDisplay.performance_drift.accuracy_change || 0) * 100).toFixed(2)}%
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total Features Monitored</div>
                <div className="text-2xl font-bold">{driftDataForDisplay?.feature_drift?.length || featureDrift.length || 0}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Feature Drift Analysis</h3>
              {featureDrift && featureDrift.length > 0 ? (
                <DriftHeatmapChart
                  data={featureDrift.map((d: any) => ({
                    feature_name: d.feature_name || "Unknown",
                    drift_score: d.drift_score || 0,
                    severity: (d.severity || "low") as "low" | "medium" | "high",
                  }))}
                  maxItems={20}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No feature drift data available
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Drift Trends</h3>
              {featureDrift && featureDrift.length > 0 ? (
                <DriftTrendChart
                  data={featureDrift
                    .filter((d) => d.drift_detected)
                    .map((d) => ({
                      date: safeFormatDate(d.last_checked, "MMM dd, yyyy", "Unknown"),
                      drift_score: d.drift_score,
                      feature_name: d.feature_name,
                    }))}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

