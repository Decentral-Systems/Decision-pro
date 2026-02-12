import { API_BASE_URLS } from "@/lib/config/api-endpoints";
import { API_ENDPOINTS } from "@/lib/config/api-endpoints";
import { tryCatch } from "@/lib/try-catch";
import { normalizeApiResponse, normalizeErrorResponse } from "@/lib/utils/api-response-normalizer";
import { generateCorrelationId } from "@/lib/utils/correlationId";
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_SCORE_PATH = API_ENDPOINTS.creditScoring.score;

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("auth_access_token")?.value ?? null;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const url = `${API_BASE_URLS.apiGateway}${GATEWAY_SCORE_PATH}`;
  const correlationId = generateCorrelationId();

  const fetchResult = await tryCatch(
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": correlationId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
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

  const data = normalizeApiResponse<unknown>(parseResult.data);
  return NextResponse.json(data ?? {}, { status: 200 });
}
