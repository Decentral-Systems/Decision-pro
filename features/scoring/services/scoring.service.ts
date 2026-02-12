import type { CreditScoreRequest, CreditScoreResponse } from "@/types/credit";
import type { RealtimeScoringMetrics } from "../types/scoring.type";

function transformGatewayScoreResponse(
  responseData: Record<string, unknown>,
  customerId: string
): CreditScoreResponse {
  const score =
    (responseData.credit_score as number) ??
    (responseData.ensemble_score as number) ??
    0;
  return {
    success: true,
    customer_id: (responseData.customer_id as string) ?? customerId,
    credit_score: score,
    risk_category: (responseData.risk_level ??
      responseData.risk_category ??
      "medium") as "low" | "medium" | "high" | "very_high",
    approval_recommendation: (responseData.approval_recommendation ??
      (score >= 700 ? "approve" : score >= 600 ? "review" : "reject")) as
      | "approve"
      | "reject"
      | "review",
    confidence:
      (responseData.confidence_score as number) ??
      (responseData.confidence as number) ??
      0.8,
    ensemble_score: (responseData.ensemble_score as number) ?? score,
    model_predictions: (
      responseData.ensemble_details as Record<string, unknown>
    )?.individual_predictions
      ? Object.entries(
          (
            responseData.ensemble_details as Record<
              string,
              Record<string, unknown>
            >
          ).individual_predictions ?? {}
        ).map(([name, s]) => ({
          model_name: name,
          score: typeof s === "number" ? s : 0,
          probability: typeof s === "number" ? s / 1000 : 0,
          weight: name === "xgboost" ? 0.6 : name === "lightgbm" ? 0.4 : 0.1,
        }))
      : [],
    compliance_check: {
      compliant:
        (responseData.nbe_compliance_status as Record<string, unknown>)
          ?.overall_compliant ?? true,
      violations:
        (responseData.nbe_compliance_status as Record<string, unknown[]>)
          ?.violations ?? [],
    },
    explanation: (responseData.explainability as Record<string, unknown>)
      ? {
          shap_values: (responseData.explainability as Record<string, unknown>)
            .shap_analysis,
          lime_explanation: (
            responseData.explainability as Record<string, unknown>
          ).lime_explanation,
          top_features: (
            (responseData.explainability as Record<string, unknown[]>)
              .feature_importance ?? []
          ).slice(0, 10),
        }
      : undefined,
    correlation_id:
      (responseData.correlation_id as string) ??
      (responseData.request_id as string),
  };
}

export async function getRealtimeScoringMetrics(): Promise<RealtimeScoringMetrics> {
  const res = await fetch("/api/scoring/realtime/metrics/score", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : res.statusText || "Realtime metrics failed";
    console.log(message);
    throw new Error(message);
  }

  const data = await res.json();

  return data as RealtimeScoringMetrics;
}

export async function submitCreditScore(
  data: CreditScoreRequest
): Promise<CreditScoreResponse> {
  const res = await fetch("/api/scoring/realtime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : res.statusText || "Credit scoring failed";
    throw new Error(`${message} (${res.status})`);
  }

  const raw = await res.json();
  const responseData =
    (raw?.data && typeof raw.data === "object" ? raw.data : raw) ?? {};
  const payload =
    typeof responseData === "object" && responseData !== null
      ? (responseData as Record<string, unknown>)
      : {};

  return transformGatewayScoreResponse(payload, data.customer_id);
}
