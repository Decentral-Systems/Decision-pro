/**
 * API Endpoint Configuration
 * Centralized configuration for all API Gateway endpoints
 */

const API_GATEWAY_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://196.188.249.48:4000";
const CREDIT_SCORING_BASE = process.env.NEXT_PUBLIC_CREDIT_SCORING_API_URL || "http://196.188.249.48:4001";

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "/api/v1/auth/login",  // Use Credit Scoring Service login endpoint which works
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },

  // Customer Management
  customers: {
    list: "/api/customers",
    get: (id: string) => `/api/customers/${id}`,
    create: "/api/customers",
    update: (id: string) => `/api/customers/${id}`,
    search: "/api/customers/search",
    // Customer 360 endpoint (correct path)
    customer360: (id: string) => `/api/intelligence/customer/${id}/360`,
  },

  // Analytics & Dashboard
  analytics: {
    dashboard: "/api/v1/analytics",
    portfolioMetrics: "/api/v1/analytics/portfolio-metrics",
    riskDistribution: "/api/v1/analytics/risk-distribution",
    approvalRates: "/api/v1/analytics/approval-rates",
    revenueTrends: "/api/v1/analytics/revenue-trends",
  },

  // Compliance
  compliance: {
    metrics: "/api/compliance/metrics",
    violations: "/api/compliance/violations",
    rules: "/api/compliance/rules",
    generateReport: "/api/compliance/reports/generate",
  },

  // ML & Models (Credit Scoring Service)
  ml: {
    models: "/api/v1/models",
    modelMetrics: (id: string) => `/api/v1/models/${id}/metrics`,
    trainingJobs: "/api/v1/training/jobs",
    startTraining: "/api/v1/training/start",
    dashboard: "/api/ml/dashboard",
  },

  // Admin
  admin: {
    users: "/api/v1/admin/users", // Updated to use v1 endpoint
    user: (id: string) => `/api/v1/admin/users/${id}`, // Updated to use v1 endpoint
    userActivity: (id: string) => `/api/v1/admin/users/${id}/activity`, // Updated to use v1 endpoint
    auditLogs: "/api/v1/audit/logs", // Updated to use v1 endpoint
    settings: "/api/admin/settings",
    resetSettings: "/api/admin/settings/reset",
  },

  // Credit Scoring
  creditScoring: {
    score: "/api/intelligence/credit-scoring/realtime",
    batch: "/api/v1/credit-scoring/batch",
  },

  // Default Prediction
  defaultPrediction: {
    predict: "/api/v1/default-prediction/predict",
  },

  // Dynamic Pricing
  pricing: {
    calculate: "/api/v1/pricing/calculate",
  },

  // System Health
  health: {
    apiGateway: "/health",
    creditScoring: "/api/v1/health",
  },
} as const;

export const API_BASE_URLS = {
  apiGateway: API_GATEWAY_BASE,
  creditScoring: CREDIT_SCORING_BASE,
} as const;



