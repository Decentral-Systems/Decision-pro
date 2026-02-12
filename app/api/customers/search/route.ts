import { API_BASE_URLS } from "@/lib/config/api-endpoints";
import { tryCatch } from "@/lib/try-catch";
import {
  normalizeApiResponse,
  normalizeErrorResponse,
} from "@/lib/utils/api-response-normalizer";
import { generateCorrelationId } from "@/lib/utils/correlationId";
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_SEARCH_PATH = "/api/v1/customers/search/";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("auth_access_token")?.value ?? null;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query")?.trim() ?? "";
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortOrder = searchParams.get("sort_order") ?? "desc";

  const params = new URLSearchParams();

  if (query) params.set("query", query);
  params.set("limit", limit);
  params.set("offset", offset);
  params.set("sort_by", sortBy);
  params.set("sort_order", sortOrder);

  const url = `${API_BASE_URLS.apiGateway}${GATEWAY_SEARCH_PATH}?${params.toString()}`;
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

  const data = normalizeApiResponse<{
    results?: unknown[];
    total?: number;
    limit?: number;
    offset?: number;
  }>(parseResult.data);

  return NextResponse.json(
    data ?? {
      results: [],
      total: 0,
      limit: Number(limit),
      offset: Number(offset),
    },
    { status: 200 }
  );
}
