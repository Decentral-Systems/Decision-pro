/**
 * React Query hooks for Dynamic Pricing
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { creditScoringClient } from "../clients/credit-scoring";
import { PricingRequest, PricingResponse } from "@/types/pricing";

export function useCalculatePricing() {
  const queryClient = useQueryClient();
  return useMutation<PricingResponse, Error, PricingRequest>({
    mutationFn: async (data) => {
      // Use existing method from credit-scoring client
      const response = await creditScoringClient.calculateDynamicPricing({
        customer_id: data.customer_id,
        product_type: data.product_type,
        loan_amount: data.loan_amount,
        loan_term_months: data.loan_term_months,
      });
      
      // Transform response to PricingResponse format
      return response as PricingResponse;
    },
    onSuccess: (_, variables) => {
      // Invalidate pricing history for this customer
      if (variables.customer_id) {
        queryClient.invalidateQueries({ queryKey: ["pricing-history", variables.customer_id] });
      }
      // Invalidate analytics as pricing affects metrics
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}









