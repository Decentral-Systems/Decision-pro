/**
 * React Query hooks for User Management
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { User, CreateUserRequest, UpdateUserRequest } from "@/types/admin";
import { PaginatedResponse } from "@/types/api";
import { useAuth } from "@/lib/auth/auth-context";

export function useUsers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  return useQuery<PaginatedResponse<User> | null>({
    queryKey: ["users", params],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getUsers(params);
        return data as PaginatedResponse<User>;
      } catch (error: any) {
        // Handle 401/404 errors gracefully - return null to show empty state (no fallback data)
        if (error?.statusCode === 401 || error?.statusCode === 404) {
          console.warn(
            "Users API unavailable, returning null to show empty state"
          );
          return null;
        }
        // For other errors, let React Query handle them
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useUser(userId: string) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const data = await apiGatewayClient.get<User>(
        `/api/v1/admin/users/${userId}`
      );
      return data;
    },
    enabled:
      isAuthenticated && tokenSynced && !!session?.accessToken && !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, CreateUserRequest>({
    mutationFn: async (userData) => {
      const data = await apiGatewayClient.post<User>(
        "/api/v1/admin/users",
        userData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: string; data: UpdateUserRequest }>({
    mutationFn: async ({ userId, data }) => {
      const response = await apiGatewayClient.put<User>(
        `/api/v1/admin/users/${userId}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      await apiGatewayClient.delete(`/api/v1/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: string; roles: string[] }>({
    mutationFn: async ({ userId, roles }) => {
      const data = await apiGatewayClient.post<User>(
        `/api/v1/admin/users/${userId}/roles`,
        { roles }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
}

export function useUserActivity(
  userId: string | null,
  params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
  }
) {
  const { isAuthenticated, tokenSynced } = useAuth();
  return useQuery<PaginatedResponse<
    import("@/types/admin").AuditLogEntry
  > | null>({
    queryKey: ["user-activity", userId, params],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const data = await apiGatewayClient.getUserActivity(userId, params);
        return data;
      } catch (error: any) {
        // Handle 401/404 errors gracefully
        if (error?.statusCode === 401 || error?.statusCode === 404) {
          console.warn("User activity API unavailable");
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useBulkActivateUsers() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: async (userIds) => {
      const data = await apiGatewayClient.bulkActivateUsers(userIds);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkDeactivateUsers() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: async (userIds) => {
      const data = await apiGatewayClient.bulkDeactivateUsers(userIds);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
