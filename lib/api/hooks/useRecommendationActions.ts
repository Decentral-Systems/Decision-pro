/**
 * React Query hooks for recommendation actions
 * Handles apply, dismiss, feedback, and history operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useToast } from "@/hooks/use-toast";
import type {
  ApplyRecommendationResponse,
  DismissRecommendationResponse,
  SubmitFeedbackResponse,
  RecommendationHistoryResponse,
  UseRecommendationHistoryOptions,
} from "@/types/recommendations";

/**
 * Hook to apply a recommendation
 */
export function useApplyRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      recommendationId,
      customerId,
    }: {
      recommendationId: string | number;
      customerId: string;
    }) => {
      return await apiGatewayClient.applyRecommendation(recommendationId, customerId) as ApplyRecommendationResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch intelligence data and history
      queryClient.invalidateQueries({
        queryKey: ["customer-intelligence", variables.customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recommendationHistory", variables.customerId],
      });
      
      toast({
        title: "Recommendation Applied",
        description: "The recommendation has been successfully applied.",
      });
    },
    onError: (error: Error) => {
      // Extract user-friendly error message
      let errorMessage = "Failed to apply recommendation";
      
      if (error.message) {
        // Check for common error patterns and provide actionable messages
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "You are not authorized to apply this recommendation. Please refresh and try again.";
        } else if (error.message.includes("404") || error.message.includes("Not Found")) {
          errorMessage = "This recommendation is no longer available. It may have been removed or expired.";
        } else if (error.message.includes("409") || error.message.includes("Conflict")) {
          errorMessage = "This recommendation has already been applied or is in progress.";
        } else if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
          errorMessage = "A server error occurred. Please try again in a few moments.";
        } else if (error.message.includes("Network") || error.message.includes("timeout")) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Unable to Apply Recommendation",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Enhanced error logging with context
      console.error("[useApplyRecommendation] Error applying recommendation:", {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Hook to dismiss a recommendation
 */
export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      recommendationId,
      customerId,
      reason,
    }: {
      recommendationId: string | number;
      customerId: string;
      reason?: string;
    }) => {
      return await apiGatewayClient.dismissRecommendation(recommendationId, customerId, reason) as DismissRecommendationResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch intelligence data and history
      queryClient.invalidateQueries({
        queryKey: ["customer-intelligence", variables.customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recommendationHistory", variables.customerId],
      });
      
      toast({
        title: "Recommendation Dismissed",
        description: "The recommendation has been dismissed.",
      });
    },
    onError: (error: Error) => {
      // Extract user-friendly error message
      let errorMessage = "Failed to dismiss recommendation";
      
      if (error.message) {
        // Check for common error patterns and provide actionable messages
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "You are not authorized to dismiss this recommendation. Please refresh and try again.";
        } else if (error.message.includes("404") || error.message.includes("Not Found")) {
          errorMessage = "This recommendation is no longer available. It may have already been dismissed.";
        } else if (error.message.includes("409") || error.message.includes("Conflict")) {
          errorMessage = "This recommendation cannot be dismissed in its current state.";
        } else if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
          errorMessage = "A server error occurred. Please try again in a few moments.";
        } else if (error.message.includes("Network") || error.message.includes("timeout")) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Unable to Dismiss Recommendation",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Enhanced error logging with context
      console.error("[useDismissRecommendation] Error dismissing recommendation:", {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Hook to submit feedback on a recommendation
 */
export function useRecommendationFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      recommendationId,
      feedback,
      rating,
    }: {
      recommendationId: string | number;
      feedback: string;
      rating?: number;
    }) => {
      return await apiGatewayClient.submitRecommendationFeedback(recommendationId, {
        feedback,
        rating,
      }) as SubmitFeedbackResponse;
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback.",
      });
    },
    onError: (error: Error) => {
      // Extract user-friendly error message
      let errorMessage = "Failed to submit feedback";
      
      if (error.message) {
        // Check for common error patterns and provide actionable messages
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "You are not authorized to submit feedback. Please refresh and try again.";
        } else if (error.message.includes("404") || error.message.includes("Not Found")) {
          errorMessage = "This recommendation is no longer available. Feedback cannot be submitted.";
        } else if (error.message.includes("400") || error.message.includes("Bad Request")) {
          errorMessage = "Invalid feedback data. Please try again.";
        } else if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
          errorMessage = "A server error occurred. Please try again in a few moments.";
        } else if (error.message.includes("Network") || error.message.includes("timeout")) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Unable to Submit Feedback",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Enhanced error logging with context
      console.error("[useRecommendationFeedback] Error submitting feedback:", {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Hook to get recommendation history for a customer
 */
export function useRecommendationHistory(
  customerId: string | null,
  options?: UseRecommendationHistoryOptions
) {
  return useQuery<RecommendationHistoryResponse>({
    queryKey: [
      "recommendationHistory",
      customerId,
      options?.page,
      options?.page_size,
      options?.action,
    ],
    queryFn: async () => {
      if (!customerId) {
        throw new Error("Customer ID is required");
      }
      return await apiGatewayClient.getRecommendationHistory(customerId, {
        page: options?.page,
        page_size: options?.page_size,
        action: options?.action,
      }) as RecommendationHistoryResponse;
    },
    enabled: (options?.enabled !== false) && !!customerId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

