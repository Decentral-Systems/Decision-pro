/**
 * Zustand auth store for client-side auth state
 * Centralized state management for authentication status
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole } from "@/types/user";

interface AuthState {
  accessToken: string | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  tokenSynced: boolean;
  lastTokenRefresh: number | null;
  authError: string | null;
  setAccessToken: (token: string | null) => void;
  setRoles: (roles: UserRole[]) => void;
  setAuthenticated: (value: boolean) => void;
  setTokenSynced: (value: boolean) => void;
  setLastTokenRefresh: (timestamp: number) => void;
  setAuthError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      roles: [],
      isAuthenticated: false,
      tokenSynced: false,
      lastTokenRefresh: null,
      authError: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setRoles: (roles) => set({ roles }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setTokenSynced: (value) => set({ tokenSynced: value }),
      setLastTokenRefresh: (timestamp) => set({ lastTokenRefresh: timestamp }),
      setAuthError: (error) => set({ authError: error }),
      clearAuth: () =>
        set({
          accessToken: null,
          roles: [],
          isAuthenticated: false,
          tokenSynced: false,
          lastTokenRefresh: null,
          authError: null,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Only persist non-sensitive state
        lastTokenRefresh: state.lastTokenRefresh,
        roles: state.roles,
      }),
    }
  )
);









