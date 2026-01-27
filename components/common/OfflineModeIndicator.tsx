/**
 * Offline Mode Indicator Component
 * Shows when system is in offline mode with sync capabilities
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { gracefulDegradationService } from "@/lib/services/graceful-degradation";

interface OfflineModeIndicatorProps {
  className?: string;
  onSync?: () => void;
}

export function OfflineModeIndicator({
  className,
  onSync,
}: OfflineModeIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const checkNetworkStatus = () => {
      const offline = gracefulDegradationService.isOfflineMode();
      setIsOffline(offline);
    };

    // Check on mount
    checkNetworkStatus();

    // Listen to online/offline events
    window.addEventListener("online", checkNetworkStatus);
    window.addEventListener("offline", checkNetworkStatus);

    // Periodic check
    const interval = setInterval(checkNetworkStatus, 5000);

    return () => {
      window.removeEventListener("online", checkNetworkStatus);
      window.removeEventListener("offline", checkNetworkStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Trigger sync
      onSync?.();
      
      // Wait a bit for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setLastSync(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOffline) {
    return lastSync ? (
      <Alert className={className}>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <div className="flex items-center justify-between">
            <span>All systems online</span>
            <Badge variant="outline" className="text-xs">
              Last synced: {lastSync.toLocaleTimeString()}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    ) : null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Offline Mode</div>
            <div className="text-xs text-muted-foreground">
              Network connection unavailable. Some features may be limited.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
