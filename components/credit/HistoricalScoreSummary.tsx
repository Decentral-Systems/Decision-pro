/**
 * Historical Score Summary Component
 * Shows score trend chart and change indicators
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Minus, Sparkles, Info, AlertTriangle } from "lucide-react";
import { FirstScoreWelcome } from "./FirstScoreWelcome";
import { useCreditScoringHistory } from "@/lib/api/hooks/useCreditScoringHistory";
import { CreditScoreTimeline } from "@/components/charts/CreditScoreTimeline";
import { format } from "date-fns";
import { useMemo } from "react";

interface HistoricalScoreSummaryProps {
  customerId: string;
  currentScore?: number;
  currentDate?: Date;
  className?: string;
  showTrendChart?: boolean;
}

export function HistoricalScoreSummary({
  customerId,
  currentScore,
  currentDate = new Date(),
  className,
  showTrendChart = true,
}: HistoricalScoreSummaryProps) {
  // Fetch last 10 scores for trend analysis
  const {
    data: historyData,
    isLoading,
    error,
  } = useCreditScoringHistory({
    customer_id: customerId,
    limit: 10,
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

  // Calculate trend analysis
  const trendAnalysis = useMemo(() => {
    if (allScores.length < 2) return null;

    const scores = allScores.map((item) => item.credit_score);
    const oldest = scores[scores.length - 1];
    const newest = scores[0];
    const change = newest - oldest;
    const changePercent = oldest > 0 ? (change / oldest) * 100 : 0;

    // Calculate trend direction (improving, declining, stable)
    const recentScores = scores.slice(0, 3); // Last 3 scores
    const isImproving = recentScores.every(
      (score, index) => index === 0 || score >= recentScores[index - 1]
    );
    const isDeclining = recentScores.every(
      (score, index) => index === 0 || score <= recentScores[index - 1]
    );

    let trendDirection: "improving" | "declining" | "stable" = "stable";
    if (isImproving && change > 10) trendDirection = "improving";
    else if (isDeclining && change < -10) trendDirection = "declining";

    // Predict next score (simple linear regression)
    const n = scores.length;
    const sumX = scores.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + i * score, 0);
    const sumX2 = scores.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predictedNext = intercept + slope * n;

    // Calculate volatility (standard deviation)
    const mean = sumY / n;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / n;
    const volatility = Math.sqrt(variance);

    return {
      change,
      changePercent: Math.abs(changePercent),
      direction: trendDirection,
      significant: Math.abs(change) > 50,
      predictedNext: Math.max(300, Math.min(850, predictedNext)), // Clamp to valid range
      volatility,
      isStable: volatility < 20,
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
      index,
    }));

  const isFirstScore = historyItems.length === 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
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
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Score History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="text-xs">Failed to load score history</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4" />
          Historical Score Summary
        </CardTitle>
        <CardDescription className="text-xs">
          {isFirstScore
            ? "This is the first credit score for this customer"
            : `Last ${allScores.length} credit scores`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First Score Badge */}
        {isFirstScore && (
          <FirstScoreWelcome
            customerId={customerId}
            className="mb-4"
          />
        )}

        {/* Trend Analysis */}
        {trendAnalysis && !isFirstScore && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border-2 bg-muted/50">
              <div className="flex items-center gap-2">
                {trendAnalysis.direction === "improving" ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : trendAnalysis.direction === "declining" ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <div className="font-semibold capitalize">{trendAnalysis.direction}</div>
                  <div className="text-sm text-muted-foreground">
                    {trendAnalysis.change > 0 ? "+" : ""}
                    {trendAnalysis.change.toFixed(0)} points (
                    {trendAnalysis.changePercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
              {trendAnalysis.significant && (
                <Badge
                  variant={trendAnalysis.direction === "improving" ? "default" : "destructive"}
                  className="ml-auto"
                >
                  {trendAnalysis.direction === "improving"
                    ? "Significant Improvement"
                    : "Significant Decline"}
                </Badge>
              )}
            </div>

            {/* Prediction with Alert */}
            {trendAnalysis.predictedNext && (
              <div className="space-y-2">
                <div className="p-2 rounded border bg-muted/30">
                  <div className="text-xs font-semibold mb-1">Predicted Next Score</div>
                  <div className="text-lg font-bold">{trendAnalysis.predictedNext.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">
                    Based on {allScores.length} historical scores
                  </div>
                </div>
                {/* Alert for significant predicted changes */}
                {Math.abs(trendAnalysis.predictedNext - (currentScore || allScores[0]?.credit_score || 0)) > 50 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <div className="font-semibold">Significant Change Predicted</div>
                      <div className="text-muted-foreground">
                        Predicted score differs by{" "}
                        {Math.abs(trendAnalysis.predictedNext - (currentScore || allScores[0]?.credit_score || 0)).toFixed(0)} points
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Volatility Indicator */}
            {trendAnalysis.volatility !== undefined && (
              <div className="flex items-center justify-between text-xs p-2 rounded border">
                <span className="text-muted-foreground">Score Stability</span>
                <Badge variant={trendAnalysis.isStable ? "outline" : "secondary"}>
                  {trendAnalysis.isStable ? "Stable" : "Volatile"} (σ={trendAnalysis.volatility.toFixed(1)})
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Trend Chart */}
        {showTrendChart && chartData.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Score Trend</div>
            <CreditScoreTimeline data={chartData} height={200} />
          </div>
        )}

        {/* Recent Scores List */}
        {allScores.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Recent Scores</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allScores.slice(0, 5).map((item, index) => {
                const isCurrent = index === 0 && currentScore !== undefined;
                const prevScore = allScores[index + 1]?.credit_score;
                const scoreChange = prevScore ? item.credit_score - prevScore : null;

                return (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-2 rounded border text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-mono text-muted-foreground w-8">
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
            <AlertDescription className="text-xs">
              No historical scores available for this customer.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
