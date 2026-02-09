import { QueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: networkAwareRetry,
      retryDelay: networkAwareRetryDelay,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}
