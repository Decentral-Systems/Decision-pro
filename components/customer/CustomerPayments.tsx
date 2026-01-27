"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentTimelineChart } from "@/components/charts/PaymentTimelineChart";
import { formatCurrency, formatDate } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, XCircle, Clock, CalendarDays } from "lucide-react";
import { PaymentScheduleCalendar } from "./PaymentScheduleCalendar";

interface CustomerPaymentsProps {
  data: Customer360Data;
}

export function CustomerPayments({ data }: CustomerPaymentsProps) {
  const payments = data.payments?.history || data.payments?.payments || data.payments || [];
  const upcoming = data.payments?.upcoming || data.payments?.schedule || [];
  const paymentArray = Array.isArray(payments) ? payments : [];
  const loans = data.loans?.loans || data.loans || [];

  // Calculate payment metrics
  const totalPayments = paymentArray.length;
  const onTimePayments = paymentArray.filter(
    (p: any) => p.on_time || p.status === "completed" || p.status === "on_time"
  ).length;
  const latePayments = paymentArray.filter(
    (p: any) => p.on_time === false || p.status === "late" || p.status === "overdue"
  ).length;
  const onTimeRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Payment Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              On-Time Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{onTimePayments}</div>
            <p className="text-xs text-muted-foreground mt-1">{onTimeRate.toFixed(1)}% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Late Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latePayments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPayments > 0 ? ((latePayments / totalPayments) * 100).toFixed(1) : 0}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcoming.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Timeline */}
      {paymentArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History Timeline</CardTitle>
            <CardDescription>Payment activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentTimelineChart payments={paymentArray} chartType="line" />
          </CardContent>
        </Card>
      )}

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Complete payment transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentArray.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>On Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentArray
                  .sort((a: any, b: any) => {
                    const dateA = new Date(a.date || a.timestamp || 0).getTime();
                    const dateB = new Date(b.date || b.timestamp || 0).getTime();
                    return dateB - dateA;
                  })
                  .slice(0, 20)
                  .map((payment: any, index: number) => {
                    const isOnTime = payment.on_time || payment.status === "completed" || payment.status === "on_time";
                    return (
                      <TableRow key={payment.payment_id || index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(payment.date || payment.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.payment_id || `PAY-${index + 1}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{payment.method || payment.payment_method || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "completed" || payment.status === "on_time"
                                ? "default"
                                : payment.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {payment.status || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isOnTime ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No payment history available</div>
          )}
        </CardContent>
      </Card>

      {/* Payment Schedule Calendar */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Upcoming Payments Table</TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          {upcoming.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>Scheduled future payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Days Until Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((payment: any, index: number) => {
                      const dueDate = new Date(payment.due_date || payment.date || payment.timestamp);
                      const daysUntilDue = Math.ceil(
                        (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <TableRow key={payment.payment_id || index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(payment.due_date || payment.date || payment.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.payment_id || `PAY-${index + 1}`}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "pending" ? "secondary" : "outline"}>
                              {payment.status || "Scheduled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={daysUntilDue <= 7 ? "destructive" : daysUntilDue <= 14 ? "default" : "secondary"}>
                              {daysUntilDue} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">No upcoming payments scheduled</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <PaymentScheduleCalendar payments={upcoming} loans={loans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



