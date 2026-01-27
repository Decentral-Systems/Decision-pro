"use client";

/**
 * SLA Status Chips Component
 * Displays API health status with latency for multiple services
 */

import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";
import { cn } from "@/lib/utils";

interface ServiceSLA {
  name: string;
  endpoint: string;
  label?: string;
  showLatency?: boolean;
}

interface SLAStatusChipsProps {
  services?: ServiceSLA[];
  className?: string;
  compact?: boolean;
}

const DEFAULT_SERVICES: ServiceSLA[] = [
  {
    name: "API Gateway",
    endpoint: "/health",
    label: "Gateway",
    showLatency: true,
  },
  // Removed "Scoring" and "Prediction" status pills as they were showing incorrect information
];

export function SLAStatusChips({
  services = DEFAULT_SERVICES,
  className,
  compact = false,
}: SLAStatusChipsProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {services.map((service) => (
        <ApiStatusIndicator
          key={service.name}
          endpoint={service.endpoint}
          label={service.label || service.name}
          showResponseTime={service.showLatency}
          className={compact ? "text-xs" : undefined}
        />
      ))}
    </div>
  );
}

