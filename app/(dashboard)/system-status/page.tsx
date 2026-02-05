"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SystemStatus as SystemStatusComponent } from "@/components/system/SystemStatus";
import { ServiceHealth } from "@/components/system/ServiceHealth";
import { useSystemStatus } from "@/lib/api/hooks/useSystemStatus";
import { AlertTriangle, RefreshCw, AlertCircle, Activity, Zap, Network, CheckCircle2, Server, BarChart3 } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Button } from "@/components/ui/button";
import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { MetricTrend } from "@/components/charts/MetricTrend";

export default function SystemStatusPage() {
  const { data, isLoading, error, refetch } = useSystemStatus();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  
  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // Use only API data - no fallback
  const systemStatus = data || null;
  
  // Generate metrics data for charts
  const uptimeData = systemStatus?.metrics?.uptime_history || [];
  const latencyData = systemStatus?.metrics?.latency_history || [];
  const errorRateData = systemStatus?.metrics?.error_rate_history || [];
  
  // Calculate SLA/SLI metrics
  const calculateSLA = (metric: number, threshold: number) => {
    return metric >= threshold;
  };
  
  const slaMetrics = {
    uptime: calculateSLA(systemStatus?.metrics?.uptime_percentage || 0, 99.9),
    latency_p95: calculateSLA(
      (systemStatus?.metrics?.latency_p95 || 0) < 200,
      200
    ),
    error_rate: calculateSLA(
      (systemStatus?.metrics?.error_rate || 0) < 0.1,
      0.1
    ),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          <p className="text-muted-foreground">
            Monitor system health, services, and dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/health" label="Live" />
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
              Auto-refresh ({refreshInterval}s)
            </Label>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && !systemStatus && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Failed to load system status from API.</span>
              <p className="text-sm mt-1 text-muted-foreground">
                Error: {(error as any)?.message || "Unknown error occurred"}
                {(error as any)?.statusCode && ` (Status: ${(error as any)?.statusCode})`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && !systemStatus && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No system status data found. The API returned an empty result.
          </AlertDescription>
        </Alert>
      )}

      {/* Incident Banner */}
      {systemStatus?.incidents && systemStatus.incidents.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Active Incidents ({systemStatus.incidents.length})</div>
              {systemStatus.incidents.map((incident: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <strong>{incident.title}</strong>: {incident.description}
                  {incident.started_at && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Started: {new Date(incident.started_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {systemStatus && (
        <>
          {/* SLA/SLI Metrics */}
          <DashboardSection
            title="SLA/SLI Metrics"
            description="Service level agreements and service level indicators with target thresholds"
            icon={Activity}
          >
            <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime SLA</CardTitle>
                {slaMetrics.uptime ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus.metrics?.uptime_percentage?.toFixed(3) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 99.9% | Status: {slaMetrics.uptime ? "Met" : "Breached"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latency P95</CardTitle>
                {slaMetrics.latency_p95 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus.metrics?.latency_p95 || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;200ms | Status: {slaMetrics.latency_p95 ? "Met" : "Breached"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                {slaMetrics.error_rate ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(systemStatus.metrics?.error_rate || 0).toFixed(3)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;0.1% | Status: {slaMetrics.error_rate ? "Met" : "Breached"}
                </p>
              </CardContent>
            </Card>
            </div>
          </DashboardSection>

          {/* Metrics Charts */}
          {(uptimeData.length > 0 || latencyData.length > 0 || errorRateData.length > 0) && (
            <DashboardSection
              title="Performance Metrics Trends"
              description="Historical performance metrics including uptime, latency, and error rates"
              icon={BarChart3}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uptimeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Uptime Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricTrend
                      data={uptimeData}
                      dataKey="value"
                      name="Uptime %"
                      color="#10b981"
                    />
                  </CardContent>
                </Card>
              )}
              {latencyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Latency P95/P99</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricTrend
                      data={latencyData}
                      dataKey="p95"
                      name="P95"
                      color="#3b82f6"
                    />
                  </CardContent>
                </Card>
              )}
              {errorRateData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetricTrend
                      data={errorRateData}
                      dataKey="value"
                      name="Error %"
                      color="#ef4444"
                    />
                  </CardContent>
                </Card>
              )}
              </div>
            </DashboardSection>
          )}

          {/* System Overview */}
          <DashboardSection
            title="System Overview"
            description="Overall system health status and operational metrics"
            icon={Server}
          >
            <SystemStatusComponent status={systemStatus as any} isLoading={isLoading} />
          </DashboardSection>

          {/* Services Status */}
          {systemStatus.services && Object.keys(systemStatus.services).length > 0 && (
            <DashboardSection
              title="Services Status"
              description="Status of all microservices and their health indicators"
              icon={Network}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Microservices</CardTitle>
                  <CardDescription>Status of all microservices</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(systemStatus.services || {}).map(([key, service]) => {
                    // Handle both object and string service status
                    const serviceObj = typeof service === "string" 
                      ? { name: key, status: service } 
                      : service;
                    return serviceObj ? <ServiceHealth key={key} service={serviceObj as any} /> : null;
                  })}
                </div>
              </CardContent>
              </Card>
            </DashboardSection>
          )}

          {/* Dependencies Status with Graph */}
          {systemStatus.dependencies && Object.keys(systemStatus.dependencies).length > 0 && (
            <DashboardSection
              title="Dependencies"
              description="Status of infrastructure dependencies including databases, cache, and external services"
              icon={Network}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Infrastructure Dependencies</CardTitle>
                  <CardDescription>Status of infrastructure dependencies</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(systemStatus.dependencies || {}).map(([key, dependency]) => {
                    const depObj = typeof dependency === "string"
                      ? { name: key, status: dependency }
                      : dependency;
                    const status = (depObj as any)?.status || "unknown";
                    const isHealthy = status === "healthy" || status === "up" || status === "online";
                    return depObj ? (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{key}</span>
                          <Badge variant={isHealthy ? "default" : "destructive"}>
                            {status}
                          </Badge>
                        </div>
                        {(depObj as any)?.latency && (
                          <div className="text-xs text-muted-foreground">
                            Latency: {(depObj as any).latency}ms
                          </div>
                        )}
                        {(depObj as any)?.last_check && (
                          <div className="text-xs text-muted-foreground">
                            Last check: {new Date((depObj as any).last_check).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
          )}

          {/* Synthetic Checks */}
          {systemStatus.synthetic_checks && systemStatus.synthetic_checks.length > 0 && (
            <DashboardSection
              title="Synthetic Checks"
              description="Automated health check results"
              icon={Zap}
            >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Synthetic Checks
                </CardTitle>
                <CardDescription>Automated health check results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {systemStatus.synthetic_checks.map((check: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{check.name}</div>
                          <div className="text-xs text-muted-foreground">{check.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={check.passed ? "default" : "destructive"}>
                          {check.passed ? "Passed" : "Failed"}
                        </Badge>
                        {check.response_time && (
                          <span className="text-xs text-muted-foreground">
                            {check.response_time}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
          )}
        </>
      )}
    </div>
  );
}


