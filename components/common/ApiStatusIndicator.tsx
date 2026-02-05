"use client";
/**
 * API Status Indicator Component
 * Shows real-time Online/Offline status based on actual API health checks
 */

import { useMemo } from "react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useApiHealth, useEndpointHealth } from "@/lib/api/hooks/useApiHealth";
import { cn } from "@/lib/utils";

interface ApiStatusIndicatorProps {
  /**
   * Optional: Check a specific endpoint instead of general health
   * If provided, will check this endpoint instead of /health
   */
  endpoint?: string;
  
  /**
   * Custom label (default: "Live" or "Offline")
   */
  label?: string;
  
  /**
   * Show response time (default: false)
   */
  showResponseTime?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Refetch interval in milliseconds (default: 30000 = 30 seconds)
   */
  refetchInterval?: number;
}

export function ApiStatusIndicator({
  endpoint,
  label,
  showResponseTime = false,
  className,
  refetchInterval = 30000,
}: ApiStatusIndicatorProps) {
  // Always call both hooks to avoid conditional hook calls (disable one based on endpoint)
  const endpointHealth = useEndpointHealth(endpoint || "", !!endpoint, refetchInterval);
  const generalHealth = useApiHealth(!endpoint, refetchInterval);
  
  // Use endpoint-specific health check if endpoint is provided, otherwise use general health
  const health = endpoint ? endpointHealth : generalHealth;

  const { isOnline, isChecking, responseTime } = health;

  // Determine status display - use useMemo to ensure it updates when health changes
  const status = useMemo(() => {
    if (isChecking) {
      return {
        icon: Loader2,
        text: "Checking...",
        variant: "secondary" as const,
        badgeClassName: "",
        iconClassName: "", // Will be applied directly to Icon component
      };
    }

    if (isOnline) {
      return {
        icon: Wifi,
        text: label || "Online",
        variant: "default" as const,
        badgeClassName: "bg-green-500 hover:bg-green-600 text-white",
        iconClassName: "",
      };
    }

    return {
      icon: WifiOff,
      text: label || "Offline",
      variant: "destructive" as const,
      badgeClassName: "bg-red-500 hover:bg-red-600 text-white",
      iconClassName: "",
    };
  }, [isChecking, isOnline, label]);

  const Icon = status.icon;

  return (
    <div 
      className="inline-block [&]:!transform-none [&]:!animate-none [&]:!rotate-0" 
      style={{ 
        transform: 'none !important', 
        animation: 'none !important',
        rotate: '0deg !important'
      } as React.CSSProperties}
    >
      <Badge
        variant={status.variant}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1",
          status.badgeClassName,
          className,
          // Strong CSS overrides to prevent rotation - multiple layers
          "[&]:!transform-none [&]:!animate-none [&]:!rotate-0",
          "[&_*]:!transform-none [&_*]:!animate-none [&_*]:!rotate-0"
        )}
        style={{ 
          transform: 'none !important',
          animation: 'none !important',
          rotate: '0deg !important',
          // Additional CSS properties to prevent any animation
          willChange: 'auto',
          backfaceVisibility: 'visible'
        } as React.CSSProperties}
      >
        <Icon 
          className={cn(
            "h-3 w-3",
            status.iconClassName,
            // Ensure only the icon can animate, not the badge
            isChecking && "animate-spin"
          )} 
        />
        <span>{status.text}</span>
        {showResponseTime && responseTime !== null && isOnline && !isChecking && (
          <span className="text-xs opacity-90 ml-1">
            ({responseTime}ms)
          </span>
        )}
      </Badge>
    </div>
  );
}

/**
 * Compact version - just shows icon and status text
 */
export function ApiStatusIndicatorCompact({
  endpoint,
  refetchInterval = 30000,
}: Omit<ApiStatusIndicatorProps, "label" | "showResponseTime">) {
  // Always call both hooks to avoid conditional hook calls (disable one based on endpoint)
  const endpointHealth = useEndpointHealth(endpoint || "", !!endpoint, refetchInterval);
  const generalHealth = useApiHealth(!endpoint, refetchInterval);
  
  // Use endpoint-specific health check if endpoint is provided, otherwise use general health
  const health = endpoint ? endpointHealth : generalHealth;

  const { isOnline, isChecking } = health;

  if (isChecking) {
    return (
      <div 
        className="inline-block [&]:!transform-none [&]:!animate-none [&]:!rotate-0"
        style={{ 
          transform: 'none !important',
          animation: 'none !important',
          rotate: '0deg !important'
        } as React.CSSProperties}
      >
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 px-2 py-0.5 [&]:!transform-none [&]:!animate-none [&]:!rotate-0 [&_*]:!transform-none [&_*]:!animate-none [&_*]:!rotate-0"
          style={{ 
            transform: 'none !important',
            animation: 'none !important',
            rotate: '0deg !important',
            willChange: 'auto',
            backfaceVisibility: 'visible'
          } as React.CSSProperties}
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Checking...</span>
        </Badge>
      </div>
    );
  }

  if (isOnline) {
    return (
      <div 
        className="inline-block [&]:!transform-none [&]:!animate-none [&]:!rotate-0"
        style={{ 
          transform: 'none !important',
          animation: 'none !important',
          rotate: '0deg !important'
        } as React.CSSProperties}
      >
        <Badge 
          className="flex items-center gap-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white [&]:!transform-none [&]:!animate-none [&]:!rotate-0 [&_*]:!transform-none [&_*]:!animate-none [&_*]:!rotate-0"
          style={{ 
            transform: 'none !important',
            animation: 'none !important',
            rotate: '0deg !important',
            willChange: 'auto',
            backfaceVisibility: 'visible'
          } as React.CSSProperties}
        >
          <Wifi className="h-3 w-3" />
          <span className="text-xs">Online</span>
        </Badge>
      </div>
    );
  }

  return (
    <div 
      className="inline-block [&]:!transform-none [&]:!animate-none [&]:!rotate-0"
      style={{ 
        transform: 'none !important',
        animation: 'none !important',
        rotate: '0deg !important'
      } as React.CSSProperties}
    >
      <Badge 
        variant="destructive" 
        className="flex items-center gap-1 px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white [&]:!transform-none [&]:!animate-none [&]:!rotate-0 [&_*]:!transform-none [&_*]:!animate-none [&_*]:!rotate-0"
        style={{ 
          transform: 'none !important',
          animation: 'none !important',
          rotate: '0deg !important',
          willChange: 'auto',
          backfaceVisibility: 'visible'
        } as React.CSSProperties}
      >
        <WifiOff className="h-3 w-3" />
        <span className="text-xs">Offline</span>
      </Badge>
    </div>
  );
}


