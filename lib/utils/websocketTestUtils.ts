/**
 * WebSocket Connection Testing Utilities
 * Provides utilities for testing WebSocket connections from the frontend
 */

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketTestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface ChannelSubscriptionResult {
  channel: string;
  subscribed: boolean;
  receivedMessage: boolean;
  messageCount: number;
  error?: string;
}

export class WebSocketTestClient {
  private ws: WebSocket | null = null;
  private url: string;
  private state: ConnectionState = "disconnected";
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private receivedMessages: any[] = [];

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Test WebSocket connection establishment
   */
  async testConnection(): Promise<WebSocketTestResult> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url);
        this.state = "connecting";

        const timeout = setTimeout(() => {
          if (this.state !== "connected") {
            this.ws?.close();
            resolve({
              success: false,
              message: "Connection timeout",
              details: { state: this.state },
            });
          }
        }, 5000);

        this.ws.onopen = () => {
          this.state = "connected";
          clearTimeout(timeout);
          resolve({
            success: true,
            message: "Connection established",
            details: { state: this.state },
          });
        };

        this.ws.onerror = (error) => {
          this.state = "error";
          clearTimeout(timeout);
          resolve({
            success: false,
            message: "Connection error",
            details: { error, state: this.state },
          });
        };

        this.ws.onclose = () => {
          this.state = "disconnected";
        };
      } catch (error: any) {
        resolve({
          success: false,
          message: "Failed to create WebSocket",
          details: { error: error.message },
        });
      }
    });
  }

  /**
   * Test channel subscription
   */
  async testChannelSubscription(channel: string, timeoutMs: number = 10000): Promise<ChannelSubscriptionResult> {
    return new Promise((resolve) => {
      if (!this.ws || this.state !== "connected") {
        resolve({
          channel,
          subscribed: false,
          receivedMessage: false,
          messageCount: 0,
          error: "WebSocket not connected",
        });
        return;
      }

      let subscribed = false;
      let receivedMessage = false;
      let messageCount = 0;
      let error: string | undefined;

      const messageHandler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          this.receivedMessages.push(message);

          // Check for subscription confirmation
          if (message.type === "subscribed" && message.channel === channel) {
            subscribed = true;
            messageCount++;
          }

          // Check for actual channel messages
          if (message.channel === channel && message.type !== "subscribed") {
            receivedMessage = true;
            messageCount++;
          }
        } catch (e) {
          // Non-JSON messages are OK (like 'pong')
        }
      };

      this.ws.addEventListener("message", messageHandler);

      // Send subscription message
      try {
        this.ws.send(
          JSON.stringify({
            type: "subscribe",
            channel: channel,
          })
        );
      } catch (e: any) {
        error = `Failed to send subscription: ${e.message}`;
        this.ws.removeEventListener("message", messageHandler);
        resolve({
          channel,
          subscribed: false,
          receivedMessage: false,
          messageCount: 0,
          error,
        });
        return;
      }

      // Set timeout
      setTimeout(() => {
        this.ws?.removeEventListener("message", messageHandler);
        resolve({
          channel,
          subscribed,
          receivedMessage,
          messageCount,
          error,
        });
      }, timeoutMs);
    });
  }

  /**
   * Test heartbeat/ping-pong
   */
  async testHeartbeat(timeoutMs: number = 5000): Promise<WebSocketTestResult> {
    return new Promise((resolve) => {
      if (!this.ws || this.state !== "connected") {
        resolve({
          success: false,
          message: "WebSocket not connected",
        });
        return;
      }

      let pongReceived = false;

      const messageHandler = (event: MessageEvent) => {
        const message = event.data.toString();
        if (message === "pong" || message.includes("pong")) {
          pongReceived = true;
          this.ws?.removeEventListener("message", messageHandler);
          resolve({
            success: true,
            message: "Heartbeat successful",
            details: { pongReceived: true },
          });
        }
      };

      this.ws.addEventListener("message", messageHandler);

      // Send ping
      try {
        this.ws.send("ping");
      } catch (e: any) {
        this.ws.removeEventListener("message", messageHandler);
        resolve({
          success: false,
          message: "Failed to send ping",
          details: { error: e.message },
        });
        return;
      }

      // Set timeout
      setTimeout(() => {
        this.ws?.removeEventListener("message", messageHandler);
        if (!pongReceived) {
          resolve({
            success: false,
            message: "Heartbeat timeout - no pong received",
            details: { pongReceived: false },
          });
        }
      }, timeoutMs);
    });
  }

  /**
   * Test reconnection after disconnect
   */
  async testReconnection(): Promise<WebSocketTestResult> {
    return new Promise((resolve) => {
      if (!this.ws || this.state !== "connected") {
        resolve({
          success: false,
          message: "WebSocket not connected",
        });
        return;
      }

      let reconnected = false;

      const originalClose = this.ws.onclose;
      this.ws.onclose = () => {
        // Attempt reconnection
        setTimeout(() => {
          try {
            const newWs = new WebSocket(this.url);
            newWs.onopen = () => {
              reconnected = true;
              this.ws = newWs;
              this.state = "connected";
              resolve({
                success: true,
                message: "Reconnection successful",
                details: { reconnected: true },
              });
            };
            newWs.onerror = () => {
              resolve({
                success: false,
                message: "Reconnection failed",
                details: { reconnected: false },
              });
            };
          } catch (e: any) {
            resolve({
              success: false,
              message: "Failed to create new connection",
              details: { error: e.message },
            });
          }
        }, 1000);
      };

      // Disconnect
      this.ws.close();

      // Timeout
      setTimeout(() => {
        if (!reconnected) {
          resolve({
            success: false,
            message: "Reconnection timeout",
            details: { reconnected: false },
          });
        }
      }, 10000);
    });
  }

  /**
   * Test real-time updates for a channel
   */
  async testRealTimeUpdates(channel: string, timeoutMs: number = 20000): Promise<WebSocketTestResult> {
    return new Promise((resolve) => {
      if (!this.ws || this.state !== "connected") {
        resolve({
          success: false,
          message: "WebSocket not connected",
        });
        return;
      }

      let updateReceived = false;
      let lastUpdate: any = null;

      const messageHandler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message.channel === channel && message.type !== "subscribed") {
            updateReceived = true;
            lastUpdate = message;
          }
        } catch (e) {
          // Non-JSON messages are OK
        }
      };

      this.ws.addEventListener("message", messageHandler);

      // Subscribe to channel
      try {
        this.ws.send(
          JSON.stringify({
            type: "subscribe",
            channel: channel,
          })
        );
      } catch (e: any) {
        this.ws.removeEventListener("message", messageHandler);
        resolve({
          success: false,
          message: "Failed to subscribe",
          details: { error: e.message },
        });
        return;
      }

      // Set timeout
      setTimeout(() => {
        this.ws?.removeEventListener("message", messageHandler);
        resolve({
          success: updateReceived,
          message: updateReceived
            ? "Real-time updates received"
            : "No updates received within timeout",
          details: {
            updateReceived,
            lastUpdate,
            channel,
          },
        });
      }, timeoutMs);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = "disconnected";
    this.receivedMessages = [];
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get all received messages
   */
  getReceivedMessages(): any[] {
    return [...this.receivedMessages];
  }
}

/**
 * Test WebSocket connection from frontend
 * This function can be called from browser console or test utilities
 */
export async function testWebSocketConnection(
  url: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://196.188.249.48:4000/ws"
): Promise<{
  connection: WebSocketTestResult;
  channels: ChannelSubscriptionResult[];
  heartbeat: WebSocketTestResult;
  realtimeUpdates: WebSocketTestResult[];
}> {
  const client = new WebSocketTestClient(url);

  // Test connection
  const connection = await client.testConnection();

  if (!connection.success) {
    client.disconnect();
    return {
      connection,
      channels: [],
      heartbeat: { success: false, message: "Connection failed" },
      realtimeUpdates: [],
    };
  }

  // Test channel subscriptions
  const channels = await Promise.all([
    client.testChannelSubscription("dashboard_metrics"),
    client.testChannelSubscription("executive_metrics"),
    client.testChannelSubscription("risk_alert"),
    client.testChannelSubscription("system_status"),
  ]);

  // Test heartbeat
  const heartbeat = await client.testHeartbeat();

  // Test real-time updates
  const realtimeUpdates = await Promise.all([
    client.testRealTimeUpdates("dashboard_metrics"),
    client.testRealTimeUpdates("executive_metrics"),
  ]);

  client.disconnect();

  return {
    connection,
    channels,
    heartbeat,
    realtimeUpdates,
  };
}

