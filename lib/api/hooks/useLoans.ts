/**
 * React Query hooks for Loan Management
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";

export interface LoanApplicationParams {
  limit?: number;
  offset?: number;
  status?: string;
  loan_type?: string;
  customer_id?: string;
  customer_name?: string;
  application_number?: string;
  date_from?: string;
  date_to?: string;
  approval_date_from?: string;
  approval_date_to?: string;
  min_amount?: number;
  max_amount?: number;
  min_credit_score?: number;
  max_credit_score?: number;
}

/**
 * Get loan application by ID
 */
export function useLoanApplication(applicationId: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["loanApplication", applicationId],
    queryFn: async () => {
      if (!applicationId) {
        console.warn("[useLoanApplication] No application ID provided");
        return null;
      }
      console.log("[useLoanApplication] Fetching application:", applicationId);
      const result = await apiGatewayClient.getLoanApplication(applicationId);
      const resultString = result ? JSON.stringify(result, null, 2) : 'null';
      console.log("[useLoanApplication] API Response:", {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        resultStructure: resultString ? resultString.substring(0, 500) : 'null',
      });
      return result;
    },
    enabled: !!applicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get loan application status history
 */
export function useLoanApplicationStatusHistory(applicationId: number | null, limit: number = 100) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["loanApplicationStatusHistory", applicationId, limit],
    queryFn: async () => {
      if (!applicationId) return null;
      return await apiGatewayClient.getLoanApplicationStatusHistory(applicationId, limit);
    },
    enabled: !!applicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * List loan applications
 */
export function useLoanApplications(params: LoanApplicationParams = {}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["loanApplications", params],
    queryFn: async () => {
      console.log("[useLoanApplications] Fetching with params:", params);
      const result = await apiGatewayClient.listLoanApplications(params);
      const resultString = result ? JSON.stringify(result, null, 2) : 'null';
      console.log("[useLoanApplications] API Response:", {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultStructure: resultString ? resultString.substring(0, 500) : 'null',
      });
      return result;
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Create loan application mutation
 */
export function useCreateLoanApplication() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (applicationData: any) => {
      return await apiGatewayClient.createLoanApplication(applicationData);
    },
    onSuccess: (data) => {
      // Invalidate all loan application queries (with any params)
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      // Also invalidate pending approvals since new applications might need approval
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      // Invalidate approval workflows
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflow"] });
      
      console.log("[useCreateLoanApplication] Query invalidation completed", {
        applicationId: data?.data?.id || data?.data?.application_id || data?.id,
        applicationNumber: data?.data?.application_number || data?.application_number
      });
      
      toast({
        title: "Success",
        description: "Loan application created successfully",
      });
    },
    onError: (error: any) => {
      console.error("[useCreateLoanApplication] Error creating application:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create loan application",
        variant: "destructive",
      });
    },
  });
}

/**
 * Validate NBE compliance (standalone - for real-time validation)
 */
export function useValidateNBEComplianceStandalone() {
  return useMutation({
    mutationFn: async (validationData: {
      loan_amount: number;
      monthly_income: number;
      loan_term_months: number;
      interest_rate?: number;
      monthly_debt_service?: number;
    }) => {
      return await apiGatewayClient.validateNBEComplianceStandalone(validationData);
    },
  });
}

/**
 * Validate NBE compliance
 */
export function useValidateNBECompliance() {
  return useMutation({
    mutationFn: async ({ applicationId, validationData }: { applicationId: number; validationData: any }) => {
      return await apiGatewayClient.validateNBECompliance(applicationId, validationData);
    },
  });
}

/**
 * Evaluate Product Rules
 */
export function useEvaluateProductRules() {
  return useMutation({
    mutationFn: async (request: {
      product_type: string;
      application_data: any;
      evaluation_scope?: string;
    }) => {
      return await apiGatewayClient.evaluateProductRules(request);
    },
  });
}

/**
 * Evaluate Workflow Rules
 */
export function useEvaluateWorkflowRules() {
  return useMutation({
    mutationFn: async (request: {
      application_data: any;
      product_type: string;
      customer_segment?: string;
    }) => {
      return await apiGatewayClient.evaluateWorkflowRules(request);
    },
  });
}

/**
 * Predict Default Risk
 */
export function usePredictDefaultRisk() {
  return useMutation({
    mutationFn: async (predictionData: {
      customer_id: string;
      loan_amount: number;
      loan_term_months: number;
      monthly_income: number;
      employment_years?: number;
      credit_score?: number;
      age?: number;
      existing_loans?: number;
      total_debt?: number;
      payment_history_score?: number;
    }) => {
      return await apiGatewayClient.predictDefaultRisk(predictionData);
    },
  });
}

/**
 * Get pending approvals
 */
export function usePendingApprovals(params?: { limit?: number; offset?: number }) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["pendingApprovals", params],
    queryFn: async () => {
      console.log("[usePendingApprovals] Fetching with params:", params);
      const result = await apiGatewayClient.getPendingApprovals(params);
      const resultString = result ? JSON.stringify(result, null, 2) : 'null';
      console.log("[usePendingApprovals] API Response:", {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        resultStructure: resultString ? resultString.substring(0, 500) : 'null',
      });
      return result;
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Approve loan application mutation
 */
export function useApproveLoanApplication() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async ({ workflowId, decisionData }: { workflowId: string; decisionData: any }) => {
      return await apiGatewayClient.approveLoanApplication(workflowId, decisionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflow"] });
      queryClient.invalidateQueries({ queryKey: ["approvalHistory"] });
      // Toast message is shown in the handler for more specific messaging
    },
    onError: (error: any) => {
      console.error("[useApproveLoanApplication] Error:", error);
      let errorMessage = "Failed to approve loan application";
      
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout') || error?.response?.status === 408) {
        errorMessage = "Approval process timed out. This may be due to complex processing. Please check the approval status and try again if needed.";
      } else if (error?.message?.includes('Network') || error?.code === 'ERR_NETWORK') {
        errorMessage = "Network error occurred during approval. Please check your connection and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.detail) {
        // Handle FastAPI validation errors
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // Validation errors array
          errorMessage = detail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
        } else if (detail?.message) {
          errorMessage = detail.message;
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Approval Error",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Show longer for timeout errors
      });
    },
  });
}

/**
 * Reject loan application mutation
 */
export function useRejectLoanApplication() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async ({ workflowId, decisionData }: { workflowId: string; decisionData: any }) => {
      return await apiGatewayClient.rejectLoanApplication(workflowId, decisionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflow"] });
      queryClient.invalidateQueries({ queryKey: ["approvalHistory"] });
      // Toast message is shown in the handler for more specific messaging
    },
    onError: (error: any) => {
      console.error("[useRejectLoanApplication] Error:", error);
      let errorMessage = "Failed to reject loan application";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.detail) {
        // Handle FastAPI validation errors
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // Validation errors array
          errorMessage = detail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
        } else if (detail?.message) {
          errorMessage = detail.message;
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Get approval workflow
 */
export function useApprovalWorkflow(workflowId: string | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["approvalWorkflow", workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      return await apiGatewayClient.getApprovalWorkflowByWorkflowId(workflowId);
    },
    enabled: !!workflowId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get approval workflow by loan application ID
 */
export function useApprovalWorkflowByApplication(loanApplicationId: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["approvalWorkflowByApplication", loanApplicationId],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getApprovalWorkflowByLoanApplicationId(loanApplicationId);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get disbursements for loan application
 */
export function useLoanDisbursements(loanApplicationId: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["loanDisbursements", loanApplicationId],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getLoanDisbursements(loanApplicationId);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get repayment schedule for loan application
 */
export function useLoanRepaymentSchedule(loanApplicationId: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["loanRepaymentSchedule", loanApplicationId],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getLoanRepaymentSchedule(loanApplicationId);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get credit score history for loan application
 */
export function useCreditScoreHistory(loanApplicationId: number | null, limit: number = 50) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["creditScoreHistory", loanApplicationId, limit],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getCreditScoreHistory(loanApplicationId, limit);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update loan application status mutation
 */
export function useUpdateLoanApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      newStatus, 
      reason 
    }: { 
      applicationId: number; 
      newStatus: string; 
      reason?: string;
    }) => {
      return await apiGatewayClient.updateLoanApplicationStatus(applicationId, newStatus, reason);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["loanApplication", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      queryClient.invalidateQueries({ queryKey: ["loanApplicationStatusHistory", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      
      toast({
        title: "Success",
        description: `Loan application status updated to ${variables.newStatus}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update loan application status",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get approval history
 */
export function useApprovalHistory(workflowId: string | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["approvalHistory", workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      return await apiGatewayClient.getApprovalHistory(workflowId);
    },
    enabled: !!workflowId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Bulk approve/reject applications mutation
 */
export function useBulkApproveApplications() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (bulkData: {
      application_ids: number[];
      decision: "approved" | "rejected";
      decision_reason: string;
      notes?: string;
    }) => {
      return await apiGatewayClient.bulkApproveApplications(bulkData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      toast({
        title: "Bulk Operation Complete",
        description: `${data?.data?.successful || 0} successful, ${data?.data?.failed || 0} failed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk approval",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get repayment schedule
 */
export function useRepaymentSchedule(loanApplicationId: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["repaymentSchedule", loanApplicationId],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getRepaymentSchedule(loanApplicationId);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Add conditional approval requirements
 */
export function useAddConditionalApproval() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async ({
      workflowId,
      conditions
    }: {
      workflowId: string;
      conditions: Array<{
        id?: string;
        type: string;
        value: string;
        description: string;
        met?: boolean;
      }>;
    }) => {
      return await apiGatewayClient.addConditionalApproval(workflowId, conditions);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflow", variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      toast({
        title: "Success",
        description: "Conditional approval requirements added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add conditional approval",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mark condition as met
 */
export function useMarkConditionMet() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async ({
      workflowId,
      conditionId
    }: {
      workflowId: string;
      conditionId: string;
    }) => {
      return await apiGatewayClient.markConditionMet(workflowId, conditionId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflow", variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      toast({
        title: "Success",
        description: "Condition marked as met",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark condition as met",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get approval analytics
 */
export function useApprovalAnalytics(params?: {
  date_from?: string;
  date_to?: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["approvalAnalytics", params],
    queryFn: async () => {
      return await apiGatewayClient.getApprovalAnalytics(params);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get payment history
 */
export function usePaymentHistory(loanApplicationId: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["paymentHistory", loanApplicationId],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getPaymentHistory(loanApplicationId);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Record payment mutation
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiGatewayClient.recordPayment(paymentData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["paymentHistory", variables.loan_application_id] });
      queryClient.invalidateQueries({ queryKey: ["repaymentSchedule", variables.loan_application_id] });
      queryClient.invalidateQueries({ queryKey: ["loanApplication", variables.loan_application_id] });
      queryClient.invalidateQueries({ queryKey: ["overdueLoans"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get overdue loans
 */
export function useOverdueLoans(params?: {
  days_overdue_min?: number;
  days_overdue_max?: number;
  limit?: number;
  offset?: number;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["overdueLoans", params],
    queryFn: async () => {
      return await apiGatewayClient.getOverdueLoans(params);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Modify Repayment Schedule
 */
export function useModifyRepaymentSchedule() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async ({ scheduleId, modifications }: { scheduleId: string; modifications: any }) => {
      return await apiGatewayClient.modifyRepaymentSchedule(scheduleId, modifications);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["repaymentSchedule"] });
      toast({
        title: "Success",
        description: "Repayment schedule modified successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to modify repayment schedule",
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
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (loanApplicationId: number) => {
      return await apiGatewayClient.initiateCollectionWorkflow(loanApplicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overdueLoans"] });
      queryClient.invalidateQueries({ queryKey: ["collectionWorkflows"] });
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
 * Record collection action mutation
 */
export function useRecordCollectionAction() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (actionData: any) => {
      return await apiGatewayClient.recordCollectionAction(actionData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collectionWorkflows"] });
      queryClient.invalidateQueries({ queryKey: ["collectionWorkflow", variables.collection_id] });
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
 * Get Collection Workflow
 */
export function useCollectionWorkflow(collectionId: string | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["collectionWorkflow", collectionId],
    queryFn: async () => {
      if (!collectionId) return null;
      return await apiGatewayClient.getCollectionWorkflow(collectionId);
    },
    enabled: !!collectionId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get Portfolio Overview
 */
export function usePortfolioOverview(params?: {
  date_from?: string;
  date_to?: string;
  loan_type?: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["portfolioOverview", params],
    queryFn: async () => {
      return await apiGatewayClient.getPortfolioOverview(params);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get Product Performance
 */
export function useProductPerformance(params?: {
  product_type?: string;
  date_from?: string;
  date_to?: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["productPerformance", params],
    queryFn: async () => {
      return await apiGatewayClient.getProductPerformance(params);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Generate NBE Compliance Report
 */
export function useGenerateNBEComplianceReport() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (params: {
      period_start: string;
      period_end: string;
    }) => {
      return await apiGatewayClient.generateNBEComplianceReport(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolioOverview"] });
      toast({
        title: "Success",
        description: "NBE compliance report generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate NBE compliance report",
        variant: "destructive",
      });
    },
  });
}

/**
 * List Loan Documents
 */
export function useLoanDocuments(loanApplicationId: number | null, documentType?: string) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["loanDocuments", loanApplicationId, documentType],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.listLoanDocuments(loanApplicationId, documentType);
    },
    enabled: !!loanApplicationId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Upload Loan Document
 */
export function useUploadLoanDocument() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (params: {
      loanApplicationId: number;
      file: File;
      documentType: string;
      documentName: string;
      hasExpiry?: boolean;
      expiryDate?: string;
    }) => {
      return await apiGatewayClient.uploadLoanDocument(
        params.loanApplicationId,
        params.file,
        params.documentType,
        params.documentName,
        params.hasExpiry,
        params.expiryDate
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loanDocuments", variables.loanApplicationId] });
      queryClient.invalidateQueries({ queryKey: ["documentExpiryAlerts"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });
}

/**
 * Verify Document
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (params: {
      documentId: string;
      verificationNotes: string;
    }) => {
      return await apiGatewayClient.verifyDocument(params.documentId, params.verificationNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanDocuments"] });
      toast({
        title: "Success",
        description: "Document verified successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify document",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get Document Expiry Alerts
 */
export function useDocumentExpiryAlerts(loanApplicationId?: number) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["documentExpiryAlerts", loanApplicationId],
    queryFn: async () => {
      return await apiGatewayClient.getDocumentExpiryAlerts(loanApplicationId);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get Collection Effectiveness
 */
export function useCollectionEffectiveness(params?: {
  date_from?: string;
  date_to?: string;
}) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["collectionEffectiveness", params],
    queryFn: async () => {
      return await apiGatewayClient.getCollectionEffectiveness(params);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get Collection Workload
 */
export function useCollectionWorkload(assignedTo?: string) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["collectionWorkload", assignedTo],
    queryFn: async () => {
      return await apiGatewayClient.getCollectionWorkload(assignedTo);
    },
    enabled: isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Bulk Loan Operations
 */
export function useBulkLoanOperations() {
  const queryClient = useQueryClient();
  const { toast } = require("@/hooks/use-toast").useToast();
  
  return useMutation({
    mutationFn: async (params: {
      operation: "create" | "update" | "validate";
      applications: any[];
    }) => {
      return await apiGatewayClient.bulkLoanOperations(params.operation, params.applications);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      toast({
        title: "Bulk Operation Complete",
        description: `${data?.data?.successful || 0} successful, ${data?.data?.failed || 0} failed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk operations",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get customer's previous loans
 */
export function useCustomerPreviousLoans(customerId: string | null, excludeApplicationId?: number | null) {
  const { isAuthenticated, tokenSynced, session } = useAuth();
  
  return useQuery({
    queryKey: ["customerPreviousLoans", customerId, excludeApplicationId],
    queryFn: async () => {
      if (!customerId) return null;
      return await apiGatewayClient.listLoanApplications({
        customer_id: customerId,
        limit: 50,
        offset: 0
      });
    },
    enabled: !!customerId && isAuthenticated && tokenSynced && !!session?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
