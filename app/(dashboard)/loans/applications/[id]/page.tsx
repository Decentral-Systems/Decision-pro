"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import { 
  useLoanApplication, 
  useLoanApplicationStatusHistory,
  useUpdateLoanApplicationStatus,
  useApprovalWorkflowByApplication,
  useLoanDisbursements,
  useLoanRepaymentSchedule,
  useCreditScoreHistory,
  useCustomerPreviousLoans
} from "@/lib/api/hooks/useLoans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, FileText, Calendar, User, DollarSign, Percent, Clock, CheckCircle2, XCircle, AlertCircle, History, Upload, Download, Play, CreditCard, TrendingUp, TrendingDown, Minus, Info, Activity } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoanApplicationDetailContent() {
  const params = useParams();
  const router = useRouter();
  
  // Handle ID from URL - could be string or number
  const idParam = params.id as string;
  const applicationId = idParam ? parseInt(idParam) : null;
  
  console.log("[LoanApplicationDetail] Route params:", {
    idParam,
    applicationId,
    params,
  });
  
  const { data, isLoading, error } = useLoanApplication(applicationId);
  const { data: statusHistoryData, isLoading: statusHistoryLoading } = useLoanApplicationStatusHistory(applicationId, 100);
  const updateStatusMutation = useUpdateLoanApplicationStatus();
  const { data: approvalWorkflowData } = useApprovalWorkflowByApplication(applicationId);
  const { data: disbursementsData } = useLoanDisbursements(applicationId);
  const { data: repaymentScheduleData } = useLoanRepaymentSchedule(applicationId);
  const { data: creditScoreHistoryData } = useCreditScoreHistory(applicationId, 50);
  
  // Handle different response structures
  const application = data?.data || data;
  
  // Get customer's previous loans (excluding current application)
  const { data: customerPreviousLoansData } = useCustomerPreviousLoans(
    application?.customer_id || null,
    applicationId
  );
  
  const dataString = data ? JSON.stringify(data, null, 2) : 'null';
  console.log("[LoanApplicationDetail] Query state:", {
    isLoading,
    error: error?.message || error,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    dataStructure: dataString ? dataString.substring(0, 1000) : 'null',
  });
  
  const statusHistory = statusHistoryData?.data?.history || statusHistoryData?.history || [];
  
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-500",
      pending: "bg-yellow-500",
      under_review: "bg-blue-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      disbursed: "bg-purple-500",
      active: "bg-green-600",
      completed: "bg-gray-600",
      defaulted: "bg-red-600",
    };
    
    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };
  
  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    const riskColors: Record<string, string> = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      very_high: "bg-red-500",
    };
    
    return (
      <Badge className={riskColors[riskLevel] || "bg-gray-500"}>
        {riskLevel.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error || !application) {
    console.error("[LoanApplicationDetail] Error or no application:", {
      error: error?.message || error,
      hasData: !!data,
      applicationId,
      dataStructure: data,
    });
    
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8 space-y-4">
            <p className="text-destructive text-center text-lg font-semibold">
              {error ? "Failed to load application" : "Application not found"}
            </p>
            {error && (
              <p className="text-muted-foreground text-center text-sm">
                {typeof error === 'string' ? error : error?.message || 'Unknown error'}
              </p>
            )}
            {applicationId && (
              <p className="text-muted-foreground text-center text-sm">
                Application ID: {applicationId}
              </p>
            )}
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => navigateTo('/loans/applications')}>
                Back to Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Loan Application Details</h1>
            <p className="text-muted-foreground">
              {application.application_number}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(application.application_status)}
          {application.application_status === 'draft' && (
            <Button 
              variant="default"
              onClick={async () => {
                try {
                  await updateStatusMutation.mutateAsync({
                    applicationId: applicationId!,
                    newStatus: 'pending',
                    reason: 'Initiated approval workflow'
                  });
                } catch (error) {
                  console.error("Failed to initiate approval:", error);
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              {updateStatusMutation.isPending ? "Initiating..." : "Initiate Approval"}
            </Button>
          )}
          {application.application_status === 'approved' && (
            <Button 
              variant="default"
              onClick={() => {
                navigateTo(`/loans/disbursements/create?application_id=${applicationId}`);
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Create Disbursement
            </Button>
          )}
          {application.application_status === 'active' && (
            <Button 
              variant="default"
              onClick={() => {
                navigateTo(`/loans/repayments/record?application_id=${applicationId}`);
              }}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">NBE Compliance</TabsTrigger>
          <TabsTrigger value="status-history">Status History</TabsTrigger>
          <TabsTrigger value="credit-history">Credit History</TabsTrigger>
          <TabsTrigger value="related">Related Records</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <DashboardSection
            title="Application Overview"
            description="Complete application details including customer information, loan details, and financial metrics"
            icon={Info}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer ID:</span>
                  <span className="font-medium">{application.customer_id}</span>
                </div>
                {application.customer_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Name:</span>
                    <span className="font-medium">{application.customer_name}</span>
                  </div>
                )}
                {/* Customer History Display */}
                {customerPreviousLoansData?.data?.items && customerPreviousLoansData.data.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Previous Loans:</span>
                      <span className="text-xs text-muted-foreground">
                        {customerPreviousLoansData.data.items.length} total
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {customerPreviousLoansData.data.items
                        .filter((loan: any) => loan.id !== applicationId)
                        .slice(0, 5)
                        .map((loan: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 bg-background rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => navigateTo(`/loans/applications/${loan.id || loan.loan_id}`)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {loan.application_number || `Loan #${loan.id || loan.loan_id}`}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {loan.loan_type?.replace(/_/g, " ")} • {loan.application_status?.replace(/_/g, " ")}
                              </div>
                            </div>
                            <div className="ml-2 text-right">
                              <div className="font-medium">
                                {new Intl.NumberFormat("en-ET", {
                                  style: "currency",
                                  currency: "ETB",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(loan.loan_amount || loan.requested_amount || 0)}
                              </div>
                              {loan.credit_score && (
                                <div className="text-xs text-muted-foreground">
                                  Score: {loan.credit_score}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    {customerPreviousLoansData.data.items.filter((loan: any) => loan.id !== applicationId).length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => {
                          navigateTo(`/loans/applications?customer_id=${application.customer_id}`);
                        }}
                      >
                        View All ({customerPreviousLoansData.data.items.filter((loan: any) => loan.id !== applicationId).length} loans)
                      </Button>
                    )}
                  </div>
                )}
                {application.credit_score && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Score:</span>
                      <span className="font-medium">{application.credit_score}</span>
                    </div>
                    {/* Credit Score Impact Visualization */}
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-3">
                      <div className="text-xs font-medium">Score Impact on Loan Terms:</div>
                      <div className="space-y-2">
                        {/* Interest Rate Calculator Visualization */}
                        {application.interest_rate && application.credit_score && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Interest Rate:</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 h-2 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, ((application.credit_score || 0) / 1000) * 100))}%`
                                    }}
                                  />
                                </div>
                                <span className="font-medium text-xs min-w-[50px] text-right">
                                  {(application.interest_rate * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            {/* Interest Rate Range Comparison */}
                            <div className="text-xs text-muted-foreground pl-1">
                              Range: 12% (excellent) - 25% (poor)
                            </div>
                          </div>
                        )}
                        {/* Loan Terms Comparison Chart */}
                        {application.loan_term_months && application.credit_score && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Loan Term:</span>
                              <span className="font-medium text-xs">
                                {application.loan_term_months} months
                              </span>
                            </div>
                            {application.monthly_payment && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Monthly Payment:</span>
                                <span className="font-medium text-xs">
                                  {new Intl.NumberFormat("en-ET", {
                                    style: "currency",
                                    currency: "ETB",
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(application.monthly_payment)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Risk Level Indicator */}
                        {application.risk_level && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Risk Assessment:</span>
                            {getRiskBadge(application.risk_level)}
                          </div>
                        )}
                        {/* Default Probability */}
                        {application.default_probability !== undefined && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Default Risk:</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 h-2 bg-background rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${application.default_probability > 0.3 ? 'bg-red-500' : application.default_probability > 0.15 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{
                                      width: `${Math.min(100, (application.default_probability * 100))}%`
                                    }}
                                  />
                                </div>
                                <span className="font-medium text-xs min-w-[45px] text-right">
                                  {(application.default_probability * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {application.risk_level && !application.credit_score && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    {getRiskBadge(application.risk_level)}
                  </div>
                )}
                {application.risk_score && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Score:</span>
                    <span className="font-medium">{application.risk_score.toFixed(2)}</span>
                  </div>
                )}
                {application.approval_probability && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approval Probability:</span>
                    <span className="font-medium">{(application.approval_probability * 100).toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Type:</span>
                  <span className="font-medium">{application.loan_type?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Amount:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(application.requested_amount || 0)}
                  </span>
                </div>
                {application.approved_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved Amount:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(application.approved_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Term:</span>
                  <span className="font-medium">{application.loan_term_months} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="font-medium">
                    <Percent className="inline h-3 w-3" />
                    {(application.interest_rate || 0).toFixed(2)}%
                  </span>
                </div>
                {application.monthly_payment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Payment:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(application.monthly_payment)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Dates & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(application.created_at).toLocaleString()}
                  </span>
                </div>
                {application.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(application.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {application.approval_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approval Date:</span>
                    <span className="font-medium">
                      {new Date(application.approval_date).toLocaleString()}
                    </span>
                  </div>
                )}
                {application.disbursement_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disbursement Date:</span>
                    <span className="font-medium">
                      {new Date(application.disbursement_date).toLocaleString()}
                    </span>
                  </div>
                )}
                {application.maturity_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maturity Date:</span>
                    <span className="font-medium">
                      {new Date(application.maturity_date).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.loan_purpose && (
                  <div>
                    <span className="text-muted-foreground">Loan Purpose:</span>
                    <p className="font-medium">{application.loan_purpose}</p>
                  </div>
                )}
                {application.product_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Name:</span>
                    <span className="font-medium">{application.product_name}</span>
                  </div>
                )}
                {application.product_category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Category:</span>
                    <span className="font-medium">{application.product_category}</span>
                  </div>
                )}
                {application.collateral_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collateral ID:</span>
                    <span className="font-medium">{application.collateral_id}</span>
                  </div>
                )}
                {application.application_notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="font-medium">{application.application_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </DashboardSection>
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <DashboardSection
            title="NBE Compliance Status"
            description="Ethiopian National Bank regulatory compliance validation and status"
            icon={AlertCircle}
          >
            <Card>
              <CardHeader>
                <CardTitle>Compliance Validation</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">NBE Compliant:</span>
                  <Badge className={application.nbe_compliant ? "bg-green-500" : "bg-red-500"}>
                    {application.nbe_compliant ? "Compliant" : "Non-Compliant"}
                  </Badge>
                </div>
                {application.one_third_salary_check !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">1/3 Salary Rule:</span>
                    <Badge className={application.one_third_salary_check ? "bg-green-500" : "bg-red-500"}>
                      {application.one_third_salary_check ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                )}
                {application.max_affordable_payment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Affordable Payment:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(application.max_affordable_payment)}
                    </span>
                  </div>
                )}
                {application.debt_to_income_ratio !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debt-to-Income Ratio:</span>
                    <span className="font-medium">{(application.debt_to_income_ratio * 100).toFixed(2)}%</span>
                  </div>
                )}
                {application.compliance_violations && application.compliance_violations.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Violations:</span>
                    <ul className="list-disc list-inside mt-2">
                      {application.compliance_violations.map((violation: any, index: number) => (
                        <li key={index} className="text-destructive">{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </DashboardSection>
        </TabsContent>
        
        <TabsContent value="status-history" className="space-y-4">
          <DashboardSection
            title="Status History Timeline"
            description="Complete audit trail of status changes with user attribution and timestamps"
            icon={History}
          >
            <Card>
              <CardHeader>
                <CardTitle>Status Changes</CardTitle>
                <CardDescription>
                  Complete audit trail of status changes with user attribution
                </CardDescription>
              </CardHeader>
            <CardContent>
              {statusHistoryLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((entry: any, index: number) => {
                    const getStatusColor = (status: string) => {
                      const colors: Record<string, string> = {
                        draft: "border-gray-400",
                        pending: "border-yellow-500",
                        under_review: "border-blue-500",
                        approved: "border-green-500",
                        rejected: "border-red-500",
                        disbursed: "border-purple-500",
                        active: "border-green-600",
                        completed: "border-gray-600",
                        defaulted: "border-red-600",
                        in_collection: "border-orange-500",
                        cancelled: "border-gray-500",
                      };
                      return colors[status] || "border-muted";
                    };
                    
                    const getStatusIcon = (status: string) => {
                      if (status === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                      if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-500" />;
                      if (status === 'pending' || status === 'under_review') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
                      return <Clock className="h-4 w-4 text-muted-foreground" />;
                    };
                    
                    return (
                      <div key={index} className={`flex items-start space-x-4 border-l-2 ${getStatusColor(entry.new_status)} pl-4 relative`}>
                        <div className="absolute -left-2.5 top-0 bg-background rounded-full p-1">
                          {getStatusIcon(entry.new_status)}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{entry.new_status?.replace(/_/g, " ").toUpperCase()}</span>
                              {entry.old_status && entry.old_status !== entry.new_status && (
                                <span className="text-xs text-muted-foreground">
                                  (from {entry.old_status?.replace(/_/g, " ")})
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          {entry.changed_by && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Changed by: <span className="font-medium">{entry.changed_by}</span>
                            </p>
                          )}
                          {entry.change_reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {entry.change_reason}
                            </p>
                          )}
                          {entry.metadata && typeof entry.metadata === 'object' && Object.keys(entry.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <p className="font-medium mb-1">Metadata:</p>
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(entry.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No status history available</p>
                  <p className="text-sm mt-2">Status changes will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
          </DashboardSection>
        </TabsContent>
        
        <TabsContent value="credit-history" className="space-y-4">
          <DashboardSection
            title="Credit Score History & Trends"
            description="Historical credit score data and trend analysis with visualization"
            icon={TrendingUp}
          >
            <Card>
              <CardHeader>
                <CardTitle>Credit History</CardTitle>
                <CardDescription>
                  Historical credit score data and trend analysis
                </CardDescription>
              </CardHeader>
            <CardContent>
              {creditScoreHistoryData?.data?.history && creditScoreHistoryData.data.history.length > 0 ? (
                <div className="space-y-6">
                  {/* Trend Indicator */}
                  {creditScoreHistoryData.data.trend && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Trend</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {creditScoreHistoryData.data.trend === 'improving' ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : creditScoreHistoryData.data.trend === 'declining' ? (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="font-semibold capitalize">
                            {creditScoreHistoryData.data.trend}
                          </span>
                          {creditScoreHistoryData.data.trend_change !== 0 && (
                            <span className={`text-sm ${creditScoreHistoryData.data.trend_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({creditScoreHistoryData.data.trend_change > 0 ? '+' : ''}{creditScoreHistoryData.data.trend_change.toFixed(1)} points)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Score</p>
                        <p className="text-2xl font-bold">{creditScoreHistoryData.data.current_score?.toFixed(0) || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Credit Score History Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Score Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={creditScoreHistoryData.data.history
                          .slice()
                          .reverse()
                          .map((record: any) => ({
                            date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            score: parseFloat(record.credit_score || 0),
                            riskLevel: record.risk_level,
                            application: record.application_number
                          }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 1000]} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold">Score: {data.score}</p>
                                  <p className="text-sm text-muted-foreground">Date: {data.date}</p>
                                  {data.riskLevel && (
                                    <p className="text-sm text-muted-foreground">Risk: {data.riskLevel}</p>
                                  )}
                                  {data.application && (
                                    <p className="text-xs text-muted-foreground">App: {data.application}</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Risk Level Distribution */}
                  {creditScoreHistoryData.data.history.some((r: any) => r.risk_level) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Risk Level Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={Object.entries(
                            creditScoreHistoryData.data.history.reduce((acc: any, record: any) => {
                              const level = record.risk_level || 'unknown';
                              acc[level] = (acc[level] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([level, count]) => ({ level, count }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="level" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {/* History Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">History Details</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Application</TableHead>
                            <TableHead>Credit Score</TableHead>
                            <TableHead>Risk Level</TableHead>
                            <TableHead>Default Probability</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditScoreHistoryData.data.history.slice(0, 10).map((record: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {new Date(record.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="link"
                                  className="h-auto p-0"
                                  onClick={() => {
                                    if (record.loan_id) {
                                      navigateTo(`/loans/applications/${record.loan_id}`);
                                    }
                                  }}
                                >
                                  {record.application_number || 'N/A'}
                                </Button>
                              </TableCell>
                              <TableCell className="font-medium">
                                {record.credit_score?.toFixed(0) || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {getRiskBadge(record.risk_level)}
                              </TableCell>
                              <TableCell>
                                {record.default_probability ? `${(record.default_probability * 100).toFixed(1)}%` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(record.application_status || 'unknown')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No credit score history available</p>
                  <p className="text-sm mt-2">Credit score history will appear here once applications are processed</p>
                </div>
              )}
            </CardContent>
          </Card>
          </DashboardSection>
        </TabsContent>
        
        <TabsContent value="related" className="space-y-4">
          <DashboardSection
            title="Related Records"
            description="Related records including approval workflow, disbursements, and repayment schedule"
            icon={Activity}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Approval Workflow</CardTitle>
                  <CardDescription>
                    Current approval workflow status
                  </CardDescription>
                </CardHeader>
              <CardContent>
                {approvalWorkflowData?.data?.workflow || approvalWorkflowData?.data ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge>{(approvalWorkflowData.data?.workflow || approvalWorkflowData.data)?.workflow_status || 'N/A'}</Badge>
                    </div>
                    {(approvalWorkflowData.data?.workflow || approvalWorkflowData.data)?.current_stage && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Stage:</span>
                        <span className="text-sm">{(approvalWorkflowData.data?.workflow || approvalWorkflowData.data)?.current_stage}</span>
                      </div>
                    )}
                    {(approvalWorkflowData.data?.workflow || approvalWorkflowData.data)?.started_by && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Started By:</span>
                        <span className="text-sm">{(approvalWorkflowData.data?.workflow || approvalWorkflowData.data)?.started_by}</span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        navigateTo(`/loans/approvals?application_id=${applicationId}`);
                      }}
                    >
                      View Full Workflow
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No approval workflow found for this application
                    </p>
                    {application.application_status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigateTo(`/loans/approvals?application_id=${applicationId}`);
                        }}
                      >
                        View Approval Workflow
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Disbursements</CardTitle>
                <CardDescription>
                  Disbursement records for this loan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {disbursementsData?.data?.disbursements && disbursementsData.data.disbursements.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      {disbursementsData.data.count} Disbursement(s)
                    </div>
                    {disbursementsData.data.disbursements.slice(0, 3).map((disb: any, idx: number) => (
                      <div key={idx} className="border rounded p-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Amount:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(disb.disbursement_amount || 0)}
                          </span>
                        </div>
                        {disb.disbursement_date && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Date:</span>
                            <span>{new Date(disb.disbursement_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {disb.disbursement_status && (
                          <div className="flex justify-between text-xs">
                            <span>Status:</span>
                            <Badge variant="outline">{disb.disbursement_status}</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigateTo(`/loans/disbursements?application_id=${applicationId}`);
                      }}
                    >
                      View All Disbursements
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No disbursements found
                    </p>
                    {application.application_status === 'approved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigateTo(`/loans/disbursements/create?application_id=${applicationId}`);
                        }}
                      >
                        Create Disbursement
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Repayment Schedule</CardTitle>
                <CardDescription>
                  Payment schedule and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {repaymentScheduleData?.data?.schedule ? (
                  <div className="space-y-3">
                    {repaymentScheduleData.data.schedule.payments && repaymentScheduleData.data.schedule.payments.length > 0 && (
                      <>
                        <div className="text-sm font-medium">
                          {repaymentScheduleData.data.schedule.payments.length} Scheduled Payment(s)
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {repaymentScheduleData.data.schedule.payments.slice(0, 5).map((payment: any, idx: number) => (
                            <div key={idx} className="border rounded p-2 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Due:</span>
                                <span className="font-medium">
                                  {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Amount:</span>
                                <span>
                                  {new Intl.NumberFormat("en-ET", {
                                    style: "currency",
                                    currency: "ETB",
                                  }).format(payment.due_amount || 0)}
                                </span>
                              </div>
                              {payment.paid_date && (
                                <div className="flex justify-between text-xs text-green-600">
                                  <span>Paid:</span>
                                  <span>{new Date(payment.paid_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {repaymentScheduleData.data.schedule.payments.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{repaymentScheduleData.data.schedule.payments.length - 5} more payments
                          </p>
                        )}
                      </>
                    )}
                    {repaymentScheduleData.data.payments && repaymentScheduleData.data.payments.length > 0 && (
                      <div className="text-sm font-medium mt-2">
                        {repaymentScheduleData.data.payment_count} Payment(s) Recorded
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigateTo(`/loans/repayments?application_id=${applicationId}`);
                      }}
                    >
                      View Full Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No repayment schedule found
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigateTo(`/loans/repayments?application_id=${applicationId}`);
                      }}
                    >
                      View Repayments
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Collection Workflow</CardTitle>
                <CardDescription>
                  Collection actions if loan is overdue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {application.application_status === 'in_collection' ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Loan is in collection workflow
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigateTo(`/loans/collections?application_id=${applicationId}`);
                        }}
                      >
                        View Collection Details
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No collection workflow active
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          </DashboardSection>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <DashboardSection
            title="Documents"
            description="Loan application documents and attachments with upload and verification capabilities"
            icon={FileText}
            actions={
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Loan application documents and attachments
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    No documents uploaded yet
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Document
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Document management features:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Upload multiple document types</li>
                    <li>View and download documents</li>
                    <li>Document verification status</li>
                    <li>Expiry date monitoring</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoanApplicationDetailPage() {
  return (
    <ErrorBoundary>
      <LoanApplicationDetailContent />
    </ErrorBoundary>
  );
}
