"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WebSocketClient, WebSocketStatus, WebSocketMessage } from "./websocket-client";

export interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

export interface UseWebSocketReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  send: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  error: Event | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * React hook for WebSocket connection
 * Provides connection status, message handling, and automatic reconnection
 */
export function useWebSocket(
  options: UseWebSocketOptions
): UseWebSocketReturn {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage(message);
  }, []);

  const handleError = useCallback((err: Event) => {
    setError(err);
  }, []);

  const handleConnect = useCallback(() => {
    setStatus("connected");
    setError(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    setStatus("disconnected");
  }, []);

  // Initialize WebSocket client
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!clientRef.current) {
      clientRef.current = new WebSocketClient({
        url,
        reconnectInterval,
        maxReconnectAttempts,
        onMessage: handleMessage,
        onError: handleError,
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
      });
    }

    // Connect when enabled
    clientRef.current.connect();

    // Cleanup on unmount or when disabled
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [
    url,
    reconnectInterval,
    maxReconnectAttempts,
    enabled,
    handleMessage,
    handleError,
    handleConnect,
    handleDisconnect,
  ]);

  // Update status from client
  useEffect(() => {
    if (clientRef.current) {
      const interval = setInterval(() => {
        const currentStatus = clientRef.current?.getStatus();
        if (currentStatus && currentStatus !== status) {
          setStatus(currentStatus);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const send = useCallback((message: WebSocketMessage) => {
    if (clientRef.current) {
      clientRef.current.send(message);
    }
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  return {
    status,
    isConnected: status === "connected",
    send,
    lastMessage,
    error,
    connect,
    disconnect,
  };
}






