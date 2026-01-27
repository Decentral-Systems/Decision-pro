/**
 * Logger Utility
 * Provides structured logging with environment-aware behavior
 */

// Safe check for development mode that works in both server and client
const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
};

