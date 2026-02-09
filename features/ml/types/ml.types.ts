export interface ModelVersion {
  version_id: string;
  version: string;
  model_id: string;
  model_name: string;
  created_at: string;
  created_by?: string;
  accuracy: number;
  auc_roc: number;
  f1_score: number;
  configuration?: Record<string, unknown>;
  changelog?: string;
  is_active: boolean;
  is_deployed: boolean;
  is_beta?: boolean;
  deployment_date?: string;
  stability_metrics?: {
    uptime_percentage: number;
    error_rate: number;
    avg_latency_ms: number;
  };
}
