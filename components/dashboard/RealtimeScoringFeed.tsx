"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeScoringFeed } from "@/lib/api/hooks/useRealtimeScoring";
import { formatCurrency, safeFormatDate } from "@/lib/utils/format";
import { Activity, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

export function RealtimeScoringFeed() {
  const { data: scores, isLoading } = useRealtimeScoringFeed(20);

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
            <Activity className="h-5 w-5" />
            Real-Time Scoring Feed
          </CardTitle>
          <CardDescription>Live credit scoring activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Scoring Feed
          </CardTitle>
          <CardDescription>Live credit scoring activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent scoring activity
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 animate-pulse" />
          Real-Time Scoring Feed
        </CardTitle>
        <CardDescription>Live credit scoring activity - Auto-refreshing every 5 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {scores.map((score: any, index: number) => (
            <Link
              key={score.id || index}
              href={`/customers/${score.customer_id}`}
              className="block p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Customer {score.customer_id?.slice(-8) || "N/A"}</span>
                    <Badge variant={getRiskBadgeVariant(score.risk_category)}>
                      {score.risk_category || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Score: {score.credit_score || score.score || "N/A"}</span>
                    </div>
                    {score.loan_amount && (
                      <span>Loan: {formatCurrency(score.loan_amount)}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {safeFormatDate(score.timestamp, "HH:mm:ss", "Just now")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

