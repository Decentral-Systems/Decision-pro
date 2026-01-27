"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiGatewayClient } from "../clients/api-gateway";

// Types
export interface DisbursementFilters {
  status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface DisbursementConfirmationData {
  confirmation_code?: string;
  notes?: string;
}

// Query Keys
export const disbursementKeys = {
  all: ["disbursements"] as const,
  lists: () => [...disbursementKeys.all, "list"] as const,
  list: (filters?: DisbursementFilters) => [...disbursementKeys.lists(), filters] as const,
  details: () => [...disbursementKeys.all, "detail"] as const,
  detail: (id: string) => [...disbursementKeys.details(), id] as const,
};

// Hooks
export function useDisbursements(filters?: DisbursementFilters) {
  const { toast } = useToast();

  return useQuery({
    queryKey: disbursementKeys.list(filters),
    queryFn: async () => {
      const response = await apiGatewayClient.listDisbursements(filters);
      return response.data;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch disbursements",
        variant: "destructive",
      });
    },
  });
}

export function useDisbursement(disbursementId: string | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: disbursementKeys.detail(disbursementId || ""),
    queryFn: async () => {
      if (!disbursementId) return null;
      const response = await apiGatewayClient.getDisbursement(disbursementId);
      return response.data;
    },
    enabled: !!disbursementId,
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch disbursement",
        variant: "destructive",
      });
    },
  });
}

export function useCreateDisbursement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disbursementData: any) => {
      const response = await apiGatewayClient.createDisbursement(disbursementData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.lists() });
      toast({
        title: "Success",
        description: "Disbursement created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create disbursement",
        variant: "destructive",
      });
    },
  });
}

export function useProcessDisbursement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disbursementId: string) => {
      const response = await apiGatewayClient.processDisbursement(disbursementId);
      return response.data;
    },
    onSuccess: (_, disbursementId) => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disbursementKeys.detail(disbursementId) });
      toast({
        title: "Success",
        description: "Disbursement processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process disbursement",
        variant: "destructive",
      });
    },
  });
}

export function useConfirmDisbursement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      disbursementId,
      confirmationData,
    }: {
      disbursementId: string;
      confirmationData: DisbursementConfirmationData;
    }) => {
      const response = await apiGatewayClient.confirmDisbursement(disbursementId, confirmationData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disbursementKeys.detail(variables.disbursementId) });
      toast({
        title: "Success",
        description: "Disbursement confirmed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm disbursement",
        variant: "destructive",
      });
    },
  });
}

export function useRetryDisbursement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disbursementId: string) => {
      const response = await apiGatewayClient.retryDisbursement(disbursementId);
      return response.data;
    },
    onSuccess: (_, disbursementId) => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disbursementKeys.detail(disbursementId) });
      toast({
        title: "Success",
        description: "Disbursement retry initiated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to retry disbursement",
        variant: "destructive",
      });
    },
  });
}

export function useCancelDisbursement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ disbursementId, reason }: { disbursementId: string; reason: string }) => {
      const response = await apiGatewayClient.cancelDisbursement(disbursementId, reason);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disbursementKeys.detail(variables.disbursementId) });
      toast({
        title: "Success",
        description: "Disbursement cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel disbursement",
        variant: "destructive",
      });
    },
  });
}
