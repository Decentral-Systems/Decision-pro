/**
 * WebSocket Client
 * Manages WebSocket connections with automatic reconnection and message queuing
 */

import { WebSocketConfig, WebSocketMessage, WebSocketStatus, WebSocketSubscription } from './types';
import { getOrCreateCorrelationId } from '../utils/correlationId';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig & { reconnectInterval: number; maxReconnectAttempts: number; heartbeatInterval: number };
  private status: WebSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      onConnect: config.onConnect,
      onDisconnect: config.onDisconnect,
      onError: config.onError,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    this.setStatus('connecting');
    console.log(`[WebSocket] Connecting to ${this.config.url}`);

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
        this.config.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.setStatus('error');
        this.config.onError?.(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.setStatus('disconnected');
        this.stopHeartbeat();
        this.config.onDisconnect?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.setStatus('error');
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  send(message: WebSocketMessage): void {
    // Add correlation ID to message if not present
    const messageWithCorrelationId = {
      ...message,
      correlation_id: (message as any).correlation_id || getOrCreateCorrelationId(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(messageWithCorrelationId));
    } else {
      console.log('[WebSocket] Queueing message (not connected)');
      this.messageQueue.push(messageWithCorrelationId);
    }
  }

  subscribe(channel: string, callback: (data: any) => void): string {
    const subscriptionId = `${channel}_${Date.now()}_${Math.random()}`;
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      channel,
      callback,
    };

    this.subscriptions.set(subscriptionId, subscription);

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Send subscription message to server with correlation ID
    this.send({
      type: 'subscribe',
      channel,
      correlation_id: getOrCreateCorrelationId(),
    } as any);

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.listeners.get(subscription.channel)?.delete(subscription.callback);
      this.subscriptions.delete(subscriptionId);

      // Send unsubscribe message to server
      this.send({
        type: 'unsubscribe',
        channel: subscription.channel,
      } as any);
    }
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    // Emit status change event
    this.emit('status_change', { status });
  }

  private handleMessage(message: WebSocketMessage & { channel?: string; data?: any }): void {
    // Handle heartbeat/pong
    if (message.type === 'pong') {
      return;
    }

    // Handle subscription confirmations
    if (message.type === 'subscribed' || message.type === 'unsubscribed') {
      return;
    }

    // Route message to channel listeners
    // Backend sends messages with channel field, frontend uses type for routing
    const channel = (message as any).channel || message.type;
    const listeners = this.listeners.get(channel);
    if (listeners) {
      // Backend sends data field, client expects payload - extract appropriately
      // For dashboard_metrics and executive_metrics, data contains the actual metrics
      // For other messages, check for nested dashboard/executive objects and extract them
      let payload = (message as any).data || (message as any).payload || message;
      
      // Handle nested structure: if data.dashboard exists, use it instead (backward compatibility)
      if (payload && typeof payload === 'object' && 'dashboard' in payload) {
        payload = payload.dashboard;
      }
      // Handle nested executive structure
      if (payload && typeof payload === 'object' && 'executive' in payload) {
        payload = payload.executive;
      }
      
      listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for ${channel}:`, error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff: base interval * 2^(attempt-1), capped at 30 seconds
    const baseInterval = this.config.reconnectInterval || 3000;
    const exponentialDelay = Math.min(
      baseInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Cap at 30 seconds
    );
    
    console.log(
      `[WebSocket] Reconnecting (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}) in ${exponentialDelay}ms...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, exponentialDelay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', payload: {} });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

