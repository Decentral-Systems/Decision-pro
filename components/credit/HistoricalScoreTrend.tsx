/**
 * Historical Score Trend Component
 * Displays score trends with automatic retrieval of last 5 scores
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Sparkles, Download, Info } from "lucide-react";
import { useCreditScoringHistory } from "@/lib/api/hooks/useCreditScoringHistory";
import { CreditScoreTimeline } from "@/components/charts/CreditScoreTimeline";
import { format } from "date-fns";
import { exportToPDF } from "@/lib/utils/exportHelpers";

interface HistoricalScoreTrendProps {
  customerId: string;
  currentScore?: number;
  currentDate?: Date;
  className?: string;
}

export function HistoricalScoreTrend({
  customerId,
  currentScore,
  currentDate = new Date(),
  className,
}: HistoricalScoreTrendProps) {
  // Fetch last 5 scores
  const {
    data: historyData,
    isLoading,
    error,
  } = useCreditScoringHistory({
    customer_id: customerId,
    limit: 5,
  });

  const historyItems = historyData?.items || [];

  // Combine with current score if provided
  const allScores = currentScore
    ? [
        {
          id: "current",
          credit_score: currentScore,
          created_at: currentDate.toISOString(),
          risk_category: "unknown" as const,
        },
        ...historyItems,
      ]
    : historyItems;

  // Calculate trend
  const trend = useMemo(() => {
    if (allScores.length < 2) return null;

    const scores = allScores.map((item) => item.credit_score);
    const oldest = scores[scores.length - 1];
    const newest = scores[0];
    const change = newest - oldest;
    const changePercent = oldest > 0 ? (change / oldest) * 100 : 0;

    return {
      change,
      changePercent: Math.abs(changePercent),
      direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      significant: Math.abs(change) > 50,
    };
  }, [allScores]);

  // Prepare chart data
  const chartData = allScores
    .slice()
    .reverse()
    .map((item, index) => ({
      date: new Date(item.created_at).toISOString(),
      score: item.credit_score,
      risk: item.risk_category,
    }));

  const isFirstScore = historyItems.length === 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading score history...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>Failed to load score history</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score History
            </CardTitle>
            <CardDescription>
              {isFirstScore
                ? "This is the first credit score for this customer"
                : `Last ${allScores.length} credit scores`}
            </CardDescription>
          </div>
          {!isFirstScore && chartData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportToPDF(
                  {
                    title: "Credit Score Trend Report",
                    customerId,
                    scores: chartData,
                    trend,
                    generatedAt: new Date().toISOString(),
                  },
                  `credit-score-trend-${customerId}`
                );
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First Score Badge */}
        {isFirstScore && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">First Score</div>
              <div className="text-sm text-muted-foreground">
                This is the first credit score calculation for this customer.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Trend Indicator */}
        {trend && !isFirstScore && (
          <div className="flex items-center justify-between p-3 rounded-lg border-2 bg-muted/50">
            <div className="flex items-center gap-2">
              {trend.direction === "up" ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : trend.direction === "down" ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Minus className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <div className="font-semibold">
                  {trend.direction === "up" ? "Improving" : trend.direction === "down" ? "Declining" : "Stable"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {trend.change > 0 ? "+" : ""}
                  {trend.change.toFixed(0)} points (
                  {trend.changePercent.toFixed(1)}%)
                </div>
              </div>
            </div>
            {trend.significant && (
              <Badge
                variant={trend.direction === "up" ? "default" : "destructive"}
                className="ml-auto"
              >
                {trend.direction === "up" ? "Significant Improvement" : "Significant Decline"}
              </Badge>
            )}
          </div>
        )}

        {/* Trend Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Score Trend Over Time</div>
            <CreditScoreTimeline data={chartData} height={250} />
          </div>
        )}

        {/* Score List */}
        {allScores.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Recent Scores</div>
            <div className="space-y-2">
              {allScores.slice(0, 5).map((item, index) => {
                const isCurrent = index === 0 && currentScore !== undefined;
                const prevScore = allScores[index + 1]?.credit_score;
                const scoreChange = prevScore ? item.credit_score - prevScore : null;

                return (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono text-muted-foreground">
                        #{allScores.length - index}
                      </div>
                      <div>
                        <div className="font-semibold">{item.credit_score.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    {scoreChange !== null && (
                      <div className="flex items-center gap-1 text-xs">
                        {scoreChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : scoreChange < 0 ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-gray-600" />
                        )}
                        <span
                          className={
                            scoreChange > 0
                              ? "text-green-600"
                              : scoreChange < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }
                        >
                          {scoreChange > 0 ? "+" : ""}
                          {scoreChange.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allScores.length === 0 && !currentScore && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No historical scores available for this customer.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
