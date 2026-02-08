export function isNetworkOffline(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return !navigator.onLine;
}

export function networkAwareRetry(
  failureCount: number,
  error: unknown
): boolean {
  if (isNetworkOffline()) {
    return false;
  }

  const statusCode =
    (error as { statusCode?: number })?.statusCode ??
    (error as { response?: { status?: number } })?.response?.status;
  const errorCode = (error as { code?: string })?.code;

  if (
    typeof statusCode === "number" &&
    statusCode >= 400 &&
    statusCode < 500 &&
    statusCode !== 429
  ) {
    return false;
  }

  if (
    errorCode === "ERR_NETWORK" ||
    errorCode === "ECONNABORTED" ||
    errorCode === "ETIMEDOUT"
  ) {
    return failureCount < 1;
  }

  return failureCount < 3;
}

export function networkAwareRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}

export function isNetworkError(error: unknown): boolean {
  const errorCode = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message ?? "");

  if (
    errorCode === "ERR_NETWORK" ||
    errorCode === "ECONNABORTED" ||
    errorCode === "ETIMEDOUT"
  ) {
    return true;
  }

  if (
    (error as { constructor?: { name?: string } })?.constructor?.name ===
      "APINetworkError" ||
    (error as { constructor?: { name?: string } })?.constructor?.name ===
      "APITimeoutError"
  ) {
    return true;
  }

  if (
    message.includes("Network") ||
    message.includes("timeout") ||
    message.includes("ECONN")
  ) {
    return true;
  }

  return false;
}
