/**
 * React Query hooks for Customer Communications
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  networkAwareRetry,
  networkAwareRetryDelay,
} from "@/lib/utils/network-aware-retry";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface CommunicationFilter {
  type?: "email" | "sms" | "all";
  status?: string;
  from_date?: string;
  to_date?: string;
}

export interface CustomerCommunication {
  id: string;
  customer_id: string;
  type: "email" | "sms";
  subject?: string;
  message: string;
  status: "sent" | "delivered" | "read" | "failed" | "pending";
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  sent_by?: string;
  sent_by_name?: string;
  template_id?: string;
  template_name?: string;
  scheduled_for?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: "email" | "sms";
  subject?: string;
  content: string;
  variables?: string[];
  category?: string;
}

export function useCustomerCommunications(
  customerId: string | undefined | null,
  filters?: CommunicationFilter
) {
  const { isAuthenticated } = useAuth();

  return useQuery<CustomerCommunication[]>({
    queryKey: ["customer-communications", customerId, filters],
    queryFn: async () => {
      if (!customerId) {
        return [];
      }
      try {
        const data = await apiGatewayClient.getCustomerCommunications(
          customerId,
          filters
        );
        return (
          data?.communications ||
          data?.items ||
          (Array.isArray(data) ? data : [])
        );
      } catch (error: any) {
        console.error("Failed to fetch customer communications:", error);
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useCommunicationTemplates(type?: "email" | "sms") {
  const { isAuthenticated } = useAuth();

  return useQuery<CommunicationTemplate[]>({
    queryKey: ["communication-templates", type],
    queryFn: async () => {
      try {
        const data = await apiGatewayClient.getCommunicationTemplates(type);
        return (
          data?.templates || data?.items || (Array.isArray(data) ? data : [])
        );
      } catch (error: any) {
        console.error("Failed to fetch communication templates:", error);
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSendCommunication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      type,
      subject,
      message,
      templateId,
      scheduledFor,
    }: {
      customerId: string;
      type: "email" | "sms";
      subject?: string;
      message: string;
      templateId?: string;
      scheduledFor?: string;
    }) => {
      return await apiGatewayClient.sendCustomerCommunication(customerId, {
        type,
        subject,
        message,
        template_id: templateId,
        scheduled_for: scheduledFor,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customer-communications", variables.customerId],
      });
      toast({
        title: "Communication Sent",
        description: variables.scheduledFor
          ? "Communication has been scheduled"
          : "Communication has been sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send communication",
        variant: "destructive",
      });
    },
  });
}
