/**
 * Enhanced Loading States Component
 * Provides skeleton loaders, timeout handling, and retry buttons
 */

"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EnhancedLoadingStatesProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  timeout?: number; // milliseconds
  showSkeleton?: boolean;
  skeletonCount?: number;
  className?: string;
  children?: React.ReactNode;
}

export function EnhancedLoadingStates({
  isLoading,
  error,
  onRetry,
  timeout = 10000, // 10 seconds default
  showSkeleton = true,
  skeletonCount = 3,
  className,
  children,
}: EnhancedLoadingStatesProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setHasTimedOut(false);
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      setHasTimedOut(false);
    }
  }, [isLoading, timeout]);

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Error loading data</div>
              <div className="text-sm text-muted-foreground mt-1">
                {error.message || "An unexpected error occurred"}
              </div>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Timeout state
  if (hasTimedOut && isLoading) {
    return (
      <Alert className={className}>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Loading is taking longer than expected</div>
              <div className="text-sm text-muted-foreground mt-1">
                The request is still processing. You can wait or retry.
              </div>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state with skeleton
  if (isLoading && showSkeleton) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Loading state without skeleton (spinner)
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Content
  return <>{children}</>;
}

/**
 * Form Field Skeleton Loader
 */
export function FormFieldSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
