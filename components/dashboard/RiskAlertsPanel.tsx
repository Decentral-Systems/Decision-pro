"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRiskAlerts } from "@/lib/api/hooks/useRiskAlerts";
import { RiskAlert } from "@/types/risk";
import { safeFormatDate } from "@/lib/utils/format";
import { AlertTriangle, AlertCircle, Info, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { navigateTo } from "@/lib/utils/navigation";
import type { ComplianceMetrics } from "@/types/dashboard";

interface RiskAlertsPanelProps {
  complianceMetrics?: ComplianceMetrics;
}

export function RiskAlertsPanel({ complianceMetrics }: RiskAlertsPanelProps) {
  const { data: alertsData, isLoading } = useRiskAlerts();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Transform compliance violations into alert format
  const complianceAlerts: RiskAlert[] = [];
  if (complianceMetrics && complianceMetrics.violations_count && complianceMetrics.violations_count > 0) {
    // Create alert entries for compliance violations
    const violationDetails = (complianceMetrics as any).violations_details || [];
    violationDetails.forEach((violation: any) => {
      complianceAlerts.push({
        id: `compliance-${violation.id || Date.now()}`,
        customer_id: violation.customer_id || "N/A",
        title: "Compliance Violation",
        description: violation.message || "Compliance violation detected",
        severity: violation.severity || "medium",
        risk_score: 0,
        created_at: violation.created_at || new Date().toISOString(),
        status: "active",
      } as RiskAlert);
    });
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Alerts
          </CardTitle>
          <CardDescription>Active risk alerts and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alertsData || !alertsData.alerts || alertsData.alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Alerts
          </CardTitle>
          <CardDescription>Active risk alerts and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>No active risk alerts at this time</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { alerts, total_count, critical_count, high_count } = alertsData;
  
  // Combine risk alerts with compliance alerts
  const allAlerts = [...alerts, ...complianceAlerts];
  const riskAlerts = alerts;
  
  // Filter alerts based on active tab
  const filteredAlerts = activeTab === "all" ? allAlerts :
                         activeTab === "risk" ? riskAlerts :
                         activeTab === "compliance" ? complianceAlerts : allAlerts;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk & Compliance Alerts
            </CardTitle>
            <CardDescription>Active risk alerts and compliance violations</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {critical_count > 0 && (
              <Badge variant="destructive">{critical_count} Critical</Badge>
            )}
            {high_count > 0 && (
              <Badge variant="secondary">{high_count} High</Badge>
            )}
            {complianceAlerts.length > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {complianceAlerts.length} Compliance
              </Badge>
            )}
            <Badge variant="outline">{allAlerts.length} Total</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === "all" ? "bg-background text-foreground shadow" : ""
              }`}
              onClick={() => setActiveTab("all")}
            >
              All ({allAlerts.length})
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === "risk" ? "bg-background text-foreground shadow" : ""
              }`}
              onClick={() => setActiveTab("risk")}
            >
              Risk ({riskAlerts.length})
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === "compliance" ? "bg-background text-foreground shadow" : ""
              }`}
              onClick={() => setActiveTab("compliance")}
            >
              Compliance ({complianceAlerts.length})
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.slice(0, 10).map((alert: RiskAlert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === "critical" ? "destructive" : "default"}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigateTo(`/customers/${alert.customer_id}`)}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{alert.title}</span>
                      <Badge variant={getSeverityVariant(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo(`/customers/${alert.customer_id}`);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <AlertDescription>{alert.description}</AlertDescription>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Customer: {alert.customer_id?.slice(-8)}</span>
                    <span>Risk Score: {alert.risk_score}</span>
                    <span>
                      {safeFormatDate(alert.created_at, "MMM dd, yyyy HH:mm", "Unknown")}
                    </span>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
        {alerts.length > 10 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline"
              onClick={() => navigateTo("/compliance")}
            >
              View All {total_count} Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

