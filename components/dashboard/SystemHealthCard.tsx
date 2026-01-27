"use client";

import React, { memo, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SystemHealthChart } from "@/components/charts/SystemHealthChart";
import { formatPercentage } from "@/lib/utils/format";
import { Activity, Server, Database, Network, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { SystemHealth } from "@/types/dashboard";
import { useWebSocketChannel } from "@/lib/hooks/useWebSocket";
import { useSystemHealthPolling } from "@/lib/hooks/useSystemHealthPolling";

interface SystemHealthCardProps {
  health?: SystemHealth;
  isLoading?: boolean;
  className?: string;
  enableRealTime?: boolean;
}

function SystemHealthCardComponent({ health, isLoading, className, enableRealTime = false }: SystemHealthCardProps) {
  const [currentHealth, setCurrentHealth] = useState(health);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update health data when prop changes
  useEffect(() => {
    if (health) {
      setCurrentHealth(health);
      setLastUpdate(new Date());
    }
  }, [health]);

  // Real-time WebSocket updates
  const { data: realtimeHealthData } = useWebSocketChannel<SystemHealth>(
    'dashboard_metrics' as any,
    enableRealTime
  );

  // Polling hook as fallback/primary mechanism
  const {
    data: pollingHealthData,
    isLoading: isPollingLoading,
    isPolling,
    timeUntilNextPoll,
  } = useSystemHealthPolling({
    interval: 10000, // 10 seconds
    enabled: enableRealTime,
    pauseWhenHidden: true,
    retryOnFailure: true,
  });

  // Update state when WebSocket data arrives (preferred)
  useEffect(() => {
    if (realtimeHealthData && enableRealTime) {
      setCurrentHealth(realtimeHealthData);
      setLastUpdate(new Date());
    }
  }, [realtimeHealthData, enableRealTime]);

  // Update state from polling data (fallback when WebSocket unavailable)
  useEffect(() => {
    if (pollingHealthData && enableRealTime && !realtimeHealthData) {
      setCurrentHealth(pollingHealthData);
      setLastUpdate(new Date());
    }
  }, [pollingHealthData, enableRealTime, realtimeHealthData]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time system resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!currentHealth) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time system resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No system health data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = (usage?: number): { status: string; colorClass: string; Icon: React.ComponentType<{ className?: string }> } => {
    if (usage === undefined) return { status: "unknown", colorClass: "text-gray-600", Icon: AlertCircle };
    if (usage < 50) return { status: "healthy", colorClass: "text-green-600", Icon: CheckCircle2 };
    if (usage < 80) return { status: "warning", colorClass: "text-amber-600", Icon: Activity };
    return { status: "critical", colorClass: "text-red-600", Icon: XCircle };
  };


  const cpuStatus = getHealthStatus(currentHealth.cpu_usage);
  const memoryStatus = getHealthStatus(currentHealth.memory_usage);
  const diskStatus = getHealthStatus(currentHealth.disk_usage);
  const networkStatus = getHealthStatus(currentHealth.network_usage);

  // Prepare chart data (can be enhanced with historical data)
  const chartData = currentHealth.cpu_usage !== undefined || currentHealth.memory_usage !== undefined ? [
    {
      timestamp: new Date().toISOString(),
      cpu_usage: currentHealth.cpu_usage,
      memory_usage: currentHealth.memory_usage,
      disk_usage: currentHealth.disk_usage,
      network_usage: currentHealth.network_usage,
    },
  ] : [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Health
          {enableRealTime && (
            <Badge variant="outline" className="ml-2">
              <Activity className="h-3 w-3 mr-1" />
              {realtimeHealthData ? "Live (WebSocket)" : isPolling ? "Live (Polling)" : "Live"}
            </Badge>
          )}
          {enableRealTime && lastUpdate && (
            <Badge variant="outline" className="ml-auto text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {lastUpdate.toLocaleTimeString()}
            </Badge>
          )}
          {enableRealTime && isPolling && !realtimeHealthData && (
            <Badge variant="outline" className="ml-2 text-xs">
              Next: {timeUntilNextPoll}s
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {enableRealTime ? 'Real-time' : 'Current'} system resource utilization and service status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* CPU Usage */}
          {currentHealth.cpu_usage !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPercentage(currentHealth.cpu_usage)}</span>
                  <cpuStatus.Icon className={`h-4 w-4 ${cpuStatus.colorClass}`} />
                </div>
              </div>
              <Progress value={currentHealth.cpu_usage} className="h-2" />
            </div>
          )}

          {/* Memory Usage */}
          {currentHealth.memory_usage !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPercentage(currentHealth.memory_usage)}</span>
                  <memoryStatus.Icon className={`h-4 w-4 ${memoryStatus.colorClass}`} />
                </div>
              </div>
              <Progress value={currentHealth.memory_usage} className="h-2" />
            </div>
          )}

          {/* Disk Usage */}
          {currentHealth.disk_usage !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPercentage(currentHealth.disk_usage)}</span>
                  <diskStatus.Icon className={`h-4 w-4 ${diskStatus.colorClass}`} />
                </div>
              </div>
              <Progress value={currentHealth.disk_usage} className="h-2" />
            </div>
          )}

          {/* Network Usage */}
          {currentHealth.network_usage !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Network Usage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPercentage(currentHealth.network_usage)}</span>
                  <networkStatus.Icon className={`h-4 w-4 ${networkStatus.colorClass}`} />
                </div>
              </div>
              <Progress value={currentHealth.network_usage} className="h-2" />
            </div>
          )}
        </div>

        {/* Service Status */}
        {currentHealth.service_status && Object.keys(currentHealth.service_status).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Service Status</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {Object.entries(currentHealth.service_status).map(([serviceName, service]) => {
                const status = service.status === "healthy" ? "default" : service.status === "degraded" ? "secondary" : "destructive";
                return (
                  <div key={serviceName} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{serviceName.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      {service.response_time !== undefined && (
                        <span className="text-xs text-muted-foreground">{service.response_time}ms</span>
                      )}
                      <Badge variant={status}>{service.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Health Chart - can be enhanced with historical data */}
        {chartData.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Resource Usage Trends</h4>
            <SystemHealthChart data={chartData} height={200} showThresholds={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const SystemHealthCard = memo(SystemHealthCardComponent);

