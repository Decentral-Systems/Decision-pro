/**
 * Error Handler Utility
 * Provides user-friendly error messages, error categorization, and recovery suggestions
 */

import { APIServiceError, APITimeoutError, APINetworkError } from "@/types/api";

export type ErrorCategory = "network" | "server" | "validation" | "authentication" | "authorization" | "unknown";

export interface ErrorDetails {
  category: ErrorCategory;
  userMessage: string;
  technicalMessage: string;
  recoverySuggestion: string;
  correlationId?: string;
  statusCode?: number;
  retryable: boolean;
}

/**
 * Categorize error type
 */
export function categorizeError(error: any): ErrorCategory {
  if (error instanceof APINetworkError || error.code === "ERR_NETWORK" || !error.response) {
    return "network";
  }
  
  if (error instanceof APITimeoutError || error.code === "ECONNABORTED") {
    return "network";
  }
  
  if (error instanceof APIServiceError) {
    const statusCode = error.statusCode || error.response?.status;
    
    if (statusCode === 401) {
      return "authentication";
    }
    
    if (statusCode === 403) {
      return "authorization";
    }
    
    if (statusCode >= 400 && statusCode < 500) {
      return "validation";
    }
    
    if (statusCode >= 500) {
      return "server";
    }
  }
  
  return "unknown";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const category = categorizeError(error);
  
  // Network errors are usually retryable
  if (category === "network") {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (category === "server") {
    return true;
  }
  
  // Timeout errors are retryable
  if (error instanceof APITimeoutError) {
    return true;
  }
  
  // Validation, authentication, and authorization errors are not retryable
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const category = categorizeError(error);
  
  switch (category) {
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
    
    case "unknown":
    default:
      return "An unexpected error occurred. Please try again or contact support if the problem persists.";
  }
}

/**
 * Get recovery suggestion
 */
export function getRecoverySuggestion(error: any): string {
  const category = categorizeError(error);
  
  switch (category) {
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
    
    case "unknown":
    default:
      return "Try refreshing the page. If the problem continues, contact support with the error details.";
  }
}

/**
 * Get technical error message for logging
 */
export function getTechnicalMessage(error: any): string {
  if (error instanceof APIServiceError) {
    return `API Error ${error.statusCode}: ${error.message}`;
  }
  
  if (error instanceof APITimeoutError) {
    return `Request timeout: ${error.message}`;
  }
  
  if (error instanceof APINetworkError) {
    return `Network error: ${error.message}`;
  }
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    return `HTTP ${status}: ${data?.detail || data?.message || error.message}`;
  }
  
  return error.message || "Unknown error";
}

/**
 * Extract correlation ID from error
 */
export function getCorrelationId(error: any): string | undefined {
  if (error instanceof APIServiceError && error.correlationId) {
    return error.correlationId;
  }
  
  if (error.correlationId) {
    return error.correlationId;
  }
  
  if (error.response?.headers?.["x-correlation-id"]) {
    return error.response.headers["x-correlation-id"];
  }
  
  return undefined;
}

/**
 * Get comprehensive error details
 */
export function getErrorDetails(error: any): ErrorDetails {
  const category = categorizeError(error);
  const correlationId = getCorrelationId(error);
  const statusCode = error.statusCode || error.response?.status;
  
  return {
    category,
    userMessage: getUserFriendlyMessage(error),
    technicalMessage: getTechnicalMessage(error),
    recoverySuggestion: getRecoverySuggestion(error),
    correlationId,
    statusCode,
    retryable: isRetryableError(error),
  };
}

/**
 * Log error with correlation ID
 */
export function logError(error: any, context?: string): void {
  const details = getErrorDetails(error);
  const logData = {
    context: context || "Error",
    category: details.category,
    technicalMessage: details.technicalMessage,
    correlationId: details.correlationId,
    statusCode: details.statusCode,
    retryable: details.retryable,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
  
  if (details.category === "server" || details.category === "network") {
    console.error(`[Error Handler] ${context || "Error"}:`, logData);
  } else {
    console.warn(`[Error Handler] ${context || "Error"}:`, logData);
  }
}

/**
 * Parse API error response
 */
export function parseAPIError(error: any): {
  message: string;
  statusCode?: number;
  correlationId?: string;
  details?: any;
} {
  if (error instanceof APIServiceError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      correlationId: error.correlationId,
      details: error.response?.data,
    };
  }
  
  if (error.response) {
    return {
      message: error.response.data?.detail || error.response.data?.message || error.message || "Unknown error",
      statusCode: error.response.status,
      correlationId: error.response.headers?.["x-correlation-id"],
      details: error.response.data,
    };
  }
  
  return {
    message: error.message || "Unknown error occurred",
  };
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: any): string {
  const parsed = parseAPIError(error);
  return parsed.message;
}
