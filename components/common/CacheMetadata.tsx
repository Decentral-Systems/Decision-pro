"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatLastUpdated, getCacheMetadata } from "@/lib/utils/cacheMetadata";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface CacheMetadataProps {
  cacheKey: string | string[];
  className?: string;
  showRefreshButton?: boolean;
  variant?: "default" | "compact" | "minimal";
}

export function CacheMetadata({
  cacheKey,
  className,
  showRefreshButton = true,
  variant = "default",
}: CacheMetadataProps) {
  const queryClient = useQueryClient();
  const metadata = typeof window !== "undefined" ? getCacheMetadata(Array.isArray(cacheKey) ? cacheKey[0] : cacheKey) : null;
  
  const handleRefresh = () => {
    const keys = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  if (!metadata) {
    return null;
  }

  const isStale = metadata.responseTime && metadata.responseTime > 5000; // Consider stale if >5s response time
  const lastUpdated = metadata.timestamp ? formatLastUpdated(new Date(metadata.timestamp)) : null;

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
        {lastUpdated && (
          <>
            <Clock className="h-3 w-3" />
            <span>{lastUpdated}</span>
          </>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {lastUpdated && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {lastUpdated}
          </Badge>
        )}
        {showRefreshButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className="flex items-center gap-2">
        {isStale ? (
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        {lastUpdated && (
          <span className="text-muted-foreground">
            Updated {lastUpdated}
          </span>
        )}
        {metadata.responseTime && (
          <Badge variant="outline" className="text-xs">
            {metadata.responseTime}ms
          </Badge>
        )}
      </div>
      {showRefreshButton && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      )}
    </div>
  );
}

