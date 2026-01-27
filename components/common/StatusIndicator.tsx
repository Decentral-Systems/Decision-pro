"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  Info,
  type LucideIcon
} from "lucide-react";

type StatusType = 
  | "active" 
  | "inactive" 
  | "success" 
  | "error" 
  | "warning" 
  | "pending" 
  | "info"
  | "approved"
  | "rejected"
  | "processing";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  badgeVariant: "success" | "destructive" | "warning" | "info" | "pending" | "approved" | "rejected" | "default";
}

const statusConfig: Record<StatusType, StatusConfig> = {
  active: {
    label: "Active",
    color: "text-success",
    bgColor: "bg-success",
    icon: CheckCircle,
    badgeVariant: "success",
  },
  inactive: {
    label: "Inactive",
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground",
    icon: XCircle,
    badgeVariant: "default",
  },
  success: {
    label: "Success",
    color: "text-success",
    bgColor: "bg-success",
    icon: CheckCircle,
    badgeVariant: "success",
  },
  error: {
    label: "Error",
    color: "text-destructive",
    bgColor: "bg-destructive",
    icon: XCircle,
    badgeVariant: "destructive",
  },
  warning: {
    label: "Warning",
    color: "text-warning",
    bgColor: "bg-warning",
    icon: AlertTriangle,
    badgeVariant: "warning",
  },
  pending: {
    label: "Pending",
    color: "text-pending",
    bgColor: "bg-pending",
    icon: Clock,
    badgeVariant: "pending",
  },
  info: {
    label: "Info",
    color: "text-info",
    bgColor: "bg-info",
    icon: Info,
    badgeVariant: "info",
  },
  approved: {
    label: "Approved",
    color: "text-approved",
    bgColor: "bg-approved",
    icon: CheckCircle,
    badgeVariant: "approved",
  },
  rejected: {
    label: "Rejected",
    color: "text-rejected",
    bgColor: "bg-rejected",
    icon: XCircle,
    badgeVariant: "rejected",
  },
  processing: {
    label: "Processing",
    color: "text-info",
    bgColor: "bg-info",
    icon: AlertCircle,
    badgeVariant: "info",
  },
};

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  showDot?: boolean;
  variant?: "dot" | "badge" | "icon" | "full";
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  showIcon = true,
  showDot = false,
  variant = "full",
  pulse = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  // Dot only variant
  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          config.bgColor,
          pulse && "animate-pulse-slow",
          className
        )}
        title={displayLabel}
      />
    );
  }

  // Badge variant
  if (variant === "badge") {
    return (
      <Badge variant={config.badgeVariant} pulse={pulse} className={className}>
        {showIcon && <Icon className="mr-1 h-3 w-3" />}
        {displayLabel}
      </Badge>
    );
  }

  // Icon only variant
  if (variant === "icon") {
    return (
      <Icon
        className={cn("h-5 w-5", config.color, pulse && "animate-pulse", className)}
        title={displayLabel}
      />
    );
  }

  // Full variant (dot + icon + text)
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {showDot && (
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            config.bgColor,
            pulse && "animate-pulse-slow"
          )}
        />
      )}
      {showIcon && (
        <Icon className={cn("h-4 w-4", config.color)} />
      )}
      <span className={cn("text-sm font-medium", config.color)}>
        {displayLabel}
      </span>
    </div>
  );
}

// Convenient status indicator components
export function SystemStatus({ online = true }: { online?: boolean }) {
  return (
    <StatusIndicator
      status={online ? "active" : "error"}
      label={online ? "Online" : "Offline"}
      variant="full"
      showDot
      pulse={online}
    />
  );
}

export function LoanStatus({ status }: { status: "approved" | "rejected" | "pending" | "processing" }) {
  return (
    <StatusIndicator
      status={status}
      variant="badge"
      showIcon
    />
  );
}

export function RiskIndicator({ level }: { level: "low" | "medium" | "high" }) {
  const statusMap = {
    low: "success" as const,
    medium: "warning" as const,
    high: "error" as const,
  };
  
  return (
    <StatusIndicator
      status={statusMap[level]}
      label={`${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
      variant="badge"
      showIcon
    />
  );
}
