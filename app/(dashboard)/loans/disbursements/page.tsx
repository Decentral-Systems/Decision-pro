"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Eye, Play, RotateCw, X, Filter, Download, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, Wallet } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDisbursements,
  useProcessDisbursement,
  useRetryDisbursement,
  useCancelDisbursement,
  DisbursementFilters,
} from "@/lib/api/hooks/useDisbursements";
import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import { format } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import { useMemo } from "react";

function DisbursementsPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  
  // Action dialogs
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  
  // Build filters
  const filters: DisbursementFilters = {
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    payment_method: paymentMethodFilter && paymentMethodFilter !== "all" ? paymentMethodFilter : undefined,
    date_from: dateFromFilter || undefined,
    date_to: dateToFilter || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
  
  const { data, isLoading, error, refetch } = useDisbursements(filters);
  const processMutation = useProcessDisbursement();
  const retryMutation = useRetryDisbursement();
  const cancelMutation = useCancelDisbursement();
  
  const disbursements = data?.items || [];
  const total = data?.total || 0;

  // Calculate analytics
  const analytics = useMemo(() => {
    const pending = disbursements.filter((d: any) => d.disbursement_status === "pending").length;
    const processing = disbursements.filter((d: any) => d.disbursement_status === "processing").length;
    const completed = disbursements.filter((d: any) => d.disbursement_status === "completed").length;
    const failed = disbursements.filter((d: any) => d.disbursement_status === "failed").length;
    const totalAmount = disbursements.reduce((sum: number, d: any) => sum + (parseFloat(d.net_disbursement_amount || 0)), 0);
    const pendingAmount = disbursements
      .filter((d: any) => d.disbursement_status === "pending")
      .reduce((sum: number, d: any) => sum + (parseFloat(d.net_disbursement_amount || 0)), 0);
    const completedAmount = disbursements
      .filter((d: any) => d.disbursement_status === "completed")
      .reduce((sum: number, d: any) => sum + (parseFloat(d.net_disbursement_amount || 0)), 0);
    const failedAmount = disbursements
      .filter((d: any) => d.disbursement_status === "failed")
      .reduce((sum: number, d: any) => sum + (parseFloat(d.net_disbursement_amount || 0)), 0);

    return {
      pending,
      processing,
      completed,
      failed,
      totalAmount,
      pendingAmount,
      completedAmount,
      failedAmount,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [disbursements, total]);

  // Export functions
  const handleExportCSV = () => {
    const exportData = disbursements.map((d: any) => ({
      "Disbursement ID": d.disbursement_id,
      "Application #": d.application_number || "N/A",
      "Customer ID": d.customer_id || "N/A",
      "Amount": d.net_disbursement_amount || 0,
      "Payment Method": getPaymentMethodLabel(d.payment_method),
      "Status": d.disbursement_status,
      "Requested Date": d.requested_date ? format(new Date(d.requested_date), "yyyy-MM-dd") : "N/A",
      "Transaction Reference": d.transaction_reference || "N/A",
    }));
    exportToCSV(exportData, `disbursements_${format(new Date(), "yyyy-MM-dd")}`);
    toast({
      title: "Success",
      description: "Disbursements exported to CSV",
    });
  };

  const handleExportExcel = () => {
    const exportData = disbursements.map((d: any) => ({
      "Disbursement ID": d.disbursement_id,
      "Application #": d.application_number || "N/A",
      "Customer ID": d.customer_id || "N/A",
      "Amount": d.net_disbursement_amount || 0,
      "Payment Method": getPaymentMethodLabel(d.payment_method),
      "Status": d.disbursement_status,
      "Requested Date": d.requested_date ? format(new Date(d.requested_date), "yyyy-MM-dd") : "N/A",
      "Transaction Reference": d.transaction_reference || "N/A",
    }));
    exportToExcel(exportData, `disbursements_${format(new Date(), "yyyy-MM-dd")}`);
    toast({
      title: "Success",
      description: "Disbursements exported to Excel",
    });
  };
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
      processing: { label: "Processing", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
      completed: { label: "Completed", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
      failed: { label: "Failed", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
      cancelled: { label: "Cancelled", className: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
    };
    
    const config = statusConfig[status] || { label: status, className: "bg-gray-500/10 text-gray-700" };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };
  
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      mobile_money: "Mobile Money",
      cash: "Cash",
      cheque: "Cheque",
    };
    return labels[method] || method;
  };
  
  const handleProcess = async (disbursement: any) => {
    try {
      await processMutation.mutateAsync(disbursement.disbursement_id);
      setProcessDialogOpen(false);
      setSelectedDisbursement(null);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleRetry = async (disbursement: any) => {
    try {
      await retryMutation.mutateAsync(disbursement.disbursement_id);
      setRetryDialogOpen(false);
      setSelectedDisbursement(null);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleCancel = async () => {
    if (!selectedDisbursement || !cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await cancelMutation.mutateAsync({
        disbursementId: selectedDisbursement.disbursement_id,
        reason: cancelReason,
      });
      setCancelDialogOpen(false);
      setSelectedDisbursement(null);
      setCancelReason("");
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Disbursements</h1>
          <p className="text-muted-foreground">
            Manage loan fund disbursements through multiple payment methods
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <DashboardSection
        title="Disbursement Analytics"
        description="Key metrics and performance indicators for loan disbursements"
        icon={BarChart3}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Disbursements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending}</div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
              }).format(analytics.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completed}</div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
              }).format(analytics.completedAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.failed}</div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
              }).format(analytics.failedAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completed} of {total} completed
            </p>
          </CardContent>
        </Card>
        </div>
      </DashboardSection>
      
      {/* Filters */}
      <DashboardSection
        title="Filters"
        description="Filter disbursements by status, payment method, and date range"
        icon={Filter}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
          </CardContent>
        </Card>
      </DashboardSection>
      
      {/* Disbursement Queue */}
      <DashboardSection
        title="Disbursement Queue"
        description={`${total} disbursement${total !== 1 ? "s" : ""} found. Manage and process disbursements through various payment methods.`}
        icon={Wallet}
        badge={
          analytics.pending > 0
            ? { label: `${analytics.pending} Pending`, variant: "warning" }
            : analytics.failed > 0
            ? { label: `${analytics.failed} Failed`, variant: "destructive" }
            : undefined
        }
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Disbursements List</CardTitle>
                <CardDescription>
                  {total} disbursement{total !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {analytics.pending > 0 && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                    {analytics.pending} Pending
                  </Badge>
                )}
                {analytics.processing > 0 && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    {analytics.processing} Processing
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading disbursements</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : disbursements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No disbursements found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disbursement ID</TableHead>
                    <TableHead>Application #</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disbursements.map((disb: any) => {
                    // Calculate priority based on status and age
                    const requestedDate = disb.requested_date ? new Date(disb.requested_date) : null;
                    const daysPending = requestedDate 
                      ? Math.floor((Date.now() - requestedDate.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    const isHighPriority = disb.disbursement_status === "pending" && daysPending > 3;
                    const isUrgent = disb.disbursement_status === "pending" && daysPending > 7;

                    return (
                      <TableRow 
                        key={disb.id || disb.disbursement_id}
                        className={isUrgent ? "bg-red-50 dark:bg-red-950/20" : isHighPriority ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {disb.disbursement_id}
                            {isUrgent && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                            {isHighPriority && !isUrgent && (
                              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">High Priority</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{disb.application_number || "N/A"}</TableCell>
                        <TableCell>{disb.customer_id || "N/A"}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("en-ET", {
                            style: "currency",
                            currency: "ETB",
                          }).format(disb.net_disbursement_amount || 0)}
                        </TableCell>
                        <TableCell>{getPaymentMethodLabel(disb.payment_method)}</TableCell>
                        <TableCell>{getStatusBadge(disb.disbursement_status)}</TableCell>
                        <TableCell>
                          <div>
                            {disb.requested_date
                              ? format(new Date(disb.requested_date), "MMM dd, yyyy")
                              : "N/A"}
                            {daysPending > 0 && disb.disbursement_status === "pending" && (
                              <div className="text-xs text-muted-foreground">
                                {daysPending} day{daysPending !== 1 ? "s" : ""} pending
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigateTo(`/loans/disbursements/${disb.disbursement_id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {disb.disbursement_status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDisbursement(disb);
                                setProcessDialogOpen(true);
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {disb.disbursement_status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDisbursement(disb);
                                setRetryDialogOpen(true);
                              }}
                              title={disb.failure_reason ? `Failure: ${disb.failure_reason}` : "Retry failed disbursement"}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          )}
                          {(disb.disbursement_status === "pending" ||
                            disb.disbursement_status === "processing") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDisbursement(disb);
                                setCancelDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        </Card>
      </DashboardSection>
      
      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Disbursement</DialogTitle>
            <DialogDescription>
              Are you sure you want to process this disbursement? This will initiate the payment.
            </DialogDescription>
          </DialogHeader>
          {selectedDisbursement && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Disbursement ID:</strong> {selectedDisbursement.disbursement_id}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong>{" "}
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(selectedDisbursement.net_disbursement_amount || 0)}
              </p>
              <p className="text-sm">
                <strong>Payment Method:</strong> {getPaymentMethodLabel(selectedDisbursement.payment_method)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleProcess(selectedDisbursement)}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? "Processing..." : "Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Retry Dialog */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Retry Failed Disbursement</DialogTitle>
            <DialogDescription>
              Review failure details and retry the disbursement
            </DialogDescription>
          </DialogHeader>
          {selectedDisbursement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Disbursement ID:</strong> {selectedDisbursement.disbursement_id}
                </div>
                <div>
                  <strong>Amount:</strong>{" "}
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                  }).format(selectedDisbursement.net_disbursement_amount || 0)}
                </div>
                <div>
                  <strong>Payment Method:</strong> {getPaymentMethodLabel(selectedDisbursement.payment_method)}
                </div>
                <div>
                  <strong>Failed Date:</strong>{" "}
                  {selectedDisbursement.failed_at
                    ? format(new Date(selectedDisbursement.failed_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </div>
              </div>
              {selectedDisbursement.failure_reason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <strong className="text-red-600 dark:text-red-400">Failure Reason:</strong>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {selectedDisbursement.failure_reason}
                  </p>
                </div>
              )}
              {selectedDisbursement.error_details && (
                <div className="p-4 bg-muted rounded-lg">
                  <strong className="text-sm mb-2 block">Error Details:</strong>
                  <pre className="text-xs overflow-auto max-h-32">
                    {typeof selectedDisbursement.error_details === "string"
                      ? selectedDisbursement.error_details
                      : JSON.stringify(selectedDisbursement.error_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleRetry(selectedDisbursement)}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? "Retrying..." : "Retry Disbursement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Disbursement</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this disbursement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCancel}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
              variant="destructive"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Disbursement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DisbursementsPage() {
  return (
    <ErrorBoundary>
      <DisbursementsPageContent />
    </ErrorBoundary>
  );
}
