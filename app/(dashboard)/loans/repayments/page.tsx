"use client";

import React, { useState } from "react";
import { useRepaymentSchedule, usePaymentHistory, useRecordPayment } from "@/lib/api/hooks/useLoans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Receipt, Plus, AlertTriangle, Clock, DollarSign, Calendar, History } from "lucide-react";
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

function RepaymentsPageContent() {
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_amount: "",
    payment_method: "bank_transfer",
    payment_reference: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  
  const { data: schedule, isLoading: scheduleLoading } = useRepaymentSchedule(selectedLoanId);
  const { data: paymentHistory, isLoading: historyLoading } = usePaymentHistory(selectedLoanId);
  const recordPaymentMutation = useRecordPayment();
  const { toast } = useToast();
  
  const handleRecordPayment = async () => {
    if (!selectedLoanId || !paymentFormData.payment_amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await recordPaymentMutation.mutateAsync({
        loan_application_id: selectedLoanId,
        payment_date: paymentFormData.payment_date,
        payment_amount: parseFloat(paymentFormData.payment_amount),
        payment_method: paymentFormData.payment_method,
        payment_reference: paymentFormData.payment_reference,
      });
      setIsRecordPaymentDialogOpen(false);
      setPaymentFormData({
        payment_amount: "",
        payment_method: "bank_transfer",
        payment_reference: "",
        payment_date: new Date().toISOString().split("T")[0],
      });
    } catch (error: any) {
      // Error handled by mutation
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      partial: "bg-blue-500",
      overdue: "bg-red-500",
    };
    
    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {status.toUpperCase()}
      </Badge>
    );
  };
  
  const payments = paymentHistory?.data?.payments || [];
  const schedulePayments = schedule?.data?.payments || [];

  // Calculate overdue payments
  const overduePayments = schedulePayments.filter((payment: any) => {
    if (payment.payment_status === "overdue") return true;
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && payment.payment_status !== "paid";
  });

  // Calculate total overdue amount
  const totalOverdueAmount = overduePayments.reduce((sum: number, payment: any) => {
    return sum + (payment.due_amount || 0) - (payment.paid_amount || 0);
  }, 0);

  // Calculate days overdue for each payment
  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repayments</h1>
          <p className="text-muted-foreground">
            Manage loan repayments and payment schedules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            placeholder="Loan Application ID"
            className="w-48"
            onChange={(e) => setSelectedLoanId(e.target.value ? parseInt(e.target.value) : null)}
          />
          {selectedLoanId && (
            <Dialog open={isRecordPaymentDialogOpen} onOpenChange={setIsRecordPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment for loan application {selectedLoanId}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment_amount">Payment Amount (ETB)</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      value={paymentFormData.payment_amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={paymentFormData.payment_method}
                      onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_reference">Payment Reference</Label>
                    <Input
                      id="payment_reference"
                      value={paymentFormData.payment_reference}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_reference: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentFormData.payment_date}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRecordPaymentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      disabled={recordPaymentMutation.isPending}
                    >
                      {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {selectedLoanId && (
        <>
          {/* Overdue Alerts */}
          {overduePayments.length > 0 && (
            <DashboardSection
              title="Overdue Payments Alert"
              description={`${overduePayments.length} payment${overduePayments.length !== 1 ? "s" : ""} overdue requiring immediate attention`}
              icon={AlertTriangle}
              badge={{ label: `${overduePayments.length} Overdue`, variant: "destructive" }}
            >
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Overdue Amount:</span>
                    <span className="text-lg font-bold text-red-700 dark:text-red-400">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(totalOverdueAmount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {overduePayments.slice(0, 3).map((payment: any) => {
                      const daysOverdue = calculateDaysOverdue(payment.due_date);
                      return (
                        <div key={payment.payment_number} className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Payment #{payment.payment_number}</span>
                            <Badge variant="destructive">{daysOverdue} days overdue</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm font-medium mt-1">
                            Amount: {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(payment.due_amount || 0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </CardContent>
              </Card>
            </DashboardSection>
          )}

          <DashboardSection
            title="Repayment Schedule"
            description={`Scheduled payments for loan application ${selectedLoanId}`}
            icon={Calendar}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>
                  Complete repayment schedule with due dates and amounts
                </CardDescription>
              </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : schedulePayments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No repayment schedule found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Late Fee</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedulePayments.map((payment: any) => {
                      const daysOverdue = calculateDaysOverdue(payment.due_date);
                      const isOverdue = daysOverdue > 0 && payment.payment_status !== "paid";
                      return (
                        <TableRow 
                          key={payment.payment_number}
                          className={isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}
                        >
                          <TableCell>{payment.payment_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {new Date(payment.due_date).toLocaleDateString()}
                              {isOverdue && <Clock className="h-4 w-4 text-red-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(payment.due_amount || 0)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(payment.principal_amount || 0)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(payment.interest_amount || 0)}
                          </TableCell>
                          <TableCell>
                            {payment.late_fee || payment.allocated_late_fee ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {new Intl.NumberFormat("en-ET", {
                                  style: "currency",
                                  currency: "ETB",
                                }).format(payment.late_fee || payment.allocated_late_fee || 0)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">{daysOverdue} days</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(payment.payment_status)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            </Card>
          </DashboardSection>
          
          <DashboardSection
            title="Payment History"
            description={`Recorded payments and transaction history for loan application ${selectedLoanId}`}
            icon={History}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>
                  Complete payment history with details
                </CardDescription>
              </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payments recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell className="font-medium">
                          {payment.payment_id}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("en-ET", {
                            style: "currency",
                            currency: "ETB",
                          }).format(payment.payment_amount || 0)}
                        </TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.payment_status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          </DashboardSection>
        </>
      )}
      
      {!selectedLoanId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Enter a loan application ID to view repayment schedule and payment history
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RepaymentsPage() {
  return (
    <ErrorBoundary>
      <RepaymentsPageContent />
    </ErrorBoundary>
  );
}
