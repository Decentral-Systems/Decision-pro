import { API_BASE_URLS } from "@/lib/config/api-endpoints";
import { tryCatch } from "@/lib/try-catch";
import {
  normalizeApiResponse,
  normalizeErrorResponse,
} from "@/lib/utils/api-response-normalizer";
import { generateCorrelationId } from "@/lib/utils/correlationId";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = _request.cookies.get("auth_access_token")?.value ?? null;
  const { id: customerId } = await params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!customerId || typeof customerId !== "string" || !customerId.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid customer id" },
      { status: 400 }
    );
  }

  const url = `${API_BASE_URLS.apiGateway}/api/v1/customers/${encodeURIComponent(customerId.trim())}/360`;

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
      return NextResponse.json(null, { status: 200 });
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

  const data = normalizeApiResponse<unknown>(parseResult.data);
  return NextResponse.json(data, { status: 200 });
}
