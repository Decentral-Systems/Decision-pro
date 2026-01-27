"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeFormatDate } from "@/lib/utils/format";
import { RiskGaugeChart } from "@/components/charts/RiskGaugeChart";
import { getRiskData, getRiskLevelColor } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle, Shield, TrendingDown } from "lucide-react";

interface CustomerRiskAssessmentProps {
  data: Customer360Data;
}

export function CustomerRiskAssessment({ data }: CustomerRiskAssessmentProps) {
  const risk = getRiskData(data);
  
  const riskLevel = risk.level || "medium";
  const riskScore = risk.score || 0.5;
  const alerts = risk.alerts || [];
  const factors = risk.assessment?.factors || [];

  // Prepare risk factors data for chart
  const factorsData = factors.map((factor: any) => ({
    name: factor.name || factor.factor_name || "Unknown",
    impact: (factor.impact || factor.risk_impact || 0) * 100,
  }));

  const getAlertVariant = (type: string): "default" | "destructive" => {
    const typeLower = type.toLowerCase();
    if (typeLower === "high" || typeLower === "critical") return "destructive";
    return "default";
  };

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Level</CardTitle>
            <CardDescription>Overall risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold capitalize">
                  {riskLevel.replace(/_/g, " ")}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Risk Level</p>
              </div>
              <Badge className={getRiskLevelColor(riskLevel)}>
                {(riskScore * 100).toFixed(1)}%
              </Badge>
            </div>
            <RiskGaugeChart riskScore={riskScore} riskLevel={riskLevel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Summary</CardTitle>
            <CardDescription>Key risk metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Score
              </span>
              <span className="text-2xl font-bold">{(riskScore * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Alerts
              </span>
              <Badge variant={alerts.length > 0 ? "destructive" : "default"}>
                {alerts.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Risk Factors
              </span>
              <span className="text-lg font-medium">{factors.length}</span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Risk score calculated based on credit history, payment patterns, and financial stability.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Alerts</CardTitle>
            <CardDescription>Active risk warnings and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert: any, index: number) => (
                <Alert
                  key={index}
                  variant={getAlertVariant(alert.type || alert.severity || "info")}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.title || alert.message || "Risk Alert"}</p>
                        {alert.message && alert.title && (
                          <p className="text-sm mt-1">{alert.message}</p>
                        )}
                      </div>
                      {alert.type && (
                        <Badge variant={getAlertVariant(alert.type)} className="ml-2">
                          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                        </Badge>
                      )}
                    </div>
                    {alert.timestamp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {safeFormatDate(alert.timestamp, "PPpp", "Unknown")}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors Breakdown */}
      {factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
            <CardDescription>Contributing factors to risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, factors.length * 40)}>
              <BarChart
                layout="vertical"
                data={factorsData.sort((a, b) => b.impact - a.impact)}
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} label={{ value: "Impact (%)", position: "insideBottom", offset: -5 }} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Impact"]} />
                <Legend />
                <Bar dataKey="impact" fill="#ef4444">
                  {factorsData.map((entry, index) => {
                    const color =
                      entry.impact >= 70
                        ? "#ef4444"
                        : entry.impact >= 50
                        ? "#f97316"
                        : entry.impact >= 30
                        ? "#f59e0b"
                        : "#3b82f6";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment Details */}
      {risk.assessment && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>Detailed risk assessment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(risk.assessment)
                .filter(([key]) => key !== "factors")
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {typeof value === "number" ? value.toFixed(3) : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 && factors.length === 0 && !risk.assessment && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No detailed risk assessment data available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

