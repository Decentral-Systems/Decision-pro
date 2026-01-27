/**
 * Error Message Utility
 * Provides detailed, actionable error messages for Rules Engine operations
 */

import { AxiosError } from "axios";
import { APIServiceError, APITimeoutError, APINetworkError } from "@/types/api";

export interface ErrorContext {
  operation: string;
  ruleName?: string;
  ruleId?: number;
  ruleType?: "product" | "workflow" | "risk";
  fieldName?: string;
  errorCode?: string;
  correlationId?: string;
}

/**
 * Extract detailed error message from various error types
 */
export function extractErrorMessage(error: unknown, context?: ErrorContext): string {
  // Handle API Service Errors
  if (error instanceof APIServiceError) {
    return formatAPIServiceError(error, context);
  }

  // Handle Timeout Errors
  if (error instanceof APITimeoutError) {
    return formatTimeoutError(error, context);
  }

  // Handle Network Errors
  if (error instanceof APINetworkError) {
    return formatNetworkError(error, context);
  }

  // Handle Axios Errors
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError;
    return formatAxiosError(axiosError, context);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return formatGenericError(error, context);
  }

  // Fallback
  return formatUnknownError(context);
}

/**
 * Format API Service Error with context
 */
function formatAPIServiceError(error: APIServiceError, context?: ErrorContext): string {
  const baseMessage = error.message || "An error occurred";
  
  if (context) {
    const parts: string[] = [];
    
    if (context.operation) {
      parts.push(`Failed to ${context.operation}`);
    }
    
    if (context.ruleName) {
      parts.push(`rule "${context.ruleName}"`);
    } else if (context.ruleId) {
      parts.push(`rule #${context.ruleId}`);
    }
    
    if (context.fieldName) {
      parts.push(`(field: ${context.fieldName})`);
    }
    
    if (parts.length > 0) {
      return `${parts.join(" ")}: ${baseMessage}`;
    }
  }
  
  return baseMessage;
}

/**
 * Format Timeout Error
 */
function formatTimeoutError(error: APITimeoutError, context?: ErrorContext): string {
  const operation = context?.operation || "operation";
  return `Request timeout: The ${operation} took too long to complete. Please try again or check your network connection.`;
}

/**
 * Format Network Error
 */
function formatNetworkError(error: APINetworkError, context?: ErrorContext): string {
  const operation = context?.operation || "operation";
  return `Network error: Unable to reach the server. Please check your internet connection and try again.`;
}

/**
 * Format Axios Error
 */
function formatAxiosError(error: AxiosError, context?: ErrorContext): string {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  // Extract error message from response
  const errorMessage = 
    data?.detail?.message ||
    data?.detail ||
    data?.message ||
    data?.error ||
    error.message;

  // Format based on status code
  if (status === 400) {
    return formatValidationError(errorMessage, context);
  }
  
  if (status === 401) {
    return "Authentication required: Please log in again.";
  }
  
  if (status === 403) {
    return "Permission denied: You don't have permission to perform this operation.";
  }
  
  if (status === 404) {
    const resource = context?.ruleName || "resource";
    return `${resource} not found. It may have been deleted or doesn't exist.`;
  }
  
  if (status === 409) {
    return formatConflictError(errorMessage, context);
  }
  
  if (status === 422) {
    return formatValidationError(errorMessage, context);
  }
  
  if (status === 500) {
    return "Server error: An internal error occurred. Please try again later or contact support.";
  }
  
  return errorMessage || `Request failed with status ${status}`;
}

/**
 * Format Validation Error
 */
function formatValidationError(errorMessage: string, context?: ErrorContext): string {
  if (context?.fieldName) {
    return `Validation error in field "${context.fieldName}": ${errorMessage}`;
  }
  
  return `Validation error: ${errorMessage}`;
}

/**
 * Format Conflict Error
 */
function formatConflictError(errorMessage: string, context?: ErrorContext): string {
  if (context?.ruleName) {
    return `Conflict: ${errorMessage}. Rule "${context.ruleName}" may conflict with existing rules.`;
  }
  
  return `Conflict: ${errorMessage}`;
}

/**
 * Format Generic Error
 */
function formatGenericError(error: Error, context?: ErrorContext): string {
  if (context) {
    const parts: string[] = [];
    
    if (context.operation) {
      parts.push(`Failed to ${context.operation}`);
    }
    
    if (context.ruleName) {
      parts.push(`rule "${context.ruleName}"`);
    }
    
    if (parts.length > 0) {
      return `${parts.join(" ")}: ${error.message}`;
    }
  }
  
  return error.message || "An unexpected error occurred";
}

/**
 * Format Unknown Error
 */
function formatUnknownError(context?: ErrorContext): string {
  if (context?.operation) {
    return `Failed to ${context.operation}. An unknown error occurred.`;
  }
  
  return "An unknown error occurred. Please try again.";
}

/**
 * Create actionable error message with suggestions
 */
export function createActionableErrorMessage(
  error: unknown,
  context?: ErrorContext
): { message: string; suggestions: string[] } {
  const message = extractErrorMessage(error, context);
  const suggestions: string[] = [];

  // Add context-specific suggestions
  if (context?.operation === "create rule") {
    suggestions.push("Check that all required fields are filled");
    suggestions.push("Verify rule conditions are valid");
    suggestions.push("Ensure rule actions are properly configured");
  }
  
  if (context?.operation === "update rule") {
    suggestions.push("Verify the rule still exists");
    suggestions.push("Check for validation errors");
    suggestions.push("Ensure no conflicts with other rules");
  }
  
  if (context?.operation === "delete rule") {
    suggestions.push("Check if the rule is in use");
    suggestions.push("Verify the rule exists");
    suggestions.push("Check for dependencies");
  }

  // Add error-type specific suggestions
  if (error instanceof APITimeoutError) {
    suggestions.push("Check your network connection");
    suggestions.push("Try again in a few moments");
    suggestions.push("Contact support if the problem persists");
  }
  
  if (error instanceof APINetworkError) {
    suggestions.push("Check your internet connection");
    suggestions.push("Verify the server is accessible");
    suggestions.push("Try refreshing the page");
  }

  // Add field-specific suggestions
  if (context?.fieldName) {
    suggestions.push(`Review the "${context.fieldName}" field for errors`);
    suggestions.push("Check field format and constraints");
  }

  return { message, suggestions };
}

/**
 * Format error for display in toast/alert
 */
export function formatErrorForDisplay(
  error: unknown,
  context?: ErrorContext
): string {
  const { message, suggestions } = createActionableErrorMessage(error, context);
  
  if (suggestions.length > 0) {
    return `${message}\n\nSuggestions:\n${suggestions.map(s => `• ${s}`).join("\n")}`;
  }
  
  return message;
}

/**
 * Get error code for troubleshooting
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof APIServiceError) {
    return error.correlationId;
  }
  
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError;
    const data = axiosError.response?.data as any;
    return data?.correlation_id || data?.error_code;
  }
  
  return undefined;
}

