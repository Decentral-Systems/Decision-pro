/**
 * React Hook for Real-time ML Data Updates
 * Subscribes to WebSocket streams for ML Center data
 */

import { useEffect, useState } from "react";
import { useWebSocket } from "./useWebSocket";

interface RealtimeMLDataOptions {
  enabled?: boolean;
  onTrainingJobUpdate?: (job: any) => void;
  onModelStatusUpdate?: (model: any) => void;
  onMetricsUpdate?: (metrics: any) => void;
  onDriftAlert?: (alert: any) => void;
}

export function useRealtimeMLData(options: RealtimeMLDataOptions = {}) {
  const {
    enabled = true,
    onTrainingJobUpdate,
    onModelStatusUpdate,
    onMetricsUpdate,
    onDriftAlert,
  } = options;

  // WebSocket URL - should be configurable
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://196.188.249.48:4000/ws/ml-center";

  const { state, lastMessage, isConnected, reconnect } = useWebSocket({
    url: wsUrl,
    enabled,
    onMessage: (message) => {
      switch (message.type) {
        case "training_job_update":
          onTrainingJobUpdate?.(message.data);
          break;
        case "model_status_update":
          onModelStatusUpdate?.(message.data);
          break;
        case "metrics_update":
          onMetricsUpdate?.(message.data);
          break;
        case "drift_alert":
          onDriftAlert?.(message.data);
          break;
        default:
          // Handle other message types
          break;
      }
    },
  });

  return {
    isConnected,
    connectionState: state,
    lastMessage,
    reconnect,
  };
}

