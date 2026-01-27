"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { User, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency, getCreditScoreLabel, getRiskLevelColor } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { getMissingDataMessage } from "@/lib/utils/missingDataMessages";

interface CustomerOverviewProps {
  data: Customer360Data;
}

export function CustomerOverview({ data }: CustomerOverviewProps) {
  const profile = data.profile?.customer || data.profile || {};
  const credit = data.credit || {};
  const risk = data.risk || {};
  const loans = data.loans || {};

  const customerName = profile.full_name || profile.customer_name || profile.name || "Unknown Customer";
  const creditScore = credit.score || credit.credit_score || credit.ensemble_score || 0;
  const riskLevel = risk.level || risk.risk_level || "medium";
  const riskScore = risk.score || risk.risk_score || 0.5;
  const totalLoans = loans.total_loans || (loans.loans ? loans.loans.length : 0);
  const totalOutstanding = loans.total_outstanding || 0;
  const activeLoans = loans.active_loans || 0;

  const creditScoreLabel = getCreditScoreLabel(creditScore);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{customerName}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Customer ID: {data.customer_id || profile.customer_id || (
                    <span className="italic text-muted-foreground">
                      {getMissingDataMessage({ field: 'customer_id', category: 'personal' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Badge
              variant={riskLevel === "low" ? "default" : riskLevel === "medium" ? "secondary" : "destructive"}
              className="text-lg px-4 py-2"
            >
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).replace(/_/g, " ")} Risk
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditScore.toFixed(0)}</div>
            <p className={`text-xs mt-1 ${creditScoreLabel.color}`}>
              {creditScoreLabel.label}
            </p>
            <div className="mt-2">
              <Badge variant="outline" className={creditScoreLabel.color}>
                {creditScoreLabel.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeLoans} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(riskScore * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {riskLevel.replace(/_/g, " ")}
            </p>
            <div className="mt-2">
              <Badge className={getRiskLevelColor(riskLevel)}>
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).replace(/_/g, " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Score Gauge */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Score Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <GaugeChart
              value={creditScore}
              max={850}
              min={300}
              label="Credit Score"
              colors={{
                excellent: "#10b981",
                good: "#3b82f6",
                fair: "#f59e0b",
                poor: "#ef4444",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profile.monthly_income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profile.total_debt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(credit.available_credit)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



