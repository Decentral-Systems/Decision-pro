/**
 * React Query hooks for Settings
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { SettingsData } from "@/types/settings";
import { useAuth } from "@/lib/auth/auth-context";

export function useSettings() {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<SettingsData | null>({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getSettings();
        // Extract data from response if nested
        return data?.data || data;
      } catch (error: any) {
        // If endpoint doesn't exist (404), return null instead of undefined (React Query requirement)
        const statusCode = error?.statusCode || error?.response?.status;
        if (statusCode === 404 || statusCode === 401) {
          console.warn("[useSettings] Settings not available:", statusCode);
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation<SettingsData, Error, Partial<SettingsData>>({
    mutationFn: async (settings) => {
      const data = await apiGatewayClient.updateSettings(settings);
      // Extract data from response if nested
      return data?.data || data;
    },
    onSuccess: () => {
      // Invalidate settings query to refetch after update
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useResetSettings() {
  const queryClient = useQueryClient();
  
  return useMutation<SettingsData, Error, void>({
    mutationFn: async () => {
      const data = await apiGatewayClient.resetSettings();
      return data;
    },
    onSuccess: () => {
      // Invalidate settings query to refetch after reset
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}



/**
 * Hook to import settings with validation
 */
export function useImportSettings() {
  const { isAuthenticated } = useAuth();

  return useMutation<any, Error, { settings: any; options?: { validateOnly?: boolean; overwrite?: boolean } }>({
    mutationFn: async ({ settings, options }) => {
      return await apiGatewayClient.importSettings(settings, options);
    },
    onError: (error) => {
      console.error("Failed to import settings:", error);
    },
  });
}

/**
 * Hook to fetch settings history
 */
export function useSettingsHistory(params?: { limit?: number; offset?: number }) {
  const { isAuthenticated } = useAuth();

  return useQuery<any | null>({
    queryKey: ["settings-history", params],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getSettingsHistory(params);
        return data;
      } catch (error: any) {
        console.error("Failed to fetch settings history:", error);
        return null;
      }
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
