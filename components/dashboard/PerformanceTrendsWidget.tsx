"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePerformanceTrends } from "@/lib/api/hooks/usePerformanceTrends";
import { PerformanceTrendChart } from "@/components/charts/PerformanceTrendChart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import type { MLPerformanceMetrics } from "@/types/dashboard";

interface PerformanceTrendsWidgetProps {
  executiveMLData?: MLPerformanceMetrics;
}

export function PerformanceTrendsWidget({ executiveMLData }: PerformanceTrendsWidgetProps = {}) {
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [groupBy, setGroupBy] = useState<string>("day");
  const { data: trendsData, isLoading, refetch } = usePerformanceTrends(timeRange, groupBy);
  
  // Use API data only - no fallback
  const finalTrendsData = trendsData as any;

  const getTrendIndicator = (current: number, previous: number) => {
    const change = current - previous;
    if (change > 0.01) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm">+{(change * 100).toFixed(2)}%</span>
        </div>
      );
    } else if (change < -0.01) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm">{(change * 100).toFixed(2)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-600">
        <Minus className="h-4 w-4" />
        <span className="text-sm">{(change * 100).toFixed(2)}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Model performance trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Type assertion for API data
  const trends = trendsData as any;

  if (!trends) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Model performance trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No performance trends data available"
            description="Performance trends data is not available. This may be due to insufficient historical data or API connectivity issues."
            icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
            action={{
              label: "Retry",
              onClick: () => refetch()
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const { summary } = trends || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Trends
        </CardTitle>
        <CardDescription>Model performance trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {trends?.time_series && trends.time_series.length > 0 ? (
              <PerformanceTrendChart
                data={trends.time_series}
                metrics={["accuracy", "precision", "recall", "f1_score"]}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No trend data available for the selected time range
              </div>
            )}

            {trends?.time_series && trends.time_series.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Avg Predictions/Day</div>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      trends.time_series.reduce((sum: number, d: any) => sum + (d.prediction_count || 0), 0) /
                        trends.time_series.length
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Avg Latency</div>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      trends.time_series.reduce((sum: number, d: any) => sum + (d.average_latency_ms || 0), 0) /
                        trends.time_series.length
                    )}
                    ms
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4 mt-4">
            {summary && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Current Accuracy</div>
                    <div className="text-3xl font-bold">
                      {(summary.current_accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Previous Accuracy</div>
                    <div className="text-3xl font-bold">
                      {(summary.previous_accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Accuracy Change</span>
                    {getTrendIndicator(summary.current_accuracy, summary.previous_accuracy)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Trend:</span>
                    <Badge
                      variant={
                        summary.trend === "improving"
                          ? "default"
                          : summary.trend === "degrading"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {summary.trend === "improving"
                        ? "Improving"
                        : summary.trend === "degrading"
                        ? "Degrading"
                        : "Stable"}
                    </Badge>
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

