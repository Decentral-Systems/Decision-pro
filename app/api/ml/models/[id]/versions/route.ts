import { API_BASE_URLS } from "@/lib/config/api-endpoints";
import { tryCatch } from "@/lib/try-catch";
import {
  normalizeApiResponse,
  normalizeErrorResponse,
} from "@/lib/utils/api-response-normalizer";
import { generateCorrelationId } from "@/lib/utils/correlationId";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = request.cookies.get("auth_access_token")?.value ?? null;
  const { id: modelId } = await params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!modelId || typeof modelId !== "string" || !modelId.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid modelId" },
      { status: 400 }
    );
  }

  const url = `${API_BASE_URLS.apiGateway}/api/ml/model/${encodeURIComponent(modelId.trim())}/versions`;
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
    if (response.status === 404) {
      return NextResponse.json([], { status: 200 });
    }
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

  const data = normalizeApiResponse<unknown[]>(parseResult.data);
  const versions = Array.isArray(data) ? data : [];
  return NextResponse.json(versions, { status: 200 });
}
