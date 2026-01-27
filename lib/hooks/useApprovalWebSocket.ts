/**
 * WebSocket hook for real-time approval updates
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export interface ApprovalUpdate {
  type: "approval_completed" | "approval_started" | "stage_changed" | "condition_updated";
  workflow_id: string;
  application_id?: string;
  decision?: string;
  stage?: string;
  status?: string;
  timestamp: string;
  user_id?: string;
  message?: string;
}

interface UseApprovalWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useApprovalWebSocket(
  onUpdate?: (update: ApprovalUpdate) => void,
  options: UseApprovalWebSocketOptions = {}
) {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ApprovalUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.log("[ApprovalWebSocket] Not authenticated, skipping connection");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[ApprovalWebSocket] Already connected");
      return;
    }

    try {
      // In a real implementation, this would connect to the actual WebSocket endpoint
      // For now, we'll simulate the WebSocket connection
      console.log("[ApprovalWebSocket] Attempting to connect...");
      
      // Simulate WebSocket URL - in production this would be something like:
      // const wsUrl = `ws://196.188.249.48:4000/ws/approvals?token=${accessToken}`;
      // For now, we'll simulate the connection
      
      // Create a mock WebSocket-like object for development
      const mockWs = {
        readyState: WebSocket.OPEN,
        close: () => {
          setIsConnected(false);
          console.log("[ApprovalWebSocket] Connection closed");
        },
        send: (data: string) => {
          console.log("[ApprovalWebSocket] Sending:", data);
        }
      };

      wsRef.current = mockWs as any;
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      
      console.log("[ApprovalWebSocket] Connected successfully");

      // Simulate receiving updates periodically (for development)
      const simulateUpdates = () => {
        if (!isConnected) return;
        
        // Randomly simulate approval updates
        if (Math.random() > 0.95) { // 5% chance every interval
          const mockUpdate: ApprovalUpdate = {
            type: "approval_completed",
            workflow_id: `WF_${Date.now()}`,
            application_id: `APP_${Date.now()}`,
            decision: Math.random() > 0.5 ? "approved" : "rejected",
            timestamp: new Date().toISOString(),
            user_id: user?.id,
            message: "Approval decision completed"
          };
          
          setLastUpdate(mockUpdate);
          onUpdate?.(mockUpdate);
        }
      };

      // Start simulation (remove in production)
      const simulationInterval = setInterval(simulateUpdates, 10000); // Every 10 seconds

      // Cleanup simulation on disconnect
      const originalClose = mockWs.close;
      mockWs.close = () => {
        clearInterval(simulationInterval);
        originalClose();
      };

      /* 
      // Real WebSocket implementation would look like this:
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("[ApprovalWebSocket] Connected");
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send authentication message
        ws.send(JSON.stringify({
          type: "auth",
          token: accessToken,
          user_id: user?.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const update: ApprovalUpdate = JSON.parse(event.data);
          console.log("[ApprovalWebSocket] Received update:", update);
          
          setLastUpdate(update);
          onUpdate?.(update);
        } catch (error) {
          console.error("[ApprovalWebSocket] Failed to parse message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("[ApprovalWebSocket] Connection closed:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error("[ApprovalWebSocket] Connection error:", error);
        setConnectionError("WebSocket connection failed");
        setIsConnected(false);
      };

      wsRef.current = ws;
      */
      
    } catch (error) {
      console.error("[ApprovalWebSocket] Failed to connect:", error);
      setConnectionError("Failed to establish WebSocket connection");
      scheduleReconnect();
    }
  }, [isAuthenticated, user, onUpdate, maxReconnectAttempts]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log("[ApprovalWebSocket] Max reconnect attempts reached");
      setConnectionError("Max reconnection attempts reached");
      return;
    }

    reconnectAttemptsRef.current += 1;
    console.log(`[ApprovalWebSocket] Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastUpdate,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts
  };
}