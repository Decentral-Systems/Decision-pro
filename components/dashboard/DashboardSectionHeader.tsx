"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/common/EnhancedTooltip";

interface DashboardSectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  };
  actions?: React.ReactNode;
  className?: string;
  showSeparator?: boolean;
  variant?: "default" | "compact" | "large";
}

export function DashboardSectionHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  className,
  showSeparator = true,
  variant = "default",
}: DashboardSectionHeaderProps) {
  const variantStyles = {
    default: "mb-6",
    compact: "mb-4",
    large: "mb-8",
  };

  const titleSizes = {
    default: "text-2xl",
    compact: "text-xl",
    large: "text-3xl",
  };

  return (
    <div className={cn("space-y-3", variantStyles[variant], className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {Icon && (
            <div className="flex-shrink-0 mt-1" aria-hidden="true">
              <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 
                id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn("font-bold tracking-tight", titleSizes[variant])}
              >
                {title}
              </h2>
              {badge && (
                <Badge variant={badge.variant || "secondary"} className="shrink-0">
                  {badge.label}
                </Badge>
              )}
            </div>
            {description && (
              <div className="flex items-start gap-2 mt-1.5">
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {description}
                </p>
                <InfoTooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">{title}</p>
                      <p className="text-xs">{description}</p>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {showSeparator && (
        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
      )}
    </div>
  );
}
