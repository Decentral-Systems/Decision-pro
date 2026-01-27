/**
 * System Status types
 */

export interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  response_time_ms?: number;
  uptime_seconds?: number;
  version?: string;
  last_check?: string;
  error?: string;
}

export interface DependencyStatus {
  database: ServiceStatus;
  redis: ServiceStatus;
  kafka: ServiceStatus;
  [key: string]: ServiceStatus;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_throughput: number;
  active_connections: number;
}

export interface SystemStatus {
  overall_status: "healthy" | "degraded" | "unhealthy";
  services: {
    api_gateway: ServiceStatus;
    credit_scoring: ServiceStatus;
    default_prediction?: ServiceStatus;
    [key: string]: ServiceStatus | undefined;
  };
  dependencies: DependencyStatus;
  metrics: SystemMetrics;
  uptime_seconds: number;
  version: string;
  timestamp: string;
}


