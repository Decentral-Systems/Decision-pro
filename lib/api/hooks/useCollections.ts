/**
 * React Query hooks for Collections Management
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface CollectionFilters {
  status?: string;
  stage?: string;
  loan_application_id?: number;
  assigned_collector?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface CollectionActionData {
  collection_id: string;
  action_type: string;
  contact_method?: string;
  contact_result?: string;
  notes?: string;
  next_action_date?: string;
  amount_collected?: number;
}

export interface EscalationData {
  new_stage: string;
  reason: string;
  assigned_collector?: string;
  notes?: string;
}

/**
 * Get collections with filters
 */
export function useCollections(filters?: CollectionFilters) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["collections", filters],
    queryFn: async () => {
      console.log("[useCollections] Fetching with filters:", filters);
      const result = await apiGatewayClient.getCollections(filters);
      console.log("[useCollections] API Response:", {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
      });
      return result;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get collection workflows
 */
export function useCollectionWorkflows(collectionId?: string) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["collectionWorkflows", collectionId],
    queryFn: async () => {
      if (!collectionId) return null;
      return await apiGatewayClient.getCollectionWorkflow(collectionId);
    },
    enabled: !!collectionId && isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Record collection action mutation
 */
export function useRecordCollectionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (actionData: CollectionActionData) => {
      return await apiGatewayClient.recordCollectionAction(actionData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collectionWorkflows", variables.collection_id] });
      queryClient.invalidateQueries({ queryKey: ["overdueLoans"] });
      toast({
        title: "Success",
        description: "Collection action recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record collection action",
        variant: "destructive",
      });
    },
  });
}

/**
 * Escalate collection mutation
 */
export function useEscalateCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      escalationData 
    }: { 
      collectionId: string; 
      escalationData: EscalationData;
    }) => {
      return await apiGatewayClient.escalateCollection(collectionId, escalationData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collectionWorkflows", variables.collectionId] });
      toast({
        title: "Success",
        description: "Collection escalated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to escalate collection",
        variant: "destructive",
      });
    },
  });
}

/**
 * Initiate collection workflow mutation
 */
export function useInitiateCollectionWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (loanApplicationId: number) => {
      return await apiGatewayClient.initiateCollectionWorkflow(loanApplicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["overdueLoans"] });
      toast({
        title: "Success",
        description: "Collection workflow initiated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate collection workflow",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get collection effectiveness analytics
 */
export function useCollectionEffectiveness(params?: {
  date_from?: string;
  date_to?: string;
  collector_id?: string;
  stage?: string;
}) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["collectionEffectiveness", params],
    queryFn: async () => {
      return await apiGatewayClient.getCollectionEffectiveness(params);
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get collection workload analytics
 */
export function useCollectionWorkload(params?: {
  date_from?: string;
  date_to?: string;
  collector_id?: string;
}) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["collectionWorkload", params],
    queryFn: async () => {
      return await apiGatewayClient.getCollectionWorkload(params);
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}