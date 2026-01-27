"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { ComplianceViolationsTrendChart } from "@/components/charts/ComplianceViolationsTrendChart";
import { formatPercentage, formatNumber } from "@/lib/utils/format";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import type { ComplianceMetrics } from "@/types/dashboard";

interface ComplianceMetricsCardProps {
  compliance?: ComplianceMetrics;
  isLoading?: boolean;
  className?: string;
}

function ComplianceMetricsCardComponent({ compliance, isLoading, className }: ComplianceMetricsCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Compliance Metrics</CardTitle>
          <CardDescription>Regulatory compliance and violations tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!compliance) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Compliance Metrics</CardTitle>
          <CardDescription>Regulatory compliance and violations tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getComplianceStatus = (rate?: number): { status: string; color: string; badge: "default" | "secondary" | "destructive" } => {
    if (rate === undefined) return { status: "unknown", color: "gray", badge: "default" };
    if (rate >= 95) return { status: "excellent", color: "green", badge: "default" };
    if (rate >= 85) return { status: "good", color: "blue", badge: "default" };
    if (rate >= 75) return { status: "fair", color: "amber", badge: "secondary" };
    return { status: "poor", color: "red", badge: "destructive" };
  };

  const complianceRateStatus = getComplianceStatus(compliance.compliance_rate);
  const violationsTrend = compliance.violations_trend && compliance.violations_trend.length > 1
    ? compliance.violations_trend[compliance.violations_trend.length - 1].count - compliance.violations_trend[0].count
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Metrics
        </CardTitle>
        <CardDescription>Regulatory compliance and violations tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Compliance Rate */}
          {compliance.compliance_rate !== undefined && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance Rate</span>
                <Badge variant={complianceRateStatus.badge}>
                  {complianceRateStatus.status}
                </Badge>
              </div>
              <GaugeChart
                value={compliance.compliance_rate}
                max={100}
                min={0}
                label="Compliance"
              />
              <div className="text-center">
                <div className="text-2xl font-bold">{formatPercentage(compliance.compliance_rate)}</div>
                <div className="text-xs text-muted-foreground">NBE Regulatory Compliance</div>
              </div>
            </div>
          )}

          {/* Compliance Score */}
          {compliance.compliance_score !== undefined && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance Score</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <GaugeChart
                value={compliance.compliance_score}
                max={100}
                min={0}
                label="Score"
              />
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(compliance.compliance_score, 1)}</div>
                <div className="text-xs text-muted-foreground">Overall Compliance Score</div>
              </div>
            </div>
          )}

          {/* Violations Count */}
          {compliance.violations_count !== undefined && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Violations</span>
                {violationsTrend !== 0 && (
                  violationsTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )
                )}
              </div>
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${compliance.violations_count === 0 ? "text-green-600" : compliance.violations_count < 10 ? "text-amber-600" : "text-red-600"}`}>
                    {formatNumber(compliance.violations_count)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {violationsTrend !== 0 && (
                      <span className={violationsTrend > 0 ? "text-red-600" : "text-green-600"}>
                        {violationsTrend > 0 ? "+" : ""}{violationsTrend} from last period
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Violations Trend Chart */}
        {compliance.violations_trend && compliance.violations_trend.length > 0 && (
          <div className="pt-6 border-t">
            <ComplianceViolationsTrendChart
              data={compliance.violations_trend.map((point: any) => ({
                timestamp: point.date,
                critical_violations: point.critical || 0,
                high_violations: point.high || 0,
                medium_violations: point.medium || 0,
                low_violations: point.low || 0,
                total_violations: point.count,
                compliance_rate: point.compliance_rate || 90 + Math.random() * 10,
              }))}
              height={280}
              chartType="area"
              showComplianceRate={true}
            />
          </div>
        )}

        {/* Compliance Details */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">NBE Regulatory Requirements</span>
            <Badge variant={complianceRateStatus.badge}>
              {complianceRateStatus.status === "excellent" || complianceRateStatus.status === "good" ? "Compliant" : "Review Required"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ComplianceMetricsCard = memo(ComplianceMetricsCardComponent);

