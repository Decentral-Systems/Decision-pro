"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTopCustomers } from "@/lib/api/hooks/useCustomerJourney";
import { TopCustomer } from "@/types/customer-intelligence";
import { formatCurrency, formatNumber, safeFormatDate } from "@/lib/utils/format";
import { Users, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { navigateTo } from "@/lib/utils/navigation";
import { useState } from "react";

export function TopCustomersWidget() {
  const [sortBy, setSortBy] = useState<"credit_score" | "revenue" | "loan_amount">("credit_score");
  const { data: customers, isLoading } = useTopCustomers(10, sortBy);

  const getRiskBadgeVariant = (riskCategory: string) => {
    switch (riskCategory?.toLowerCase()) {
      case "low":
        return "default";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      case "very_high":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
          </CardTitle>
          <CardDescription>Top performing customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
          </CardTitle>
          <CardDescription>Top performing customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No customer data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Customers
            </CardTitle>
            <CardDescription>Top performing customers</CardDescription>
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_score">Credit Score</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="loan_amount">Loan Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {customers.map((customer: TopCustomer, index: number) => (
            <div
              key={customer.customer_id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {customer.customer_name || `Customer ${customer.customer_id.slice(-8)}`}
                    </span>
                    <Badge variant={getRiskBadgeVariant(customer.risk_category) as any}>
                      {customer.risk_category}
                    </Badge>
                    <Badge variant="outline">{customer.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Score: {customer.credit_score}</span>
                    </div>
                    <span>Loans: {customer.total_loans}</span>
                    <span>Revenue: {formatCurrency(customer.total_revenue)}</span>
                    <span>Avg Loan: {formatCurrency(customer.average_loan_amount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last Activity: {safeFormatDate(customer.last_activity, "MMM dd, yyyy", "Never")}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigateTo(`/customers/${customer.customer_id}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button 
            variant="outline"
            onClick={() => navigateTo("/customers")}
          >
            View All Customers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

