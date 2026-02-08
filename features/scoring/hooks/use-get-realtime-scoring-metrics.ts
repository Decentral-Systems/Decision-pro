import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry-standalone";
import { scoringKeys } from "../constants/scoring.keys";
import { getRealtimeScoringMetrics } from "../services/scoring.service";
import type { RealtimeScoringMetrics } from "../types/scoring.type";

export function useGetRealtimeScoringMetrics() {
  const { isAuthenticated, accessToken } = useAuth();

  return useQuery<RealtimeScoringMetrics>({
    queryKey: scoringKeys.realtimeScoringMetrics(),
    queryFn: getRealtimeScoringMetrics,
    enabled: isAuthenticated && !!accessToken,
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
    refetchInterval: 3000,
    staleTime: 0,
  });
}
