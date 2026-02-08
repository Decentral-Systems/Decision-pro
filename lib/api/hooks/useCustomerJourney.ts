/**
 * React Query hooks for Customer Journey
 */
import { useQuery } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { LifeEventsResponse, TopCustomer } from "@/types/customer-intelligence";
import {
  CustomerJourneyInsights,
  CustomerJourneyTimelineItem,
  JourneyStatisticsFilters,
  JourneyTimelineFilters,
} from "@/types/customer-journey";
import { useAuth } from "@/lib/auth/auth-context";
import {
  normalizeResponseFormat,
  validateCustomerJourneyInsights,
} from "@/lib/utils/responseFormatValidator";

export function useCustomerJourneyInsights(filters?: JourneyStatisticsFilters) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<CustomerJourneyInsights | null>({
    queryKey: ["customer-journey-insights", filters],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const rawData =
          await apiGatewayClient.getCustomerJourneyInsights(filters);
        // Normalize and validate response format (transforms to camelCase)
        const normalized = normalizeResponseFormat<CustomerJourneyInsights>(
          rawData,
          validateCustomerJourneyInsights
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
          console.error("[CustomerJourney] API Error:", {
            statusCode,
            correlationId,
            message: error?.message || "Unknown error",
            filters,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useCustomerJourneyTimeline(
  customerId: string | undefined | null,
  filters?: JourneyTimelineFilters
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<CustomerJourneyTimelineItem[]>({
    queryKey: ["customer-journey-timeline", customerId, filters],
    queryFn: async () => {
      if (!customerId) {
        return [];
      }
      try {
        const data = await apiGatewayClient.getCustomerJourneyTimeline(
          customerId,
          filters
        );

        // Ensure data is properly transformed to CustomerJourneyTimelineItem[]
        if (Array.isArray(data)) {
          return data.map(
            (item: any) =>
              ({
                eventId:
                  item.eventId ||
                  item.event_id ||
                  item.id ||
                  String(item.timestamp),
                customerId: item.customerId || item.customer_id || customerId,
                userId: item.userId || item.user_id || null,
                sessionId: item.sessionId || item.session_id || null,
                stage: item.stage || "onboarding",
                subStage:
                  item.subStage ||
                  item.sub_stage ||
                  "onboarding.customer_created",
                action: item.action || "",
                channel: item.channel || "unknown",
                timestamp:
                  item.timestamp || item.created_at || new Date().toISOString(),
                context: item.context || {},
              }) as CustomerJourneyTimelineItem
          );
        }

        return [];
      } catch (error: any) {
        console.error("Error fetching journey timeline:", error);
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled:
      isAuthenticated && tokenSynced && !!session?.accessToken && !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for individual customer data)
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useLifeEvents(customerId?: string, limit: number = 20) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<LifeEventsResponse | null>({
    queryKey: ["life-events", customerId, limit],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getLifeEvents(customerId, limit);
        return data;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useTopCustomers(
  limit: number = 10,
  sortBy: "credit_score" | "revenue" | "loan_amount" = "credit_score"
) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<TopCustomer[]>({
    queryKey: ["top-customers", limit, sortBy],
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getTopCustomers(limit, sortBy);
        return data;
      } catch (error: any) {
        // Return empty array on error
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}
