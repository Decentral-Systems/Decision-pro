"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/lib/api/hooks/useRiskAlerts";
import { WatchlistCustomer } from "@/types/risk";
import { safeFormatDate } from "@/lib/utils/format";
import { Eye, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { navigateTo } from "@/lib/utils/navigation";

export function WatchlistWidget() {
  const { data: watchlistData, isLoading } = useWatchlist();

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
            <Shield className="h-5 w-5" />
            Customer Watchlist
          </CardTitle>
          <CardDescription>Customers requiring monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!watchlistData || !watchlistData.customers || watchlistData.customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Customer Watchlist
          </CardTitle>
          <CardDescription>Customers requiring monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No customers on watchlist
          </div>
        </CardContent>
      </Card>
    );
  }

  const { customers, total_count } = watchlistData;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Customer Watchlist
            </CardTitle>
            <CardDescription>Customers requiring monitoring</CardDescription>
          </div>
          <Badge variant="outline">{total_count} Customers</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {customers.slice(0, 10).map((customer: WatchlistCustomer) => (
            <div
              key={customer.customer_id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigateTo(`/customers/${customer.customer_id}`)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{customer.customer_name || `Customer ${customer.customer_id.slice(-8)}`}</span>
                  <Badge variant={getRiskBadgeVariant(customer.risk_category) as any}>
                    {customer.risk_category}
                  </Badge>
                  {customer.alert_count > 0 && (
                    <Badge variant="destructive">{customer.alert_count} Alerts</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Risk Score: {customer.current_risk_score}</span>
                  <span>Added: {safeFormatDate(customer.added_at, "MMM dd, yyyy", "Unknown")}</span>
                  {customer.last_alert_at && (
                    <span>Last Alert: {safeFormatDate(customer.last_alert_at, "MMM dd", "Never")}</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Reason: {customer.watchlist_reason}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(`/customers/${customer.customer_id}`);
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {customers.length > 10 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline"
              onClick={() => navigateTo("/compliance")}
            >
              View All {total_count} Customers
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

