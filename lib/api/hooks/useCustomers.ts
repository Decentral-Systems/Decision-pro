/**
 * React Query hooks for Customer data
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { CustomersListResponse } from "@/types/api";
import { useAuth } from "@/lib/auth/auth-context";

export interface CustomersListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  order?: "asc" | "desc";
  // Server-side filters
  region?: string;
  status?: string;
  riskLevel?: string; // Will be mapped to risk_level or calculated from risk_score
  minScore?: number; // Maps to min_credit_score
  maxScore?: number; // Maps to max_credit_score
  dateFrom?: string; // Maps to date_from (YYYY-MM-DD format)
  dateTo?: string; // Maps to date_to (YYYY-MM-DD format)
  employment_status?: string;
}

import { useCustomer360 as useCustomer360Hook } from "@/features/customers/hooks/use-customer-360";

/**
 * Customer 360 data (route-based). Prefer importing from @/features/customers/hooks/use-customer-360.
 */
export function useCustomer360(customerId: string | null) {
  return useCustomer360Hook({ customerId });
}

export function useCustomersList(params: CustomersListParams = {}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  return useQuery<CustomersListResponse | null>({
    queryKey: ["customers", params],
    queryFn: async () => {
      try {
        return await apiGatewayClient.getCustomers(params);
      } catch (error: any) {
        // Log error but don't return null - let React Query handle errors properly
        console.error("Failed to fetch customers:", error);
        // Re-throw all errors so React Query can handle them properly
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute (optimized)
    refetchInterval: 60 * 1000, // Refetch every 60 seconds for customer list
    refetchIntervalInBackground: false, // Don't refetch in background
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useCustomerSearch(searchTerm: string) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  return useQuery<CustomersListResponse>({
    queryKey: ["customers", "search", searchTerm],
    queryFn: () =>
      apiGatewayClient.getCustomers({
        search: searchTerm,
        page: 1,
        page_size: 20,
      }),
    enabled:
      isAuthenticated &&
      tokenSynced &&
      !!session?.accessToken &&
      searchTerm.length >= 2, // Only search if at least 2 characters
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Enhanced customer search hook for autocomplete
export function useCustomerSearchAutocomplete(
  query: string,
  options?: {
    limit?: number;
    enabled?: boolean;
  }
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  const limit = options?.limit || 20;
  // Always require authentication, but allow options.enabled to control query length requirement
  const baseEnabled = isAuthenticated && tokenSynced && !!session?.accessToken;
  const trimmedQuery = query?.trim() || "";
  const queryEnabled = trimmedQuery.length >= 2;
  // Only enable if base conditions are met AND query is valid
  // If options.enabled is provided, it should already check query length, but we double-check here
  const enabled =
    baseEnabled &&
    queryEnabled &&
    (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: ["customers", "autocomplete", trimmedQuery, limit],
    queryFn: async () => {
      try {
        console.log(
          "[useCustomerSearchAutocomplete] Searching customers with query:",
          trimmedQuery
        );
        const result = await apiGatewayClient.searchCustomers({
          query: trimmedQuery,
          limit,
          offset: 0,
          sort_by: "created_at",
          sort_order: "desc",
        });
        console.log("[useCustomerSearchAutocomplete] Search result:", {
          query: trimmedQuery,
          resultsCount: result.results?.length || 0,
          total: result.total,
        });
        return result.results || [];
      } catch (error: any) {
        console.error(
          "[useCustomerSearchAutocomplete] Customer search autocomplete error:",
          error
        );
        return [];
      }
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry autocomplete queries
  });
}

export function useExportCustomers() {
  const { isAuthenticated } = useAuth();
  return useMutation<any, Error, { format?: string; limit?: number }>({
    mutationFn: async ({ format = "csv", limit = 1000 }) => {
      const data = await apiGatewayClient.exportCustomers(format, limit);
      return data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: async (customerData) => {
      const data = await apiGatewayClient.createCustomer(customerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { customerId: string; data: any }>({
    mutationFn: async ({ customerId, data }) => {
      const result = await apiGatewayClient.updateCustomer(customerId, data);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({
        queryKey: ["customer360", variables.customerId],
      });
    },
  });
}

export function useBulkActivateCustomers() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: async (customerIds) => {
      return await apiGatewayClient.bulkActivateCustomers(customerIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useBulkDeactivateCustomers() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: async (customerIds) => {
      return await apiGatewayClient.bulkDeactivateCustomers(customerIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useBulkDeleteCustomers() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: async (customerIds) => {
      return await apiGatewayClient.bulkDeleteCustomers(customerIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useBulkExportCustomers() {
  return useMutation<any, Error, { customerIds: string[]; format?: string }>({
    mutationFn: async ({ customerIds, format = "csv" }) => {
      return await apiGatewayClient.bulkExportCustomers(customerIds, format);
    },
  });
}

/**
 * Get Customer Notes
 */
export function useCustomerNotes(
  customerId: string | null,
  params?: { page?: number; page_size?: number }
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["customerNotes", customerId, params],
    queryFn: async () => {
      if (!customerId)
        return { items: [], total: 0, page: 1, page_size: 50, has_more: false };
      return await apiGatewayClient.getCustomerNotes(customerId, params);
    },
    enabled: !!customerId && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create Customer Note
 */
export function useCreateCustomerNote() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    {
      customerId: string;
      note: { content: string; type?: string; tags?: string[] };
    }
  >({
    mutationFn: async ({ customerId, note }) => {
      return await apiGatewayClient.createCustomerNote(customerId, note);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customerNotes", variables.customerId],
      });
    },
  });
}

/**
 * Update Customer Note
 */
export function useUpdateCustomerNote() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    {
      customerId: string;
      noteId: string;
      note: { content: string; type?: string; tags?: string[] };
    }
  >({
    mutationFn: async ({ customerId, noteId, note }) => {
      return await apiGatewayClient.updateCustomerNote(
        customerId,
        noteId,
        note
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customerNotes", variables.customerId],
      });
    },
  });
}

/**
 * Delete Customer Note
 */
export function useDeleteCustomerNote() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { customerId: string; noteId: string }>({
    mutationFn: async ({ customerId, noteId }) => {
      return await apiGatewayClient.deleteCustomerNote(customerId, noteId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customerNotes", variables.customerId],
      });
    },
  });
}

/**
 * Get Customer Activity Log
 */
export function useCustomerActivityLog(
  customerId: string | null,
  params?: { page?: number; page_size?: number; activity_type?: string }
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["customerActivityLog", customerId, params],
    queryFn: async () => {
      if (!customerId)
        return { items: [], total: 0, page: 1, page_size: 50, has_more: false };
      return await apiGatewayClient.getCustomerActivityLog(customerId, params);
    },
    enabled: !!customerId && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get Bulk Operation Status
 */
export function useBulkOperationStatus(operationId: string | null) {
  return useQuery({
    queryKey: ["bulkOperationStatus", operationId],
    queryFn: async () => {
      if (!operationId) return null;
      return await apiGatewayClient.getBulkOperationStatus(operationId);
    },
    enabled: !!operationId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if operation is in progress
      if (data?.status === "in_progress" || data?.status === "pending") {
        return 2000;
      }
      return false;
    },
  });
}
