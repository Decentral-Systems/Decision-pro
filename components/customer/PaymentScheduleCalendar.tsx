"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/customer360Transform";
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaymentScheduleCalendarProps {
  payments: any[];
  loans?: any[];
}

export function PaymentScheduleCalendar({ payments, loans = [] }: PaymentScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Get all upcoming payments from both payments array and loans
  const getAllUpcomingPayments = () => {
    const allPayments: any[] = [];

    // Add payments from payments array
    payments.forEach((payment) => {
      if (payment.due_date || payment.date || payment.timestamp) {
        const dueDate = new Date(payment.due_date || payment.date || payment.timestamp);
        if (dueDate >= new Date()) {
          allPayments.push({
            ...payment,
            dueDate: dueDate.toISOString(),
            source: "payment",
          });
        }
      }
    });

    // Generate payment schedule from loans
    loans.forEach((loan) => {
      if (loan.status === "active" || loan.status === "approved") {
        const monthlyPayment = loan.monthly_payment || 0;
        const startDate = loan.start_date ? new Date(loan.start_date) : new Date();
        const remainingPayments = loan.remaining_payments || 12;
        const loanId = loan.loan_id || "N/A";

        for (let i = 0; i < Math.min(remainingPayments, 12); i++) {
          const paymentDate = new Date(startDate);
          paymentDate.setMonth(paymentDate.getMonth() + i);
          
          if (paymentDate >= new Date()) {
            allPayments.push({
              payment_id: `${loanId}-PAY-${i + 1}`,
              loan_id: loanId,
              amount: monthlyPayment,
              dueDate: paymentDate.toISOString(),
              source: "loan",
              loan_type: loan.loan_type,
            });
          }
        }
      }
    });

    return allPayments.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  };

  const upcomingPayments = getAllUpcomingPayments();

  // Get payments for current month/week
  const getPaymentsForPeriod = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(start.getDate() + 6);
    }

    return upcomingPayments.filter((payment) => {
      const paymentDate = new Date(payment.dueDate);
      return paymentDate >= start && paymentDate <= end;
    });
  };

  const periodPayments = getPaymentsForPeriod();

  // Group payments by date
  const paymentsByDate = periodPayments.reduce((acc, payment) => {
    const dateKey = new Date(payment.dueDate).toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(payment);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate totals
  const totalAmount = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdueCount = periodPayments.filter((p) => {
    const dueDate = new Date(p.dueDate);
    return dueDate < new Date() && p.status !== "completed";
  }).length;

  const navigatePeriod = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getPaymentStatus = (payment: any) => {
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (payment.status === "completed" || payment.status === "paid") {
      return { label: "Paid", variant: "default" as const, icon: CheckCircle2 };
    }
    if (daysUntilDue < 0) {
      return { label: "Overdue", variant: "destructive" as const, icon: XCircle };
    }
    if (daysUntilDue <= 7) {
      return { label: "Due Soon", variant: "default" as const, icon: AlertTriangle };
    }
    return { label: "Upcoming", variant: "outline" as const, icon: Clock };
  };

  const formatPeriodLabel = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      const start = new Date(currentDate);
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Payment Schedule Calendar
              </CardTitle>
              <CardDescription>Upcoming payment schedule and due dates</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "month" ? "week" : "month")}
              >
                {viewMode === "month" ? "Week View" : "Month View"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => navigatePeriod("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold">{formatPeriodLabel()}</div>
            <Button variant="outline" size="sm" onClick={() => navigatePeriod("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Due This Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">{periodPayments.length} payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingPayments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Total scheduled</p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Grid */}
          {viewMode === "month" ? (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());

                const days = [];
                const currentDay = new Date(startDate);

                for (let i = 0; i < 42; i++) {
                  const dateKey = currentDay.toISOString().split("T")[0];
                  const dayPayments = paymentsByDate[dateKey] || [];
                  const isCurrentMonth = currentDay.getMonth() === month;
                  const isToday = dateKey === new Date().toISOString().split("T")[0];

                  days.push(
                    <div
                      key={i}
                      className={`min-h-24 p-2 border rounded-lg ${
                        !isCurrentMonth ? "opacity-50 bg-muted/30" : "bg-background"
                      } ${isToday ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="text-sm font-medium mb-1">{currentDay.getDate()}</div>
                      <div className="space-y-1">
                        {dayPayments.slice(0, 3).map((payment, idx) => {
                          const status = getPaymentStatus(payment);
                          const StatusIcon = status.icon;
                          return (
                            <div
                              key={idx}
                              className="text-xs p-1 rounded bg-muted hover:bg-muted/80 cursor-pointer"
                              title={`${formatCurrency(payment.amount)} - ${payment.loan_id || payment.payment_id}`}
                            >
                              <div className="flex items-center gap-1">
                                <StatusIcon className="h-3 w-3" />
                                <span className="truncate">{formatCurrency(payment.amount)}</span>
                              </div>
                            </div>
                          );
                        })}
                        {dayPayments.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayPayments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  currentDay.setDate(currentDay.getDate() + 1);
                }

                return days;
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              {periodPayments.map((payment, index) => {
                const status = getPaymentStatus(payment);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {payment.loan_id ? `Loan: ${payment.loan_id}` : `Payment: ${payment.payment_id || "N/A"}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(payment.dueDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(payment.amount)}</div>
                        {payment.loan_type && (
                          <div className="text-xs text-muted-foreground">{payment.loan_type}</div>
                        )}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
              {periodPayments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payments scheduled for this period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

