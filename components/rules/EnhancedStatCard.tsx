"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { StatCardTrend } from "./StatCardTrend";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface EnhancedStatCardProps {
  title: string;
  total: number;
  active: number;
  icon: LucideIcon;
  trendData?: number[];
  previousValue?: number;
  onClick?: () => void;
  className?: string;
  color?: "default" | "green" | "yellow" | "red";
}

export function EnhancedStatCard({
  title,
  total,
  active,
  icon: Icon,
  trendData,
  previousValue,
  onClick,
  className,
  color = "default",
}: EnhancedStatCardProps) {
  const inactive = total - active;
  const activePercentage = total > 0 ? (active / total) * 100 : 0;

  // Use provided trend data or empty array - no mock data generation
  const defaultTrendData = trendData || [];

  // Determine color scheme
  const colorClasses = {
    default: "border-border hover:border-primary/50",
    green:
      "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 hover:border-green-300 dark:hover:border-green-700",
    yellow:
      "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20 hover:border-yellow-300 dark:hover:border-yellow-700",
    red: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700",
  };

  // Determine status color based on active percentage
  const statusColor =
    activePercentage >= 75
      ? "green"
      : activePercentage >= 50
      ? "yellow"
      : "red";

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md",
        colorClasses[statusColor],
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-lg",
              statusColor === "green" &&
                "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
              statusColor === "yellow" &&
                "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
              statusColor === "red" &&
                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
              statusColor === "default" &&
                "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs">
          {total}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{active}</div>
            <div className="text-xs text-muted-foreground">
              {activePercentage.toFixed(0)}% active
            </div>
          </div>

          {/* Trend Chart */}
          {defaultTrendData.length > 0 && (
            <StatCardTrend
              data={defaultTrendData}
              currentValue={active}
              previousValue={previousValue}
            />
          )}

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{inactive} inactive</span>
            {onClick && (
              <span className="text-primary hover:underline">Click to filter</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

