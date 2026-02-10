export interface ModelVersionInfo {
  version_id: string;
  version: string;
  model_name: string;
  accuracy: number;
  auc_roc: number;
  f1_score: number;
  created_at: string;
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

export interface RealtimeScoringMetrics {
  total_scores_today: number;
  average_score: number;
  scores_per_minute: number;
  active_customers: number;
  score_trend: Array<{ time: string; count: number; avg_score: number }>;
}

export type ScoringMetrics = RealtimeScoringMetrics;
