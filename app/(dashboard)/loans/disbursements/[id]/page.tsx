"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Wallet,
  FileText,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  useDisbursement,
  useConfirmDisbursement,
  useRetryDisbursement,
  useCancelDisbursement,
} from "@/lib/api/hooks/useDisbursements";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
import { navigateTo } from "@/lib/utils/navigation";

function DisbursementDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Support both disbursementId (from URL) and applicationId (from query) for creating
  const id = params.id as string;
  const isCreateMode = searchParams.get("create") === "true";
  const applicationId = isCreateMode ? parseInt(id) : null;
  const disbursementId = !isCreateMode ? id : null;

  const { data: disbursementData, isLoading } = useDisbursement(
    disbursementId || undefined
  );
  const confirmMutation = useConfirmDisbursement();
  const retryMutation = useRetryDisbursement();
  const cancelMutation = useCancelDisbursement();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (isCreateMode && applicationId) {
    // Redirect to create page - this will be handled by a separate create page
    navigateTo(`/loans/disbursements?create=${applicationId}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!disbursementData?.data) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Disbursement not found</p>
        <Button
          variant="outline"
          onClick={() => navigateTo("/loans/disbursements")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Disbursements
        </Button>
      </div>
    );
  }

  const disbursement = disbursementData.data;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-500" },
      processing: { label: "Processing", className: "bg-blue-500" },
      completed: { label: "Completed", className: "bg-green-500" },
      failed: { label: "Failed", className: "bg-red-500" },
      cancelled: { label: "Cancelled", className: "bg-gray-500" },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-500",
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(disbursementId!);
      setConfirmDialogOpen(false);
      toast({
        title: "Success",
        description: "Disbursement confirmed",
      });
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const handleRetry = async () => {
    try {
      await retryMutation.mutateAsync(disbursementId!);
      setRetryDialogOpen(false);
      toast({
        title: "Success",
        description: "Disbursement retry initiated",
      });
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason",
        variant: "destructive",
      });
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        disbursementId: disbursementId!,
        reason: cancelReason,
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      toast({
        title: "Success",
        description: "Disbursement cancelled",
      });
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigateTo("/loans/disbursements")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Disbursement Details</h1>
            <p className="text-muted-foreground">
              Disbursement ID: {disbursementId}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(disbursement.disbursement_status)}
        </div>
      </div>

      <DashboardSection
        title="Disbursement Information"
        description="Complete disbursement details and transaction information"
        icon={Wallet}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Disbursement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">
                    Disbursement ID
                  </div>
                  <div className="font-mono">
                    {disbursement.disbursement_id}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">
                    Status
                  </div>
                  <div>{getStatusBadge(disbursement.disbursement_status)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">
                    Loan Application ID
                  </div>
                  <div>{disbursement.loan_application_id}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">
                    Payment Method
                  </div>
                  <div>
                    {disbursement.payment_method
                      ?.replace(/_/g, " ")
                      .toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">
                    Approved Amount
                  </div>
                  <div>
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(
                      parseFloat(disbursement.approved_loan_amount || 0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">
                    Net Disbursement
                  </div>
                  <div>
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(
                      parseFloat(disbursement.net_disbursement_amount || 0)
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amount Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved Amount:</span>
                <span>
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                  }).format(parseFloat(disbursement.approved_loan_amount || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Fee:</span>
                <span>
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                  }).format(parseFloat(disbursement.processing_fee || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance Fee:</span>
                <span>
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                  }).format(parseFloat(disbursement.insurance_fee || 0))}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                <span>Net Disbursement:</span>
                <span>
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                  }).format(
                    parseFloat(disbursement.net_disbursement_amount || 0)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {disbursement.payment_method_details && (
        <DashboardSection
          title="Payment Method Details"
          description="Payment method configuration and account information"
          icon={FileText}
        >
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded bg-muted p-4 text-sm">
                {JSON.stringify(disbursement.payment_method_details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </DashboardSection>
      )}

      {disbursement.transaction_reference && (
        <DashboardSection
          title="Transaction Reference"
          description="Transaction reference and tracking information"
          icon={FileText}
        >
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm">
                {disbursement.transaction_reference}
              </div>
            </CardContent>
          </Card>
        </DashboardSection>
      )}

      <DashboardSection
        title="Actions"
        description="Manage disbursement status and perform actions"
        icon={CheckCircle2}
      >
        <Card>
          <CardHeader>
            <CardTitle>Disbursement Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {disbursement.disbursement_status === "pending" && (
                <Dialog
                  open={confirmDialogOpen}
                  onOpenChange={setConfirmDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Disbursement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Disbursement</DialogTitle>
                      <DialogDescription>
                        Confirm that the disbursement has been completed
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        disabled={confirmMutation.isPending}
                      >
                        {confirmMutation.isPending
                          ? "Confirming..."
                          : "Confirm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {disbursement.disbursement_status === "failed" && (
                <Dialog
                  open={retryDialogOpen}
                  onOpenChange={setRetryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <RotateCw className="mr-2 h-4 w-4" />
                      Retry Disbursement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Retry Disbursement</DialogTitle>
                      <DialogDescription>
                        Retry the failed disbursement
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setRetryDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRetry}
                        disabled={retryMutation.isPending}
                      >
                        {retryMutation.isPending ? "Retrying..." : "Retry"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {["pending", "processing"].includes(
                disbursement.disbursement_status
              ) && (
                <Dialog
                  open={cancelDialogOpen}
                  onOpenChange={setCancelDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Disbursement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Disbursement</DialogTitle>
                      <DialogDescription>
                        Provide a reason for cancelling this disbursement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cancel-reason">
                          Cancellation Reason *
                        </Label>
                        <Textarea
                          id="cancel-reason"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Reason for cancellation..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCancelDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={cancelMutation.isPending || !cancelReason}
                      >
                        {cancelMutation.isPending
                          ? "Cancelling..."
                          : "Cancel Disbursement"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}

export default function DisbursementDetailsPage() {
  return (
    <ErrorBoundary>
      <DisbursementDetailsPageContent />
    </ErrorBoundary>
  );
}
