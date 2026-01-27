/**
 * Token Refresh Utilities
 * Handles JWT token refresh logic and proactive refresh checking
 */

import { isTokenExpiringSoon, getTokenExpirationTime, isValidJWT, isTokenExpired } from './token-validation';
import { apiGatewayClient } from '@/lib/api/clients/api-gateway';

/**
 * Default buffer time for proactive token refresh (5 minutes)
 */
const DEFAULT_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks if a token should be refreshed (expiring soon or already expired)
 * @param token - The JWT token string
 * @param bufferMs - Buffer time in milliseconds (default: 5 minutes)
 * @returns true if token should be refreshed
 */
export function shouldRefreshToken(token: string | null | undefined, bufferMs: number = DEFAULT_REFRESH_BUFFER_MS): boolean {
  if (!token || !isValidJWT(token)) {
    return false; // Can't refresh invalid tokens
  }

  // Check if token is expired or expiring soon
  return isTokenExpired(token) || isTokenExpiringSoon(token, bufferMs);
}

/**
 * Refreshes an access token using the refresh token
 * @param refreshToken - The refresh token string
 * @returns New access token or null if refresh failed
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  if (!refreshToken || !isValidJWT(refreshToken)) {
    console.error('[token-refresh] Invalid refresh token provided');
    return null;
  }

  try {
    console.log('[token-refresh] Attempting to refresh access token');
    const response = await apiGatewayClient.refreshToken(refreshToken);
    
    if (response?.access_token && isValidJWT(response.access_token)) {
      console.log('[token-refresh] Access token refreshed successfully');
      return response.access_token;
    } else {
      console.error('[token-refresh] Invalid access token in refresh response');
      return null;
    }
  } catch (error: any) {
    console.error('[token-refresh] Token refresh failed:', {
      message: error?.message,
      statusCode: error?.statusCode || error?.response?.status,
    });
    return null;
  }
}

/**
 * Gets time until token expiration in milliseconds
 * @param token - The JWT token string
 * @returns Time until expiration in milliseconds, or null if invalid/no expiration
 */
export function getTimeUntilExpiration(token: string | null | undefined): number | null {
  if (!token || !isValidJWT(token)) {
    return null;
  }

  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return null;
  }

  const now = Date.now();
  const timeUntilExpiry = expirationTime - now;
  
  return timeUntilExpiry > 0 ? timeUntilExpiry : 0;
}

/**
 * Checks if token refresh should be attempted based on expiration
 * Returns buffer time in milliseconds if refresh needed, null otherwise
 * @param token - The JWT token string
 * @param bufferMs - Buffer time in milliseconds (default: 5 minutes)
 * @returns Buffer time remaining in milliseconds, or null if no refresh needed
 */
export function getRefreshBufferRemaining(token: string | null | undefined, bufferMs: number = DEFAULT_REFRESH_BUFFER_MS): number | null {
  if (!token || !isValidJWT(token)) {
    return null;
  }

  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return null;
  }

  const now = Date.now();
  const timeUntilExpiry = expirationTime - now;
  
  if (timeUntilExpiry <= bufferMs && timeUntilExpiry > 0) {
    return timeUntilExpiry;
  }

  return null;
}

