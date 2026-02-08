/**
 * React Query hooks for Product Intelligence
 */
import { useQuery } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import {
  ProductRecommendationsResponse,
  RecommendationStatistics,
  ProductRecommendation,
} from "@/types/product-intelligence";
import { useAuth } from "@/lib/auth/auth-context";
import { shouldEnableQuery } from "./useQueryEnabled";
import {
  normalizeResponseFormat,
  validateProductRecommendations,
  validateRecommendationStatistics,
} from "@/lib/utils/responseFormatValidator";

export function useProductRecommendations(
  customerId?: string,
  limit: number = 10
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<ProductRecommendationsResponse | null>({
    queryKey: ["product-recommendations", customerId, limit],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const rawData = await apiGatewayClient.getProductRecommendations(
          customerId,
          limit
        );

        // Handle both array and object with recommendations property
        let recommendationsArray: ProductRecommendation[] = [];
        if (Array.isArray(rawData)) {
          recommendationsArray = rawData;
        } else if (
          rawData &&
          typeof rawData === "object" &&
          "recommendations" in rawData
        ) {
          recommendationsArray = (rawData as any).recommendations || [];
        }

        // Normalize and validate recommendations (transforms to camelCase)
        const normalizedRecommendations = normalizeResponseFormat<
          ProductRecommendation[]
        >(recommendationsArray, validateProductRecommendations);

        // Return in expected format (camelCase)
        return {
          recommendations: normalizedRecommendations,
          statistics: {} as RecommendationStatistics,
          totalCount: normalizedRecommendations.length,
        } as ProductRecommendationsResponse;
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        const correlationId =
          error?.correlationId ||
          error?.response?.headers?.["x-correlation-id"];

        // Log error for debugging (only in development)
        if (
          typeof window !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          console.error("[ProductRecommendations] API Error:", {
            statusCode,
            correlationId,
            message: error?.message || "Unknown error",
            customerId,
            limit,
            error: error,
          });
        }

        // Return null for 404 (endpoint not found) to show empty state
        if (statusCode === 404) {
          return null;
        }

        // Re-throw other errors to trigger error state
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useRecommendationStats(dateParams?: {
  start_date: string;
  end_date: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<RecommendationStatistics | null>({
    queryKey: ["recommendation-stats", dateParams],
    enabled: shouldEnableQuery(isAuthenticated, session?.accessToken),
    queryFn: async () => {
      try {
        const rawData =
          await apiGatewayClient.getRecommendationStats(dateParams);
        // Normalize and validate response format (transforms to camelCase)
        const normalized = normalizeResponseFormat<RecommendationStatistics>(
          rawData,
          validateRecommendationStatistics
        );
        return normalized;
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        const correlationId =
          error?.correlationId ||
          error?.response?.headers?.["x-correlation-id"];

        // Log error for debugging (only in development)
        if (
          typeof window !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          console.error("[RecommendationStats] API Error:", {
            statusCode,
            correlationId,
            message: error?.message || "Unknown error",
            dateParams,
            error: error,
          });
        }

        // Return null for 404 (endpoint not found) to show empty state
        if (statusCode === 404) {
          return null;
        }

        // Re-throw other errors to trigger error state
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}
