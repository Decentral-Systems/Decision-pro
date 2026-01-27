"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceStatus } from "@/types/system";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface ServiceHealthProps {
  service: ServiceStatus;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "unhealthy":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "default";
    case "degraded":
      return "secondary";
    case "unhealthy":
      return "destructive";
    default:
      return "outline";
  }
};

const formatUptime = (seconds?: number) => {
  if (!seconds) return "N/A";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export function ServiceHealth({ service }: ServiceHealthProps) {
  // Handle null/undefined service
  if (!service) {
    return null;
  }

  // Ensure we have status and name
  const statusValue = service.status || "unknown";
  const serviceName = service.name || "Unknown Service";

  // Handle operational status (map to healthy)
  const displayStatus = statusValue === "operational" ? "healthy" : statusValue;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(displayStatus)}
            <h3 className="font-semibold">{serviceName}</h3>
          </div>
          <Badge variant={getStatusColor(displayStatus) as any}>
            {displayStatus}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          {service.version && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">{service.version}</span>
            </div>
          )}
          {service.response_time_ms !== undefined && service.response_time_ms !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response Time</span>
              <span className="font-medium">{(service.response_time_ms || 0).toFixed(0)} ms</span>
            </div>
          )}
          {service.uptime_seconds !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{formatUptime(service.uptime_seconds)}</span>
            </div>
          )}
          {service.error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
              {service.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


