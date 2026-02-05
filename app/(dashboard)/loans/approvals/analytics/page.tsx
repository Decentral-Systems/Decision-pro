"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApprovalAnalytics } from "@/components/approvals/ApprovalAnalytics";
import { useApprovalAnalytics } from "@/lib/api/hooks/useLoans";
import { Calendar, BarChart3 } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

export default function ApprovalAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data, isLoading, error, refetch } = useApprovalAnalytics({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined
  });

  const analytics = data?.data || null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and metrics for approval workflows
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <DashboardSection
        title="Date Range Filter"
        description="Filter analytics by date range to analyze approval performance over specific periods"
        icon={Calendar}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()} className="flex-1">
                Apply Filter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Analytics Display */}
      <DashboardSection
        title="Approval Analytics"
        description="Comprehensive analytics and metrics for approval workflows including trends, performance, and decision patterns"
        icon={BarChart3}
      >
        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading analytics: {error.message}</p>
            </CardContent>
          </Card>
        )}

        <ApprovalAnalytics analytics={analytics} isLoading={isLoading} />
      </DashboardSection>
    </div>
  );
}
