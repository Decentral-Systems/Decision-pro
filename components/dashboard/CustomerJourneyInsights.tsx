"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCustomerJourneyInsights } from "@/lib/api/hooks/useCustomerJourney";
import type { CustomerJourneyInsights as CustomerJourneyInsightsType } from "@/types/customer-journey";
import { formatPercentage } from "@/lib/utils/format";
import { TrendingDown, TrendingUp, AlertCircle, Users, RefreshCw, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";

export function CustomerJourneyInsightsWidget() {
  const { data: insights, isLoading, error, refetch, isError } = useCustomerJourneyInsights() as { 
    data: CustomerJourneyInsightsType | null; 
    isLoading: boolean;
    error: any;
    refetch: () => void;
    isError: boolean;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Journey Insights
              </CardTitle>
              <CardDescription>Customer journey stage distribution and conversion metrics</CardDescription>
            </div>
            <ApiStatusIndicator 
              endpoint="/api/intelligence/journey/insights" 
              label="Live"
              showResponseTime={true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show error state if API call failed
  if (isError && error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Journey Insights
              </CardTitle>
              <CardDescription>Customer journey stage distribution and conversion metrics</CardDescription>
            </div>
            <ApiStatusIndicator 
              endpoint="/api/intelligence/journey/insights" 
              label="Live"
              showResponseTime={true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Failed to load customer journey insights.</span>
                <p className="text-sm mt-1 text-muted-foreground">
                  Error: {(error as any)?.message || "Unknown error occurred"}
                  {(error as any)?.statusCode && ` (Status: ${(error as any)?.statusCode})`}
                  {(error as any)?.correlationId && (
                    <span className="block text-xs mt-1 font-mono">
                      Correlation ID: {(error as any)?.correlationId}
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insights || !insights.stages || insights.stages.length === 0) {
    // Determine error type for better messaging
    const statusCode = (error as any)?.statusCode;
    let title = "No Journey Data Available";
    let description = "Customer journey insights data is not available.";
    
    if (statusCode === 404) {
      title = "Endpoint Not Found";
      description = "The customer journey insights API endpoint is not available. Please check if the service is properly configured.";
    } else if (statusCode === 500) {
      title = "Server Error";
      description = "The server encountered an error while processing your request. Please try again later.";
    } else if (statusCode === 503) {
      title = "Service Unavailable";
      description = "The customer journey service is temporarily unavailable. Please try again in a few moments.";
    } else if (error) {
      title = "Failed to Load Data";
      description = "Unable to fetch customer journey insights. Please check your connection and try again.";
    } else {
      description = "No customer journey data is available. This may be due to insufficient data in the system.";
    }
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Journey Insights
              </CardTitle>
              <CardDescription>Customer journey stage distribution and conversion metrics</CardDescription>
            </div>
            <ApiStatusIndicator 
              endpoint="/api/intelligence/journey/insights" 
              label="Live"
              showResponseTime={true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={title}
            description={description}
            variant={error ? "error" : "empty"}
            action={{
              label: "Retry",
              onClick: () => refetch()
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Handle both snake_case (API response) and camelCase (type definition) formats
  const totalCustomers = insights.metadata?.total_customers || 
    insights.statistics?.total_customers ||
    insights.stages.reduce((sum, stage) => {
      const count = (stage as any).customer_count || stage.customerCount || 0;
      return sum + count;
    }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Journey Insights
            </CardTitle>
            <CardDescription>
              {totalCustomers.toLocaleString()} total customers across journey stages
            </CardDescription>
          </div>
          <ApiStatusIndicator 
            endpoint="/api/intelligence/journey/insights" 
            label="Live"
            showResponseTime={true}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Journey Stages */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Journey Stages</h4>
            {insights.stages.map((stage) => {
              // Handle both snake_case (API) and camelCase (type) formats
              const customerCount = (stage as any).customer_count || stage.customerCount || 0;
              const percentageOfTotal = (stage as any).percentage_of_total ?? stage.percentageOfTotal ?? 0;
              const avgDuration = (stage as any).avg_duration_from_previous_stage_seconds ?? stage.avgDurationFromPreviousStageSeconds;
              
              return (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{stage.stage.replace("_", " ")}</span>
                      <Badge variant="outline">{customerCount.toLocaleString()} customers</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatPercentage(percentageOfTotal)}</span>
                    </div>
                  </div>
                  <Progress value={percentageOfTotal} className="h-2" />
                  {avgDuration && (
                    <div className="text-xs text-muted-foreground">
                      Avg Duration: {Math.round(avgDuration / 86400)} days
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Conversion Funnel */}
          {((insights as any).conversion_funnel || insights.conversionFunnel) && 
           ((insights as any).conversion_funnel || insights.conversionFunnel).length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold">Conversion Funnel</h4>
              {((insights as any).conversion_funnel || insights.conversionFunnel).map((edge: any, index: number) => {
                const fromStage = edge.from_stage || edge.fromStage || "";
                const toStage = edge.to_stage || edge.toStage || "";
                const count = edge.count || 0;
                const conversionRate = edge.conversion_rate ?? edge.conversionRate ?? 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {fromStage.replace("_", " ")} → {toStage.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{count} customers</Badge>
                        <span className={`text-sm font-medium flex items-center gap-1 ${
                          conversionRate >= 70 ? "text-green-600" :
                          conversionRate >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {conversionRate >= 70 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {conversionRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={conversionRate} 
                      className={`h-2 ${
                        conversionRate >= 70 ? "[&>div]:bg-green-500" :
                        conversionRate >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottlenecks */}
          {insights.bottlenecks && insights.bottlenecks.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Identified Bottlenecks
              </h4>
              {insights.bottlenecks.slice(0, 3).map((bottleneck, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    bottleneck.impact === "high"
                      ? "bg-destructive/10 border-destructive/20"
                      : bottleneck.impact === "medium"
                      ? "bg-orange-500/10 border-orange-500/20"
                      : "bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{bottleneck.stage}</span>
                    <Badge
                      variant={
                        bottleneck.impact === "high"
                          ? "destructive"
                          : bottleneck.impact === "medium"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {bottleneck.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{bottleneck.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Recommendation:</strong> {bottleneck.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

