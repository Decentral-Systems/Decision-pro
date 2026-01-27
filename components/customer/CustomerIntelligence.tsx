"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { formatDate } from "@/lib/utils/customer360Transform";
import { Lightbulb, Target, TrendingUp, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { useCustomerIntelligence } from "@/lib/api/hooks/useCustomerIntelligence";
import { useMemo } from "react";

interface CustomerIntelligenceProps {
  data?: Customer360Data | null;
  customerId?: string;
}

export function CustomerIntelligence({ data, customerId }: CustomerIntelligenceProps) {
  // If data prop is provided, use it; otherwise fetch directly
  const hasIntelligenceData = data?.intelligence && (
    (data.intelligence.recommendations && data.intelligence.recommendations.length > 0) ||
    (data.intelligence.insights && data.intelligence.insights.length > 0) ||
    (data.intelligence.life_events && data.intelligence.life_events.length > 0)
  );

  // Fetch intelligence data directly if not in Customer360 data or if empty
  const { 
    data: fetchedIntelligence, 
    isLoading, 
    error, 
    refetch 
  } = useCustomerIntelligence(
    !hasIntelligenceData && customerId ? customerId : null
  );

  // Use fetched data if prop data is missing or empty, otherwise use prop data
  const intelligence = useMemo(() => {
    if (hasIntelligenceData && data?.intelligence) {
      return data.intelligence;
    }
    if (fetchedIntelligence) {
      return fetchedIntelligence;
    }
    return {};
  }, [data?.intelligence, fetchedIntelligence, hasIntelligenceData]);

  const recommendations = intelligence.recommendations || [];
  const insights = intelligence.insights || [];
  const lifeEvents = intelligence.life_events || [];

  // Show loading state only when fetching directly (not when using prop data)
  if (!hasIntelligenceData && isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Intelligence</CardTitle>
          <CardDescription>AI-powered insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state only when fetching directly
  if (!hasIntelligenceData && error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Intelligence</CardTitle>
          <CardDescription>AI-powered insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Failed to load intelligence data: {error.message || "Unknown error"}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered insights, recommendations, and life events
          </p>
        </div>
        {customerId && (
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Intelligence Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Product recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">AI-generated insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Life Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lifeEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Detected events</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Recommendations</CardTitle>
            <CardDescription>AI-powered product suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {rec.recommended_product || rec.product || rec.product_name || "Product Recommendation"}
                      </CardTitle>
                      <Badge
                        variant={
                          (rec.score || rec.recommendation_score || 0) >= 0.8
                            ? "default"
                            : (rec.score || rec.recommendation_score || 0) >= 0.6
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {((rec.score || rec.recommendation_score || 0) * 100).toFixed(0)}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Recommendation Score</span>
                          <span className="text-sm font-medium">
                            {((rec.score || rec.recommendation_score || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(rec.score || rec.recommendation_score || 0) * 100} />
                      </div>
                      {rec.description && (
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      )}
                      {rec.reason && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">Reason:</p>
                          <p className="text-sm">{rec.reason}</p>
                        </div>
                      )}
                      {rec.converted !== undefined && (
                        <Badge variant={rec.converted ? "default" : "outline"} className="mt-2">
                          {rec.converted ? "Converted" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
            <CardDescription>Behavioral patterns and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight: any, index: number) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{insight.title || insight.insight_type || "Insight"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description || insight.message || "No description available"}
                      </p>
                      {insight.confidence && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Confidence</span>
                            <span className="text-xs font-medium">
                              {(insight.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={insight.confidence * 100} className="h-1" />
                        </div>
                      )}
                      {insight.timestamp && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(insight.timestamp)}
                        </p>
                      )}
                      {insight.category && (
                        <Badge variant="outline" className="mt-2">
                          {insight.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Life Events */}
      {lifeEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Life Events</CardTitle>
            <CardDescription>Significant life changes detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lifeEvents.map((event: any, index: number) => (
                <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold capitalize">
                        {event.event_type || event.event || "Life Event"}
                      </h4>
                      {event.date && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(event.date || event.timestamp)}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                    {event.confidence && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Detection Confidence:</span>
                          <Badge variant="outline">
                            {(event.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    )}
                    {event.impact && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground capitalize">
                            Impact: {event.impact}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length === 0 && insights.length === 0 && lifeEvents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Intelligence</CardTitle>
            <CardDescription>AI-powered insights and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                No intelligence data available for this customer
              </div>
              {customerId && !isLoading && (
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



