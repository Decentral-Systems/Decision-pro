"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { BankingKPIs } from "@/types/dashboard";

interface BankingMetricsCardProps {
  kpis: BankingKPIs;
  className?: string;
}

function BankingMetricsCardComponent({ kpis, className }: BankingMetricsCardProps) {
  const getTrendIcon = (value?: number) => {
    if (!value) return null;
    return value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (value?: number) => {
    if (!value) return "text-muted-foreground";
    return value > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className || ""}`}>
      {/* Total Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Assets
          </CardTitle>
          {getTrendIcon(kpis.assets_growth)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.total_assets || 0)}</div>
          {kpis.assets_growth !== undefined && (
            <p className={`text-xs ${getTrendColor(kpis.assets_growth)}`}>
              {kpis.assets_growth > 0 ? "+" : ""}
              {kpis.assets_growth.toFixed(2)}% growth
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Deposits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Deposits
          </CardTitle>
          {getTrendIcon(kpis.deposits_growth)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.total_deposits || 0)}</div>
          {kpis.deposits_growth !== undefined && (
            <p className={`text-xs ${getTrendColor(kpis.deposits_growth)}`}>
              {kpis.deposits_growth > 0 ? "+" : ""}
              {kpis.deposits_growth.toFixed(2)}% growth
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Loans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Loans
          </CardTitle>
          {getTrendIcon(kpis.loans_growth)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.total_loans || 0)}</div>
          {kpis.loans_growth !== undefined && (
            <p className={`text-xs ${getTrendColor(kpis.loans_growth)}`}>
              {kpis.loans_growth > 0 ? "+" : ""}
              {kpis.loans_growth.toFixed(2)}% growth
            </p>
          )}
        </CardContent>
      </Card>

      {/* Net Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Income
          </CardTitle>
          {getTrendIcon(kpis.income_growth)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.net_income || 0)}</div>
          {kpis.income_growth !== undefined && (
            <p className={`text-xs ${getTrendColor(kpis.income_growth)}`}>
              {kpis.income_growth > 0 ? "+" : ""}
              {kpis.income_growth.toFixed(2)}% growth
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const BankingMetricsCard = memo(BankingMetricsCardComponent);



