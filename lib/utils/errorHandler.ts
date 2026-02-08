import { APIServiceError, APITimeoutError, APINetworkError } from "@/types/api";

export type ErrorCategory =
  | "network"
  | "server"
  | "validation"
  | "authentication"
  | "authorization"
  | "unknown";

export interface ErrorDetails {
  category: ErrorCategory;
  userMessage: string;
  technicalMessage: string;
  recoverySuggestion: string;
  correlationId?: string;
  statusCode?: number;
  retryable: boolean;
}

export interface ParsedAPIError {
  message: string;
  statusCode?: number;
  correlationId?: string;
  details?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function hasResponse(
  error: unknown
): error is {
  response: { status?: number; data?: Record<string, unknown>; headers?: Record<string, unknown> };
} {
  if (!isObject(error) || !("response" in error)) return false;
  const r = (error as { response: unknown }).response;
  return r !== null && typeof r === "object";
}

function getStatusCode(error: unknown): number | undefined {
  if (error instanceof APIServiceError) return error.statusCode;
  if (isObject(error) && "statusCode" in error && typeof (error as { statusCode: number }).statusCode === "number") {
    return (error as { statusCode: number }).statusCode;
  }
  if (hasResponse(error)) return error.response.status;
  if (isObject(error) && "status" in error && typeof (error as { status: number }).status === "number") {
    return (error as { status: number }).status;
  }
  return undefined;
}

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof APINetworkError) return "network";
  if (isObject(error) && (error.code === "ERR_NETWORK" || !("response" in error) || error.response == null)) {
    return "network";
  }
  if (error instanceof APITimeoutError || (isObject(error) && error.code === "ECONNABORTED")) {
    return "network";
  }
  if (error instanceof APIServiceError) {
    const statusCode = error.statusCode ?? (hasResponse(error) ? error.response.status : undefined);
    if (statusCode === 401) return "authentication";
    if (statusCode === 403) return "authorization";
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) return "validation";
    if (statusCode !== undefined && statusCode >= 500) return "server";
  }
  return "unknown";
}

export function isRetryableError(error: unknown): boolean {
  const category = categorizeError(error);
  if (category === "network" || category === "server") return true;
  if (error instanceof APITimeoutError) return true;
  return false;
}

export function getUserFriendlyMessage(error: unknown): string {
  switch (categorizeError(error)) {
    case "network":
      return "Unable to connect to the server. Please check your internet connection and try again.";
    case "server":
      return "The server encountered an error. Please try again in a few moments.";
    case "validation":
      return "The request contains invalid data. Please check your input and try again.";
    case "authentication":
      return "Your session has expired. Please log in again.";
    case "authorization":
      return "You don't have permission to perform this action.";
    default:
      return "An unexpected error occurred. Please try again or contact support if the problem persists.";
  }
}

export function getRecoverySuggestion(error: unknown): string {
  switch (categorizeError(error)) {
    case "network":
      return "Check your internet connection, verify the server is accessible, and try again.";
    case "server":
      return "Wait a few moments and try again. If the problem persists, contact support.";
    case "validation":
      return "Review the form fields for errors and ensure all required fields are filled correctly.";
    case "authentication":
      return "Please log out and log back in to refresh your session.";
    case "authorization":
      return "Contact your administrator if you believe you should have access to this feature.";
    default:
      return "Try refreshing the page. If the problem continues, contact support with the error details.";
  }
}

export function getTechnicalMessage(error: unknown): string {
  if (error instanceof APIServiceError) {
    return `API Error ${error.statusCode}: ${error.message}`;
  }
  if (error instanceof APITimeoutError) {
    return `Request timeout: ${error.message}`;
  }
  if (error instanceof APINetworkError) {
    return `Network error: ${error.message}`;
  }
  if (hasResponse(error)) {
    const status = error.response.status ?? "?";
    const data = error.response.data;
    const msg = isObject(data)
      ? (typeof data.detail === "string" ? data.detail : typeof data.message === "string" ? data.message : null)
      : null;
    const fallback =
      isObject(error) && "message" in error && typeof (error as { message: string }).message === "string"
        ? (error as { message: string }).message
        : "Unknown error";
    return `HTTP ${status}: ${msg ?? fallback}`;
  }
  if (isObject(error) && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Unknown error";
}

export function getCorrelationId(error: unknown): string | undefined {
  if (error instanceof APIServiceError && error.correlationId) {
    return error.correlationId;
  }
  if (isObject(error) && "correlationId" in error && typeof (error as { correlationId: string }).correlationId === "string") {
    return (error as { correlationId: string }).correlationId;
  }
  if (hasResponse(error) && error.response.headers) {
    const id = error.response.headers["x-correlation-id"];
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

export function getErrorDetails(error: unknown): ErrorDetails {
  return {
    category: categorizeError(error),
    userMessage: getUserFriendlyMessage(error),
    technicalMessage: getTechnicalMessage(error),
    recoverySuggestion: getRecoverySuggestion(error),
    correlationId: getCorrelationId(error),
    statusCode: getStatusCode(error),
    retryable: isRetryableError(error),
  };
}

export function logError(error: unknown, context?: string): void {
  const details = getErrorDetails(error);
  const stack = isObject(error) && "stack" in error && typeof error.stack === "string"
    ? (process.env.NODE_ENV === "development" ? error.stack : undefined)
    : undefined;
  const logData = {
    context: context ?? "Error",
    category: details.category,
    technicalMessage: details.technicalMessage,
    correlationId: details.correlationId,
    statusCode: details.statusCode,
    retryable: details.retryable,
    stack,
  };
  if (details.category === "server" || details.category === "network") {
    console.error(`[Error Handler] ${context ?? "Error"}:`, logData);
  } else {
    console.warn(`[Error Handler] ${context ?? "Error"}:`, logData);
  }
}

export function parseAPIError(error: unknown): ParsedAPIError {
  if (error instanceof APIServiceError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      correlationId: error.correlationId,
      details: hasResponse(error) ? error.response.data : undefined,
    };
  }
  if (hasResponse(error)) {
    const data = error.response.data;
    const message =
      (isObject(data) && typeof data.detail === "string" ? data.detail : null) ??
      (isObject(data) && typeof data.message === "string" ? data.message : null) ??
      (isObject(error) && "message" in error && typeof (error as { message: string }).message === "string"
        ? (error as { message: string }).message
        : null) ??
      "Unknown error";
    const headers = error.response.headers;
    const correlationId =
      isObject(headers) && typeof (headers as Record<string, unknown>)["x-correlation-id"] === "string"
        ? (headers as Record<string, string>)["x-correlation-id"]
        : undefined;
    return {
      message,
      statusCode: error.response.status,
      correlationId,
      details: error.response.data,
    };
  }
  const message =
    isObject(error) && "message" in error && typeof (error as { message: string }).message === "string"
      ? (error as { message: string }).message
      : "Unknown error occurred";
  return { message };
}

export function formatErrorForDisplay(error: unknown): string {
  return parseAPIError(error).message;
}
