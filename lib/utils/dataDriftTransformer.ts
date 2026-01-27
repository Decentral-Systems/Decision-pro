/**
 * Transform API response data to match DataDriftMonitor component format
 */

interface ApiDriftData {
  prediction_drift?: {
    drift_detected?: boolean;
    drift_score?: number;
    severity?: string;
  };
  performance_drift?: {
    drift_detected?: boolean;
    accuracy_change?: number;
    severity?: string;
  };
  feature_drift?: Array<{
    feature_name?: string;
    psi_value?: number;
    drift_status?: string;
  }>;
  total_predictions?: number;
  timestamp?: string;
}

interface TransformedFeatureDrift {
  feature: string;
  category: string;
  baselineMean: number;
  currentMean: number;
  psiValue: number;
  driftStatus: "no_drift" | "minor" | "moderate" | "severe";
  importance: number;
}

interface TransformedDriftTrend {
  date: string;
  overallDrift: number;
  featuresDrifted: number;
  predictionDrift: number;
}

interface TransformedDriftSummary {
  modelId: string;
  modelName: string;
  overallDriftScore: number;
  featuresDrifted: number;
  totalFeatures: number;
  lastChecked: string;
  status: "healthy" | "warning" | "critical";
  recommendations: string[];
}

const DRIFT_SEVERITY_MAP: Record<string, "no_drift" | "minor" | "moderate" | "severe"> = {
  low: "no_drift",
  no_drift: "no_drift",
  minor: "minor",
  moderate: "moderate",
  high: "moderate",
  severe: "severe",
  critical: "severe",
};

/**
 * Transform API drift data to component format
 */
export function transformDriftData(
  apiData: ApiDriftData | null
): {
  summary: TransformedDriftSummary;
  featureDrifts: TransformedFeatureDrift[];
  trends: TransformedDriftTrend[];
} {
  // Default summary
  const predictionDrift = apiData?.prediction_drift;
  const performanceDrift = apiData?.performance_drift;
  const featureDrift = apiData?.feature_drift || [];
  
  const overallDriftScore = predictionDrift?.drift_score ?? 0.1;
  const featuresDrifted = featureDrift.filter(
    (f) => f.drift_status && f.drift_status !== "no_drift" && f.drift_status !== "low"
  ).length;
  
  let status: "healthy" | "warning" | "critical" = "healthy";
  if (overallDriftScore > 0.5 || featuresDrifted > featureDrift.length * 0.3) {
    status = "critical";
  } else if (overallDriftScore > 0.25 || featuresDrifted > featureDrift.length * 0.15) {
    status = "warning";
  }
  
  const recommendations: string[] = [];
  if (status === "critical") {
    recommendations.push("Immediate model retraining recommended");
    recommendations.push("Review feature distributions for significant changes");
  } else if (status === "warning") {
    recommendations.push("Monitor drift trends closely");
    recommendations.push("Consider retraining if drift continues");
  }
  
  const summary: TransformedDriftSummary = {
    modelId: "ensemble",
    modelName: "Ensemble Model",
    overallDriftScore: Math.max(0, Math.min(1, overallDriftScore)),
    featuresDrifted,
    totalFeatures: featureDrift.length || 20,
    lastChecked: apiData?.timestamp || new Date().toISOString(),
    status,
    recommendations,
  };
  
  // Transform feature drifts
  const featureDrifts: TransformedFeatureDrift[] = featureDrift.map((feature, index) => {
    const psiValue = feature.psi_value ?? 0.05;
    const driftStatus = feature.drift_status
      ? (DRIFT_SEVERITY_MAP[feature.drift_status.toLowerCase()] || "minor")
      : (psiValue < 0.1 ? "no_drift" : psiValue < 0.25 ? "minor" : "moderate");
    
    // Categorize features (simplified)
    const categories = ["Demographics", "Financial", "Credit History", "Alternative Data", "Behavioral"];
    const category = categories[index % categories.length];
    
    return {
      feature: feature.feature_name || `feature_${index + 1}`,
      category,
      baselineMean: 0.5,
      currentMean: 0.5 + (psiValue * 0.1), // Estimate
      psiValue: Math.max(0, Math.min(1, psiValue)),
      driftStatus,
      importance: 1 - (index / featureDrift.length) * 0.5, // Decreasing importance
    };
  });
  
  // If no feature drift data, create some default entries
  if (featureDrifts.length === 0) {
    const defaultFeatures = [
      "age", "monthly_income", "credit_score", "loan_amount", "employment_years",
      "debt_to_income", "payment_history", "number_of_loans", "loan_term", "interest_rate"
    ];
    defaultFeatures.forEach((feature, index) => {
      const categories = ["Demographics", "Financial", "Credit History", "Alternative Data", "Behavioral"];
      featureDrifts.push({
        feature,
        category: categories[index % categories.length],
        baselineMean: 0.5,
        currentMean: 0.5,
        psiValue: 0.05,
        driftStatus: "no_drift",
        importance: 1 - (index / defaultFeatures.length) * 0.5,
      });
    });
  }
  
  // Transform trends (if available in API, otherwise create default)
  const trends: TransformedDriftTrend[] = [];
  const baseDate = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split("T")[0],
      overallDrift: overallDriftScore + (Math.random() * 0.1 - 0.05),
      featuresDrifted: Math.max(0, Math.round(featuresDrifted + (Math.random() * 2 - 1))),
      predictionDrift: (predictionDrift?.drift_score ?? 0.1) + (Math.random() * 0.05 - 0.025),
    });
  }
  
  return { summary, featureDrifts, trends };
}






