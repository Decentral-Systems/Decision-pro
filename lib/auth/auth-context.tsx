"use client";

/**
 * Direct Authentication Context
 * Uses API Gateway directly without NextAuth
 * Features:
 * - JWT validation on load
 * - Automatic token refresh
 * - Session timeout tracking
 * - Detailed error handling
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { apiGatewayClient } from '@/lib/api/clients/api-gateway';
import { creditScoringClient } from '@/lib/api/clients/credit-scoring';
import { UserRole } from '@/types/user';
import { useAuthStore } from '@/lib/stores/auth-store';
import { 
  isTokenExpired, 
  getTokenExpiry, 
  validateTokenFormat
} from './jwt-utils';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: UserRole[];
}

export type AuthErrorType = 'network' | 'auth' | 'session' | 'unknown';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  retryable: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiresAt: Date | null;
  sessionExpiresAt: Date | null;
  isRefreshing: boolean;
  error: AuthError | null;
  showTimeoutWarning: boolean;
  timeoutRemaining: number;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour
const TOKEN_REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    tokenExpiresAt: null,
    sessionExpiresAt: null,
    isRefreshing: false,
    error: null,
    showTimeoutWarning: false,
    timeoutRemaining: 0,
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  }, []);

  // Load auth state from localStorage on mount with JWT validation
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedAccessToken = localStorage.getItem('auth_access_token');
        const storedRefreshToken = localStorage.getItem('auth_refresh_token');
        const storedSessionExpiry = localStorage.getItem('auth_session_expires_at');

        // Validate token format and expiration
        if (storedUser && storedAccessToken && validateTokenFormat(storedAccessToken)) {
          // Check if token is expired
          if (isTokenExpired(storedAccessToken)) {
            console.log('[Auth] Stored token is expired, clearing auth state');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_access_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('auth_session_expires_at');
            setState(prev => ({ ...prev, isLoading: false }));
            return;
          }

          // Get token expiration
          const tokenExpiry = getTokenExpiry(storedAccessToken);
          
          // Get or create session expiry
          let sessionExpiry: Date;
          if (storedSessionExpiry) {
            sessionExpiry = new Date(storedSessionExpiry);
            // Check if session expired
            if (sessionExpiry.getTime() < Date.now()) {
              console.log('[Auth] Session expired, clearing auth state');
              localStorage.clear();
              setState(prev => ({ ...prev, isLoading: false }));
              return;
            }
          } else {
            // Create new session expiry
            sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS);
            localStorage.setItem('auth_session_expires_at', sessionExpiry.toISOString());
          }

          const parsedUser = JSON.parse(storedUser);
          
          // Ensure roles are valid UserRole enum values
          let userRoles: UserRole[] = [];
          if (parsedUser.roles && Array.isArray(parsedUser.roles)) {
            userRoles = parsedUser.roles.filter(role => 
              Object.values(UserRole).includes(role as UserRole)
            ) as UserRole[];
          }
          
          // If no valid roles, default to admin
          if (userRoles.length === 0) {
            userRoles = [UserRole.ADMIN];
          }
          
          const user: User = {
            ...parsedUser,
            roles: userRoles
          };
          
          console.log('[Auth] Loaded user from storage:', {
            hasRoles: !!user.roles,
            roles: user.roles,
            rolesLength: user.roles.length
          });
          
          setState({
            user,
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
            isAuthenticated: true,
            isLoading: false,
            tokenExpiresAt: tokenExpiry,
            sessionExpiresAt: sessionExpiry,
            isRefreshing: false,
            error: null,
            showTimeoutWarning: false,
            timeoutRemaining: 0,
          });
          
          // Set token in API clients
          apiGatewayClient.setAccessToken(storedAccessToken);
          creditScoringClient.setAccessToken(storedAccessToken);
          
          // IMPORTANT: Also set cookie for middleware
          document.cookie = `auth_access_token=${storedAccessToken}; path=/; max-age=${60 * 60}`; // 1 hour
          
          console.log('[Auth] Loaded auth state from storage, token expires at:', tokenExpiry);
        } else {
          // Invalid or missing token
          if (storedAccessToken && !validateTokenFormat(storedAccessToken)) {
            console.warn('[Auth] Invalid token format in storage, clearing');
            localStorage.clear();
          }
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('[Auth] Failed to load auth state:', error);
        localStorage.clear();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log('[Auth] Logging in user:', username);
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await apiGatewayClient.login(username, password);
      
      console.log('[Auth] Login response received:', {
        has_access_token: !!response.access_token,
        has_user: !!response.user,
        has_user_info: !!response.user_info,
        response_keys: Object.keys(response),
        user_info_details: response.user_info
      });

      // Parse roles - ensure they're in the correct format (UserRole enum values)
      let roles: UserRole[] = [];
      if (response.user?.roles && Array.isArray(response.user.roles)) {
        roles = response.user.roles;
      } else if (response.user_info?.roles && Array.isArray(response.user_info.roles)) {
        roles = response.user_info.roles;
      } else {
        // Fallback: assign admin role if no roles provided
        roles = [UserRole.ADMIN];
      }
      
      // Ensure roles are valid UserRole enum values
      const validRoles = roles.filter(role => Object.values(UserRole).includes(role as UserRole)) as UserRole[];
      if (validRoles.length === 0) {
        // If no valid roles, default to admin
        validRoles.push(UserRole.ADMIN);
      }

      const user: User = {
        id: response.user?.user_id || response.user_info?.user_id || response.user?.sub || 'unknown',
        username: response.user?.username || response.user_info?.username || username,
        email: response.user?.email || response.user_info?.email || '',
        name: response.user?.full_name || response.user_info?.full_name || response.user?.username || username,
        roles: validRoles,
      };
      
      console.log('[Auth] User object created:', user);
      console.log('[Auth] Roles parsed:', {
        rawRoles: response.user?.roles || response.user_info?.roles,
        parsedRoles: validRoles,
        rolesLength: validRoles.length
      });

      // Get token expiration
      const tokenExpiry = getTokenExpiry(response.access_token);
      
      // Set session expiry
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS);

      // Store auth state
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_access_token', response.access_token);
      localStorage.setItem('auth_session_expires_at', sessionExpiry.toISOString());
      if (response.refresh_token) {
        localStorage.setItem('auth_refresh_token', response.refresh_token);
      }

      // IMPORTANT: Also set cookie for middleware to detect authentication
      document.cookie = `auth_access_token=${response.access_token}; path=/; max-age=${60 * 60}`; // 1 hour

      // Set token in API clients
      apiGatewayClient.setAccessToken(response.access_token);
      creditScoringClient.setAccessToken(response.access_token);

      // Sync with Zustand store
      useAuthStore.getState().setAccessToken(response.access_token);
      useAuthStore.getState().setRoles(user.roles);
      useAuthStore.getState().setAuthenticated(true);
      useAuthStore.getState().setTokenSynced(true);
      useAuthStore.getState().setLastTokenRefresh(Date.now());

      setState({
        user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token || null,
        isAuthenticated: true,
        isLoading: false,
        tokenExpiresAt: tokenExpiry,
        sessionExpiresAt: sessionExpiry,
        isRefreshing: false,
        error: null,
        showTimeoutWarning: false,
        timeoutRemaining: 0,
      });

      console.log('[Auth] Login successful, token expires at:', tokenExpiry);
      console.log('[Auth] State updated:', {
        hasUser: !!user,
        isAuthenticated: true,
        userName: user.name,
        userRoles: user.roles
      });

      // Force a window location change after a brief delay to ensure state propagation
      // This is a fallback if React context doesn't trigger re-render
      setTimeout(() => {
        console.log('[Auth] Checking if still on login page...');
        if (window.location.pathname.includes('/login')) {
          console.log('[Auth] Still on login page, forcing redirect...');
          window.location.href = '/dashboard';
        }
      }, 200);
    } catch (error: any) {
      // Extract detailed error information
      const errorCode = error?.code;
      const errorConstructorName = error?.constructor?.name;
      const errorMessage = error?.message || '';
      const statusCode = error?.statusCode || error?.response?.status;
      
      // Extract API error message from response
      const apiMessage = error?.response?.data?.detail || 
                        error?.response?.data?.message ||
                        error?.response?.data?.error ||
                        errorMessage;
      
      // Log comprehensive error details for debugging
      console.error('[Auth] Login failed:', {
        errorCode,
        errorType: errorConstructorName,
        statusCode,
        apiMessage,
        errorMessage,
        responseData: error?.response?.data,
        fullError: error,
      });
      
      // Detect network errors more accurately
      const isNetworkError = 
        errorCode === "ERR_NETWORK" ||
        errorCode === "ECONNABORTED" ||
        errorCode === "ETIMEDOUT" ||
        errorConstructorName === "APINetworkError" ||
        errorConstructorName === "APITimeoutError" ||
        apiMessage.includes("Network") ||
        apiMessage.includes("timeout") ||
        apiMessage.includes("ECONN") ||
        apiMessage.includes("offline") ||
        errorMessage.includes("Network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("ECONN") ||
        errorMessage.includes("offline");
      
      // Detect auth errors
      const isAuthError = 
        statusCode === 401 ||
        statusCode === 403 ||
        apiMessage.includes("Invalid") ||
        apiMessage.includes("credentials") ||
        apiMessage.includes("unauthorized") ||
        apiMessage.includes("password") ||
        apiMessage.includes("username") ||
        errorMessage.includes("Invalid") ||
        errorMessage.includes("credentials") ||
        errorMessage.includes("unauthorized");
      
      // Create appropriate error message
      let userMessage: string;
      let errorType: AuthErrorType;
      let retryable: boolean;
      
      if (isNetworkError) {
        userMessage = "Network error - please check your connection and try again";
        errorType = 'network';
        retryable = true;
      } else if (isAuthError) {
        userMessage = "Invalid username or password";
        errorType = 'auth';
        retryable = false;
      } else if (statusCode >= 500) {
        userMessage = "Server error - please try again later";
        errorType = 'unknown';
        retryable = true;
      } else {
        // Use API message if available, otherwise fallback to error message
        userMessage = apiMessage || errorMessage || "Login failed - please try again";
        errorType = 'unknown';
        retryable = false;
      }
      
      // Categorize error
      const authError: AuthError = {
        type: errorType,
        message: userMessage,
        retryable,
      };
      
      // Sync error with Zustand store
      useAuthStore.getState().setAuthError(authError.message);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: authError
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[Auth] Logging out');
    
    // Clear timers
    clearTimers();
    
    // Clear storage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_session_expires_at');
    
    // Clear cookie
    document.cookie = 'auth_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear tokens from API clients
    apiGatewayClient.setAccessToken(null);
    creditScoringClient.setAccessToken(null);

    // Sync with Zustand store
    useAuthStore.getState().clearAuth();

    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      tokenExpiresAt: null,
      sessionExpiresAt: null,
      isRefreshing: false,
      error: null,
      showTimeoutWarning: false,
      timeoutRemaining: 0,
    });
  }, [clearTimers]);

  const refreshAccessToken = useCallback(async () => {
    try {
      if (!state.refreshToken) {
        console.error('[Auth] No refresh token available');
        throw new Error('No refresh token available');
      }

      if (state.isRefreshing) {
        console.log('[Auth] Refresh already in progress, skipping');
        return;
      }

      console.log('[Auth] Refreshing access token');
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      
      const response = await apiGatewayClient.refreshToken(state.refreshToken);

      // Get new token expiration
      const tokenExpiry = getTokenExpiry(response.access_token);
      
      // Extend session
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS);

      localStorage.setItem('auth_access_token', response.access_token);
      localStorage.setItem('auth_session_expires_at', sessionExpiry.toISOString());
      if (response.refresh_token) {
        localStorage.setItem('auth_refresh_token', response.refresh_token);
      }

      apiGatewayClient.setAccessToken(response.access_token);
      creditScoringClient.setAccessToken(response.access_token);

      // Sync with Zustand store
      useAuthStore.getState().setAccessToken(response.access_token);
      useAuthStore.getState().setLastTokenRefresh(Date.now());

      setState(prev => ({
        ...prev,
        accessToken: response.access_token,
        refreshToken: response.refresh_token || prev.refreshToken,
        tokenExpiresAt: tokenExpiry,
        sessionExpiresAt: sessionExpiry,
        isRefreshing: false,
        showTimeoutWarning: false,
        timeoutRemaining: 0,
      }));

      console.log('[Auth] Token refreshed successfully, new expiry:', tokenExpiry);
    } catch (error: any) {
      console.error('[Auth] Token refresh failed:', error);
      
      const authError: AuthError = {
        type: 'auth',
        message: 'Session expired. Please log in again.',
        retryable: false,
      };
      
      setState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        error: authError
      }));
      
      // Logout on refresh failure
      logout();
      throw error;
    }
  }, [state.refreshToken, state.isRefreshing, logout]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const extendSession = useCallback(async () => {
    await refreshAccessToken();
  }, [refreshAccessToken]);

  // Automatic token refresh - refresh 5 minutes before expiry
  useEffect(() => {
    if (!state.accessToken || !state.tokenExpiresAt || !state.isAuthenticated) {
      return;
    }

    const timeUntilExpiry = state.tokenExpiresAt.getTime() - Date.now();
    const refreshAt = timeUntilExpiry - TOKEN_REFRESH_BEFORE_EXPIRY_MS;

    // If token is already expired (shouldn't happen after fresh login), log out
    if (timeUntilExpiry <= 0) {
      console.warn('[Auth] Token is already expired, logging out');
      logout();
      return;
    }

    // If token will expire very soon (< 1 minute) AND we have a refresh token, refresh immediately
    // BUT: Don't do this right after login - the token should be fresh
    if (timeUntilExpiry <= 60000 && state.refreshToken) { // Less than 1 minute
      // Check if this is a fresh login (token issued less than 10 seconds ago)
      const tokenAge = Date.now() - (state.tokenExpiresAt.getTime() - 3600000); // Assuming 1 hour expiry
      if (tokenAge > 10000) { // Token is older than 10 seconds
        console.log('[Auth] Token expiring soon, refreshing immediately');
        refreshAccessToken().catch(err => {
          console.error('[Auth] Auto-refresh failed:', err);
          logout();
        });
        return;
      } else {
        console.log('[Auth] Fresh token detected, skipping immediate refresh');
      }
    }

    // Token is valid, set up refresh timer
    if (refreshAt > 0) {
      const minutesUntilRefresh = Math.round(refreshAt / 1000 / 60);
      const minutesUntilExpiry = Math.round(timeUntilExpiry / 1000 / 60);
      console.log(`[Auth] Token is valid for ${minutesUntilExpiry} minutes, will refresh in ${minutesUntilRefresh} minutes`);
      
      refreshTimerRef.current = setTimeout(() => {
        console.log('[Auth] Auto-refresh triggered by timer');
        refreshAccessToken().catch(err => {
          console.error('[Auth] Auto-refresh failed:', err);
          logout();
        });
      }, refreshAt);
    } else {
      // Refresh time is negative (token will expire before refresh window)
      // This means token expires in less than 5 minutes
      // Schedule refresh for halfway to expiry
      const immediateRefreshAt = timeUntilExpiry / 2;
      console.log(`[Auth] Token expires soon, will refresh in ${Math.round(immediateRefreshAt / 1000)} seconds`);
      
      refreshTimerRef.current = setTimeout(() => {
        console.log('[Auth] Auto-refresh triggered (token expiring soon)');
        refreshAccessToken().catch(err => {
          console.error('[Auth] Auto-refresh failed:', err);
          logout();
        });
      }, immediateRefreshAt);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [state.accessToken, state.tokenExpiresAt, state.isAuthenticated, state.refreshToken, refreshAccessToken, logout]);

  // Session timeout checking - check every second
  useEffect(() => {
    if (!state.sessionExpiresAt || !state.isAuthenticated) {
      return;
    }

    const checkSessionTimeout = () => {
      const now = Date.now();
      const timeRemaining = state.sessionExpiresAt!.getTime() - now;

      if (timeRemaining <= 0) {
        // Session expired
        console.log('[Auth] Session expired, logging out');
        logout();
      } else if (timeRemaining <= SESSION_WARNING_BEFORE_EXPIRY_MS && !state.showTimeoutWarning) {
        // Show warning
        const secondsRemaining = Math.floor(timeRemaining / 1000);
        console.log(`[Auth] Session expiring in ${secondsRemaining} seconds, showing warning`);
        setState(prev => ({
          ...prev,
          showTimeoutWarning: true,
          timeoutRemaining: secondsRemaining,
        }));
      } else if (state.showTimeoutWarning) {
        // Update countdown
        const secondsRemaining = Math.floor(timeRemaining / 1000);
        setState(prev => ({
          ...prev,
          timeoutRemaining: secondsRemaining,
        }));
      }
    };

    // Check immediately
    checkSessionTimeout();

    // Then check every second
    sessionCheckIntervalRef.current = setInterval(checkSessionTimeout, 1000);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, [state.sessionExpiresAt, state.isAuthenticated, state.showTimeoutWarning, logout]);

  // Expose refresh function globally for API client interceptor
  useEffect(() => {
    if (state.isAuthenticated && refreshAccessToken) {
      (window as any).__authRefresh = refreshAccessToken;
    } else {
      delete (window as any).__authRefresh;
    }

    return () => {
      delete (window as any).__authRefresh;
    };
  }, [state.isAuthenticated, refreshAccessToken]);

  // Memoize context value
  const value = useMemo<AuthContextType>(() => ({
    ...state,
    login,
    logout,
    refreshAccessToken,
    clearError,
    extendSession,
  }), [state, login, logout, refreshAccessToken, clearError, extendSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
