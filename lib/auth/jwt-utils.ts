/**
 * JWT Utility Functions
 * Provides client-side JWT decoding and validation
 * Note: This does NOT verify JWT signatures - only server should verify
 */

export interface JWTPayload {
  user_id: string;
  roles?: string[];
  permissions?: string[];
  exp: number;
  iat: number;
  email?: string;
  username?: string;
}

/**
 * Decode JWT token without verification
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    if (!validateTokenFormat(token)) {
      console.error("[JWT] Invalid token format");
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split(".");
    const payload = parts[1];

    // Decode base64url
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const decoded = JSON.parse(jsonPayload);

    // Validate required fields - be flexible with user ID field names
    const userId = decoded.user_id || decoded.sub || decoded.id || decoded.username;
    if (!userId || typeof decoded.exp !== "number") {
      console.error("[JWT] Missing required fields in token", decoded);
      // Still return the decoded payload even if some fields are missing
      // This allows the app to work with different JWT formats
      return decoded as JWTPayload;
    }

    // Normalize the user_id field
    if (!decoded.user_id && userId) {
      decoded.user_id = userId;
    }

    return decoded as JWTPayload;
  } catch (error) {
    console.error("[JWT] Failed to decode token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param token - JWT token string
 * @returns True if expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error("[JWT] Error checking token expiration:", error);
    return true;
  }
}

/**
 * Get token expiration date
 * @param token - JWT token string
 * @returns Expiration date or null if invalid
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    // Convert exp (seconds) to milliseconds
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error("[JWT] Error getting token expiry:", error);
    return null;
  }
}

/**
 * Get token issued at date
 * @param token - JWT token string
 * @returns Issued at date or null if invalid
 */
export function getTokenIssuedAt(token: string): Date | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    // Convert iat (seconds) to milliseconds
    return new Date(payload.iat * 1000);
  } catch (error) {
    console.error("[JWT] Error getting token issued at:", error);
    return null;
  }
}

/**
 * Validate JWT token format
 * @param token - JWT token string
 * @returns True if valid format (3 parts separated by dots)
 */
export function validateTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // JWT must have exactly 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Each part must be non-empty
  return parts.every((part) => part.length > 0);
}

/**
 * Get time remaining until token expires
 * @param token - JWT token string
 * @returns Milliseconds until expiry, or 0 if expired/invalid
 */
export function getTimeUntilExpiry(token: string): number {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) {
      return 0;
    }

    const remaining = expiry.getTime() - Date.now();
    return Math.max(0, remaining);
  } catch (error) {
    console.error("[JWT] Error calculating time until expiry:", error);
    return 0;
  }
}

/**
 * Check if token will expire soon
 * @param token - JWT token string
 * @param thresholdMinutes - Minutes before expiry to consider "soon"
 * @returns True if token expires within threshold
 */
export function willExpireSoon(token: string, thresholdMinutes: number = 5): boolean {
  try {
    const timeRemaining = getTimeUntilExpiry(token);
    const thresholdMs = thresholdMinutes * 60 * 1000;
    return timeRemaining > 0 && timeRemaining <= thresholdMs;
  } catch (error) {
    console.error("[JWT] Error checking if token expires soon:", error);
    return true;
  }
}

/**
 * Extract user info from token
 * @param token - JWT token string
 * @returns User info or null if invalid
 */
export function getUserFromToken(token: string): {
  user_id: string;
  username?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
} | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    return {
      user_id: payload.user_id,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  } catch (error) {
    console.error("[JWT] Error extracting user from token:", error);
    return null;
  }
}

/**
 * Verify JWT token (client-side basic verification)
 * Note: This is NOT cryptographic verification - only format and expiration check
 * @param token - JWT token string
 * @returns Decoded payload if valid, throws error otherwise
 */
export async function jwtVerify(token: string): Promise<JWTPayload> {
  if (!validateTokenFormat(token)) {
    throw new Error('Invalid token format');
  }

  if (isTokenExpired(token)) {
    throw new Error('Token has expired');
  }

  const payload = decodeJWT(token);
  if (!payload) {
    throw new Error('Failed to decode token');
  }

  return payload;
}
