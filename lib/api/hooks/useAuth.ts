"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * Hook to ensure auth state is initialized and synced
 */
export function useAuthReady() {
  const { accessToken, isAuthenticated, setTokenSynced } = useAuthStore();

  useEffect(() => {
    // Mark token as synced when component mounts
    setTokenSynced(true);
  }, [setTokenSynced]);

  return {
    token: accessToken,
    isAuthenticated,
    isReady: true
  };
}

/**
 * Hook to get current auth state
 */
export function useAuth() {
  const authStore = useAuthStore();

  return {
    token: authStore.accessToken,
    roles: authStore.roles,
    isAuthenticated: authStore.isAuthenticated,
    setToken: authStore.setAccessToken,
    setRoles: authStore.setRoles,
    logout: authStore.clearAuth
  };
}
