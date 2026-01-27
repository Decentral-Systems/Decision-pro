"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/utils/format";
import type { KPIMetric } from "@/types/dashboard";

interface KPICardProps {
  metric: KPIMetric | undefined;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  interactive?: boolean;
}

function KPICardComponent({
  metric,
  className,
  "aria-label": ariaLabel,
  onClick,
  interactive = false,
}: KPICardProps) {
  // Handle undefined/null metric with shimmer loading
  if (!metric) {
    return (
      <Card className={cn("shimmer", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-3 w-32 bg-muted animate-pulse rounded mt-2"></div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = () => {
    switch (metric.format) {
      case "currency":
        return formatCurrency(metric.value);
      case "percentage":
        return formatPercentage(metric.value);
      default:
        return formatNumber(metric.value);
    }
  };

  const getTrendIcon = () => {
    if (!metric.change) return null;

    if (metric.changeType === "increase") {
      return <TrendingUp className="h-4 w-4" />;
    } else if (metric.changeType === "decrease") {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = () => {
    if (metric.changeType === "increase")
      return "text-success bg-success/10";
    if (metric.changeType === "decrease")
      return "text-danger bg-danger/10";
    return "text-muted-foreground bg-muted/10";
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:border-primary/50",
        interactive && "cursor-pointer hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {metric.label}
        </CardTitle>
        {metric.change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all",
              getChangeColor()
            )}
          >
            {getTrendIcon()}
            <span>
              {metric.changeType === "increase" ? "+" : ""}
              {formatPercentage(Math.abs(metric.change))}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight">
              {formatValue()}
            </div>
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground">
                {metric.subtitle}
              </p>
            )}
          </div>

          {interactive && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        {metric.change !== undefined && (
          <p className="text-xs text-muted-foreground mt-2">
            vs. last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders with custom comparison
export const KPICard = memo(KPICardComponent, (prev, next) => {
  // Custom comparison function for better memoization
  if (!prev.metric && !next.metric) return true;
  if (!prev.metric || !next.metric) return false;
  return (
    prev.metric.value === next.metric.value &&
    prev.metric.change === next.metric.change &&
    prev.metric.changeType === next.metric.changeType &&
    prev.metric.format === next.metric.format &&
    prev.metric.label === next.metric.label &&
    prev.interactive === next.interactive
  );
});

KPICard.displayName = "KPICard";
