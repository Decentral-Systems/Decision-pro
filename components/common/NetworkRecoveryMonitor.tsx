/**
 * Network Recovery Monitor Component
 * 
 * Monitors network connectivity and automatically recovers failed queries.
 * This component uses the useNetworkRecovery hook to ensure queries don't
 * get stuck in error states.
 */

"use client";

import { useNetworkRecovery } from "@/lib/hooks/useNetworkRecovery";
import { useToast } from "@/hooks/use-toast";

/**
 * Network Recovery Monitor
 * 
 * This component runs in the background to monitor network status
 * and automatically recover failed queries when network comes back online.
 * It's invisible to the user but critical for preventing data fetching issues.
 */
export function NetworkRecoveryMonitor() {
  const { toast } = useToast();
  
  useNetworkRecovery({
    enabled: true,
    checkInterval: 30000, // Check every 30 seconds
    onRecovery: () => {
      // Optionally show a toast notification when network recovers
      // (commented out to avoid noise, but can be enabled if needed)
      // toast({
      //   title: "Network Recovered",
      //   description: "Data is being refreshed automatically.",
      //   duration: 3000,
      // });
      
      console.log("[NetworkRecoveryMonitor] Network recovered, queries refreshed");
    },
  });
  
  // This component doesn't render anything
  return null;
}
