/**
 * Authentication Error Handler
 * Centralized error handling for authentication failures
 */

import { APIServiceError } from '@/types/api';

export interface AuthErrorDetails {
  code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'ACCOUNT_LOCKED' | 'UNKNOWN';
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  shouldRedirect: boolean;
  redirectPath?: string;
}

/**
 * Parse authentication error and return user-friendly details
 */
export function parseAuthError(error: unknown): AuthErrorDetails {
  // Handle APIServiceError
  if (error instanceof APIServiceError) {
    const statusCode = error.statusCode;
    const message = error.message || 'Authentication error';

    switch (statusCode) {
      case 401:
        // Check error message for more specific details
        if (message.includes('expired') || message.includes('expire')) {
          return {
            code: 'TOKEN_EXPIRED',
            message,
            userMessage: 'Your session has expired. Please log in again.',
            shouldRetry: false,
            shouldRedirect: true,
            redirectPath: '/login',
          };
        }
        if (message.includes('invalid') || message.includes('Invalid')) {
          return {
            code: 'TOKEN_INVALID',
            message,
            userMessage: 'Your session is invalid. Please log in again.',
            shouldRetry: false,
            shouldRedirect: true,
            redirectPath: '/login',
          };
        }
        return {
          code: 'UNAUTHORIZED',
          message,
          userMessage: 'You are not authorized to access this resource.',
          shouldRetry: false,
          shouldRedirect: true,
          redirectPath: '/login',
        };

      case 423:
        return {
          code: 'ACCOUNT_LOCKED',
          message,
          userMessage: 'Your account has been locked. Please contact support.',
          shouldRetry: false,
          shouldRedirect: false,
        };

      case 403:
        return {
          code: 'UNAUTHORIZED',
          message,
          userMessage: 'You do not have permission to perform this action.',
          shouldRetry: false,
          shouldRedirect: false,
        };

      default:
        return {
          code: 'UNKNOWN',
          message,
          userMessage: 'An authentication error occurred. Please try again.',
          shouldRetry: statusCode >= 500, // Retry server errors
          shouldRedirect: statusCode === 401,
          redirectPath: statusCode === 401 ? '/login' : undefined,
        };
    }
  }

  // Handle network errors
  if (error && typeof error === 'object') {
    const err = error as any;
    
    if (err.code === 'ERR_NETWORK' || err.message?.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network error',
        userMessage: 'Cannot connect to the server. Please check your internet connection and try again.',
        shouldRetry: true,
        shouldRedirect: false,
      };
    }

    if (err.response?.status === 401) {
      return {
        code: 'TOKEN_EXPIRED',
        message: err.message || 'Token expired',
        userMessage: 'Your session has expired. Please log in again.',
        shouldRetry: false,
        shouldRedirect: true,
        redirectPath: '/login',
      };
    }
  }

  // Handle credential errors from login
  if (error && typeof error === 'object') {
    const err = error as any;
    if (err.message?.includes('Invalid credentials') || err.message?.includes('invalid username') || err.message?.includes('invalid password')) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: err.message || 'Invalid credentials',
        userMessage: 'Invalid username or password. Please try again.',
        shouldRetry: false,
        shouldRedirect: false,
      };
    }
  }

  // Default unknown error
  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'Unknown error',
    userMessage: 'An authentication error occurred. Please try again.',
    shouldRetry: false,
    shouldRedirect: false,
  };
}

/**
 * Handle authentication error and perform appropriate action
 */
export function handleAuthError(
  error: unknown,
  options?: {
    onRedirect?: (path: string) => void;
    onRetry?: () => void;
    onError?: (details: AuthErrorDetails) => void;
  }
): AuthErrorDetails {
  const details = parseAuthError(error);

  // Log error for debugging
  console.error('[AuthErrorHandler]', {
    code: details.code,
    message: details.message,
    userMessage: details.userMessage,
    shouldRetry: details.shouldRetry,
    shouldRedirect: details.shouldRedirect,
  });

  // Handle redirect
  if (details.shouldRedirect && details.redirectPath) {
    if (options?.onRedirect) {
      options.onRedirect(details.redirectPath);
    } else if (typeof window !== 'undefined') {
      // Default redirect behavior
      window.location.href = details.redirectPath;
    }
  }

  // Handle retry
  if (details.shouldRetry && options?.onRetry) {
    // Don't auto-retry immediately, let caller decide
    // options.onRetry();
  }

  // Call custom error handler if provided
  if (options?.onError) {
    options.onError(details);
  }

  return details;
}

/**
 * Get user-friendly error message for display
 */
export function getUserFriendlyMessage(error: unknown): string {
  const details = parseAuthError(error);
  return details.userMessage;
}

/**
 * Check if error requires redirect to login
 */
export function shouldRedirectToLogin(error: unknown): boolean {
  const details = parseAuthError(error);
  return details.shouldRedirect === true && details.redirectPath === '/login';
}

/**
 * Check if error should trigger retry
 */
export function shouldRetryAuth(error: unknown): boolean {
  const details = parseAuthError(error);
  return details.shouldRetry === true;
}

