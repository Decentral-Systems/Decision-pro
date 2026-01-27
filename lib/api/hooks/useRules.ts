/**
 * React Query hooks for Rules Engine
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creditScoringClient } from "../clients/credit-scoring";
import {
  CustomProductRule,
  CustomProductRuleRequest,
  WorkflowRule,
  WorkflowRuleRequest,
  RiskAppetiteConfig,
  RiskAppetiteConfigRequest,
  ApprovalWorkflowRule,
  ApprovalWorkflowRuleRequest,
  RuleEvaluationRequest,
  WorkflowEvaluationRequest,
  RulesListResponse,
  RuleVersionHistory,
} from "@/types/rules";
import { useAuth } from "@/lib/auth/auth-context";

// Custom Product Rules Hooks
export function useCustomProductRules(params?: {
  product_type?: string;
  evaluation_scope?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<RulesListResponse<CustomProductRule>>({
    queryKey: ["custom-product-rules", params],
    queryFn: async () => {
      const data = await creditScoringClient.getCustomProductRules(params);
      return data;
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useCustomProductRule(ruleId: number) {
  const { isAuthenticated, tokenSynced, session } = useAuth();

  return useQuery<CustomProductRule>({
    queryKey: ["custom-product-rule", ruleId],
    queryFn: async () => {
      const data = await creditScoringClient.getCustomProductRule(ruleId);
      return data;
    },
    enabled: isAuthenticated && tokenSynced && !!ruleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCustomProductRule() {
  const queryClient = useQueryClient();

  return useMutation<CustomProductRule, Error, CustomProductRuleRequest>({
    mutationFn: async (rule) => {
      return await creditScoringClient.createCustomProductRule(rule);
    },
    onMutate: async (newRule) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["custom-product-rules"] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData<RulesListResponse<CustomProductRule>>(["custom-product-rules"]);
      
      // Optimistically update
      if (previous) {
        const optimisticRule: CustomProductRule = {
          ...newRule as any,
          id: Date.now(), // Temporary ID
          evaluation_count: 0,
          match_count: 0,
          action_execution_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<RulesListResponse<CustomProductRule>>(["custom-product-rules"], {
          ...previous,
          rules: [...(previous.rules || []), optimisticRule],
          total: (previous.total || 0) + 1,
        });
      }
      
      return { previous };
    },
    onError: (err, newRule, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["custom-product-rules"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-product-rules"] });
    },
  });
}

export function useUpdateCustomProductRule() {
  const queryClient = useQueryClient();

  return useMutation<CustomProductRule, Error, { ruleId: number; rule: CustomProductRuleRequest }>({
    mutationFn: async ({ ruleId, rule }) => {
      return await creditScoringClient.updateCustomProductRule(ruleId, rule);
    },
    onMutate: async ({ ruleId, rule }) => {
      await queryClient.cancelQueries({ queryKey: ["custom-product-rules"] });
      await queryClient.cancelQueries({ queryKey: ["custom-product-rule", ruleId] });
      
      const previous = queryClient.getQueryData<RulesListResponse<CustomProductRule>>(["custom-product-rules"]);
      const previousRule = queryClient.getQueryData<CustomProductRule>(["custom-product-rule", ruleId]);
      
      // Optimistically update
      if (previous) {
        queryClient.setQueryData<RulesListResponse<CustomProductRule>>(["custom-product-rules"], {
          ...previous,
          rules: previous.rules?.map((r) => 
            r.id === ruleId ? { ...r, ...rule, updated_at: new Date().toISOString() } : r
          ) || [],
        });
      }
      
      if (previousRule) {
        queryClient.setQueryData<CustomProductRule>(["custom-product-rule", ruleId], {
          ...previousRule,
          ...rule,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previous, previousRule };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["custom-product-rules"], context.previous);
      }
      if (context?.previousRule) {
        queryClient.setQueryData(["custom-product-rule", variables.ruleId], context.previousRule);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["custom-product-rules"] });
      queryClient.invalidateQueries({ queryKey: ["custom-product-rule", variables.ruleId] });
    },
  });
}

export function useDeleteCustomProductRule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (ruleId) => {
      await creditScoringClient.deleteCustomProductRule(ruleId);
    },
    onMutate: async (ruleId) => {
      await queryClient.cancelQueries({ queryKey: ["custom-product-rules"] });
      
      const previous = queryClient.getQueryData<RulesListResponse<CustomProductRule>>(["custom-product-rules"]);
      
      // Optimistically remove
      if (previous) {
        queryClient.setQueryData<RulesListResponse<CustomProductRule>>(["custom-product-rules"], {
          ...previous,
          rules: previous.rules?.filter((r) => r.id !== ruleId) || [],
          total: Math.max(0, (previous.total || 0) - 1),
        });
      }
      
      return { previous };
    },
    onError: (err, ruleId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["custom-product-rules"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-product-rules"] });
    },
  });
}

export function useBulkDeleteProductRules() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number[]>({
    mutationFn: async (ruleIds) => {
      return await creditScoringClient.bulkDeleteProductRules(ruleIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-product-rules"] });
    },
  });
}

export function useBulkToggleProductRulesActive() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { ruleIds: number[]; isActive: boolean }>({
    mutationFn: async ({ ruleIds, isActive }) => {
      return await creditScoringClient.bulkToggleProductRulesActive(ruleIds, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-product-rules"] });
    },
  });
}

export function useEvaluateRules() {
  return useMutation<any, Error, RuleEvaluationRequest>({
    mutationFn: async (request) => {
      return await creditScoringClient.evaluateRules(request);
    },
  });
}

// Workflow Automation Rules Hooks
export function useWorkflowRules(params?: {
  rule_type?: string;
  product_type?: string;
  customer_segment?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<RulesListResponse<WorkflowRule>>({
    queryKey: ["workflow-rules", params],
    queryFn: async () => {
      const data = await creditScoringClient.getWorkflowRules(params);
      return data;
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useWorkflowRule(ruleId: number) {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<WorkflowRule>({
    queryKey: ["workflow-rule", ruleId],
    queryFn: async () => {
      const data = await creditScoringClient.getWorkflowRule(ruleId);
      return data;
    },
    enabled: isAuthenticated && tokenSynced && !!ruleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkflowRule() {
  const queryClient = useQueryClient();

  return useMutation<WorkflowRule, Error, WorkflowRuleRequest>({
    mutationFn: async (rule) => {
      return await creditScoringClient.createWorkflowRule(rule);
    },
    onMutate: async (newRule) => {
      await queryClient.cancelQueries({ queryKey: ["workflow-rules"] });
      
      const previous = queryClient.getQueryData<RulesListResponse<WorkflowRule>>(["workflow-rules"]);
      
      if (previous) {
        const optimisticRule: WorkflowRule = {
          ...newRule as any,
          id: Date.now(),
          execution_count: 0,
          success_count: 0,
          failure_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<RulesListResponse<WorkflowRule>>(["workflow-rules"], {
          ...previous,
          rules: [...(previous.rules || []), optimisticRule],
          total: (previous.total || 0) + 1,
        });
      }
      
      return { previous };
    },
    onError: (err, newRule, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["workflow-rules"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
    },
  });
}

export function useUpdateWorkflowRule() {
  const queryClient = useQueryClient();

  return useMutation<WorkflowRule, Error, { ruleId: number; rule: WorkflowRuleRequest }>({
    mutationFn: async ({ ruleId, rule }) => {
      return await creditScoringClient.updateWorkflowRule(ruleId, rule);
    },
    onMutate: async ({ ruleId, rule }) => {
      await queryClient.cancelQueries({ queryKey: ["workflow-rules"] });
      await queryClient.cancelQueries({ queryKey: ["workflow-rule", ruleId] });
      
      const previous = queryClient.getQueryData<RulesListResponse<WorkflowRule>>(["workflow-rules"]);
      const previousRule = queryClient.getQueryData<WorkflowRule>(["workflow-rule", ruleId]);
      
      if (previous) {
        queryClient.setQueryData<RulesListResponse<WorkflowRule>>(["workflow-rules"], {
          ...previous,
          rules: previous.rules?.map((r) => 
            r.id === ruleId ? { ...r, ...rule, updated_at: new Date().toISOString() } : r
          ) || [],
        });
      }
      
      if (previousRule) {
        queryClient.setQueryData<WorkflowRule>(["workflow-rule", ruleId], {
          ...previousRule,
          ...rule,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previous, previousRule };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["workflow-rules"], context.previous);
      }
      if (context?.previousRule) {
        queryClient.setQueryData(["workflow-rule", variables.ruleId], context.previousRule);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-rule", variables.ruleId] });
    },
  });
}

export function useDeleteWorkflowRule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (ruleId) => {
      await creditScoringClient.deleteWorkflowRule(ruleId);
    },
    onMutate: async (ruleId) => {
      await queryClient.cancelQueries({ queryKey: ["workflow-rules"] });
      
      const previous = queryClient.getQueryData<RulesListResponse<WorkflowRule>>(["workflow-rules"]);
      
      if (previous) {
        queryClient.setQueryData<RulesListResponse<WorkflowRule>>(["workflow-rules"], {
          ...previous,
          rules: previous.rules?.filter((r) => r.id !== ruleId) || [],
          total: Math.max(0, (previous.total || 0) - 1),
        });
      }
      
      return { previous };
    },
    onError: (err, ruleId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["workflow-rules"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
    },
  });
}

export function useBulkDeleteWorkflowRules() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number[]>({
    mutationFn: async (ruleIds) => {
      return await creditScoringClient.bulkDeleteWorkflowRules(ruleIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
    },
  });
}

export function useBulkToggleWorkflowRulesActive() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { ruleIds: number[]; isActive: boolean }>({
    mutationFn: async ({ ruleIds, isActive }) => {
      return await creditScoringClient.bulkToggleWorkflowRulesActive(ruleIds, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
    },
  });
}

export function useEvaluateWorkflow() {
  return useMutation<any, Error, WorkflowEvaluationRequest>({
    mutationFn: async (request) => {
      return await creditScoringClient.evaluateWorkflow(request);
    },
  });
}

// Risk Appetite Configuration Hooks
export function useRiskAppetiteConfigs(params?: {
  config_type?: string;
  product_type?: string;
  customer_segment?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<RulesListResponse<RiskAppetiteConfig>>({
    queryKey: ["risk-appetite-configs", params],
    queryFn: async () => {
      const data = await creditScoringClient.getRiskAppetiteConfigs(params);
      return data;
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useRiskAppetiteConfig(configId: number) {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<RiskAppetiteConfig>({
    queryKey: ["risk-appetite-config", configId],
    queryFn: async () => {
      const data = await creditScoringClient.getRiskAppetiteConfig(configId);
      return data;
    },
    enabled: isAuthenticated && tokenSynced && !!configId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRiskAppetiteConfig() {
  const queryClient = useQueryClient();

  return useMutation<RiskAppetiteConfig, Error, RiskAppetiteConfigRequest>({
    mutationFn: async (config) => {
      return await creditScoringClient.createRiskAppetiteConfig(config);
    },
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ["risk-appetite-configs"] });
      
      const previous = queryClient.getQueryData<RulesListResponse<RiskAppetiteConfig>>(["risk-appetite-configs"]);
      
      if (previous) {
        const optimisticConfig: RiskAppetiteConfig = {
          ...newConfig as any,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<RulesListResponse<RiskAppetiteConfig>>(["risk-appetite-configs"], {
          ...previous,
          configs: [...(previous.configs || []), optimisticConfig],
          total: (previous.total || 0) + 1,
        });
      }
      
      return { previous };
    },
    onError: (err, newConfig, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["risk-appetite-configs"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-appetite-configs"] });
    },
  });
}

export function useUpdateRiskAppetiteConfig() {
  const queryClient = useQueryClient();

  return useMutation<RiskAppetiteConfig, Error, { configId: number; config: RiskAppetiteConfigRequest }>({
    mutationFn: async ({ configId, config }) => {
      return await creditScoringClient.updateRiskAppetiteConfig(configId, config);
    },
    onMutate: async ({ configId, config }) => {
      await queryClient.cancelQueries({ queryKey: ["risk-appetite-configs"] });
      await queryClient.cancelQueries({ queryKey: ["risk-appetite-config", configId] });
      
      const previous = queryClient.getQueryData<RulesListResponse<RiskAppetiteConfig>>(["risk-appetite-configs"]);
      const previousConfig = queryClient.getQueryData<RiskAppetiteConfig>(["risk-appetite-config", configId]);
      
      if (previous) {
        queryClient.setQueryData<RulesListResponse<RiskAppetiteConfig>>(["risk-appetite-configs"], {
          ...previous,
          configs: previous.configs?.map((c) => 
            c.id === configId ? { ...c, ...config, updated_at: new Date().toISOString() } : c
          ) || [],
        });
      }
      
      if (previousConfig) {
        queryClient.setQueryData<RiskAppetiteConfig>(["risk-appetite-config", configId], {
          ...previousConfig,
          ...config,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previous, previousConfig };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["risk-appetite-configs"], context.previous);
      }
      if (context?.previousConfig) {
        queryClient.setQueryData(["risk-appetite-config", variables.configId], context.previousConfig);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["risk-appetite-configs"] });
      queryClient.invalidateQueries({ queryKey: ["risk-appetite-config", variables.configId] });
    },
  });
}

export function useDeleteRiskAppetiteConfig() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (configId) => {
      await creditScoringClient.deleteRiskAppetiteConfig(configId);
    },
    onMutate: async (configId) => {
      await queryClient.cancelQueries({ queryKey: ["risk-appetite-configs"] });
      
      const previous = queryClient.getQueryData<RulesListResponse<RiskAppetiteConfig>>(["risk-appetite-configs"]);
      
      if (previous) {
        queryClient.setQueryData<RulesListResponse<RiskAppetiteConfig>>(["risk-appetite-configs"], {
          ...previous,
          configs: previous.configs?.filter((c) => c.id !== configId) || [],
          total: Math.max(0, (previous.total || 0) - 1),
        });
      }
      
      return { previous };
    },
    onError: (err, configId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["risk-appetite-configs"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-appetite-configs"] });
    },
  });
}

export function useBulkDeleteRiskAppetiteConfigs() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number[]>({
    mutationFn: async (configIds) => {
      return await creditScoringClient.bulkDeleteRiskAppetiteConfigs(configIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-appetite-configs"] });
    },
  });
}

export function useBulkToggleRiskAppetiteConfigsActive() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { configIds: number[]; isActive: boolean }>({
    mutationFn: async ({ configIds, isActive }) => {
      return await creditScoringClient.bulkToggleRiskAppetiteConfigsActive(configIds, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-appetite-configs"] });
    },
  });
}

// Approval Workflow Rules Hooks
// Rule Versioning Hooks
export function useRuleVersionHistory(
  ruleId: number,
  ruleType: "product" | "workflow" | "risk"
) {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<RuleVersionHistory>({
    queryKey: ["rule-version-history", ruleId, ruleType],
    queryFn: async () => {
      return await creditScoringClient.getRuleVersionHistory(ruleId, ruleType);
    },
    enabled: isAuthenticated && tokenSynced && !!ruleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRollbackRuleVersion() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { ruleId: number; ruleType: "product" | "workflow" | "risk"; version: number }>({
    mutationFn: async ({ ruleId, ruleType, version }) => {
      return await creditScoringClient.rollbackRuleVersion(ruleId, ruleType, version);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      if (variables.ruleType === "product") {
        queryClient.invalidateQueries({ queryKey: ["custom-product-rules"] });
        queryClient.invalidateQueries({ queryKey: ["custom-product-rule", variables.ruleId] });
      } else if (variables.ruleType === "workflow") {
        queryClient.invalidateQueries({ queryKey: ["workflow-rules"] });
        queryClient.invalidateQueries({ queryKey: ["workflow-rule", variables.ruleId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["risk-appetite-configs"] });
        queryClient.invalidateQueries({ queryKey: ["risk-appetite-config", variables.ruleId] });
      }
      queryClient.invalidateQueries({ queryKey: ["rule-version-history", variables.ruleId, variables.ruleType] });
    },
  });
}

export function useApprovalWorkflowRules() {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<ApprovalWorkflowRule>({
    queryKey: ["approval-workflow-rules"],
    queryFn: async () => {
      const data = await creditScoringClient.getApprovalWorkflowRules();
      return data;
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateApprovalWorkflowRules() {
  const queryClient = useQueryClient();

  return useMutation<ApprovalWorkflowRule, Error, ApprovalWorkflowRuleRequest>({
    mutationFn: async (rules) => {
      return await creditScoringClient.updateApprovalWorkflowRules(rules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflow-rules"] });
    },
  });
}

// Execution Logs
export function useExecutionLogs(params?: {
  rule_type?: "product" | "workflow" | "risk" | "all";
  rule_id?: number;
  status?: "success" | "failure" | "partial" | "all";
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const { isAuthenticated, tokenSynced } = useAuth();

  return useQuery<ExecutionLog[]>({
    queryKey: ["execution-logs", params],
    queryFn: async () => {
      const data = await creditScoringClient.getExecutionLogs(params);
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.logs && Array.isArray(data.logs)) {
        return data.logs;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
    enabled: isAuthenticated && tokenSynced,
    staleTime: 30 * 1000, // 30 seconds (logs are frequently updated)
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

