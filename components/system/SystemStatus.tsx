"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SystemStatus as SystemStatusType, SystemMetrics } from "@/types/system";
import { Activity, Server, Database, Zap } from "lucide-react";

interface SystemStatusProps {
  status: SystemStatusType;
  isLoading?: boolean;
}

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days} days, ${hours} hours`;
  if (hours > 0) return `${hours} hours, ${minutes} minutes`;
  return `${minutes} minutes`;
};

export function SystemStatus({ status, isLoading }: SystemStatusProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Handle null/undefined status
  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No system status data available</p>
        </CardContent>
      </Card>
    );
  }

  // Normalize API response: map 'status' to 'overall_status' if needed
  const overallStatus = (status as any).overall_status || (status as any).status || "unknown";
  const version = status.version || "Unknown";
  const uptimeSeconds = status.uptime_seconds || 0;
  const services = status.services || {};
  const dependencies = status.dependencies || {};
  const metrics = status.metrics;

  const getOverallStatusColor = (statusValue: string) => {
    switch (statusValue?.toLowerCase()) {
      case "healthy":
      case "operational":
        return "default";
      case "degraded":
        return "secondary";
      case "unhealthy":
      case "down":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Map operational to healthy for display
  const displayStatus = overallStatus === "operational" ? "healthy" : overallStatus;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Overall system health and uptime</CardDescription>
            </div>
            <Badge variant={getOverallStatusColor(overallStatus) as any} className="text-lg px-4 py-2">
              {displayStatus?.toUpperCase() || "UNKNOWN"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Version</div>
              <div className="text-2xl font-bold">{version}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="text-sm font-medium">{formatUptime(uptimeSeconds)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Services</div>
              <div className="text-2xl font-bold">
                {Object.keys(services).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-sm font-medium capitalize">{displayStatus}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>Current system resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.cpu_usage !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <span className="text-sm font-medium">{(metrics.cpu_usage || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cpu_usage || 0} />
                </div>
              )}

              {metrics.memory_usage !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className="text-sm font-medium">{(metrics.memory_usage || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.memory_usage || 0} />
                </div>
              )}

              {metrics.disk_usage !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Disk Usage</span>
                    </div>
                    <span className="text-sm font-medium">{(metrics.disk_usage || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.disk_usage || 0} />
                </div>
              )}

              {(metrics.network_throughput !== undefined || metrics.active_connections !== undefined) && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {metrics.network_throughput !== undefined && (
                    <div>
                      <div className="text-sm text-muted-foreground">Network Throughput</div>
                      <div className="text-lg font-medium">
                        {((metrics.network_throughput || 0) / 1024 / 1024).toFixed(2)} MB/s
                      </div>
                    </div>
                  )}
                  {metrics.active_connections !== undefined && (
                    <div>
                      <div className="text-sm text-muted-foreground">Active Connections</div>
                      <div className="text-lg font-medium">{metrics.active_connections || 0}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


