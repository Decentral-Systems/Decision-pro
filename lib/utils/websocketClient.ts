/**
 * WebSocket Client Utility
 * Manages WebSocket connections with automatic reconnection and message queuing
 */

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3; // Reduced from 10 to 3
  private reconnectDelay: number = 5000; // Increased from 1000 to 5000ms
  private messageQueue: WebSocketMessage[] = [];
  private handlers: Map<string, MessageHandler[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private enabled: boolean = false; // Add enablement flag
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
    // Check if WebSocket should be enabled (defaults to false for safety)
    this.enabled = typeof window !== 'undefined' && 
                   process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';
    
    if (!this.enabled) {
      console.log('[WebSocket] Disabled - Set NEXT_PUBLIC_ENABLE_WEBSOCKET=true to enable');
    }
  }

  connect(): void {
    if (!this.enabled) {
      console.log('[WebSocket] Connection attempt blocked - WebSocket is disabled');
      return;
    }
    
    if (this.state === "connected" || this.state === "connecting") {
      return;
    }

    this.state = "connecting";
    
    // Set connection timeout (10 seconds)
    this.connectionTimeout = setTimeout(() => {
      console.warn('[WebSocket] Connection timeout - disabling WebSocket');
      this.enabled = false;
      this.disconnect();
    }, 10000);
    
    try {
      const wsUrl = this.url.startsWith("ws://") || this.url.startsWith("wss://")
        ? this.url
        : `ws://${this.url}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.state = "connected";
        this.reconnectAttempts = 0;
        console.log("[WebSocket] Connected");
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Process queued messages
        this.processMessageQueue();
        
        // Notify handlers
        this.notifyHandlers("connection", { type: "connected", data: {}, timestamp: Date.now() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        console.error("[WebSocket] Error:", error);
        this.state = "error";
        
        // Disable after max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('[WebSocket] Max reconnect attempts reached - disabling');
          this.enabled = false;
        }
        
        this.notifyHandlers("error", { type: "error", data: error, timestamp: Date.now() });
      };

      this.ws.onclose = () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.state = "disconnected";
        this.stopHeartbeat();
        console.log("[WebSocket] Disconnected");
        
        this.notifyHandlers("connection", { type: "disconnected", data: {}, timestamp: Date.now() });
        
        // Only attempt to reconnect if still enabled
        if (this.enabled) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      console.error("[WebSocket] Failed to connect:", error);
      this.state = "error";
      this.enabled = false; // Disable on connection failure
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.state = "disconnected";
    this.messageQueue = [];
  }

  send(message: WebSocketMessage): void {
    if (this.state === "connected" && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("[WebSocket] Failed to send message:", error);
        // Queue message for later
        this.messageQueue.push(message);
      }
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
      
      // Try to connect if not already connecting
      if (this.state === "disconnected") {
        this.connect();
      }
    }
  }

  subscribe(eventType: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  private handleMessage(message: WebSocketMessage): void {
    // Notify specific event type handlers
    this.notifyHandlers(message.type, message);
    
    // Notify general message handlers
    this.notifyHandlers("message", message);
  }

  private notifyHandlers(eventType: string, message: WebSocketMessage): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${eventType}:`, error);
        }
      });
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state === "connected" && this.ws) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error("[WebSocket] Failed to send queued message:", error);
          // Put message back in queue
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  private attemptReconnect(): void {
    if (!this.enabled) {
      console.log('[WebSocket] Reconnection blocked - WebSocket is disabled');
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnection attempts reached - disabling WebSocket");
      this.state = "error";
      this.enabled = false; // Disable after max attempts
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.state === "connected" && this.ws) {
        this.send({ type: "ping", data: {}, timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance - ensures only one WebSocket connection per URL
const wsClientInstances: Map<string, WebSocketClient> = new Map();

export function getWebSocketClient(url?: string): WebSocketClient {
  if (!url) {
    // Default URL if not provided
    url = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://196.188.249.48:4000/ws";
  }
  
  // Return existing instance if available
  if (wsClientInstances.has(url)) {
    return wsClientInstances.get(url)!;
  }
  
  // Create new instance
  const client = new WebSocketClient(url);
  wsClientInstances.set(url, client);
  return client;
}

export function createWebSocketClient(url: string): WebSocketClient {
  // Use singleton pattern to prevent multiple connections
  return getWebSocketClient(url);
}

