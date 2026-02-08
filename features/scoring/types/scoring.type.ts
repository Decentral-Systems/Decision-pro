export interface RealtimeScoringMetrics {
  total_scores_today: number;
  average_score: number;
  scores_per_minute: number;
  active_customers: number;
  score_trend: Array<{ time: string; count: number; avg_score: number }>;
}

export type ScoringMetrics = RealtimeScoringMetrics;
