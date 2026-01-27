/**
 * SLA Timer Component
 * Shows countdown timer for critical violations
 */

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SLAConfig {
  critical: number; // hours
  high: number;
  medium: number;
  low: number;
}

const DEFAULT_SLA: SLAConfig = {
  critical: 1, // 1 hour for critical
  high: 4, // 4 hours for high
  medium: 24, // 24 hours for medium
  low: 72, // 72 hours for low
};

interface SLATimerProps {
  detectedAt: Date | string;
  severity: "critical" | "high" | "medium" | "low";
  slaConfig?: SLAConfig;
  className?: string;
}

export function SLATimer({ detectedAt, severity, slaConfig = DEFAULT_SLA, className }: SLATimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const detected = typeof detectedAt === "string" ? new Date(detectedAt) : detectedAt;
      const now = new Date();
      const elapsed = (now.getTime() - detected.getTime()) / (1000 * 60 * 60); // hours
      const slaHours = slaConfig[severity];
      const remaining = slaHours - elapsed;

      setTimeRemaining(Math.max(0, remaining));
      setIsBreached(remaining <= 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [detectedAt, severity, slaConfig]);

  const formatTime = (hours: number): string => {
    if (hours <= 0) return "Breached";
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getStatusColor = () => {
    if (isBreached) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    if (timeRemaining < slaConfig[severity] * 0.25) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
  };

  return (
    <Badge
      variant="outline"
      className={cn("flex items-center gap-1.5", getStatusColor(), className)}
    >
      {isBreached ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      <span className="text-xs font-medium">
        {isBreached ? "SLA Breached" : `${formatTime(timeRemaining)} remaining`}
      </span>
    </Badge>
  );
}



