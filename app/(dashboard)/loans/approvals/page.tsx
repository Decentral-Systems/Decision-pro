"use client";

import React, { useState, useEffect } from "react";
import { 
  usePendingApprovals, 
  useApproveLoanApplication, 
  useRejectLoanApplication,
  useLoanApplication,
  useEvaluateProductRules,
  useEvaluateWorkflowRules,
  useApprovalWorkflow,
  useApprovalHistory,
  useBulkApproveApplications,
} from "@/lib/api/hooks/useLoans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  FileText,
  Filter,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Loader2,
  BarChart3,
  Wifi,
  WifiOff,
  ClipboardCheck,
  Activity
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ConditionalApprovalManager } from "@/components/approvals/ConditionalApprovalManager";
import { WorkflowStageTimeline } from "@/components/approvals/WorkflowStageTimeline";
import { ApprovalExportDialog } from "@/components/approvals/ApprovalExportDialog";
import { useApprovalWebSocket } from "@/lib/hooks/useApprovalWebSocket";
import { navigateTo } from "@/lib/utils/navigation";

function ApprovalsPageContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
  const [bulkDecision, setBulkDecision] = useState<"approved" | "rejected">("approved");
  const [bulkReason, setBulkReason] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState<number | undefined>();
  const [filterAmountMax, setFilterAmountMax] = useState<number | undefined>();
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>("all");
  
  // Real-time updates via WebSocket
  const { isConnected, lastUpdate } = useApprovalWebSocket((update) => {
    // Auto-refresh when approval updates are received
    if (update.type === "approval_completed") {
      refetch();
      toast({
        title: "Approval Update",
        description: `Workflow ${update.workflow_id} has been ${update.decision}`,
      });
    }
  });
  
  const { data, isLoading, error, refetch } = usePendingApprovals({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  
  const { data: applicationData } = useLoanApplication(selectedApplication?.loan_application_id || null);
  
  const approveMutation = useApproveLoanApplication();
  const rejectMutation = useRejectLoanApplication();
  const bulkApproveMutation = useBulkApproveApplications();
  const evaluateProductRules = useEvaluateProductRules();
  const evaluateWorkflowRules = useEvaluateWorkflowRules();
  const { toast } = useToast();
  
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const { data: workflowData } = useApprovalWorkflow(selectedWorkflowId);
  const { data: historyData } = useApprovalHistory(selectedWorkflowId);
  
  const [ruleEvaluation, setRuleEvaluation] = useState<any>(null);
  const [workflowEvaluation, setWorkflowEvaluation] = useState<any>(null);
  const [isEvaluatingRules, setIsEvaluatingRules] = useState(false);
  
  // Evaluate rules when application is selected
  useEffect(() => {
    if (selectedApplication && applicationData?.data) {
      setIsEvaluatingRules(true);
      const app = applicationData.data;
      
      // Evaluate product rules
      evaluateProductRules.mutateAsync({
        product_type: app.loan_type || "personal_loan",
        application_data: {
          customer_id: app.customer_id,
          loan_amount: parseFloat(app.loan_amount),
          loan_term_months: app.loan_term_months,
          monthly_income: app.monthly_income ? parseFloat(app.monthly_income) : undefined,
          credit_score: app.credit_score,
          risk_level: app.risk_level,
        },
        evaluation_scope: "all",
      }).then((result) => {
        setRuleEvaluation(result?.data || result);
      }).catch(() => {
        // Silently fail
      });
      
      // Evaluate workflow rules
      evaluateWorkflowRules.mutateAsync({
        application_data: {
          customer_id: app.customer_id,
          loan_amount: parseFloat(app.loan_amount),
          loan_term_months: app.loan_term_months,
          credit_score: app.credit_score,
          risk_level: app.risk_level,
        },
        product_type: app.loan_type || "personal_loan",
      }).then((result) => {
        setWorkflowEvaluation(result?.data || result);
      }).catch(() => {
        // Silently fail
      }).finally(() => {
        setIsEvaluatingRules(false);
      });
    }
  }, [selectedApplication, applicationData]);
  
  const handleApprove = async () => {
    if (!selectedWorkflow || !decisionReason) {
      toast({
        title: "Error",
        description: "Please provide a decision reason",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Show a toast indicating the approval is being processed
      toast({
        title: "Processing Approval",
        description: "Your approval request is being processed. This may take a moment...",
        duration: 3000,
      });
      
      await approveMutation.mutateAsync({
        workflowId: selectedWorkflow.workflow_id,
        decisionData: {
          decision: "approved",
          decision_reason: decisionReason,
          decision_rationale: decisionRationale || undefined,
        },
      });
      
      // Success toast
      toast({
        title: "Success",
        description: "Loan application has been approved successfully",
        variant: "default",
      });
      
      setIsApproveDialogOpen(false);
      setSelectedWorkflow(null);
      setDecisionReason("");
      setDecisionRationale("");
    } catch (error: any) {
      // Error handled by mutation, but we can add additional context here
      console.error("Approval failed:", error);
    }
  };
  
  const handleReject = async () => {
    if (!selectedWorkflow || !decisionReason) {
      toast({
        title: "Error",
        description: "Please provide a decision reason",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await rejectMutation.mutateAsync({
        workflowId: selectedWorkflow.workflow_id,
        decisionData: {
          decision: "rejected",
          decision_reason: decisionReason,
          decision_rationale: decisionRationale || undefined,
        },
      });
      setIsRejectDialogOpen(false);
      setSelectedWorkflow(null);
      setDecisionReason("");
      setDecisionRationale("");
    } catch (error: any) {
      // Error handled by mutation
    }
  };
  
  const handleBulkApprove = async () => {
    if (selectedWorkflows.size === 0 || !bulkReason) {
      toast({
        title: "Error",
        description: "Please select workflows and provide a reason",
        variant: "destructive",
      });
      return;
    }
    
    // Get application IDs from selected workflows
    const workflows = approvals.filter((a: any) => selectedWorkflows.has(a.workflow_id));
    const applicationIds = workflows.map((w: any) => w.loan_application_id).filter((id: any) => id);
    
    if (applicationIds.length === 0) {
      toast({
        title: "Error",
        description: "No valid application IDs found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await bulkApproveMutation.mutateAsync({
        application_ids: applicationIds,
        decision: bulkDecision,
        decision_reason: bulkReason,
        notes: bulkReason,
      });
      
      setIsBulkDialogOpen(false);
      setSelectedWorkflows(new Set());
      setBulkReason("");
      refetch();
    } catch (error: any) {
      // Error handled by mutation
    }
  };
  
  const toggleWorkflowSelection = (workflowId: string) => {
    const newSet = new Set(selectedWorkflows);
    if (newSet.has(workflowId)) {
      newSet.delete(workflowId);
    } else {
      newSet.add(workflowId);
    }
    setSelectedWorkflows(newSet);
  };
  
  const toggleSelectAll = () => {
    if (selectedWorkflows.size === approvals.length) {
      setSelectedWorkflows(new Set());
    } else {
      setSelectedWorkflows(new Set(approvals.map((a: any) => a.workflow_id)));
    }
  };
  
  const toggleRowExpansion = (workflowId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(workflowId)) {
      newSet.delete(workflowId);
    } else {
      newSet.add(workflowId);
    }
    setExpandedRows(newSet);
  };
  
  // Handle different response structures - same fix as applications page
  let approvals: any[] = [];
  if (data) {
    // Try different possible structures
    if (Array.isArray(data.data)) {
      approvals = data.data;
    } else if (Array.isArray(data.items)) {
      approvals = data.items;
    } else if (Array.isArray(data)) {
      approvals = data;
    } else if (data.data?.items && Array.isArray(data.data.items)) {
      approvals = data.data.items;
    } else if (data.data?.data && Array.isArray(data.data.data)) {
      approvals = data.data.data;
    }
  }
  
  const total = data?.pagination?.total || 
                data?.data?.total || 
                data?.total || 
                approvals.length;
  
  // Add diagnostic logging
  useEffect(() => {
    console.log("[ApprovalsPage] Query State:", {
      isLoading,
      error: error?.message || error,
      hasData: !!data,
      approvalsCount: approvals.length,
      total,
      dataStructure: data ? Object.keys(data) : [],
    });
  }, [isLoading, error, data, approvals.length, total]);
  
  // Filter approvals with advanced filtering
  const filteredApprovals = approvals.filter((approval: any) => {
    // Stage filter
    if (filterStage !== "all" && approval.current_stage !== filterStage) return false;
    
    // Status filter
    if (filterStatus !== "all" && approval.workflow_status !== filterStatus) return false;
    
    // Search query (customer name, application number)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCustomer = approval.customer_id?.toLowerCase().includes(query);
      const matchesApplication = approval.application_number?.toLowerCase().includes(query);
      if (!matchesCustomer && !matchesApplication) return false;
    }
    
    // Amount range filter
    if (filterAmountMin !== undefined && approval.loan_amount < filterAmountMin) return false;
    if (filterAmountMax !== undefined && approval.loan_amount > filterAmountMax) return false;
    
    // Date range filter
    if (filterDateFrom) {
      const approvalDate = new Date(approval.created_at);
      const fromDate = new Date(filterDateFrom);
      if (approvalDate < fromDate) return false;
    }
    if (filterDateTo) {
      const approvalDate = new Date(approval.created_at);
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (approvalDate > toDate) return false;
    }
    
    // Risk level filter (if available in approval data)
    if (filterRiskLevel !== "all" && approval.risk_level && approval.risk_level !== filterRiskLevel) return false;
    
    return true;
  });
  
  const getStageBadgeColor = (stage: string) => {
    const colors: Record<string, string> = {
      initial_review: "bg-blue-500",
      credit_assessment: "bg-purple-500",
      compliance_check: "bg-yellow-500",
      automated_decision: "bg-green-500",
      risk_review: "bg-orange-500",
      final_approval: "bg-red-500",
    };
    return colors[stage] || "bg-gray-500";
  };
  
  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      conditional: "bg-orange-500",
      escalated: "bg-purple-500",
    };
    return colors[status] || "bg-gray-500";
  };
  
  // Calculate analytics metrics
  const analytics = React.useMemo(() => {
    const total = filteredApprovals.length;
    const byStage = filteredApprovals.reduce((acc: Record<string, number>, approval: any) => {
      const stage = approval.current_stage || "unknown";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    
    const byStatus = filteredApprovals.reduce((acc: Record<string, number>, approval: any) => {
      const status = approval.workflow_status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const totalAmount = filteredApprovals.reduce((sum: number, approval: any) => {
      return sum + (parseFloat(approval.loan_amount || 0));
    }, 0);
    
    const pendingCount = byStatus.pending || 0;
    const inProgressCount = byStatus.in_progress || 0;
    const conditionalCount = byStatus.conditional || 0;
    const escalatedCount = byStatus.escalated || 0;
    
    return {
      total,
      byStage,
      byStatus,
      totalAmount,
      pendingCount,
      inProgressCount,
      conditionalCount,
      escalatedCount,
      averageAmount: total > 0 ? totalAmount / total : 0,
    };
  }, [filteredApprovals]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Workflow</h1>
          <p className="text-muted-foreground">
            Review and approve/reject loan applications with rule evaluation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsBulkDialogOpen(true)}
            disabled={selectedWorkflows.size === 0}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Bulk Actions ({selectedWorkflows.size})
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigateTo("/loans/approvals/analytics")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <ApprovalExportDialog
            filters={{
              date_from: filterDateFrom || undefined,
              date_to: filterDateTo || undefined,
              stage: filterStage !== "all" ? filterStage : undefined,
              status: filterStatus !== "all" ? filterStatus : undefined
            }}
          />
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <DashboardSection
        title="Approval Metrics"
        description="Key performance indicators for approval workflow including pending, in-progress, and conditional approvals"
        icon={Activity}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.total > 0 ? ((analytics.pendingCount / analytics.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently being reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conditional</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conditionalCount}</div>
            <p className="text-xs text-muted-foreground">
              Require conditions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(analytics.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
                notation: "compact",
              }).format(analytics.averageAmount)}
            </p>
          </CardContent>
        </Card>
        </div>
      </DashboardSection>
      
      {/* Advanced Filters */}
      <DashboardSection
        title="Filters & Search"
        description="Filter and search approval workflows by stage, status, risk level, amount, and date range"
        icon={Filter}
      >
        <Card>
          <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by customer ID, application number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Basic Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter-stage">Current Stage</Label>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="initial_review">Initial Review</SelectItem>
                    <SelectItem value="credit_assessment">Credit Assessment</SelectItem>
                    <SelectItem value="compliance_check">Compliance Check</SelectItem>
                    <SelectItem value="automated_decision">Automated Decision</SelectItem>
                    <SelectItem value="risk_review">Risk Review</SelectItem>
                    <SelectItem value="final_approval">Final Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-status">Workflow Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              </div>
              <div>
                <Label htmlFor="filter-risk">Risk Level</Label>
                <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All risk levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="very_high">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Advanced Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filter-amount-min">Min Amount (ETB)</Label>
                <Input
                  id="filter-amount-min"
                  type="number"
                  placeholder="0"
                  value={filterAmountMin || ""}
                  onChange={(e) => setFilterAmountMin(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="filter-amount-max">Max Amount (ETB)</Label>
                <Input
                  id="filter-amount-max"
                  type="number"
                  placeholder="No limit"
                  value={filterAmountMax || ""}
                  onChange={(e) => setFilterAmountMax(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="filter-date-from">Date From</Label>
                <Input
                  id="filter-date-from"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-date-to">Date To</Label>
                <Input
                  id="filter-date-to"
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterStage("all");
                  setFilterStatus("all");
                  setSearchQuery("");
                  setFilterAmountMin(undefined);
                  setFilterAmountMax(undefined);
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterRiskLevel("all");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>
      </DashboardSection>
      
      <DashboardSection
        title="Pending Approvals"
        description={`${filteredApprovals.length} of ${total} applications pending approval. Review and make approval decisions.`}
        icon={ClipboardCheck}
        badge={
          filteredApprovals.length > 0
            ? { label: `${filteredApprovals.length} Pending`, variant: "warning" }
            : undefined
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>
              {filteredApprovals.length} of {total} applications pending approval
            </CardDescription>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load pending approvals</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending approvals match the filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedWorkflows.size === filteredApprovals.length && filteredApprovals.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Application #</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval: any) => {
                    const isExpanded = expandedRows.has(approval.workflow_id);
                    const applicationId = approval.loan_application_id || approval.application_id;
                    return (
                      <React.Fragment key={approval.workflow_id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={(e) => {
                            // Don't navigate if clicking checkbox, expand button, or action buttons
                            const target = e.target as HTMLElement;
                            if (
                              target.closest('input[type="checkbox"]') ||
                              target.closest('button') ||
                              target.closest('[role="button"]')
                            ) {
                              return;
                            }
                            if (applicationId) {
                              navigateTo(`/loans/applications/${applicationId}`);
                            }
                          }}
                        >
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedWorkflows.has(approval.workflow_id)}
                              onCheckedChange={() => toggleWorkflowSelection(approval.workflow_id)}
                            />
                          </TableCell>
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(approval.workflow_id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {approval.application_number}
                          </TableCell>
                          <TableCell>{approval.customer_id}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(approval.loan_amount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStageBadgeColor(approval.current_stage)}>
                              {approval.current_stage?.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(approval.workflow_status)}>
                              {approval.workflow_status?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(approval.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApplication(approval);
                                  setSelectedWorkflowId(approval.workflow_id);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWorkflow(approval);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Approve Loan Application</DialogTitle>
                                    <DialogDescription>
                                      Provide a reason and rationale for approval
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="approve-reason">Decision Reason *</Label>
                                      <Textarea
                                        id="approve-reason"
                                        value={decisionReason}
                                        onChange={(e) => setDecisionReason(e.target.value)}
                                        placeholder="Application meets all criteria..."
                                        rows={3}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="approve-rationale">Decision Rationale (Optional)</Label>
                                      <Textarea
                                        id="approve-rationale"
                                        value={decisionRationale}
                                        onChange={(e) => setDecisionRationale(e.target.value)}
                                        placeholder="Detailed rationale for the decision..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsApproveDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleApprove}
                                        disabled={approveMutation.isPending || !decisionReason}
                                      >
                                        {approveMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Approving...
                                          </>
                                        ) : (
                                          "Approve"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWorkflow(approval);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Reject Loan Application</DialogTitle>
                                    <DialogDescription>
                                      Provide a reason and rationale for rejection
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="reject-reason">Decision Reason *</Label>
                                      <Textarea
                                        id="reject-reason"
                                        value={decisionReason}
                                        onChange={(e) => setDecisionReason(e.target.value)}
                                        placeholder="Application does not meet criteria..."
                                        rows={3}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="reject-rationale">Decision Rationale (Optional)</Label>
                                      <Textarea
                                        id="reject-rationale"
                                        value={decisionRationale}
                                        onChange={(e) => setDecisionRationale(e.target.value)}
                                        placeholder="Detailed rationale for the rejection..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsRejectDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={rejectMutation.isPending || !decisionReason}
                                      >
                                        {rejectMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Rejecting...
                                          </>
                                        ) : (
                                          "Reject"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/50">
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-muted-foreground">Workflow ID</div>
                                    <div>{approval.workflow_id}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground">Approval Level</div>
                                    <div>{approval.approval_level || "N/A"}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground">Required Approvals</div>
                                    <div>{approval.required_approvals || "N/A"}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground">Received Approvals</div>
                                    <div>{approval.received_approvals || 0}</div>
                                  </div>
                                </div>
                                {approval.conditional_approval && (
                                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                    <div className="flex items-center space-x-2">
                                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                                      <span className="font-medium">Conditional Approval</span>
                                    </div>
                                    {approval.conditions && (
                                      <div className="mt-2 text-sm">
                                        Conditions: {JSON.stringify(approval.conditions)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
        </Card>
      </DashboardSection>
      
      {/* Application Detail Dialog with Rule Evaluation */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details & Rule Evaluation</DialogTitle>
            <DialogDescription>
              Comprehensive application information with rules engine evaluation
            </DialogDescription>
          </DialogHeader>
          {applicationData?.data && (
            <div className="space-y-4">
              {/* Workflow Details */}
              {workflowData?.data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground">Workflow ID</div>
                          <div className="font-mono text-xs">{workflowData.data.workflow_id}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Current Stage</div>
                          <Badge className={getStageBadgeColor(workflowData.data.current_stage)}>
                            {workflowData.data.current_stage?.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Workflow Status</div>
                          <Badge className={getStatusBadgeColor(workflowData.data.workflow_status)}>
                            {workflowData.data.workflow_status?.toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Created</div>
                          <div>{workflowData.data.created_at ? new Date(workflowData.data.created_at).toLocaleString() : "N/A"}</div>
                        </div>
                      </div>
                      {workflowData.data.workflow_stages && workflowData.data.workflow_stages.length > 0 && (
                        <div>
                          <div className="font-medium text-muted-foreground mb-2">Workflow Stages</div>
                          <div className="flex flex-wrap gap-2">
                            {workflowData.data.workflow_stages.map((stage: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant={stage === workflowData.data.current_stage ? "default" : "outline"}
                                className={stage === workflowData.data.current_stage ? getStageBadgeColor(stage) : ""}
                              >
                                {stage.replace(/_/g, " ").toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Workflow Stage Timeline */}
                      {workflowData.data.workflow_stages && (
                        <WorkflowStageTimeline
                          stages={workflowData.data.workflow_stages.map((stage: string) => {
                            // Find history entry for this stage
                            const stageHistory = historyData?.data?.find((h: any) => h.stage === stage);
                            const currentStageIndex = workflowData.data.workflow_stages.indexOf(workflowData.data.current_stage);
                            const stageIndex = workflowData.data.workflow_stages.indexOf(stage);
                            
                            let status: "completed" | "current" | "pending" = "pending";
                            if (stage === workflowData.data.current_stage) {
                              status = "current";
                            } else if (stageIndex < currentStageIndex || stageHistory) {
                              status = "completed";
                            }
                            
                            return {
                              stage,
                              name: stage.replace(/_/g, " "),
                              status,
                              completed_at: stageHistory?.decision_date || stageHistory?.created_at,
                              estimated_time: undefined // Will use default from component
                            };
                          })}
                          currentStage={workflowData.data.current_stage}
                          workflowStatus={workflowData.data.workflow_status}
                        />
                      )}
                      
                      {/* Conditional Approval Manager */}
                      {workflowData.data.workflow_id && (
                        <ConditionalApprovalManager
                          workflowId={workflowData.data.workflow_id}
                          conditions={Array.isArray(workflowData.data.conditions) 
                            ? workflowData.data.conditions 
                            : workflowData.data.conditions 
                              ? (typeof workflowData.data.conditions === 'string' 
                                  ? JSON.parse(workflowData.data.conditions) 
                                  : [workflowData.data.conditions])
                              : []}
                          onConditionsChange={() => {
                            // Refetch workflow data when conditions change
                            if (selectedWorkflowId) {
                              // Trigger refetch
                              window.location.reload();
                            }
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Application Number</div>
                      <div>{applicationData.data.application_number}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Customer ID</div>
                      <div>{applicationData.data.customer_id}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Loan Amount</div>
                      <div>
                        {new Intl.NumberFormat("en-ET", {
                          style: "currency",
                          currency: "ETB",
                        }).format(parseFloat(applicationData.data.loan_amount))}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Loan Term</div>
                      <div>{applicationData.data.loan_term_months} months</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Interest Rate</div>
                      <div>{applicationData.data.interest_rate}%</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Credit Score</div>
                      <div>{applicationData.data.credit_score || "N/A"}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Risk Level</div>
                      <div>
                        <Badge>{applicationData.data.risk_level || "N/A"}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">NBE Compliant</div>
                      <div>
                        <Badge className={applicationData.data.nbe_compliant ? "bg-green-500" : "bg-red-500"}>
                          {applicationData.data.nbe_compliant ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Rule Evaluation */}
              {isEvaluatingRules ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Evaluating rules...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {ruleEvaluation && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Rules Evaluation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {ruleEvaluation.eligibility_status && (
                            <div>
                              <div className="font-medium">Eligibility Status</div>
                              <Badge className={ruleEvaluation.eligibility_status === "eligible" ? "bg-green-500" : "bg-red-500"}>
                                {ruleEvaluation.eligibility_status}
                              </Badge>
                            </div>
                          )}
                          {ruleEvaluation.dynamic_limits && (
                            <div>
                              <div className="font-medium">Dynamic Limits</div>
                              <div className="text-sm text-muted-foreground">
                                Max: {new Intl.NumberFormat("en-ET", {
                                  style: "currency",
                                  currency: "ETB",
                                }).format(ruleEvaluation.dynamic_limits.max_loan_amount || 0)}
                              </div>
                            </div>
                          )}
                          {ruleEvaluation.risk_based_pricing && (
                            <div>
                              <div className="font-medium">Risk-Based Pricing</div>
                              <div className="text-sm text-muted-foreground">
                                Recommended Rate: {ruleEvaluation.risk_based_pricing.recommended_rate || "N/A"}%
                              </div>
                            </div>
                          )}
                          {ruleEvaluation.matched_rules && ruleEvaluation.matched_rules.length > 0 && (
                            <div>
                              <div className="font-medium mb-2">Matched Rules ({ruleEvaluation.matched_rules.length})</div>
                              <div className="text-sm space-y-2 max-h-48 overflow-y-auto">
                                {ruleEvaluation.matched_rules.map((rule: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-muted rounded border">
                                    <div className="font-medium">{rule.rule_name || rule.name || `Rule ${idx + 1}`}</div>
                                    {rule.description && (
                                      <div className="text-xs text-muted-foreground mt-1">{rule.description}</div>
                                    )}
                                    {rule.conditions && (
                                      <div className="text-xs mt-2">
                                        <div className="font-medium">Conditions:</div>
                                        <div className="pl-2">{JSON.stringify(rule.conditions, null, 2)}</div>
                                      </div>
                                    )}
                                    {rule.action && (
                                      <div className="text-xs mt-1">
                                        <span className="font-medium">Action: </span>
                                        <Badge className="bg-blue-500 text-xs">{rule.action}</Badge>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {workflowEvaluation && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Workflow Rules Evaluation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {workflowEvaluation.decision && (
                            <div>
                              <div className="font-medium">Automated Decision</div>
                              <Badge>{workflowEvaluation.decision}</Badge>
                            </div>
                          )}
                          {workflowEvaluation.actions && workflowEvaluation.actions.length > 0 && (
                            <div>
                              <div className="font-medium mb-2">Automated Actions ({workflowEvaluation.actions.length})</div>
                              <div className="text-sm space-y-2">
                                {workflowEvaluation.actions.map((action: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-muted rounded border">
                                    <div className="flex items-center space-x-2">
                                      <Badge className="bg-blue-500">
                                        {action.action_type || action.type || `Action ${idx + 1}`}
                                      </Badge>
                                      {action.status && (
                                        <Badge variant="outline">{action.status}</Badge>
                                      )}
                                    </div>
                                    {action.description && (
                                      <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                                    )}
                                    {action.parameters && (
                                      <div className="text-xs mt-2">
                                        <div className="font-medium">Parameters:</div>
                                        <div className="pl-2">{JSON.stringify(action.parameters, null, 2)}</div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {workflowEvaluation.matched_rules && workflowEvaluation.matched_rules.length > 0 && (
                            <div>
                              <div className="font-medium mb-2">Matched Workflow Rules ({workflowEvaluation.matched_rules.length})</div>
                              <div className="text-sm space-y-2 max-h-48 overflow-y-auto">
                                {workflowEvaluation.matched_rules.map((rule: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-muted rounded border">
                                    <div className="font-medium">{rule.rule_name || rule.name || `Rule ${idx + 1}`}</div>
                                    {rule.description && (
                                      <div className="text-xs text-muted-foreground mt-1">{rule.description}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
              
              {/* Approval History */}
              {selectedWorkflowId && historyData?.data?.history && (
                <Card>
                  <CardHeader>
                    <CardTitle>Approval History & Audit Trail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {historyData.data.history.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No approval history yet</p>
                      ) : (
                        <div className="space-y-3">
                          {historyData.data.history.map((decision: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge className={
                                    decision.decision === "approved" ? "bg-green-500" :
                                    decision.decision === "rejected" ? "bg-red-500" :
                                    "bg-gray-500"
                                  }>
                                    {decision.decision?.toUpperCase() || decision.decision_type?.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {decision.stage?.replace(/_/g, " ").toUpperCase() || "N/A"}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {decision.created_at ? new Date(decision.created_at).toLocaleString() : "N/A"}
                                </span>
                              </div>
                              {decision.decision_reason && (
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Reason</div>
                                  <div className="text-sm">{decision.decision_reason}</div>
                                </div>
                              )}
                              {decision.decision_rationale && (
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Rationale</div>
                                  <div className="text-sm">{decision.decision_rationale}</div>
                                </div>
                              )}
                              {decision.notes && (
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Notes</div>
                                  <div className="text-sm">{decision.notes}</div>
                                </div>
                              )}
                              {decision.decision_by && (
                                <div className="text-xs text-muted-foreground">
                                  By: {decision.decision_by}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Approval Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approval/Rejection</DialogTitle>
            <DialogDescription>
              Process {selectedWorkflows.size} selected workflows
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-decision">Decision</Label>
              <Select value={bulkDecision} onValueChange={(v: any) => setBulkDecision(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulk-reason">Reason *</Label>
              <Textarea
                id="bulk-reason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Reason for bulk decision..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending || !bulkReason || selectedWorkflows.size === 0}
              >
                {bulkApproveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process ${selectedWorkflows.size} Workflows`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <ErrorBoundary>
      <ApprovalsPageContent />
    </ErrorBoundary>
  );
}
