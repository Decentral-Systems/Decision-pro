/**
 * React Hook for WebSocket Connection
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getWebSocketClient, WebSocketClient } from "@/lib/utils/websocketClient";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  url?: string;
  enabled?: boolean;
  fallbackToSSE?: boolean;
  onMessage?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsUrl = options.url || process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://196.188.249.48:4000/ws";
  const { enabled = true, fallbackToSSE = false, onMessage, onConnect, onDisconnect, onError } = options;
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!enabled || !wsUrl) {
      return;
    }

    // Create or get WebSocket client (singleton pattern)
    try {
      // Use getWebSocketClient to ensure singleton - prevents multiple connections
      clientRef.current = getWebSocketClient(wsUrl);
    } catch (error) {
      console.error("[useWebSocket] Failed to create client:", error);
      setState("error");
      return;
    }

    const client = clientRef.current;

    // Subscribe to connection events
    const unsubscribeConnection = client.subscribe("connection", (message) => {
      if (message.type === "connected") {
        setState("connected");
        onConnect?.();
      } else if (message.type === "disconnected") {
        setState("disconnected");
        onDisconnect?.();
      }
    });

    // Subscribe to error events
    const unsubscribeError = client.subscribe("error", (message) => {
      setState("error");
      onError?.(message.data);
    });

    // Subscribe to messages
    const unsubscribeMessage = client.subscribe("message", (message) => {
      setLastMessage(message);
      onMessage?.(message);
    });

    // Connect
    client.connect();
    setState(client.getState());

    // Cleanup
    return () => {
      unsubscribeConnection();
      unsubscribeError();
      unsubscribeMessage();
      client.disconnect();
      clientRef.current = null;
    };
  }, [wsUrl, enabled, onMessage, onConnect, onDisconnect, onError]);

  const send = useCallback((message: any) => {
    if (clientRef.current && state === "connected") {
      clientRef.current.send({
        type: message.type || "message",
        data: message.data || message,
        timestamp: Date.now(),
      });
    }
  }, [state]);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current.connect();
    }
  }, []);

  return {
    state,
    lastMessage,
    send,
    reconnect,
    isConnected: state === "connected",
    isConnecting: state === "connecting",
    isDisconnected: state === "disconnected",
    hasError: state === "error",
    status: state,
    transport: "websocket" as const,
  };
}

/**
 * React Hook for WebSocket Channel Subscription
 * Subscribes to a specific WebSocket channel and returns channel data
 */
export function useWebSocketChannel<T = any>(
  channel: string,
  enabled: boolean = true
): { data: T | null; isConnected: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://196.188.249.48:4000/ws";
  
  const { isConnected, send } = useWebSocket({
    url: wsUrl,
    enabled: enabled && typeof window !== "undefined",
    onMessage: (message) => {
      try {
        // Check if message is for this channel
        if (message.data && typeof message.data === "object") {
          const msgData = message.data;
          // Check if message matches channel
          if (msgData.channel === channel || message.type === channel) {
            setData(msgData.data || msgData as T);
            setError(null);
          }
        } else if (message.type === channel) {
          setData(message.data || message as T);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
    },
  });

  // Subscribe to channel when connected
  useEffect(() => {
    if (isConnected && enabled && channel) {
      send({
        type: "subscribe",
        channel: channel,
      });
    }
  }, [isConnected, enabled, channel, send]);

  return {
    data,
    isConnected,
    error,
  };
}
