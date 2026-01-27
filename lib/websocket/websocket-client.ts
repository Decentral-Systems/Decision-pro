/**
 * WebSocket Client for Real-time Scoring
 * Handles WebSocket connection, reconnection, and message handling
 */

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export interface WebSocketClientOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private status: WebSocketStatus = "disconnected";
  private onMessage?: (message: WebSocketMessage) => void;
  private onError?: (error: Event) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private shouldReconnect: boolean = true;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Already connected");
      return;
    }

    this.status = "connecting";
    console.log(`[WebSocket] Connecting to ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected");
        this.status = "connected";
        this.reconnectAttempts = 0;
        this.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("[WebSocket] Message received:", message.type);
          this.onMessage?.(message);
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        this.status = "error";
        this.onError?.(error);
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        this.status = "disconnected";
        this.onDisconnect?.();

        // Attempt to reconnect if needed
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
      this.status = "error";
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = "disconnected";
  }

  /**
   * Send message to WebSocket server
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message - not connected");
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === "connected" && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(
      `[WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }
}






