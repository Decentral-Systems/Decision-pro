/**
 * Zod Schemas for ML Center Data Validation
 * Validates API responses before rendering
 */

import { z } from "zod";

/**
 * Model Performance Schema
 */
export const ModelSchema = z.object({
  model_id: z.string(),
  model_name: z.string(),
  model_type: z.enum(["xgboost", "lightgbm", "neural_network", "lstm", "transformer", "meta_learner"]),
  version: z.string(),
  status: z.enum(["active", "training", "failed", "inactive"]),
  accuracy: z.number().min(0).max(1),
  auc_roc: z.number().min(0).max(1),
  f1_score: z.number().min(0).max(1),
  last_trained: z.string().optional(),
  weight: z.number().min(0).max(1).optional(),
  latency_p95: z.number().optional(),
  latency_p99: z.number().optional(),
});

/**
 * Training Job Schema
 */
export const TrainingJobSchema = z.object({
  job_id: z.string(),
  model_name: z.string(),
  model_id: z.string().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  started_at: z.string(),
  completed_at: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  metrics: z.object({
    accuracy: z.number().min(0).max(1).optional(),
    auc_roc: z.number().min(0).max(1).optional(),
    f1_score: z.number().min(0).max(1).optional(),
    training_time_seconds: z.number().optional(),
  }).optional(),
  latency_p95: z.number().optional(),
  latency_p99: z.number().optional(),
  lineage: z.object({
    code_version: z.string().optional(),
    data_version: z.string().optional(),
    params_hash: z.string().optional(),
  }).optional(),
  error_message: z.string().optional(),
});

/**
 * ML Metrics Schema
 */
export const MLMetricsSchema = z.object({
  active_models: z.number().int().min(0),
  total_models: z.number().int().min(0),
  average_accuracy: z.number().min(0).max(1),
  total_predictions: z.number().int().min(0),
  average_latency_ms: z.number().min(0),
  training_jobs: z.number().int().min(0),
});

/**
 * ML Center Data Schema
 */
export const MLCenterDataSchema = z.object({
  metrics: MLMetricsSchema,
  models: z.array(ModelSchema),
  recent_training_jobs: z.array(TrainingJobSchema).optional(),
});

/**
 * Model Comparison Data Schema
 */
export const ModelComparisonSchema = z.object({
  models: z.array(z.object({
    name: z.string(),
    accuracy: z.number().min(0).max(1),
    auc_roc: z.number().min(0).max(1),
    f1_score: z.number().min(0).max(1),
    latency_p95: z.number().optional(),
    latency_p99: z.number().optional(),
  })),
  performanceHistory: z.array(z.object({
    date: z.string(),
    metrics: z.record(z.number()),
  })).optional(),
});

/**
 * Data Drift Schema
 */
export const DataDriftSchema = z.object({
  summary: z.object({
    overall_drift_score: z.number().min(0).max(1),
    features_drifted: z.number().int().min(0),
    total_features: z.number().int().min(0),
    last_check: z.string(),
  }).optional(),
  featureDrifts: z.array(z.object({
    feature: z.string(),
    drift_score: z.number().min(0).max(1),
    threshold: z.number().min(0).max(1),
    status: z.enum(["drifted", "stable", "unknown"]),
    last_check: z.string(),
  })).optional(),
  trends: z.array(z.object({
    date: z.string(),
    drift_score: z.number().min(0).max(1),
  })).optional(),
});

/**
 * Validate and sanitize ML Center data
 */
export function validateMLCenterData(data: any): z.infer<typeof MLCenterDataSchema> | null {
  try {
    return MLCenterDataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[ML Schema] Validation failed:", error.errors);
      return null;
    }
    throw error;
  }
}

/**
 * Validate model comparison data
 */
export function validateModelComparison(data: any): z.infer<typeof ModelComparisonSchema> | null {
  try {
    return ModelComparisonSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[ML Schema] Model comparison validation failed:", error.errors);
      return null;
    }
    throw error;
  }
}

/**
 * Validate data drift data
 */
export function validateDataDrift(data: any): z.infer<typeof DataDriftSchema> | null {
  try {
    return DataDriftSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[ML Schema] Data drift validation failed:", error.errors);
      return null;
    }
    throw error;
  }
}

/**
 * Safe parse with fallback
 */
export function safeParseMLData<T>(
  schema: z.ZodSchema<T>,
  data: any,
  fallback: T | null = null
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("[ML Schema] Validation failed, using fallback:", error.errors);
      return fallback;
    }
    return fallback;
  }
}

