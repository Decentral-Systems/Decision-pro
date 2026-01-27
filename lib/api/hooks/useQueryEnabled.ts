import { useAuth } from "@/lib/auth/auth-context";
import { useMemo } from "react";

/**
 * Custom hook to determine if a React Query should be enabled.
 * It checks for either a valid authenticated session token OR the presence of an API key.
 * This allows data fetching to proceed even if authentication is not fully established,
 * by falling back to the API key for unauthenticated access to certain endpoints.
 */
export function useQueryEnabled(): boolean {
  const { isAuthenticated, accessToken, isLoading } = useAuth();

  const isEnabled = useMemo(() => {
    // Don't enable if still loading auth state
    if (isLoading) {
      return false;
    }

    const hasAuthToken = isAuthenticated && !!accessToken;
    const hasApiKey = !!process.env.NEXT_PUBLIC_API_KEY;

    // Log for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.debug("[useQueryEnabled] Checking query enablement:", {
        isAuthenticated,
        hasAuthToken,
        hasApiKey,
        isLoading,
        result: hasAuthToken || hasApiKey,
      });
    }

    return hasAuthToken || hasApiKey;
  }, [isAuthenticated, accessToken, isLoading]);

  return isEnabled;
}

/**
 * Legacy helper function - kept for backward compatibility
 * Now works with direct authentication instead of NextAuth
 */
export function shouldEnableQuery(
  isAuthenticated: boolean,
  sessionAccessToken: string | undefined | null
): boolean {
  // If authenticated with token, enable query
  if (isAuthenticated && sessionAccessToken) {
    return true;
  }
  
  // If API key is available, enable query (API client will use API key as fallback)
  if (typeof window !== 'undefined') {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4";
    if (apiKey) {
      return true;
    }
  }
  
  return false;
}
