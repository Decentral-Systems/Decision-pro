/**
 * Server-Sent Events (SSE) Hook
 * Provides SSE fallback when WebSocket is unavailable
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getOrCreateCorrelationId } from "../utils/correlationId";

export type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

export interface SSEMessage<T = any> {
  type: string;
  data: T;
  id?: string;
  event?: string;
  correlation_id?: string;
}

export interface UseSSEOptions {
  url?: string;
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: SSEMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseSSEReturn {
  status: SSEStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    url = process.env.NEXT_PUBLIC_SSE_URL || "http://196.188.249.48:4000/sse",
    enabled = true,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const correlationIdRef = useRef<string>(getOrCreateCorrelationId());

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("[SSE] Already connected");
      return;
    }

    if (eventSourceRef.current?.readyState === EventSource.CONNECTING) {
      console.log("[SSE] Connection in progress");
      return;
    }

    setStatus("connecting");
    console.log(`[SSE] Connecting to ${url}`);

    try {
      // Add correlation ID to URL
      const urlWithCorrelation = `${url}?correlation_id=${correlationIdRef.current}`;
      const eventSource = new EventSource(urlWithCorrelation);

      eventSource.onopen = () => {
        console.log("[SSE] Connected");
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message: SSEMessage = {
            type: data.type || "message",
            data: data.data || data,
            id: event.lastEventId,
            event: event.type,
            correlation_id: data.correlation_id || correlationIdRef.current,
          };

          onMessage?.(message);
        } catch (error) {
          console.error("[SSE] Failed to parse message:", error);
        }
      };

      eventSource.addEventListener("dashboard_metrics", (event: any) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.({
            type: "dashboard_metrics",
            data,
            correlation_id: data.correlation_id || correlationIdRef.current,
          });
        } catch (error) {
          console.error("[SSE] Failed to parse dashboard_metrics:", error);
        }
      });

      eventSource.addEventListener("executive_metrics", (event: any) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.({
            type: "executive_metrics",
            data,
            correlation_id: data.correlation_id || correlationIdRef.current,
          });
        } catch (error) {
          console.error("[SSE] Failed to parse executive_metrics:", error);
        }
      });

      eventSource.addEventListener("risk_alert", (event: any) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.({
            type: "risk_alert",
            data,
            correlation_id: data.correlation_id || correlationIdRef.current,
          });
        } catch (error) {
          console.error("[SSE] Failed to parse risk_alert:", error);
        }
      });

      eventSource.onerror = (error) => {
        console.error("[SSE] Error:", error);
        setStatus("error");
        onError?.(new Error("SSE connection error"));

        // Attempt reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[SSE] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error("[SSE] Max reconnection attempts reached");
          setStatus("disconnected");
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("[SSE] Failed to create connection:", error);
      setStatus("error");
      onError?.(error as Error);
    }
  }, [url, onConnect, onError, onMessage, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus("disconnected");
    onDisconnect?.();
  }, [onDisconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [disconnect, connect, reconnectInterval]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    isConnected: status === "connected",
    connect,
    disconnect,
    reconnect,
  };
}

/**
 * Hook for subscribing to SSE channel
 */
export function useSSEChannel<T = any>(
  channel: string,
  enabled: boolean = true,
  options: Omit<UseSSEOptions, "onMessage"> = {}
): { data: T | null; status: SSEStatus; isConnected: boolean; correlationId?: string } {
  const [data, setData] = useState<T | null>(null);
  const [correlationId, setCorrelationId] = useState<string | undefined>(undefined);

  const { status, isConnected } = useSSE({
    ...options,
    enabled,
    onMessage: (message) => {
      // Filter by channel
      if (message.type === channel || message.event === channel) {
        const payload = message.data as T;
        setData(payload);

        if (message.correlation_id) {
          setCorrelationId(message.correlation_id);
        }
      }
    },
  });

  return { data, status, isConnected, correlationId };
}






