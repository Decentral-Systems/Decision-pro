/**
 * API Response Normalizer
 * Handles different API response structures and normalizes them to consistent formats
 */

import { ApiResponse } from "@/types/api";

/**
 * Normalize API response - handles both wrapped and unwrapped responses
 */
export function normalizeApiResponse<T>(response: any): T {
  // If response is null or undefined, return as-is
  if (!response) {
    return response as T;
  }

  // If response is already the expected type (no success/data wrapper)
  if (typeof response === "object" && !("success" in response) && !("data" in response)) {
    return response as T;
  }

  // Handle wrapped response { success: true, data: {...} }
  // BUT: if analytics is at top level (not in data), preserve the full response
  if (response?.success === true && response.data !== undefined) {
    // Special case: analytics endpoint returns analytics at top level, not in data
    // Check if analytics exists at top level and data is empty
    if (response.analytics !== undefined) {
      // Return the full response with analytics at top level (excluding success)
      const { success, ...rest } = response;
      return rest as T;
    }
    return response.data as T;
  }

  // Handle response with success but data at top level { success: true, metrics: {...}, models: [...] }
  // This is the case for /api/ml/dashboard and similar endpoints
  if (response?.success === true && response.data === undefined) {
    // Extract all properties except 'success' as the data
    const { success, ...data } = response;
    return data as T;
  }

  // Handle direct data response (no success field)
  if (typeof response === "object" && !("success" in response)) {
    return response as T;
  }

  // If it has a data property but success is false/undefined, return data anyway
  if ("data" in response && response.data !== undefined) {
    return response.data as T;
  }

  // Return the response itself (fallback)
  return response as T;
}

/**
 * Normalize error response to consistent format
 */
export function normalizeErrorResponse(error: any): {
  statusCode: number;
  message: string;
  details?: any;
  correlationId?: string;
} {
  if (error.response?.data) {
    const errorData = error.response.data;
    return {
      statusCode: error.response.status || 500,
      message:
        errorData.detail ||
        errorData.message ||
        errorData.error ||
        error.message ||
        "API request failed",
      details: errorData.details || errorData.errors,
      correlationId: errorData.correlation_id || errorData.correlationId,
    };
  }

  return {
    statusCode: error.statusCode || error.status || 500,
    message: error.message || "API request failed",
    details: error.details,
    correlationId: error.correlationId || error.correlation_id,
  };
}

/**
 * Check if response indicates success
 */
export function isSuccessResponse(response: any): boolean {
  if (response?.success === true) {
    return true;
  }
  if (response?.success === false) {
    return false;
  }
  // If no success field, assume success if we have data
  return response !== null && response !== undefined;
}

/**
 * Extract data from response (handles multiple formats)
 */
export function extractResponseData<T>(response: any): T | null {
  if (!response) return null;

  // Wrapped format: { success: true, data: {...} }
  if (response.success && response.data !== undefined) {
    return response.data as T;
  }

  // Direct data format
  if (response && typeof response === "object" && !response.success) {
    return response as T;
  }

  // Already the data
  return response as T;
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any, expectedKeys?: string[]): boolean {
  if (!response || typeof response !== "object") {
    return false;
  }

  // If expected keys provided, check they exist
  if (expectedKeys && expectedKeys.length > 0) {
    const hasAllKeys = expectedKeys.every((key) => key in response);
    if (!hasAllKeys && response.data) {
      // Check in nested data
      return expectedKeys.every((key) => key in response.data);
    }
    return hasAllKeys;
  }

  return true;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: any,
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

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}




