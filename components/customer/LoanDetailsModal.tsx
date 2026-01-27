"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/customer360Transform";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Calendar,
  Percent,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoanDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
}

export function LoanDetailsModal({ open, onOpenChange, loan }: LoanDetailsModalProps) {
  if (!loan) return null;

  const loanAmount = loan.loan_amount || 0;
  const outstandingBalance = loan.outstanding_balance || loan.remaining_balance || 0;
  const paidAmount = loanAmount - outstandingBalance;
  const progressPercentage = loanAmount > 0 ? (paidAmount / loanAmount) * 100 : 0;
  const monthlyPayment = loan.monthly_payment || 0;
  const interestRate = loan.interest_rate || 0;
  const startDate = loan.start_date || loan.created_at;
  const endDate = loan.end_date || loan.maturity_date;
  const loanTerm = loan.loan_term_months || loan.term_months || 0;
  const remainingPayments = loan.remaining_payments || 0;

  // Calculate payment schedule (next 12 months or until loan ends)
  const generatePaymentSchedule = () => {
    if (!startDate || !monthlyPayment) return [];
    const schedule = [];
    const start = new Date(startDate);
    const today = new Date();
    
    for (let i = 0; i < Math.min(remainingPayments || 12, 12); i++) {
      const paymentDate = new Date(start);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      if (paymentDate >= today) {
        schedule.push({
          paymentNumber: i + 1,
          dueDate: paymentDate.toISOString(),
          amount: monthlyPayment,
          status: paymentDate < today ? "overdue" : "upcoming",
        });
      }
    }
    return schedule;
  };

  const paymentSchedule = generatePaymentSchedule();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Loan Details: {loan.loan_id || "N/A"}
          </DialogTitle>
          <DialogDescription>
            Complete information and payment schedule for this loan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Loan Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loan Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(loanAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">Original amount</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(outstandingBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">Remaining to pay</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Interest Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(interestRate * 100).toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Annual rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per month</p>
              </CardContent>
            </Card>
          </div>

          {/* Loan Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Progress</CardTitle>
              <CardDescription>Payment progress and remaining balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Paid: {formatCurrency(paidAmount)}</span>
                  <span className="text-sm font-medium">Remaining: {formatCurrency(outstandingBalance)}</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progressPercentage.toFixed(1)}% complete</span>
                  <span>{remainingPayments || 0} payments remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Loan ID</span>
                    <span className="font-medium">{loan.loan_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Loan Type</span>
                    <Badge variant="outline">{loan.loan_type || "N/A"}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        loan.status === "active" || loan.status === "approved"
                          ? "default"
                          : loan.status === "completed" || loan.status === "paid"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {loan.status || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Loan Term</span>
                    <span className="font-medium">{loanTerm} months</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </span>
                    <span className="font-medium">{formatDate(startDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </span>
                    <span className="font-medium">{formatDate(endDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Interest</span>
                    <span className="font-medium">
                      {formatCurrency((loanAmount * interestRate * loanTerm) / 12 - loanAmount + outstandingBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Remaining Payments</span>
                    <span className="font-medium">{remainingPayments || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          {paymentSchedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>Upcoming payment schedule for the next 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentSchedule.map((payment, index) => {
                      const isOverdue = payment.status === "overdue";
                      const dueDate = new Date(payment.dueDate);
                      const daysUntilDue = Math.ceil(
                        (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(payment.dueDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Overdue
                              </Badge>
                            ) : daysUntilDue <= 7 ? (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <Clock className="h-3 w-3" />
                                Due Soon ({daysUntilDue}d)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <CheckCircle2 className="h-3 w-3" />
                                Upcoming
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Additional Loan Details */}
          {loan.description || loan.purpose || loan.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loan.purpose && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Purpose: </span>
                      <span className="text-sm">{loan.purpose}</span>
                    </div>
                  )}
                  {loan.description && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Description: </span>
                      <span className="text-sm">{loan.description}</span>
                    </div>
                  )}
                  {loan.notes && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Notes: </span>
                      <span className="text-sm">{loan.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

