import { ApiResponse } from "@/types/api";

export interface NormalizedError {
  statusCode: number;
  message: string;
  details?: unknown;
  correlationId?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function hasResponse(error: unknown): error is { response: { status?: number; data?: Record<string, unknown> } } {
  return isObject(error) && "response" in error && isObject((error as { response: unknown }).response);
}

export function normalizeApiResponse<T>(response: unknown): T {
  if (response === null || response === undefined) {
    return response as T;
  }

  if (isObject(response) && !("success" in response) && !("data" in response)) {
    return response as T;
  }

  if (isObject(response) && response.success === true && response.data !== undefined) {
    if ("analytics" in response && response.analytics !== undefined) {
      const { success: _, ...rest } = response;
      return rest as T;
    }
    return response.data as T;
  }

  if (isObject(response) && response.success === true && response.data === undefined) {
    const { success: _, ...data } = response;
    return data as T;
  }

  if (isObject(response) && !("success" in response)) {
    return response as T;
  }

  if (isObject(response) && "data" in response && response.data !== undefined) {
    return response.data as T;
  }

  return response as T;
}

export function normalizeErrorResponse(error: unknown): NormalizedError {
  if (hasResponse(error)) {
    const errorData = error.response.data;
    const data = isObject(errorData) ? errorData : {};
    return {
      statusCode: error.response.status ?? 500,
      message:
        (typeof data.detail === "string" ? data.detail : undefined) ??
        (typeof data.message === "string" ? data.message : undefined) ??
        (typeof data.error === "string" ? data.error : undefined) ??
        (isObject(error) && "message" in error && typeof error.message === "string" ? error.message : undefined) ??
        "API request failed",
      details: data.details ?? data.errors,
      correlationId:
        (typeof data.correlation_id === "string" ? data.correlation_id : undefined) ??
        (typeof data.correlationId === "string" ? data.correlationId : undefined),
    };
  }

  if (isObject(error)) {
    const status =
      typeof (error as { statusCode?: number }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : typeof (error as { status?: number }).status === "number"
          ? (error as { status: number }).status
          : 500;
    const message =
      "message" in error && typeof error.message === "string" ? error.message : "API request failed";
    return {
      statusCode: status,
      message,
      details: "details" in error ? error.details : undefined,
      correlationId:
        typeof (error as { correlationId?: string }).correlationId === "string"
          ? (error as { correlationId: string }).correlationId
          : typeof (error as { correlation_id?: string }).correlation_id === "string"
            ? (error as { correlation_id: string }).correlation_id
            : undefined,
    };
  }

  return {
    statusCode: 500,
    message: "API request failed",
  };
}

export function isSuccessResponse(response: unknown): boolean {
  if (isObject(response) && response.success === true) {
    return true;
  }
  if (isObject(response) && response.success === false) {
    return false;
  }
  return response !== null && response !== undefined;
}

export function extractResponseData<T>(response: unknown): T | null {
  if (response === null || response === undefined) return null;

  if (isObject(response) && response.success && response.data !== undefined) {
    return response.data as T;
  }

  if (isObject(response) && !response.success) {
    return response as T;
  }

  return response as T;
}

export function validateApiResponse(response: unknown, expectedKeys?: string[]): boolean {
  if (!response || !isObject(response)) {
    return false;
  }

  if (expectedKeys && expectedKeys.length > 0) {
    const hasAllKeys = expectedKeys.every((key) => key in response);
    const data = response.data;
    if (!hasAllKeys && isObject(data)) {
      return expectedKeys.every((key) => key in data);
    }
    return hasAllKeys;
  }

  return true;
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: unknown,
  correlationId?: string
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
    error: message,
    correlation_id: correlationId,
  };
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}
