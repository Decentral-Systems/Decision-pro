"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, HelpCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface EnhancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  variant?: "default" | "info" | "help" | "warning";
  className?: string;
  maxWidth?: string;
  showIcon?: boolean;
}

/**
 * Enhanced Tooltip Component with improved styling and variants
 */
export function EnhancedTooltip({
  content,
  children,
  side = "top",
  delayDuration = 300,
  variant = "default",
  className,
  maxWidth = "max-w-sm",
  showIcon = false,
}: EnhancedTooltipProps) {
  const variantStyles = {
    default: "bg-popover text-popover-foreground",
    info: "bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800",
    help: "bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800",
    warning: "bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800",
  };

  const iconMap = {
    default: null,
    info: <Info className="h-3 w-3 mr-1.5" />,
    help: <HelpCircle className="h-3 w-3 mr-1.5" />,
    warning: <AlertCircle className="h-3 w-3 mr-1.5" />,
  };

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            "z-50 rounded-lg border px-4 py-3 text-sm shadow-lg",
            variantStyles[variant],
            maxWidth,
            className
          )}
        >
          <div className="flex items-start gap-2">
            {showIcon && iconMap[variant]}
            <div className="flex-1">{content}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Info Tooltip - Quick helper for info icons
 */
export function InfoTooltip({
  content,
  children,
  ...props
}: Omit<EnhancedTooltipProps, "variant" | "showIcon">) {
  return (
    <EnhancedTooltip
      content={content}
      variant="info"
      showIcon={true}
      {...props}
    >
      {children || (
        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
      )}
    </EnhancedTooltip>
  );
}

/**
 * Help Tooltip - Quick helper for help icons
 */
export function HelpTooltip({
  content,
  children,
  ...props
}: Omit<EnhancedTooltipProps, "variant" | "showIcon">) {
  return (
    <EnhancedTooltip
      content={content}
      variant="help"
      showIcon={true}
      {...props}
    >
      {children || (
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
      )}
    </EnhancedTooltip>
  );
}
