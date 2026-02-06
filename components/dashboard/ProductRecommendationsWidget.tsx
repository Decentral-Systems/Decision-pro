"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useProductRecommendations,
  useRecommendationStats,
} from "@/lib/api/hooks/useProductIntelligence";
import { ProductRecommendation } from "@/types/product-intelligence";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { Package, TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiStatusIndicator } from "@/components/api-status-indicator";

export function ProductRecommendationsWidget() {
  const {
    data: recommendationsData,
    isLoading: isLoadingRecs,
    error: recommendationsError,
    refetch: refetchRecommendations,
    isError: isRecommendationsError,
  } = useProductRecommendations(undefined, 10);
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
    isError: isStatsError,
  } = useRecommendationStats();

  const hasError = isRecommendationsError || isStatsError;
  const error = recommendationsError || statsError;

  if (isLoadingRecs || isLoadingStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Recommendations
          </CardTitle>
          <CardDescription>
            Top product recommendations and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Handle both array and object response formats
  const recommendations = Array.isArray(recommendationsData)
    ? recommendationsData
    : (recommendationsData as any)?.recommendations || [];
  const statistics = stats || null;

  // Show error state if API call failed
  if (hasError && error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Recommendations
          </CardTitle>
          <CardDescription>
            Top product recommendations and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load product recommendations.
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Error: {(error as any)?.message || "Unknown error occurred"}
                  {(error as any)?.statusCode &&
                    ` (Status: ${(error as any)?.statusCode})`}
                  {(error as any)?.correlationId && (
                    <span className="mt-1 block font-mono text-xs">
                      Correlation ID: {(error as any)?.correlationId}
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => {
                  refetchRecommendations();
                  refetchStats();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Recommendations
            </CardTitle>
            <CardDescription>
              Top product recommendations and performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ApiStatusIndicator
              endpoint="/api/intelligence/products/recommendations"
              label="Live"
              showResponseTime={true}
            />
            {statistics && (
              <>
                <Badge variant="outline">
                  {formatPercentage(statistics.acceptance_rate || 0)} Acceptance
                </Badge>
                <Badge variant="default">
                  {statistics?.total_recommendations?.toLocaleString() || 0}{" "}
                  Total
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Statistics Summary */}
          {isLoadingStats ? (
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : statistics ? (
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Acceptance Rate
                </div>
                <div className="text-2xl font-bold">
                  {formatPercentage(statistics.acceptance_rate || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Accepted</div>
                <div className="text-2xl font-bold">
                  {statistics?.accepted_recommendations?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(statistics.revenue_generated || 0)}
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Statistics data is not available. Recommendations may still be
                shown below.
              </AlertDescription>
            </Alert>
          )}

          {/* Top Recommendations */}
          {recommendations.length > 0 ? (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              <h4 className="text-sm font-semibold">Recent Recommendations</h4>
              {recommendations
                .slice(0, 8)
                .map((rec: ProductRecommendation, index: number) => (
                  <div
                    key={`${rec.product_id ?? ""}-${rec.customer_id ?? ""}-${index}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {rec.product_name ||
                            (rec.product_type
                              ? rec.product_type.replace("_", " ")
                              : "Unknown Product")}
                        </span>
                        <Badge variant="outline">
                          {rec.product_type || "N/A"}
                        </Badge>
                        <Badge
                          variant={
                            rec.risk_assessment === "low"
                              ? "default"
                              : rec.risk_assessment === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {rec.risk_assessment} risk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>
                            Score:{" "}
                            {rec.recommendation_score?.toFixed(2) || "N/A"}
                          </span>
                        </div>
                        <span>
                          Amount:{" "}
                          {formatCurrency(rec.recommended_loan_amount || 0)}
                        </span>
                        <span>
                          Rate:{" "}
                          {rec.recommended_interest_rate?.toFixed(2) || "N/A"}%
                        </span>
                        <span>
                          Term: {rec.recommended_term_months || "N/A"} months
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Customer: {rec.customer_id?.slice(-8) || "Unknown"} |{" "}
                        {rec.reason || "No reason provided"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              title={
                recommendationsError
                  ? (recommendationsError as any)?.statusCode === 404
                    ? "Endpoint Not Found"
                    : (recommendationsError as any)?.statusCode === 500
                      ? "Server Error"
                      : (recommendationsError as any)?.statusCode === 503
                        ? "Service Unavailable"
                        : "Failed to Load Recommendations"
                  : "No Recent Recommendations"
              }
              description={
                recommendationsError
                  ? (recommendationsError as any)?.statusCode === 404
                    ? "The product recommendations API endpoint is not available. Please check if the service is properly configured."
                    : (recommendationsError as any)?.statusCode === 500
                      ? "The server encountered an error while processing your request. Please try again later."
                      : (recommendationsError as any)?.statusCode === 503
                        ? "The product recommendations service is temporarily unavailable. Please try again in a few moments."
                        : "Unable to fetch product recommendations. Please check your connection and try again."
                  : "No product recommendations are available. This may be due to insufficient data in the system."
              }
              variant={recommendationsError ? "error" : "empty"}
              action={{
                label: "Retry",
                onClick: () => {
                  refetchRecommendations();
                  refetchStats();
                },
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
