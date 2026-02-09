import type { ModelVersion } from "../types/ml.types";

export async function getModelVersions(
  modelId: string
): Promise<ModelVersion[]> {
  const id = encodeURIComponent(modelId.trim());
  const response = await fetch(`/api/ml/models/${id}/versions`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : response.statusText || "Failed to fetch model versions";
    throw new Error(message);
  }

  const data = await response.json();

  return Array.isArray(data) ? (data as ModelVersion[]) : [];
}
