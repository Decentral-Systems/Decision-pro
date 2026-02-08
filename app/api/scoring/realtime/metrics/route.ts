import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URLS } from "@/lib/config/api-endpoints";
import {
  normalizeApiResponse,
  normalizeErrorResponse,
} from "@/lib/utils/api-response-normalizer";
import { generateCorrelationId } from "@/lib/utils/correlationId";
import { tryCatch } from "@/lib/try-catch";
import type { RealtimeScoringMetrics } from "@/features/scoring/types/scoring.type";

const BACKEND_PATH = "/api/scoring/realtime/metrics";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("auth_access_token")?.value ?? null;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = `${API_BASE_URLS.apiGateway}${BACKEND_PATH}`;
  const correlationId = generateCorrelationId();

  const fetchResult = await tryCatch(
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": correlationId,
      },
      signal: AbortSignal.timeout(15000),
    })
  );

  if (fetchResult.error) {
    const normalized = normalizeErrorResponse(fetchResult.error);
    return NextResponse.json(
      {
        error: normalized.message,
        correlationId: normalized.correlationId ?? correlationId,
      },
      { status: normalized.statusCode }
    );
  }

  const response = fetchResult.data;

  if (!response.ok) {
    const bodyResult = await tryCatch(response.json());
    const errorData =
      bodyResult.data && typeof bodyResult.data === "object"
        ? bodyResult.data
        : { message: response.statusText };
    const syntheticError = {
      response: { status: response.status, data: errorData },
    };
    const normalized = normalizeErrorResponse(syntheticError);
    return NextResponse.json(
      {
        error: normalized.message,
        correlationId: normalized.correlationId ?? correlationId,
      },
      { status: normalized.statusCode }
    );
  }

  const parseResult = await tryCatch(response.json());

  if (parseResult.error) {
    const normalized = normalizeErrorResponse(parseResult.error);
    return NextResponse.json(
      { error: normalized.message, correlationId },
      { status: normalized.statusCode }
    );
  }

  const metrics = normalizeApiResponse<RealtimeScoringMetrics>(
    parseResult.data
  );
  return NextResponse.json(metrics, { status: 200 });
}
