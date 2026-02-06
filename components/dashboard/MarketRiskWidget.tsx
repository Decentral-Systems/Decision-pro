"use client";

import { useState, useMemo } from "react";
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
  useMarketRiskAnalysis,
  useMarketRiskHistorical,
  useMarketRiskSectors,
} from "@/lib/api/hooks/useRiskAlerts";
import type { ExecutiveDashboardData } from "@/types/dashboard";
import { ConcentrationRiskChart } from "@/components/charts/ConcentrationRiskChart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";
import { formatPercentage } from "@/lib/utils/format";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiStatusIndicator } from "@/components/api-status-indicator";

interface MarketRiskWidgetProps {
  executiveData?: ExecutiveDashboardData;
}

export function MarketRiskWidget({ executiveData }: MarketRiskWidgetProps) {
  const {
    data: marketRisk,
    isLoading,
    error: marketRiskError,
    refetch: refetchMarketRisk,
    isError: isMarketRiskError,
  } = useMarketRiskAnalysis();
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("90d");

  // Get historical data and sectors from API
  const days = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
  const {
    data: historicalApiData,
    isLoading: isLoadingHistorical,
    error: historicalError,
    refetch: refetchHistorical,
  } = useMarketRiskHistorical(days);
  const {
    data: sectorsApiData,
    isLoading: isLoadingSectors,
    error: sectorsError,
    refetch: refetchSectors,
  } = useMarketRiskSectors();

  const hasError = isMarketRiskError;
  const error = marketRiskError;

  // Extract concentration risk from executive dashboard if available
  // Use actual data only - no hardcoded defaults
  const concentrationRisk =
    executiveData?.portfolio_health?.concentration_risk ??
    (executiveData?.portfolio_health?.components?.diversification !== undefined
      ? (1 - executiveData.portfolio_health.components.diversification) * 100
      : 0); // Use 0 instead of hardcoded default

  // Use real historical data from API only - no synthetic data generation
  const historicalData = useMemo(() => {
    if (
      historicalApiData &&
      Array.isArray(historicalApiData) &&
      historicalApiData.length > 0
    ) {
      // Transform API data to chart format
      return historicalApiData
        .map((item: any) => ({
          date: item.date || item.date_str || "",
          concentrationRisk: item.concentration_risk || 0,
          thresholdLow: 10,
          thresholdMedium: 20,
          thresholdHigh: 30,
        }))
        .filter((item: any) => item.date); // Filter out invalid dates
    }

    // Return empty array if no API data - show empty state instead of synthetic data
    return [];
  }, [historicalApiData]);

  // Use real sector breakdown from API only - no hardcoded fallback
  const sectorBreakdown = useMemo(() => {
    if (
      sectorsApiData &&
      Array.isArray(sectorsApiData) &&
      sectorsApiData.length > 0
    ) {
      // Transform API data to chart format
      return sectorsApiData.map((sector: any) => ({
        name: sector.name,
        value: sector.value || 0,
        risk: sector.risk || "medium",
        count: sector.count || 0,
        average_score: sector.average_score || 0,
      }));
    }

    // Return empty array if no API data - show empty state instead of hardcoded fallback
    return [];
  }, [sectorsApiData]);

  // Get recommendations based on concentration level
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (concentrationRisk >= 30) {
      recs.push(
        "High concentration risk detected - consider portfolio diversification"
      );
      recs.push("Review exposure to top 5 sectors and reduce if necessary");
      recs.push("Implement risk limits for individual sector exposures");
    } else if (concentrationRisk >= 20) {
      recs.push(
        "Medium concentration risk - monitor sector allocations closely"
      );
      recs.push("Consider gradual diversification to reduce concentration");
    } else {
      recs.push(
        "Portfolio shows good diversification - maintain current allocation strategy"
      );
      recs.push("Continue monitoring sector concentrations regularly");
    }
    return recs;
  }, [concentrationRisk]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Market Risk Analysis
          </CardTitle>
          <CardDescription>
            Economic conditions and market impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show error state if API call failed
  if (hasError && error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Market Risk Analysis
          </CardTitle>
          <CardDescription>
            Economic conditions and market impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load market risk analysis.
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
                  refetchMarketRisk();
                  refetchHistorical();
                  refetchSectors();
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

  if (!marketRisk) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Market Risk Analysis
          </CardTitle>
          <CardDescription>
            Economic conditions and market impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={
              error
                ? (error as any)?.statusCode === 404
                  ? "Endpoint Not Found"
                  : (error as any)?.statusCode === 500
                    ? "Server Error"
                    : (error as any)?.statusCode === 503
                      ? "Service Unavailable"
                      : "Failed to Load Market Risk Data"
                : "No Market Risk Data Available"
            }
            description={
              error
                ? (error as any)?.statusCode === 404
                  ? "The market risk analysis API endpoint is not available. Please check if the service is properly configured."
                  : (error as any)?.statusCode === 500
                    ? "The server encountered an error while processing your request. Please try again later."
                    : (error as any)?.statusCode === 503
                      ? "The market risk analysis service is temporarily unavailable. Please try again in a few moments."
                      : "Unable to fetch market risk analysis. Please check your connection and try again."
                : "Market risk analysis data is not available. This may be due to insufficient portfolio data in the system."
            }
            variant={error ? "error" : "empty"}
            icon={<AlertTriangle className="h-8 w-8 text-muted-foreground" />}
            action={{
              label: "Retry",
              onClick: () => {
                refetchMarketRisk();
                refetchHistorical();
                refetchSectors();
              },
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Safe destructuring with defaults to prevent undefined access errors
  const market_conditions = marketRisk?.market_conditions || {
    economic_indicator: "neutral",
    market_volatility: "low",
    interest_rate_trend: "stable",
    inflation_rate: 0,
  };

  const portfolio_impact = marketRisk?.portfolio_impact || {
    overall_risk_score: 0,
    risk_category: "unknown",
    expected_loss: 0,
    value_at_risk: 0,
  };

  const economic_factors = marketRisk?.economic_factors || {
    gdp_growth: 0,
    unemployment_rate: 0,
    currency_stability: "stable",
  };

  const getIndicatorIcon = (indicator: string) => {
    switch (indicator) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Market Risk Analysis
            </CardTitle>
            <CardDescription>
              Economic conditions and market impact on portfolio
            </CardDescription>
          </div>
          <ApiStatusIndicator
            endpoint="/api/risk/market-analysis"
            label="Live"
            showResponseTime={true}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Market Conditions */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Market Conditions</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">
                  Economic Indicator
                </span>
                <Badge
                  variant={
                    market_conditions?.economic_indicator === "positive"
                      ? "default"
                      : market_conditions?.economic_indicator === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {market_conditions?.economic_indicator || "N/A"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">
                  Unemployment Rate
                </span>
                <span className="font-semibold">
                  {market_conditions?.unemployment_rate?.toFixed(1) || "0"}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">
                  Inflation Rate
                </span>
                <span className="font-semibold">
                  {market_conditions?.inflation_rate?.toFixed(1) || "0"}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">
                  GDP Growth
                </span>
                <span className="font-semibold">
                  {market_conditions?.gdp_growth?.toFixed(1) || "0"}%
                </span>
              </div>
            </div>
          </div>

          {/* Portfolio Impact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Portfolio Impact</h4>
            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estimated Default Rate
                </span>
                <span className="font-semibold text-red-600">
                  {portfolio_impact?.estimated_default_rate?.toFixed(2) ||
                    "0.00"}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Risk Adjustment
                </span>
                <span className="font-semibold">
                  {portfolio_impact?.risk_adjustment?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="mt-3 border-t pt-3">
                <p className="mb-1 text-sm font-medium">Recommended Strategy</p>
                <p className="text-sm text-muted-foreground">
                  {portfolio_impact?.recommended_strategy ||
                    "No specific strategy recommended"}
                </p>
              </div>
            </div>
          </div>

          {/* Economic Factors */}
          {economic_factors &&
            Array.isArray(economic_factors) &&
            economic_factors.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold">
                  Key Economic Factors
                </h4>
                <div className="space-y-2">
                  {economic_factors.slice(0, 5).map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-lg border p-3"
                    >
                      {getIndicatorIcon(factor.impact)}
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {factor.factor}
                          </span>
                          <Badge
                            variant={
                              factor.impact === "positive"
                                ? "default"
                                : factor.impact === "negative"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {factor.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {factor.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Historical Risk Trends */}
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-semibold">
              Historical Risk Trends ({timeRange})
            </h4>
            {isLoadingHistorical ? (
              <Skeleton className="h-48 w-full" />
            ) : historicalData && historicalData.length > 0 ? (
              <div className="h-48">
                <ConcentrationRiskChart data={historicalData} />
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Historical risk trend data is not available for the selected
                  time range.
                </AlertDescription>
              </Alert>
            )}
            <div className="mt-2 flex gap-2">
              <Button
                variant={timeRange === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("30d")}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === "90d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("90d")}
              >
                90 Days
              </Button>
              <Button
                variant={timeRange === "1y" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("1y")}
              >
                1 Year
              </Button>
            </div>
          </div>

          {/* Sector Breakdown */}
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-semibold">Sector Breakdown</h4>
            {isLoadingSectors ? (
              <Skeleton className="h-64 w-full" />
            ) : sectorBreakdown && sectorBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.risk === "low"
                              ? "#10b981"
                              : entry.risk === "medium"
                                ? "#f59e0b"
                                : "#ef4444"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sector breakdown data is not available. This may be due to
                  insufficient portfolio data.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Concentration Risk from Executive Dashboard */}
          {concentrationRisk !== undefined && (
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-semibold">
                Portfolio Concentration Risk
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">
                    Concentration Risk Score
                  </span>
                  <Badge
                    variant={
                      concentrationRisk < 20
                        ? "default"
                        : concentrationRisk < 30
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {formatPercentage(concentrationRisk / 100)} (Higher = More
                    Concentrated)
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on portfolio diversification analysis. Lower scores
                  indicate better diversification.
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
