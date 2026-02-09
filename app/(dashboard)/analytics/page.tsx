"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricsSkeleton } from "@/components/common/EnhancedSkeleton";
import { ComparisonMode } from "@/components/dashboard/ComparisonMode";
import { DashboardCustomization } from "@/components/dashboard/DashboardCustomization";
import { KeyboardShortcutsDialog } from "@/components/dashboard/KeyboardShortcutsDialog";
import { usePageShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useAnalyticsData,
  useRiskDistribution,
  useApprovalRates,
  usePortfolioMetrics,
  usePreviousPeriodMetrics,
} from "@/lib/api/hooks/useAnalytics";
// Lazy load heavy chart components for better performance
const WaterfallChart = dynamic(
  () =>
    import("@/components/charts/WaterfallChart").then((mod) => ({
      default: mod.WaterfallChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
);
const SunburstChart = dynamic(
  () =>
    import("@/components/charts/SunburstChart").then((mod) => ({
      default: mod.SunburstChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
);
const MetricTrend = dynamic(
  () =>
    import("@/components/charts/MetricTrend").then((mod) => ({
      default: mod.MetricTrend,
    })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  }
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Download,
  Minus,
  BarChart3,
  PieChart,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { exportToCSV, exportToCSVSync } from "@/lib/utils/exportHelpers";
import { formatLastUpdated } from "@/lib/utils/cacheMetadata";
import { getCacheMetadata } from "@/lib/utils/cacheMetadata";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/lib/auth/auth-context";

// Helper function to ensure value is an array (defined outside component to avoid JSX parsing issues)
function ensureArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

// Wrap the main component content in a function that uses useSearchParams
function AnalyticsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [comparisonPeriods, setComparisonPeriods] = useState<any[]>([]);
  const { user } = useAuth();

  // Keyboard shortcuts for analytics page
  usePageShortcuts([
    {
      key: "e",
      ctrl: true,
      action: () => {
        // Export data
        const exportButton = document.querySelector(
          'button:has-text("Export")'
        ) as HTMLButtonElement;
        if (exportButton) exportButton.click();
      },
      description: "Export analytics data",
      global: false,
    },
  ]);

  // Initialize state from URL params
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    (searchParams.get("timeframe") as "daily" | "weekly" | "monthly") ||
      "monthly"
  );

  // Track if component is mounted (client-side) to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync timeframe to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (timeframe !== "monthly") {
      params.set("timeframe", timeframe);
    } else {
      params.delete("timeframe");
    }
    router.replace(`/analytics?${params.toString()}`, { scroll: false });
  }, [timeframe, router, searchParams]);
  const {
    data: analyticsDataFromAPI,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalyticsData({
    time_range: timeframe,
  });
  const {
    data: portfolioMetrics,
    isLoading: portfolioLoading,
    refetch: refetchPortfolio,
  } = usePortfolioMetrics({
    time_range: timeframe,
  });
  const {
    data: riskDistribution,
    isLoading: riskLoading,
    refetch: refetchRisk,
  } = useRiskDistribution();
  const {
    data: approvalRates,
    isLoading: approvalLoading,
    refetch: refetchApproval,
  } = useApprovalRates(timeframe);
  const { data: previousPeriodData, isLoading: previousPeriodLoading } =
    usePreviousPeriodMetrics(timeframe);

  // Get cache metadata for last-updated timestamp (only on client after mount)
  const analyticsCacheMetadata = isMounted
    ? getCacheMetadata("analytics")
    : null;

  const isLoading =
    analyticsLoading ||
    portfolioLoading ||
    riskLoading ||
    approvalLoading ||
    previousPeriodLoading;
  const error = analyticsError;
  const hasAnyData =
    analyticsDataFromAPI ||
    portfolioMetrics ||
    riskDistribution ||
    approvalRates;

  // Combine real data from multiple sources - no fallback data
  const analyticsData = {
    portfolio_metrics: portfolioMetrics ||
      analyticsDataFromAPI?.portfolio_metrics || {
        total_loans: 0,
        total_exposure: 0,
        average_loan_size: 0,
        average_credit_score: 0,
        npl_ratio: 0,
        default_rate: 0,
      },
    risk_distribution: ensureArray(
      riskDistribution || analyticsDataFromAPI?.risk_distribution
    ),
    approval_rates: ensureArray(
      approvalRates || analyticsDataFromAPI?.approval_rates
    ),
    revenue_trend: ensureArray(analyticsDataFromAPI?.revenue_trend),
    customer_segments: ensureArray(analyticsDataFromAPI?.customer_segments),
  };

  // Calculate comparative baselines (MoM/YoY)
  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0)
      return {
        value: current,
        percentage: current > 0 ? 100 : 0,
        trend: current > 0 ? "up" : "neutral",
      };
    const delta = current - previous;
    const percentage = (delta / previous) * 100;
    return {
      value: delta,
      percentage: Math.abs(percentage),
      trend: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
    };
  };

  // Get previous period data for comparison from API
  const previousPeriodMetrics = useMemo(() => {
    if (previousPeriodData?.portfolio_metrics) {
      return previousPeriodData.portfolio_metrics;
    }
    // Return null/empty if no data available - don't generate mock data
    return {
      total_exposure: 0,
      average_credit_score: 0,
      npl_ratio: 0,
      default_rate: 0,
    };
  }, [previousPeriodData]);

  const exposureDelta = calculateDelta(
    analyticsData.portfolio_metrics.total_exposure,
    previousPeriodMetrics.total_exposure
  );
  const scoreDelta = calculateDelta(
    analyticsData.portfolio_metrics.average_credit_score,
    previousPeriodMetrics.average_credit_score
  );
  const nplDelta = calculateDelta(
    analyticsData.portfolio_metrics.npl_ratio,
    previousPeriodMetrics.npl_ratio
  );
  const defaultDelta = calculateDelta(
    analyticsData.portfolio_metrics.default_rate,
    previousPeriodMetrics.default_rate
  );

  const handleRetry = () => {
    refetchAnalytics();
    refetchPortfolio();
    refetchRisk();
    refetchApproval();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <div className="text-muted-foreground">
            <span>
              Advanced analytics and insights for your portfolio
              {isMounted && analyticsCacheMetadata?.lastUpdated && (
                <span className="ml-2 text-xs">
                  • Last updated:{" "}
                  {formatLastUpdated(analyticsCacheMetadata.lastUpdated)}
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const exportData = [
                  ...analyticsData.revenue_trend.map((d: any) => ({
                    Date: d.date,
                    Revenue: d.value,
                  })),
                  ...(Array.isArray(analyticsData.risk_distribution)
                    ? analyticsData.risk_distribution.map((r: any) => ({
                        Category: r.category,
                        Count: r.count,
                        Percentage: r.percentage,
                        Exposure: r.total_exposure,
                      }))
                    : []),
                  ...(Array.isArray(analyticsData.approval_rates)
                    ? analyticsData.approval_rates.map((a: any) => ({
                        Period: a.period,
                        Approval_Rate: a.approval_rate,
                        Rejection_Rate: a.rejection_rate,
                        Pending_Rate: a.pending_rate || 0,
                      }))
                    : []),
                ];
                await exportToCSV(exportData, "analytics_export", undefined, {
                  includeSignature: true,
                  version: "1.0.0",
                  filterSummary: `Timeframe: ${timeframe}`,
                });
              } catch (error) {
                console.error("Export failed:", error);
              }
            }}
            disabled={!hasAnyData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <ApiStatusIndicator
            endpoint="/api/analytics"
            label="Live"
            showResponseTime={true}
          />
          <KeyboardShortcutsDialog />
          <DashboardCustomization
            page="analytics"
            availableSections={[
              "Portfolio Metrics",
              "Revenue & Customer Analytics",
              "Risk Distribution",
              "Approval Rates",
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (comparisonPeriods.length > 0) {
                setComparisonPeriods([]);
              } else {
                setComparisonPeriods([
                  {
                    id: "current",
                    label: "Current Period",
                    startDate: "",
                    endDate: "",
                    color: "#3b82f6",
                  },
                  {
                    id: "previous",
                    label: "Previous Period",
                    startDate: "",
                    endDate: "",
                    color: "#10b981",
                  },
                ]);
              }
            }}
          >
            <GitCompare className="mr-2 h-4 w-4" />
            {comparisonPeriods.length > 0
              ? "Disable Comparison"
              : "Enable Comparison"}
          </Button>
        </div>
      </div>

      {/* Comparison Mode */}
      {comparisonPeriods.length > 0 && (
        <ComparisonMode
          onCompare={setComparisonPeriods}
          defaultPeriods={comparisonPeriods}
        />
      )}

      {/* Error Alert */}
      {error && !hasAnyData && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div>
                <span className="font-semibold">
                  Failed to load analytics data from API.
                </span>
                <div className="mt-1 text-sm text-muted-foreground">
                  Error: {(error as any)?.message || "Unknown error occurred"}
                  {(error as any)?.statusCode &&
                    ` (Status: ${(error as any)?.statusCode})`}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasAnyData && (
        <EmptyState
          title="No Analytics Data"
          description="Analytics data is not available. This may be due to insufficient data or API connectivity issues."
          variant="empty"
          action={{
            label: "Retry",
            onClick: handleRetry,
          }}
        />
      )}

      {/* Portfolio Metrics */}
      <DashboardSection
        title="Portfolio Metrics"
        description="Key portfolio performance indicators with period-over-period comparisons"
        icon={BarChart3}
        actions={
          <Select
            value={timeframe}
            onValueChange={(value: "daily" | "weekly" | "monthly") =>
              setTimeframe(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        {isLoading ? (
          <MetricsSkeleton count={4} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Exposure
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      analyticsData.portfolio_metrics.total_exposure
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {exposureDelta.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : exposureDelta.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={`text-xs ${exposureDelta.trend === "up" ? "text-green-600" : exposureDelta.trend === "down" ? "text-red-600" : "text-muted-foreground"}`}
                    >
                      {exposureDelta.trend === "up"
                        ? "+"
                        : exposureDelta.trend === "down"
                          ? "-"
                          : ""}
                      {exposureDelta.percentage.toFixed(1)}% vs last period
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Across {analyticsData.portfolio_metrics.total_loans} loans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Credit Score
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.portfolio_metrics.average_credit_score}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {scoreDelta.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : scoreDelta.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={`text-xs ${scoreDelta.trend === "up" ? "text-green-600" : scoreDelta.trend === "down" ? "text-red-600" : "text-muted-foreground"}`}
                    >
                      {scoreDelta.trend === "up"
                        ? "+"
                        : scoreDelta.trend === "down"
                          ? "-"
                          : ""}
                      {scoreDelta.value.toFixed(0)} points vs last period
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Portfolio average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    NPL Ratio
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.portfolio_metrics.npl_ratio}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Non-performing loans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Default Rate
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.portfolio_metrics.default_rate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Portfolio defaults
                  </p>
                </CardContent>
              </Card>
            </>
          </div>
        )}
      </DashboardSection>

      {/* Charts Grid */}
      <DashboardSection
        title="Revenue & Customer Analytics"
        description="Revenue trends and customer segmentation analysis"
        icon={PieChart}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricTrend
                data={analyticsData.revenue_trend.map((d: any) => ({
                  name: d.date,
                  value: d.value,
                }))}
                color="#0ea5e9"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Segmentation</CardTitle>
                <CardDescription>Distribution by risk category</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const exportData = analyticsData.customer_segments.map(
                    (seg: any) => ({
                      Segment: seg.segment,
                      Count: seg.count,
                      Percentage: seg.percentage || 0,
                    })
                  );
                  exportToCSVSync(exportData, "customer_segmentation");
                }}
                disabled={
                  !analyticsData.customer_segments ||
                  analyticsData.customer_segments.length === 0
                }
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {analyticsData.customer_segments &&
              analyticsData.customer_segments.length > 0 ? (
                <SunburstChart
                  data={analyticsData.customer_segments.map((seg: any) => ({
                    name: seg.segment,
                    value: seg.count,
                  }))}
                  aria-label="Customer segmentation chart"
                />
              ) : (
                <EmptyState
                  title="No Segmentation Data"
                  description="Customer segmentation data is not available."
                  variant="empty"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* Risk Distribution */}
      <DashboardSection
        title="Risk Distribution"
        description="Portfolio exposure breakdown by risk category with detailed metrics"
        icon={AlertTriangle}
      >
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Portfolio exposure by risk category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(analyticsData.risk_distribution) &&
              analyticsData.risk_distribution.length > 0 ? (
                analyticsData.risk_distribution.map((risk: any) => (
                  <div key={risk.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {risk.category} Risk
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {risk.count} loans ({risk.percentage}%)
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(risk.total_exposure)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          risk.category === "low"
                            ? "bg-green-500"
                            : risk.category === "medium"
                              ? "bg-yellow-500"
                              : risk.category === "high"
                                ? "bg-orange-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${risk.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No risk distribution data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Rates</CardTitle>
            <CardDescription>Loan approval trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(analyticsData.approval_rates) &&
              analyticsData.approval_rates.length > 0 ? (
                analyticsData.approval_rates.map((rate: any) => (
                  <div key={rate.period} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{rate.period}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          Approved: {rate.approval_rate}%
                        </span>
                        <span className="text-red-600">
                          Rejected: {rate.rejection_rate}%
                        </span>
                        {rate.pending_rate && (
                          <span className="text-yellow-600">
                            Pending: {rate.pending_rate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-green-500"
                        style={{ width: `${rate.approval_rate}%` }}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${rate.rejection_rate}%` }}
                      />
                      {rate.pending_rate && (
                        <div
                          className="bg-yellow-500"
                          style={{ width: `${rate.pending_rate}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No approval rate data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}

// Main export with Suspense boundary
export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      }
    >
      <AnalyticsPageContent />
    </Suspense>
  );
}
