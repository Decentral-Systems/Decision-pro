"use client";

/**
 * React hook for Real-Time Scoring WebSocket integration
 * Connects to backend WebSocket endpoint for live credit score updates
 */
import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

export interface CreditScoreUpdate {
  customer_id: string;
  credit_score: number;
  risk_category: string;
  timestamp: string;
  model_predictions?: any;
  compliance_status?: any;
}

export interface UseRealtimeScoringOptions {
  customerId?: string;
  enabled?: boolean;
  autoReconnect?: boolean;
}

export interface UseRealtimeScoringReturn {
  isConnected: boolean;
  status: string;
  latestScore: CreditScoreUpdate | null;
  scoreHistory: CreditScoreUpdate[];
  error: Event | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (customerId: string) => void;
  unsubscribe: () => void;
}

/**
 * Hook for real-time credit scoring updates via WebSocket
 * 
 * Backend endpoint: ws://196.188.249.48:4000/ws/realtime-scoring
 * 
 * Message format:
 * - Subscribe: { type: "subscribe", customer_id: "CUST123" }
 * - Updates: { type: "credit_score_update", data: { customer_id, credit_score, ... } }
 */
export function useRealtimeScoring(
  options: UseRealtimeScoringOptions = {}
): UseRealtimeScoringReturn {
  const { customerId, enabled = true, autoReconnect = true } = options;

  // WebSocket URL - defaults to API Gateway WebSocket endpoint
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_WS_REALTIME_SCORING_URL ||
    "ws://196.188.249.48:4000/ws/realtime-scoring";

  const [latestScore, setLatestScore] = useState<CreditScoreUpdate | null>(null);
  const [scoreHistory, setScoreHistory] = useState<CreditScoreUpdate[]>([]);
  const [subscribedCustomerId, setSubscribedCustomerId] = useState<string | undefined>(customerId);

  // Use the base WebSocket hook
  const {
    status,
    isConnected,
    send,
    lastMessage,
    error,
    connect,
    disconnect,
  } = useWebSocket({
    url: wsUrl,
    enabled: enabled && !!subscribedCustomerId,
    reconnectInterval: 3000,
    maxReconnectAttempts: autoReconnect ? 10 : 0,
  });

  // Subscribe to customer updates
  const subscribe = useCallback(
    (customerId: string) => {
      setSubscribedCustomerId(customerId);
      if (isConnected) {
        send({
          type: "subscribe",
          customer_id: customerId,
        });
      }
    },
    [isConnected, send]
  );

  // Unsubscribe from updates
  const unsubscribe = useCallback(() => {
    if (isConnected && subscribedCustomerId) {
      send({
        type: "unsubscribe",
        customer_id: subscribedCustomerId,
      });
    }
    setSubscribedCustomerId(undefined);
  }, [isConnected, subscribedCustomerId, send]);

  // Subscribe when connected and customer ID is available
  useEffect(() => {
    if (isConnected && subscribedCustomerId) {
      send({
        type: "subscribe",
        customer_id: subscribedCustomerId,
      });
    }
  }, [isConnected, subscribedCustomerId, send]);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      // Handle credit score updates
      if (lastMessage.type === "credit_score_update" && lastMessage.data) {
        const update: CreditScoreUpdate = {
          customer_id: lastMessage.data.customer_id || subscribedCustomerId || "",
          credit_score: lastMessage.data.credit_score || 0,
          risk_category: lastMessage.data.risk_category || "medium",
          timestamp: lastMessage.data.timestamp || new Date().toISOString(),
          model_predictions: lastMessage.data.model_predictions,
          compliance_status: lastMessage.data.compliance_status,
        };

        setLatestScore(update);
        setScoreHistory((prev) => {
          // Keep last 50 updates
          const updated = [update, ...prev].slice(0, 50);
          return updated;
        });
      }

      // Handle subscription confirmation
      if (lastMessage.type === "subscribed") {
        console.log("Subscribed to real-time scoring updates", lastMessage.data);
      }

      // Handle errors
      if (lastMessage.type === "error") {
        console.error("WebSocket error:", lastMessage.data);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }, [lastMessage, subscribedCustomerId]);

  // Update subscription when customerId prop changes
  useEffect(() => {
    if (customerId && customerId !== subscribedCustomerId) {
      subscribe(customerId);
    }
  }, [customerId, subscribedCustomerId, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    isConnected,
    status,
    latestScore,
    scoreHistory,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for subscribing to multiple customers' real-time scores
 */
export function useRealtimeScoringMulti(
  customerIds: string[],
  options: Omit<UseRealtimeScoringOptions, "customerId"> = {}
) {
  const [scores, setScores] = useState<Map<string, CreditScoreUpdate>>(new Map());

  // For multiple customers, we'd need a different WebSocket approach
  // This is a placeholder for future implementation
  // The backend would need to support multi-customer subscriptions

  return {
    scores,
    isConnected: false,
    status: "not_implemented" as const,
  };
}






