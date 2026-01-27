"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface DashboardErrors {
  dashboard?: Error | null;
  executive?: Error | null;
  customerStats?: Error | null;
  recommendations?: Error | null;
}

interface DashboardErrorAlertProps {
  errors: DashboardErrors;
  onRetry: () => void;
}

const ERROR_LABELS: Record<keyof DashboardErrors, string> = {
  dashboard: "Dashboard Data",
  executive: "Executive Dashboard Data",
  customerStats: "Customer Statistics",
  recommendations: "Recommendation Statistics",
};

/**
 * Unified error alert component for dashboard errors
 * Consolidates multiple error states into a single, collapsible alert
 */
export function DashboardErrorAlert({ errors, onRetry }: DashboardErrorAlertProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter out null/undefined errors
  const activeErrors = Object.entries(errors).filter(
    ([, error]) => error !== null && error !== undefined
  ) as Array<[keyof DashboardErrors, Error]>;

  if (activeErrors.length === 0) {
    return null;
  }

  // Get error message helper
  const getErrorMessage = (error: Error): string => {
    const message = (error as any)?.message || "Unknown error occurred";
    const statusCode = (error as any)?.statusCode || (error as any)?.response?.status;
    return statusCode ? `${message} (Status: ${statusCode})` : message;
  };

  // Determine if we should show collapsible details
  const showDetails = activeErrors.length > 1;
  const primaryError = activeErrors[0];

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold">
              {activeErrors.length === 1
                ? `Failed to load ${ERROR_LABELS[primaryError[0]]}`
                : `Failed to load ${activeErrors.length} data sources`}
            </span>
            {!showDetails && (
              <p className="text-sm mt-1 text-muted-foreground">
                {getErrorMessage(primaryError[1])}
              </p>
            )}
            {showDetails && (
              <p className="text-sm mt-1 text-muted-foreground">
                Multiple data sources failed to load. {isOpen ? "Click to collapse" : "Click to view details"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
              Retry All
            </Button>
          </div>
        </div>

        {showDetails && isOpen && (
          <div className="space-y-2 pt-2 border-t border-destructive/20">
            {activeErrors.map(([key, error]) => (
              <div key={key} className="text-sm">
                <span className="font-medium">{ERROR_LABELS[key]}:</span>{" "}
                <span className="text-muted-foreground">
                  {getErrorMessage(error)}
                </span>
              </div>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

