/**
 * React Query hooks for Repayment Management
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface RepaymentFilters {
  status?: string;
  loan_application_id?: number;
  date_from?: string;
  date_to?: string;
  overdue_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaymentData {
  loan_application_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
}

/**
 * Get repayments with filters
 */
export function useRepayments(filters?: RepaymentFilters) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["repayments", filters],
    queryFn: async () => {
      console.log("[useRepayments] Fetching with filters:", filters);
      const result = await apiGatewayClient.getRepayments(filters);
      console.log("[useRepayments] API Response:", {
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
 * Get repayment schedules
 */
export function useRepaymentSchedules(loanApplicationId?: number) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["repaymentSchedules", loanApplicationId],
    queryFn: async () => {
      if (!loanApplicationId) return null;
      return await apiGatewayClient.getRepaymentSchedule(loanApplicationId);
    },
    enabled: !!loanApplicationId && isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Record payment mutation
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (paymentData: PaymentData) => {
      return await apiGatewayClient.recordPayment(paymentData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["repayments"] });
      queryClient.invalidateQueries({ queryKey: ["repaymentSchedules", variables.loan_application_id] });
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
 * Modify repayment schedule mutation
 */
export function useModifyRepaymentSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      scheduleId, 
      modifications 
    }: { 
      scheduleId: string; 
      modifications: any;
    }) => {
      return await apiGatewayClient.modifyRepaymentSchedule(scheduleId, modifications);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repaymentSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["repayments"] });
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
 * Get overdue loans
 */
export function useOverdueLoans(params?: {
  days_overdue_min?: number;
  days_overdue_max?: number;
  limit?: number;
  offset?: number;
}) {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: ["overdueLoans", params],
    queryFn: async () => {
      return await apiGatewayClient.getOverdueLoans(params);
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Generate payment reminder mutation
 */
export function useGeneratePaymentReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (loanApplicationId: number) => {
      return await apiGatewayClient.generatePaymentReminder(loanApplicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repayments"] });
      toast({
        title: "Success",
        description: "Payment reminder sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send payment reminder",
        variant: "destructive",
      });
    },
  });
}

/**
 * Calculate late fees mutation
 */
export function useCalculateLateFees() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      loanApplicationId, 
      daysOverdue 
    }: { 
      loanApplicationId: number; 
      daysOverdue: number;
    }) => {
      return await apiGatewayClient.calculateLateFees(loanApplicationId, daysOverdue);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate late fees",
        variant: "destructive",
      });
    },
  });
}