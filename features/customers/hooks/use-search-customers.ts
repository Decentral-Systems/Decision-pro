import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { customersKeys } from "../constants/customers.keys";
import { searchCustomers } from "../service/customers.service";
import type { SearchCustomersParams } from "../types/customers.types";

interface UseSearchCustomersProps extends SearchCustomersParams {
  enabled?: boolean;
  staleTime?: number;
}

export function useSearchCustomers({
  query,
  limit = 20,
  offset = 0,
  sort_by = "created_at",
  sort_order = "desc",
  enabled = true,
  staleTime = 30 * 1000,
}: UseSearchCustomersProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const trimmedQuery = query?.trim() ?? "";
  const hasQuery = trimmedQuery.length >= 2;
  const isEnabled = !!isAuthenticated && !!accessToken && hasQuery && enabled;

  const queryResult = useQuery({
    queryKey: customersKeys.search(trimmedQuery, { limit, offset }),
    queryFn: () =>
      searchCustomers({
        query: trimmedQuery,
        limit,
        offset,
        sort_by,
        sort_order,
        accessToken: accessToken ?? undefined,
      }),
    enabled: isEnabled,
    staleTime,
    retry: false,
  });

  return {
    data: queryResult.data?.results ?? [],
    total: queryResult.data?.total ?? 0,
    limit: queryResult.data?.limit ?? limit,
    offset: queryResult.data?.offset ?? offset,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
