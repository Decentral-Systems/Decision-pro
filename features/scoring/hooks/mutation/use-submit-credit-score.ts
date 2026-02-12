import { useMutation } from "@tanstack/react-query";
import { retryWithBackoff } from "@/lib/utils/retry";
import type { CreditScoreRequest, CreditScoreResponse } from "@/types/credit";
import { submitCreditScore } from "../../services/scoring.service";
import { toast } from "sonner";

export function useSubmitCreditScore() {
  const { mutateAsync: submitCreditScoreMutation, isPending } = useMutation<
    CreditScoreResponse,
    Error,
    CreditScoreRequest
  >({
    mutationFn: async (data: CreditScoreRequest) => {
      return retryWithBackoff(() => submitCreditScore(data), {
        maxRetries: 3,
        initialDelay: 1000,
      });
    },
    onSuccess: () => {
      toast.success("Credit score submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { submitCreditScoreMutation, isPending };
}
