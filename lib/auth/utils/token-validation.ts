/**
 * Token Validation Utilities
 * Centralized JWT token validation and expiration checking
 */

/**
 * Environment-driven toggle: allow opaque API Gateway tokens (non-JWT) when the
 * gateway issues opaque bearer tokens. Default: allow, unless explicitly false.
 */
const allowOpaqueTokens =
  process.env.NEXT_PUBLIC_ALLOW_OPAQUE_TOKENS !== "false" &&
  process.env.ALLOW_OPAQUE_TOKENS !== "false";

/**
 * Validates if a token is a valid JWT format
 * JWT format: header.payload.signature (3 parts separated by dots)
 * @param token - The token string to validate
 * @returns true if token is a valid JWT format, false otherwise
 */
export function isValidJWT(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // Reject dev bypass token explicitly
  if (token === "dev-bypass-token" || token === "dev-bypass-refresh") {
    return false;
  }

  // JWT must have 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Each part should be base64url encoded (not empty)
  if (!parts[0] || !parts[1] || !parts[2]) {
    return false;
  }

  // Try to decode both header and payload
  try {
    // Helper function to decode base64url (JWT uses base64url, not standard base64)
    const base64UrlDecode = (str: string): string => {
      // Replace base64url characters with base64 characters
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      
      // Add padding if needed
      const padding = base64.length % 4;
      if (padding) {
        base64 += "=".repeat(4 - padding);
      }
      
      try {
        return atob(base64);
      } catch (e) {
        // If atob fails, try without padding
        base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        return atob(base64);
      }
    };
    
    // Decode header
    const headerStr = base64UrlDecode(parts[0]);
    const header = JSON.parse(headerStr);
    if (typeof header !== "object" || header === null) {
      return false;
    }
    
    // Decode payload
    const payloadStr = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadStr);
    if (typeof payload !== "object" || payload === null) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Determine if a token is an allowed opaque gateway token (non-JWT) when enabled.
 * We still reject any dev-bypass tokens and very short/whitespace tokens.
 */
export function isAllowedOpaqueToken(token: string): boolean {
  if (!allowOpaqueTokens) return false;
  if (!token || typeof token !== "string") return false;
  if (token === "dev-bypass-token" || token === "dev-bypass-refresh" || token.startsWith("dev-bypass-")) {
    return false;
  }
  // Require a reasonable length and no spaces to reduce false positives
  return token.length >= 20 && !/\s/.test(token) && token.split(".").length < 3;
}

/**
 * Safely decodes JWT payload without throwing errors
 * @param token - The JWT token string
 * @returns Decoded payload object or null if invalid
 */
export function getTokenPayload(token: string): any | null {
  if (!isValidJWT(token)) {
    return null;
  }

  try {
    const parts = token.split('.');
    
    // Helper function to decode base64url (JWT uses base64url, not standard base64)
    const base64UrlDecode = (str: string): string => {
      // Replace base64url characters with base64 characters
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const padding = base64.length % 4;
      if (padding) {
        base64 += '='.repeat(4 - padding);
      }
      
      try {
        return atob(base64);
      } catch (e) {
        // If atob fails, try without padding
        base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        return atob(base64);
      }
    };
    
    const payloadStr = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadStr);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts the expiration time (exp claim) from a JWT token
 * @param token - The JWT token string
 * @returns Expiration timestamp in milliseconds, or null if not found/invalid
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = getTokenPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return null;
  }

  // JWT exp is in seconds, convert to milliseconds
  return payload.exp * 1000;
}

/**
 * Checks if a token is expired
 * Uses a grace period to handle clock skew between client and server
 * @param token - The JWT token string
 * @param gracePeriodMs - Grace period in milliseconds to account for clock skew (default: 10 seconds)
 * @returns true if token is expired (accounting for grace period), false if valid
 */
export function isTokenExpired(token: string, gracePeriodMs: number = 10 * 1000): boolean {
  // Allow opaque tokens when enabled; treat as not expired (no exp claim available)
  if (isAllowedOpaqueToken(token)) {
    return false;
  }

  if (!isValidJWT(token)) {
    // Invalid tokens are considered "expired" (can't be used)
    return true;
  }

  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    // If no expiration claim, consider it valid (but log warning)
    console.warn("[token-validation] Token has no expiration claim");
    return false;
  }

  const now = Date.now();
  // Standard expiration check: token is expired if current time >= expiration time
  // Add small grace period AFTER expiration to account for minor clock skew (server clock slightly ahead of client)
  // This allows tokens that are slightly past expiration (within grace period) to still be considered valid
  return now > expirationTime + gracePeriodMs;
}

/**
 * Checks if a token will expire soon (within specified buffer time)
 * @param token - The JWT token string
 * @param bufferMs - Buffer time in milliseconds (default: 5 minutes)
 * @returns true if token expires within buffer time
 */
export function isTokenExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  // For opaque tokens we cannot evaluate expiry; assume not expiring soon
  if (isAllowedOpaqueToken(token)) {
    return false;
  }

  if (!isValidJWT(token)) {
    return true; // Invalid tokens should be treated as expiring
  }

  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return false; // No expiration claim, assume not expiring soon
  }

  const now = Date.now();
  const timeUntilExpiry = expirationTime - now;
  return timeUntilExpiry <= bufferMs && timeUntilExpiry > 0;
}

/**
 * Explicitly rejects dev bypass tokens
 * @param token - The token string to check
 * @returns true if token is dev bypass token, false otherwise
 */
export function rejectDevBypass(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return true; // Reject null/undefined/empty tokens
  }

  return token === 'dev-bypass-token' || 
         token === 'dev-bypass-refresh' || 
         token.startsWith('dev-bypass-');
}

/**
 * Comprehensive token validation
 * Validates JWT format, expiration, and rejects dev bypass
 * @param token - The token string to validate
 * @returns Object with validation results and details
 */
export function validateToken(token: string | null | undefined): {
  isValid: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isDevBypass: boolean;
  expirationTime: number | null;
  tokenType: "jwt" | "opaque" | "invalid";
  reason?: string;
} {
  if (!token) {
    return {
      isValid: false,
      isExpired: true,
      isExpiringSoon: true,
      isDevBypass: false,
      expirationTime: null,
      tokenType: "invalid",
      reason: "Token is null or undefined",
    };
  }

  const isDevBypass = rejectDevBypass(token);
  if (isDevBypass) {
    return {
      isValid: false,
      isExpired: true,
      isExpiringSoon: true,
      isDevBypass: true,
      expirationTime: null,
      tokenType: "invalid",
      reason: "Dev bypass token detected",
    };
  }

  const jwtValid = isValidJWT(token);
  const opaqueValid = isAllowedOpaqueToken(token);

  if (!jwtValid && !opaqueValid) {
    return {
      isValid: false,
      isExpired: true,
      isExpiringSoon: true,
      isDevBypass: false,
      expirationTime: null,
      tokenType: "invalid",
      reason: "Invalid token format",
    };
  }

  if (opaqueValid) {
    return {
      isValid: true,
      isExpired: false,
      isExpiringSoon: false,
      isDevBypass: false,
      expirationTime: null,
      tokenType: "opaque",
    };
  }

  const expirationTime = getTokenExpirationTime(token);
  // Use standard expiration check with grace period (default 10 seconds)
  const isExpired = isTokenExpired(token);
  const isExpiringSoon = isTokenExpiringSoon(token);

  return {
    isValid: true,
    isExpired,
    isExpiringSoon,
    isDevBypass: false,
    expirationTime,
    tokenType: "jwt",
    reason: isExpired ? "Token is expired" : isExpiringSoon ? "Token expiring soon" : undefined,
  };
}

