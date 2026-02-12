/**
 * React Query hooks for Credit Scoring
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { creditScoringClient } from "../clients/credit-scoring";
import {
  CreditScoreRequest,
  CreditScoreResponse,
  BatchCreditScoreResponse,
} from "@/types/credit";
import { retryWithBackoff } from "@/lib/utils/retry";

export function useCreditScore(customerId: string | null) {
  return useQuery<CreditScoreResponse>({
    queryKey: ["creditScore", customerId],
    queryFn: async () => {
      const result = await retryWithBackoff(
        () => creditScoringClient.submitCreditScore({} as CreditScoreRequest),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(
              `Retry attempt ${attempt} for credit score fetch:`,
              error
            );
          },
        }
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data!;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitCreditScore() {
  return useMutation<CreditScoreResponse, Error, CreditScoreRequest>({
    mutationFn: async (data: CreditScoreRequest) => {
      const result = await retryWithBackoff(
        () => creditScoringClient.submitCreditScore(data),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(
              `Retry attempt ${attempt} for credit score submission:`,
              error
            );
          },
        }
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data!;
    },
  });
}

export function useBatchCreditScore() {
  return useMutation<BatchCreditScoreResponse, Error, File>({
    mutationFn: async (file: File) => {
      const result = await retryWithBackoff(
        () => creditScoringClient.submitBatchCreditScoreFromFile(file),
        {
          maxRetries: 3,
          initialDelay: 2000, // Longer delay for batch operations
          onRetry: (attempt, error) => {
            console.log(
              `Retry attempt ${attempt} for batch credit score:`,
              error
            );
          },
        }
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data!;
    },
  });
}
