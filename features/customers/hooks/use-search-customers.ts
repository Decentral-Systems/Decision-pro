import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { customersKeys } from "../constants/customers.keys";
import { searchCustomers } from "../service/customers.service";
import type {
  CustomerSearchItem,
  SearchCustomersParams,
} from "../types/customers.types";

export interface UseSearchCustomersReturn {
  data: CustomerSearchItem[];
  total: number;
  limit: number;
  offset: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

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
      }),
    enabled: isEnabled,
    staleTime,
    retry: false,
  });

  const data: CustomerSearchItem[] = queryResult.data?.results ?? [];

  return {
    data,
    total: queryResult.data?.total ?? 0,
    limit: queryResult.data?.limit ?? limit,
    offset: queryResult.data?.offset ?? offset,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error as Error | null,
    refetch: queryResult.refetch,
  } satisfies UseSearchCustomersReturn;
}
