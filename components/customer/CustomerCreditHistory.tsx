"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditScoreTimeline } from "@/components/charts/CreditScoreTimeline";
import { safeFormatDate } from "@/lib/utils/format";
import { getCreditData } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { TrendingUp, TrendingDown, Activity, CreditCard } from "lucide-react";

interface CustomerCreditHistoryProps {
  data: Customer360Data;
}

export function CustomerCreditHistory({ data }: CustomerCreditHistoryProps) {
  const credit = getCreditData(data);
  
  const creditScore = credit.score || 0;
  const utilizationRatio = credit.utilization_ratio || 0;
  const paymentHistoryScore = credit.payment_history_score || 0;
  const creditHistoryLength = credit.credit_history_length || 0;
  const numberOfAccounts = credit.number_of_credit_accounts || 0;
  const availableCredit = credit.available_credit || 0;

  // Prepare timeline data
  const timelineData = (credit.history || []).map((entry: any) => ({
    date: entry.date || entry.timestamp || new Date().toISOString(),
    score: entry.score || entry.credit_score || creditScore,
    model_name: entry.model_name,
  }));

  // If no history, create a single point with current score
  if (timelineData.length === 0 && creditScore > 0) {
    timelineData.push({
      date: new Date().toISOString(),
      score: creditScore,
      model_name: "ensemble",
    });
  }

  return (
    <div className="space-y-6">
      {/* Credit Score Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Credit Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{creditScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 850</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{utilizationRatio.toFixed(1)}%</div>
            <div className="mt-2">
              <Badge variant={utilizationRatio < 30 ? "default" : utilizationRatio < 50 ? "secondary" : "destructive"}>
                {utilizationRatio < 30 ? "Excellent" : utilizationRatio < 50 ? "Good" : "High"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{paymentHistoryScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{numberOfAccounts}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Score Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Score History</CardTitle>
          <CardDescription>Historical credit score trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <CreditScoreTimeline data={timelineData} />
        </CardContent>
      </Card>

      {/* Credit Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Credit Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Credit History Length</span>
              <span className="font-medium">{creditHistoryLength} months</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Number of Accounts</span>
              <span className="font-medium">{numberOfAccounts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Credit</span>
              <span className="font-medium">ETB {availableCredit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Utilization Ratio</span>
              <span className="font-medium">{utilizationRatio.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment History Score</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{paymentHistoryScore.toFixed(0)}</span>
                {paymentHistoryScore >= 80 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Credit Score Range</span>
              <Badge variant="outline">300 - 850</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Score Category</span>
              <Badge variant={creditScore >= 750 ? "default" : creditScore >= 700 ? "secondary" : "outline"}>
                {creditScore >= 750 ? "Excellent" : creditScore >= 700 ? "Good" : creditScore >= 650 ? "Fair" : "Poor"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Credit Events */}
      {credit.history && credit.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Credit Events</CardTitle>
            <CardDescription>Latest changes to credit profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {credit.history.slice(-5).reverse().map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">Credit Score: {event.score || event.credit_score || creditScore}</p>
                    <p className="text-sm text-muted-foreground">
                      {safeFormatDate(event.date, "MMM dd, yyyy", "N/A")}
                    </p>
                  </div>
                  {event.change && (
                    <Badge variant={event.change > 0 ? "default" : "destructive"}>
                      {event.change > 0 ? "+" : ""}{event.change}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

