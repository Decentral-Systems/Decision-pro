"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid" | "warning";

interface ValidationIndicatorProps {
  status: ValidationStatus;
  message?: string;
  showIcon?: boolean;
  showMessage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * ValidationIndicator Component
 * 
 * Displays visual feedback for form field validation status
 * 
 * @example
 * ```tsx
 * <ValidationIndicator 
 *   status="valid" 
 *   message="Email is valid" 
 * />
 * ```
 */
export function ValidationIndicator({
  status,
  message,
  showIcon = true,
  showMessage = true,
  className,
  size = "sm",
}: ValidationIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "validating":
        return {
          icon: <Loader2 className={cn(iconSizeClasses[size], "animate-spin")} />,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
        };
      case "valid":
        return {
          icon: <CheckCircle2 className={iconSizeClasses[size]} />,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/20",
        };
      case "invalid":
        return {
          icon: <XCircle className={iconSizeClasses[size]} />,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
        };
      case "warning":
        return {
          icon: <AlertCircle className={iconSizeClasses[size]} />,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        };
      default:
        return {
          icon: null,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 transition-all duration-200",
        sizeClasses[size],
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {showIcon && config.icon}
      {showMessage && message && (
        <span className="truncate">{message}</span>
      )}
    </div>
  );
}

/**
 * Inline validation indicator that appears next to form fields
 */
interface InlineValidationProps {
  status: ValidationStatus;
  message?: string;
  className?: string;
}

export function InlineValidation({
  status,
  message,
  className,
}: InlineValidationProps) {
  if (status === "idle" || !message) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1.5 text-xs transition-all duration-200",
        status === "valid" && "text-green-600 dark:text-green-400",
        status === "invalid" && "text-red-600 dark:text-red-400",
        status === "warning" && "text-yellow-600 dark:text-yellow-400",
        status === "validating" && "text-muted-foreground",
        className
      )}
    >
      <ValidationIndicator 
        status={status} 
        showMessage={false} 
        size="sm" 
      />
      <span>{message}</span>
    </div>
  );
}

/**
 * Field wrapper with validation styling
 */
interface ValidatedFieldProps {
  children: React.ReactNode;
  status: ValidationStatus;
  className?: string;
}

export function ValidatedField({
  children,
  status,
  className,
}: ValidatedFieldProps) {
  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        status === "valid" && "[&_input]:border-green-500 [&_input]:focus-visible:ring-green-500/20",
        status === "invalid" && "[&_input]:border-red-500 [&_input]:focus-visible:ring-red-500/20",
        status === "warning" && "[&_input]:border-yellow-500 [&_input]:focus-visible:ring-yellow-500/20",
        className
      )}
    >
      {children}
    </div>
  );
}

export default ValidationIndicator;


