"use client";

/**
 * SLA Status Chips Component
 * Displays API health status with latency for multiple services
 */

import { ApiStatusIndicator } from "@/components/api-status-indicator";
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

const creditScoringBase =
  process.env.NEXT_PUBLIC_CREDIT_SCORING_API_URL || "http://196.188.249.48:4001";
const CREDIT_SCORING_HEALTH_URL = creditScoringBase.replace(/\/$/, "") + "/health";

const DEFAULT_SERVICES: ServiceSLA[] = [
  {
    name: "API Gateway",
    endpoint: "/health",
    label: "Gateway",
    showLatency: true,
  },
  {
    name: "Credit Scoring Engine",
    endpoint: CREDIT_SCORING_HEALTH_URL,
    label: "Credit Scoring",
    showLatency: true,
  },
];

export function SLAStatusChips({
  services = DEFAULT_SERVICES,
  className,
  compact = false,
}: SLAStatusChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
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
