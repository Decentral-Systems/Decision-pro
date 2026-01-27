"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoanPortfolioChart } from "@/components/charts/LoanPortfolioChart";
import { getLoansData, formatCurrency, formatDate } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Calendar, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanDetailsModal } from "./LoanDetailsModal";

interface CustomerLoansPortfolioProps {
  data: Customer360Data;
}

export function CustomerLoansPortfolio({ data }: CustomerLoansPortfolioProps) {
  const loansData = getLoansData(data);
  const loans = loansData.loans || [];
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewLoan = (loan: any) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loansData.total_loans}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loansData.active_loans}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Borrowed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(loansData.total_borrowed)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(loansData.total_outstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">Remaining to pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Portfolio Charts */}
      {loans.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Loan Distribution by Status</CardTitle>
              <CardDescription>Breakdown of loans by status</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanPortfolioChart loans={loans} chartType="pie" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Amounts by Type</CardTitle>
              <CardDescription>Total amounts by loan type</CardDescription>
            </CardHeader>
            <CardContent>
              <LoanPortfolioChart loans={loans} chartType="bar" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
          <CardDescription>Currently active loan accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.filter((loan: any) => loan.status === "active" || loan.status === "approved").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Loan Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Monthly Payment</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans
                  .filter((loan: any) => loan.status === "active" || loan.status === "approved")
                  .map((loan: any, index: number) => (
                    <TableRow key={loan.loan_id || index} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewLoan(loan)}>
                      <TableCell className="font-medium">{loan.loan_id || `LOAN-${index + 1}`}</TableCell>
                      <TableCell>{loan.loan_type || "N/A"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.loan_amount)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(loan.outstanding_balance || loan.remaining_balance)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.monthly_payment)}</TableCell>
                      <TableCell>
                        {loan.interest_rate ? `${(loan.interest_rate * 100).toFixed(2)}%` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                            {loan.status || "N/A"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewLoan(loan);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No active loans</div>
          )}
        </CardContent>
      </Card>

      {/* All Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>Complete loan history</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan: any, index: number) => (
                  <TableRow key={loan.loan_id || index} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewLoan(loan)}>
                    <TableCell className="font-medium">{loan.loan_id || `LOAN-${index + 1}`}</TableCell>
                    <TableCell>{loan.loan_type || "N/A"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(loan.loan_amount)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.outstanding_balance || loan.remaining_balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(loan.start_date)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(loan.end_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLoan(loan);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No loans found</div>
          )}
        </CardContent>
      </Card>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <LoanDetailsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          loan={selectedLoan}
        />
      )}
    </div>
  );
}



