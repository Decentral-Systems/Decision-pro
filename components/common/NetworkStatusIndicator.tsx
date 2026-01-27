/**
 * Global Network Status Indicator
 * 
 * Shows network connectivity status in the application header/layout.
 * Provides visual feedback when network is offline and when it recovers.
 */

"use client";

import { useNetworkRecovery } from "@/lib/hooks/useNetworkRecovery";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NetworkStatusIndicatorProps {
  /**
   * Variant: "badge" (default) or "minimal"
   */
  variant?: "badge" | "minimal";
  
  /**
   * Show in header/compact mode
   */
  compact?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * When true, use only navigator.onLine. No API health check, no offline toasts.
   * Use on login page to avoid false "Network Offline" when /health fails (CORS, etc).
   */
  browserOnly?: boolean;
}

export function NetworkStatusIndicator({
  variant = "badge",
  compact = false,
  className,
  browserOnly = false,
}: NetworkStatusIndicatorProps) {
  const { toast } = useToast();
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  
  // browserOnly: use only navigator.onLine, no API health check
  useEffect(() => {
    if (!browserOnly || typeof window === "undefined") return;
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    setBrowserOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [browserOnly]);
  
  const { isOnline: apiOnline, isChecking } = useNetworkRecovery({
    enabled: !browserOnly,
    checkInterval: 30000,
    onRecovery: () => {
      if (browserOnly) return;
      toast({
        title: "Network Recovered",
        description: "Your connection has been restored. Data is being refreshed.",
        duration: 5000,
      });
    },
  });
  
  const wasOfflineRef = useRef<boolean>(false);
  const hasShownOfflineToastRef = useRef<boolean>(false);
  
  const isOnline = browserOnly ? browserOnline : apiOnline;
  const isCheckingState = browserOnly ? false : isChecking;
  
  // Show toast when network goes offline (only once) — skip when browserOnly
  useEffect(() => {
    if (browserOnly) return;
    if (!isOnline && !isCheckingState && !hasShownOfflineToastRef.current) {
      hasShownOfflineToastRef.current = true;
      wasOfflineRef.current = true;
      toast({
        title: "Network Offline",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive",
        duration: 5000,
      });
    } else if (isOnline && wasOfflineRef.current) {
      hasShownOfflineToastRef.current = false;
      wasOfflineRef.current = false;
    }
  }, [isOnline, isCheckingState, toast, browserOnly]);
  
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isCheckingState ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  }
  
  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1",
        isOnline && "bg-green-500 hover:bg-green-600",
        !isOnline && "bg-red-500 hover:bg-red-600",
        compact && "text-xs px-1.5 py-0.5",
        className
      )}
    >
      {isCheckingState ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          {!compact && <span>Checking...</span>}
        </>
      ) : isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          {!compact && <span>Online</span>}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          {!compact && <span>Offline</span>}
        </>
      )}
    </Badge>
  );
}
