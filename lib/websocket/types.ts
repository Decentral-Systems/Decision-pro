/**
 * WebSocket Types and Interfaces
 */

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp?: number;
  correlation_id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface WebSocketSubscription {
  id: string;
  channel: string;
  callback: (data: any) => void;
}

export type WebSocketEventType =
  | 'credit_score_update'
  | 'risk_alert'
  | 'dashboard_metrics'
  | 'customer_update'
  | 'system_status'
  | 'audit_log'
  | 'model_training_status'
  | 'executive_metrics'
  | 'system_health';




