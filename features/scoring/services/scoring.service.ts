import type { RealtimeScoringMetrics } from "../types/scoring.type";

export async function getRealtimeScoringMetrics(): Promise<RealtimeScoringMetrics> {
  const res = await fetch("/api/scoring/realtime/metrics", {
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
    throw new Error(message);
  }

  const data = await res.json();

  return data as RealtimeScoringMetrics;
}
