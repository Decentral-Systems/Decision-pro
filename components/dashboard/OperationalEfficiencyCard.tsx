"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./KPICard";
import { OperationalMetricsChart } from "@/components/charts/OperationalMetricsChart";
import { formatNumber, formatPercentage } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Zap, Clock, Activity, AlertCircle } from "lucide-react";
import type { OperationalEfficiency, KPIMetric } from "@/types/dashboard";

interface OperationalEfficiencyCardProps {
  efficiency?: OperationalEfficiency;
  isLoading?: boolean;
  className?: string;
}

function OperationalEfficiencyCardComponent({ efficiency, isLoading, className }: OperationalEfficiencyCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Operational Efficiency</CardTitle>
          <CardDescription>System performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!efficiency) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Operational Efficiency</CardTitle>
          <CardDescription>System performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No operational efficiency data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform to KPIMetric format
  const metrics: Record<string, KPIMetric> = {};
  
  if (efficiency.automation_rate !== undefined) {
    metrics.automation_rate = {
      label: "Automation Rate",
      value: efficiency.automation_rate,
      format: "percentage",
    };
  }

  if (efficiency.throughput !== undefined) {
    metrics.throughput = {
      label: "Throughput",
      value: efficiency.throughput,
      format: "number",
    };
  }

  if (efficiency.processing_time !== undefined) {
    metrics.processing_time = {
      label: "Processing Time",
      value: efficiency.processing_time,
      format: "number",
    };
  }

  if (efficiency.error_rate !== undefined) {
    metrics.error_rate = {
      label: "Error Rate",
      value: efficiency.error_rate,
      format: "percentage",
    };
  }

  const getStatusColor = (value: number, type: "good_low" | "good_high") => {
    if (type === "good_low") {
      // For error_rate - lower is better
      if (value < 1) return "text-green-600";
      if (value < 5) return "text-amber-600";
      return "text-red-600";
    } else {
      // For automation_rate, throughput - higher is better
      if (value > 80) return "text-green-600";
      if (value > 60) return "text-amber-600";
      return "text-red-600";
    }
  };

  const getStatusIcon = (value: number, type: "good_low" | "good_high") => {
    if (type === "good_low") {
      return value < 1 ? <TrendingDown className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-red-600" />;
    } else {
      return value > 60 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Operational Efficiency
        </CardTitle>
        <CardDescription>System performance and automation metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.automation_rate && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Automation Rate</div>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.automation_rate.value, "good_high")}`}>
                  {formatPercentage(metrics.automation_rate.value)}
                </div>
              </div>
              {getStatusIcon(metrics.automation_rate.value, "good_high")}
            </div>
          )}

          {metrics.throughput && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Throughput</div>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.throughput.value, "good_high")}`}>
                  {formatNumber(metrics.throughput.value)} <span className="text-sm text-muted-foreground">req/min</span>
                </div>
              </div>
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
          )}

          {metrics.processing_time && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.processing_time.value)} <span className="text-sm text-muted-foreground">ms</span>
                </div>
              </div>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          )}

          {metrics.error_rate && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Error Rate</div>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.error_rate.value, "good_low")}`}>
                  {formatPercentage(metrics.error_rate.value)}
                </div>
              </div>
              {getStatusIcon(metrics.error_rate.value, "good_low")}
            </div>
          )}
        </div>

        {/* Efficiency Trend Chart */}
        {(efficiency as any).historical_data && (efficiency as any).historical_data.length > 0 && (
          <div className="pt-6 border-t">
            <div className="mb-4">
              <h4 className="text-sm font-semibold">Efficiency Trends</h4>
              <p className="text-xs text-muted-foreground">Historical performance metrics over time</p>
            </div>
            <OperationalMetricsChart
              data={(efficiency as any).historical_data}
              height={250}
              metrics={["automation_rate", "throughput", "processing_time", "error_rate"]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const OperationalEfficiencyCard = memo(OperationalEfficiencyCardComponent);

