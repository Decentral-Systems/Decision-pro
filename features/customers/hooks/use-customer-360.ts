import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { customersKeys } from "../constants/customers.keys";
import { getCustomer360 } from "../service/customers.service";

interface UseCustomer360Props {
  customerId: string | null;
}

export function useCustomer360({ customerId }: UseCustomer360Props) {
  const { isAuthenticated, accessToken } = useAuth();

  const query = useQuery<unknown>({
    queryKey: customersKeys.customer360(customerId ?? ""),
    queryFn: () => getCustomer360(customerId!),
    enabled:
      isAuthenticated && !!accessToken && !!customerId && customerId.trim() !== "",
  });

  return {
    data: (query.data ?? null) as unknown,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
