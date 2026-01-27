/**
 * Centralized Error Handler
 * Provides user-friendly error messages, retry logic, and error recovery
 */

import { APIServiceError, APITimeoutError, APINetworkError } from "@/types/api";
import { toast } from "@/hooks/use-toast";

export interface ErrorContext {
  correlationId?: string;
  timestamp?: string;
  endpoint?: string;
  statusCode?: number;
  userMessage?: string;
  technicalMessage?: string;
  retryable?: boolean;
  suggestions?: string[];
}

export class ErrorHandler {
  /**
   * Convert error to user-friendly message
   */
  static getUserFriendlyMessage(error: unknown): string {
    if (error instanceof APIServiceError) {
      return this.getServiceErrorMessage(error);
    }

    if (error instanceof APITimeoutError) {
      return "The request took too long to complete. Please try again.";
    }

    if (error instanceof APINetworkError) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    if (error instanceof Error) {
      // Check for common error patterns
      const message = error.message.toLowerCase();

      if (message.includes("network") || message.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }

      if (message.includes("timeout")) {
        return "Request timeout. The server took too long to respond. Please try again.";
      }

      if (message.includes("unauthorized") || message.includes("401")) {
        return "Your session has expired. Please log in again.";
      }

      if (message.includes("forbidden") || message.includes("403")) {
        return "You don't have permission to perform this action.";
      }

      if (message.includes("not found") || message.includes("404")) {
        return "The requested resource was not found.";
      }

      if (message.includes("server error") || message.includes("500")) {
        return "A server error occurred. Please try again later or contact support.";
      }

      return error.message || "An unexpected error occurred. Please try again.";
    }

    return "An unexpected error occurred. Please try again.";
  }

  /**
   * Get service-specific error message
   */
  private static getServiceErrorMessage(error: APIServiceError): string {
    const status = error.statusCode;
    const message = error.message.toLowerCase();

    switch (status) {
      case 400:
        return message.includes("validation") || message.includes("invalid")
          ? "Please check your input and try again."
          : "Invalid request. Please check your input.";
      case 401:
        return "Your session has expired. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "A conflict occurred. The resource may have been modified by another user.";
      case 422:
        return "Validation error. Please check your input and try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "A server error occurred. Please try again later or contact support.";
      case 502:
        return "Service temporarily unavailable. Please try again in a moment.";
      case 503:
        return "Service is currently unavailable. Please try again later.";
      case 504:
        return "Request timeout. The server took too long to respond.";
      default:
        return error.message || "An error occurred. Please try again.";
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof APITimeoutError || error instanceof APINetworkError) {
      return true;
    }

    if (error instanceof APIServiceError) {
      const status = error.statusCode;
      // Retry on server errors and rate limits
      return status >= 500 || status === 429 || status === 503 || status === 502;
    }

    return false;
  }

  /**
   * Get error context for logging and display
   */
  static getErrorContext(error: unknown, endpoint?: string): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      endpoint,
    };

    if (error instanceof APIServiceError) {
      context.statusCode = error.statusCode;
      context.correlationId = error.correlationId;
      context.userMessage = this.getUserFriendlyMessage(error);
      context.technicalMessage = error.message;
      context.retryable = this.isRetryable(error);
      context.suggestions = this.getErrorSuggestions(error);
    } else if (error instanceof Error) {
      context.userMessage = this.getUserFriendlyMessage(error);
      context.technicalMessage = error.message;
      context.retryable = this.isRetryable(error);
    }

    return context;
  }

  /**
   * Get suggestions for error recovery
   */
  private static getErrorSuggestions(error: unknown): string[] {
    const suggestions: string[] = [];

    if (error instanceof APIServiceError) {
      const status = error.statusCode;

      switch (status) {
        case 400:
        case 422:
          suggestions.push("Check that all required fields are filled correctly");
          suggestions.push("Verify that input values are within allowed ranges");
          break;
        case 401:
          suggestions.push("Log out and log back in");
          suggestions.push("Clear your browser cache and cookies");
          break;
        case 403:
          suggestions.push("Contact your administrator for access");
          suggestions.push("Verify you have the required permissions");
          break;
        case 404:
          suggestions.push("Verify the resource ID is correct");
          suggestions.push("Check if the resource was deleted");
          break;
        case 429:
          suggestions.push("Wait a few moments before trying again");
          suggestions.push("Reduce the frequency of your requests");
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          suggestions.push("Wait a moment and try again");
          suggestions.push("Contact support if the problem persists");
          break;
      }
    } else if (error instanceof APITimeoutError) {
      suggestions.push("Check your internet connection");
      suggestions.push("Try again in a moment");
      suggestions.push("Contact support if the problem persists");
    } else if (error instanceof APINetworkError) {
      suggestions.push("Check your internet connection");
      suggestions.push("Verify the server is accessible");
      suggestions.push("Try again in a moment");
    }

    return suggestions;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  /**
   * Log error for monitoring
   */
  static logError(error: unknown, context: ErrorContext): void {
    const errorLog = {
      error: {
        message: context.technicalMessage || "Unknown error",
        userMessage: context.userMessage,
        statusCode: context.statusCode,
        correlationId: context.correlationId,
        endpoint: context.endpoint,
        timestamp: context.timestamp,
        retryable: context.retryable,
      },
      suggestions: context.suggestions,
    };

    console.error("[ErrorHandler] Error logged:", errorLog);

    // In production, send to error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorLog });
    // }
  }

  /**
   * Display error to user with toast notification
   */
  static showError(error: unknown, options?: {
    title?: string;
    description?: string;
    showRetry?: boolean;
    onRetry?: () => void;
  }): void {
    const userMessage = options?.description || this.getUserFriendlyMessage(error);
    const title = options?.title || "Error";
    
    toast({
      title,
      description: userMessage,
      variant: "destructive",
    });
  }

  /**
   * Display success message
   */
  static showSuccess(message: string, title: string = "Success"): void {
    toast({
      title,
      description: message,
    });
  }

  /**
   * Display warning message
   */
  static showWarning(message: string, title: string = "Warning"): void {
    toast({
      title,
      description: message,
    });
  }

  /**
   * Display info message
   */
  static showInfo(message: string, title: string = "Info"): void {
    toast({
      title,
      description: message,
    });
  }

  /**
   * Handle error with automatic user notification
   */
  static handle(error: unknown, options?: {
    endpoint?: string;
    showToast?: boolean;
    showRetry?: boolean;
    onRetry?: () => void;
    silent?: boolean;
  }): ErrorContext {
    const context = this.getErrorContext(error, options?.endpoint);
    
    // Log the error
    if (!options?.silent) {
      this.logError(error, context);
    }
    
    // Show toast notification if requested
    if (options?.showToast !== false && !options?.silent) {
      this.showError(error, {
        showRetry: options?.showRetry && context.retryable,
        onRetry: options?.onRetry,
      });
    }
    
    return context;
  }

  /**
   * Create error boundary fallback renderer
   */
  static createFallbackRenderer(onRetry?: () => void) {
    return ({ error }: { error: Error }) => {
      const context = this.getErrorContext(error);
      
      return {
        title: "Something went wrong",
        description: context.userMessage || "An unexpected error occurred",
        suggestions: context.suggestions || [],
        retryable: context.retryable || false,
        onRetry,
      };
    };
  }

  /**
   * Get formatted error for display
   */
  static getDisplayError(error: unknown): {
    title: string;
    message: string;
    suggestions: string[];
    retryable: boolean;
    statusCode?: number;
  } {
    const context = this.getErrorContext(error);
    
    let title = "Error";
    if (error instanceof APINetworkError) {
      title = "Connection Error";
    } else if (error instanceof APITimeoutError) {
      title = "Request Timeout";
    } else if (error instanceof APIServiceError) {
      const status = error.statusCode;
      if (status === 401) title = "Authentication Required";
      else if (status === 403) title = "Access Denied";
      else if (status === 404) title = "Not Found";
      else if (status >= 500) title = "Server Error";
    }
    
    return {
      title,
      message: context.userMessage || "An unexpected error occurred",
      suggestions: context.suggestions || [],
      retryable: context.retryable || false,
      statusCode: context.statusCode,
    };
  }
}

