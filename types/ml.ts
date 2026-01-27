/**
 * ML Center types
 */

export interface ModelInfo {
  model_id: string;
  model_name: string;
  model_type: "xgboost" | "lightgbm" | "neural_network" | "lstm" | "transformer" | "meta_learner";
  version: string;
  status: "active" | "training" | "archived" | "failed";
  accuracy: number;
  auc_roc: number;
  precision: number;
  recall: number;
  f1_score: number;
  last_trained: string;
  training_samples: number;
  weight?: number; // Weight in ensemble
}

export interface TrainingJob {
  job_id: string;
  model_name: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  metrics?: {
    accuracy: number;
    auc_roc: number;
    training_time_seconds: number;
  };
}

export interface ModelPerformance {
  model_id: string;
  model_name: string;
  predictions_count: number;
  average_latency_ms: number;
  success_rate: number;
  error_rate: number;
  last_24h_predictions: number;
  accuracy_trend: Array<{ date: string; accuracy: number }>;
}

export interface DriftDetection {
  model_id: string;
  feature_name: string;
  drift_score: number;
  drift_detected: boolean;
  last_checked: string;
  severity: "low" | "medium" | "high";
}

export interface MLMetrics {
  total_models: number;
  active_models: number;
  training_jobs: number;
  average_accuracy: number;
  total_predictions: number;
  average_latency_ms: number;
}

export interface MLCenterData {
  metrics: MLMetrics;
  models: ModelInfo[];
  recent_training_jobs: TrainingJob[];
  performance_data: ModelPerformance[];
  drift_detections: DriftDetection[];
}

// Phase 1: Model Performance Metrics
export interface ModelPerformanceMetrics {
  model_name: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
    auc_pr: number;
    calibration_score: number;
  };
  confusion_matrix?: {
    true_positive: number;
    true_negative: number;
    false_positive: number;
    false_negative: number;
  };
  timestamp: string;
}

export interface ModelComparisonData {
  models: ModelPerformanceMetrics[];
  ensemble_metrics?: ModelPerformanceMetrics;
}

// Phase 2: Drift Detection
export interface DriftMetrics {
  feature_drift: Array<{
    feature_name: string;
    drift_score: number;
    drift_detected: boolean;
    severity: "low" | "medium" | "high";
    last_checked: string;
  }>;
  prediction_drift: {
    drift_score: number;
    drift_detected: boolean;
    severity: string;
  };
  performance_drift: {
    accuracy_change: number;
    drift_detected: boolean;
  };
}

// Phase 3: Feature Importance
export interface FeatureImportanceData {
  global_importance: Array<{
    feature_name: string;
    importance_score: number;
    rank: number;
  }>;
  model_importance: Record<string, Array<{
    feature_name: string;
    importance_score: number;
  }>>;
  shap_values?: Array<{
    feature_name: string;
    shap_value: number;
  }>;
}

// Phase 4: Performance Trends
export interface PerformanceTrends {
  time_series: Array<{
    date: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    prediction_count: number;
    average_latency_ms: number;
  }>;
  summary: {
    current_accuracy: number;
    previous_accuracy: number;
    accuracy_change: number;
    trend: "improving" | "degrading" | "stable";
  };
}

// Phase 5: Ensemble Metrics
export interface EnsembleMetrics {
  model_weights: Array<{
    model_name: string;
    weight: number;
  }>;
  ensemble_accuracy: number;
  individual_accuracies: Record<string, number>;
  agreement_metrics: {
    average_agreement: number;
    disagreement_rate: number;
  };
  contribution_analysis: Array<{
    model_name: string;
    contribution_percentage: number;
    predictions_contributed: number;
  }>;
}


