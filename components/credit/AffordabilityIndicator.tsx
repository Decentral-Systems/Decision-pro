/**
 * Affordability Indicator Component
 * Shows real-time 1/3 salary rule calculation with charts
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { validationService, AffordabilityCalculation } from "@/lib/services/validation-service";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface AffordabilityIndicatorProps {
  loanAmount?: number;
  monthlyIncome?: number;
  loanTermMonths?: number;
  className?: string;
}

export function AffordabilityIndicator({
  loanAmount,
  monthlyIncome,
  loanTermMonths,
  className,
}: AffordabilityIndicatorProps) {
  const affordability = useMemo<AffordabilityCalculation | null>(() => {
    if (loanAmount && monthlyIncome && loanTermMonths) {
      return validationService.calculateAffordability(loanAmount, monthlyIncome, loanTermMonths);
    }
    return null;
  }, [loanAmount, monthlyIncome, loanTermMonths]);

  if (!affordability || !loanAmount || !monthlyIncome || !loanTermMonths) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            Affordability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Enter loan parameters to see affordability analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = [
    {
      name: "Max Affordable",
      value: affordability.maxAffordablePayment,
      type: "limit",
    },
    {
      name: "Proposed Payment",
      value: affordability.proposedPayment,
      type: "proposed",
    },
  ];

  // Payment schedule data
  const paymentSchedule = Array.from({ length: Math.min(loanTermMonths, 12) }, (_, i) => ({
    month: i + 1,
    payment: affordability.proposedPayment,
    maxAffordable: affordability.maxAffordablePayment,
  }));

  const affordabilityPercentage = Math.min(affordability.affordabilityRatio * 100, 100);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Affordability Analysis (1/3 Salary Rule)
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time calculation based on monthly income
            </CardDescription>
          </div>
          {affordability.isAffordable ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Affordable
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Not Affordable
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affordability Status */}
        {!affordability.isAffordable && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Proposed payment exceeds 1/3 of monthly income. Maximum affordable loan:{" "}
              <strong>{affordability.maxAffordableLoan.toLocaleString()} ETB</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Affordability Ratio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Affordability Ratio</span>
            <span className="font-semibold">
              {(affordability.affordabilityRatio * 100).toFixed(1)}%
            </span>
          </div>
          <Progress
            value={affordabilityPercentage}
            className={`h-3 ${
              affordability.isAffordable ? "bg-green-100" : "bg-red-100"
            }`}
          />
          <div className="text-xs text-muted-foreground">
            {affordability.isAffordable
              ? "Within affordable limits"
              : "Exceeds affordable limits"}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="text-xs text-muted-foreground">Max Affordable Payment</div>
            <div className="font-bold text-lg">
              {affordability.maxAffordablePayment.toLocaleString()} ETB
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              (1/3 of {monthlyIncome.toLocaleString()} ETB)
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="text-xs text-muted-foreground">Proposed Payment</div>
            <div className="font-bold text-lg">
              {affordability.proposedPayment.toLocaleString()} ETB
            </div>
            <div className="text-xs text-muted-foreground mt-1">Monthly payment</div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="text-xs text-muted-foreground">Max Affordable Loan</div>
            <div className="font-bold text-lg">
              {affordability.maxAffordableLoan.toLocaleString()} ETB
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Over {loanTermMonths} months
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="text-xs text-muted-foreground">Proposed Loan</div>
            <div className="font-bold text-lg">{loanAmount.toLocaleString()} ETB</div>
            <div className="text-xs text-muted-foreground mt-1">
              {affordability.isAffordable ? (
                <span className="text-green-600">✓ Within limits</span>
              ) : (
                <span className="text-red-600">
                  Exceeds by{" "}
                  {(loanAmount - affordability.maxAffordableLoan).toLocaleString()} ETB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Payment Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} ETB`, ""]}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill={affordability.isAffordable ? "#22c55e" : "#ef4444"}
                radius={[4, 4, 0, 0]}
              />
              {!affordability.isAffordable && (
                <ReferenceLine
                  y={affordability.maxAffordablePayment}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{ value: "Max Affordable", position: "right" }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Schedule (First 12 months) */}
        {loanTermMonths > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Payment Schedule (First 12 Months)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={paymentSchedule}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} ETB`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="payment"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Proposed Payment"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="maxAffordable"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Max Affordable"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
