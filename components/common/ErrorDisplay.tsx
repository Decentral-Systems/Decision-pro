"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  RefreshCw, 
  XCircle, 
  WifiOff, 
  Clock, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { ErrorHandler } from "@/lib/utils/error-handler";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ErrorDisplayProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  showSuggestions?: boolean;
  showDetails?: boolean;
  variant?: "alert" | "card" | "inline" | "minimal";
  className?: string;
}

/**
 * ErrorDisplay Component
 * 
 * Displays errors with user-friendly messages, suggestions, and retry options
 * 
 * @example
 * ```tsx
 * <ErrorDisplay 
 *   error={error}
 *   onRetry={() => refetch()}
 *   showSuggestions
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  title,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = false,
  showSuggestions = true,
  showDetails = false,
  variant = "alert",
  className,
}: ErrorDisplayProps) {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  
  const displayError = ErrorHandler.getDisplayError(error);
  const isRetryable = displayError.retryable && showRetry && onRetry;

  const getIcon = () => {
    if (displayError.title === "Connection Error") {
      return <WifiOff className="h-5 w-5" />;
    }
    if (displayError.title === "Request Timeout") {
      return <Clock className="h-5 w-5" />;
    }
    if (displayError.title === "Authentication Required" || displayError.title === "Access Denied") {
      return <ShieldAlert className="h-5 w-5" />;
    }
    if (displayError.statusCode && displayError.statusCode >= 500) {
      return <XCircle className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  };

  // Minimal inline error
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-red-600 dark:text-red-400", className)}>
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{displayError.message}</span>
        {isRetryable && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Inline error with more details
  if (variant === "inline") {
    return (
      <div className={cn("rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20", className)}>
        <div className="flex items-start gap-3">
          <div className="text-red-600 dark:text-red-400 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {title || displayError.title}
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {displayError.message}
            </p>
            {showSuggestions && displayError.suggestions.length > 0 && (
              <ul className="mt-2 text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                {displayError.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2">
            {isRetryable && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Alert variant
  if (variant === "alert") {
    return (
      <Alert variant="destructive" className={className}>
        {getIcon()}
        <AlertTitle>{title || displayError.title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{displayError.message}</p>
          
          {showSuggestions && displayError.suggestions.length > 0 && (
            <ul className="mt-3 text-sm list-disc list-inside space-y-1 opacity-90">
              {displayError.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
          
          {(isRetryable || (showDismiss && onDismiss)) && (
            <div className="mt-4 flex gap-2">
              {isRetryable && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Try Again
                </Button>
              )}
              {showDismiss && onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
          
          {showDetails && error instanceof Error && (
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs opacity-70 hover:opacity-100">
                  {isDetailsOpen ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 p-2 bg-red-100/50 dark:bg-red-950/50 rounded text-xs overflow-x-auto">
                  {error.stack || error.message}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant (most detailed)
  return (
    <Card className={cn("border-red-200 dark:border-red-900", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {getIcon()}
          </div>
          <CardTitle className="text-lg text-red-800 dark:text-red-200">
            {title || displayError.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          {displayError.message}
        </p>
        
        {showSuggestions && displayError.suggestions.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              <Info className="h-4 w-4" />
              Suggestions
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
              {displayError.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
        
        {showDetails && error instanceof Error && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-red-600 dark:text-red-400">
                {isDetailsOpen ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide Technical Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show Technical Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-xs overflow-x-auto text-gray-700 dark:text-gray-300">
                {error.stack || error.message}
              </pre>
              {displayError.statusCode && (
                <p className="mt-2 text-xs text-gray-500">
                  Status Code: {displayError.statusCode}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      {(isRetryable || (showDismiss && onDismiss)) && (
        <CardFooter className="border-t border-red-100 dark:border-red-900/50 pt-4">
          <div className="flex gap-2 w-full">
            {isRetryable && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button variant="outline" onClick={onDismiss} className="flex-1">
                Dismiss
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Error boundary fallback component
 */
interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <ErrorDisplay
        error={error}
        title="Something went wrong"
        variant="card"
        onRetry={resetErrorBoundary}
        showRetry={!!resetErrorBoundary}
        showSuggestions
        showDetails
      />
    </div>
  );
}

/**
 * Empty state with optional retry
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default ErrorDisplay;


