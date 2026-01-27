/**
 * SLA Status Chip Component
 * Displays API health status with latency metrics
 */

"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SLAStatus {
  service: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  latency?: {
    p50?: number;
    p95?: number;
    p99?: number;
  };
  lastCheck?: Date;
}

interface SLAStatusChipProps {
  status: SLAStatus;
  showLatency?: boolean;
  className?: string;
}

export function SLAStatusChip({ status, showLatency = true, className }: SLAStatusChipProps) {
  const getStatusColor = () => {
    switch (status.status) {
      case "healthy":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "degraded":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "down":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case "healthy":
        return <CheckCircle2 className="h-3 w-3" />;
      case "degraded":
        return <AlertCircle className="h-3 w-3" />;
      case "down":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatLatency = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)} style={{ transform: 'none', animation: 'none' }}>
      <Badge
        variant="outline"
        className={cn("flex items-center gap-1.5", getStatusColor(), "[&]:!transform-none [&]:!animate-none [&]:!rotate-0")}
        style={{ 
          transform: 'none !important',
          animation: 'none !important',
          rotate: '0deg !important'
        } as React.CSSProperties}
      >
        {getStatusIcon()}
        <span className="text-xs font-medium">{status.service}</span>
      </Badge>
      {showLatency && status.latency && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {status.latency.p50 && (
            <span title="p50 latency">p50: {formatLatency(status.latency.p50)}</span>
          )}
          {status.latency.p95 && (
            <span title="p95 latency">p95: {formatLatency(status.latency.p95)}</span>
          )}
          {status.latency.p99 && (
            <span title="p99 latency">p99: {formatLatency(status.latency.p99)}</span>
          )}
        </div>
      )}
    </div>
  );
}



