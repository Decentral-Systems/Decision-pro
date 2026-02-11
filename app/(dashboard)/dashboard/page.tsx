"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useDashboardData } from "@/lib/api/hooks/useDashboard";
import { useExecutiveDashboardData } from "@/lib/api/hooks/useExecutiveDashboard";

import {
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Download,
  TrendingUp,
  BarChart3,
  Building2,
  Activity,
  Shield,
  Brain,
  Users,
  Target,
  LineChart,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCustomerStats } from "@/lib/api/hooks/useCustomerStats";
import { useRecommendationStats } from "@/lib/api/hooks/useProductIntelligence";
import {
  useRevenueBreakdown,
  useRevenueTrends,
  useBankingRatiosTargets,
  useBankingRatiosStressScenario,
} from "@/lib/api/hooks/useAnalytics";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricsSkeleton } from "@/components/common/EnhancedSkeleton";
import { DashboardCustomization } from "@/components/dashboard/DashboardCustomization";
import { KeyboardShortcutsDialog } from "@/components/dashboard/KeyboardShortcutsDialog";
import { usePageShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import { DashboardData, KPIMetric } from "@/types/dashboard";
import {
  transformBankingKPIs,
  transformBankingRatios,
  transformRevenueMetrics,
  transformOperationalEfficiency,
  transformSystemHealth,
  transformComplianceMetrics,
} from "@/lib/utils/executiveDashboardTransform";
import { useToast } from "@/hooks/use-toast";
import { useDashboardCacheMetadata } from "@/lib/api/hooks/useDashboard";
import { useExecutiveDashboardCacheMetadata } from "@/lib/api/hooks/useExecutiveDashboard";
import { formatLastUpdated } from "@/lib/utils/cacheMetadata";
import { CorrelationIdDisplay } from "@/components/common/CorrelationIdDisplay";
// SLAStatusChip import removed - using real health check components only
import { EmptyState } from "@/components/common/EmptyState";
import { exportToCSV } from "@/lib/utils/exportHelpers";
import { KPIPinManager } from "@/components/dashboard/KPIPinManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScenarioToggle } from "@/components/dashboard/ScenarioToggle";
import { useDateRange } from "@/lib/hooks/useDateRange";

// Lazy load heavy widgets - only load when needed
const RealtimeScoringFeed = dynamic(
  () =>
    import("@/components/dashboard/RealtimeScoringFeed").then((mod) => ({
      default: mod.RealtimeScoringFeed,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const RiskAlertsPanel = dynamic(
  () =>
    import("@/components/dashboard/RiskAlertsPanel").then((mod) => ({
      default: mod.RiskAlertsPanel,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const WatchlistWidget = dynamic(
  () =>
    import("@/components/dashboard/WatchlistWidget").then((mod) => ({
      default: mod.WatchlistWidget,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const TopCustomersWidget = dynamic(
  () =>
    import("@/components/dashboard/TopCustomersWidget").then((mod) => ({
      default: mod.TopCustomersWidget,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const CustomerJourneyInsightsWidget = dynamic(
  () =>
    import("@/components/dashboard/CustomerJourneyInsights").then((mod) => ({
      default: mod.CustomerJourneyInsightsWidget,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const ProductRecommendationsWidget = dynamic(
  () =>
    import("@/components/dashboard/ProductRecommendationsWidget").then(
      (mod) => ({ default: mod.ProductRecommendationsWidget })
    ),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const MarketRiskWidget = dynamic(
  () =>
    import("@/components/dashboard/MarketRiskWidget").then((mod) => ({
      default: mod.MarketRiskWidget,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const ModelPerformanceWidget = dynamic(
  () =>
    import("@/components/dashboard/ModelPerformanceWidget").then((mod) => ({
      default: mod.ModelPerformanceWidget,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

const DriftDetectionWidget = dynamic(
  () =>
    import("@/components/dashboard/DriftDetectionWidget").then((mod) => ({
      default: mod.DriftDetectionWidget,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

const FeatureImportanceWidget = dynamic(
  () =>
    import("@/components/dashboard/FeatureImportanceWidget").then((mod) => ({
      default: mod.FeatureImportanceWidget,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

const PerformanceTrendsWidget = dynamic(
  () =>
    import("@/components/dashboard/PerformanceTrendsWidget").then((mod) => ({
      default: mod.PerformanceTrendsWidget,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

const EnsembleBreakdownWidget = dynamic(
  () =>
    import("@/components/dashboard/EnsembleBreakdownWidget").then((mod) => ({
      default: mod.EnsembleBreakdownWidget,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

// Lazy load charts
const WaterfallChart = dynamic(
  () =>
    import("@/components/charts/WaterfallChart").then((mod) => ({
      default: mod.WaterfallChart,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const SunburstChart = dynamic(
  () =>
    import("@/components/charts/SunburstChart").then((mod) => ({
      default: mod.SunburstChart,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const GaugeChart = dynamic(
  () =>
    import("@/components/charts/GaugeChart").then((mod) => ({
      default: mod.GaugeChart,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const RevenueTrendChart = dynamic(
  () =>
    import("@/components/charts/RevenueTrendChart").then((mod) => ({
      default: mod.RevenueTrendChart,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const DateRangeFilter = dynamic(
  () =>
    import("@/components/dashboard/DateRangeFilter")
      .then((mod) => ({ default: mod.DateRangeFilter }))
      .catch((err) => {
        console.error("Failed to load DateRangeFilter:", err);
        return { default: () => null };
      }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-8 w-32" />,
  }
);

const BankingRatiosComparisonChart = dynamic(
  () =>
    import("@/components/charts/BankingRatiosComparisonChart").then((mod) => ({
      default: mod.BankingRatiosComparisonChart,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const OperationalEfficiencyCard = dynamic(
  () =>
    import("@/components/dashboard/OperationalEfficiencyCard").then((mod) => ({
      default: mod.OperationalEfficiencyCard,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const SystemHealthCard = dynamic(
  () =>
    import("@/components/dashboard/SystemHealthCard").then((mod) => ({
      default: mod.SystemHealthCard,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const ComplianceMetricsCard = dynamic(
  () =>
    import("@/components/dashboard/ComplianceMetricsCard").then((mod) => ({
      default: mod.ComplianceMetricsCard,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const ExportButton = dynamic(
  () =>
    import("@/components/dashboard/ExportButton").then((mod) => ({
      default: mod.ExportButton,
    })),
  {
    ssr: false,
  }
);

const SLAStatusChips = dynamic(
  () =>
    import("@/components/dashboard/SLAStatusChips").then((mod) => ({
      default: mod.SLAStatusChips,
    })),
  {
    ssr: false,
  }
);

const PortfolioHealthGauge = dynamic(
  () =>
    import("@/components/charts/PortfolioHealthGauge").then((mod) => ({
      default: mod.PortfolioHealthGauge,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

// Removed fallback data - API must return actual data

export default function ExecutiveDashboardPage() {
  const { toast } = useToast();

  // Date range state - syncs with URL parameters
  // This is the SINGLE source of truth for date range state on this page
  const dateRangeState = useDateRange({
    defaultPreset: "30d",
    syncWithURL: true,
  });
  const { apiParams } = dateRangeState;

  const {
    data,
    isLoading,
    error,
    refetch: refetchDashboard,
  } = useDashboardData(apiParams);
  const {
    data: executiveData,
    isLoading: isLoadingExecutive,
    error: executiveError,
    refetch: refetchExecutive,
  } = useExecutiveDashboardData(apiParams);

  // Keyboard shortcuts for dashboard - must be after refetch functions are defined
  usePageShortcuts([
    {
      key: "r",
      ctrl: true,
      action: () => {
        // Refresh all data
        refetchDashboard();
        refetchExecutive();
      },
      description: "Refresh dashboard data",
      global: false,
    },
  ]);
  const {
    data: customerStats,
    error: customerStatsError,
    refetch: refetchCustomerStats,
  } = useCustomerStats(apiParams);
  const {
    data: revenueBreakdown,
    isLoading: isLoadingRevenue,
    error: revenueBreakdownError,
    refetch: refetchRevenueBreakdown,
  } = useRevenueBreakdown("monthly", 12, apiParams);
  const {
    data: revenueTrends,
    isLoading: isLoadingTrends,
    error: revenueTrendsError,
    refetch: refetchRevenueTrends,
  } = useRevenueTrends("monthly", 12, apiParams.start_date, apiParams.end_date);
  const {
    data: bankingRatiosTargets,
    error: bankingRatiosTargetsError,
    isLoading: isLoadingBankingRatiosTargets,
  } = useBankingRatiosTargets();
  const {
    data: recommendationStats,
    error: recommendationStatsError,
    refetch: refetchRecommendationStats,
  } = useRecommendationStats(apiParams);

  // Get cache metadata for last-updated timestamps
  const dashboardCacheMetadata = useDashboardCacheMetadata();
  const executiveCacheMetadata = useExecutiveDashboardCacheMetadata();

  // Client-side only state to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Real-time updates disabled for executive dashboard (resource heavy)
  // Data will only update when refresh button is clicked

  // Scenario toggle state for banking ratios
  const [scenario, setScenario] = useState<"baseline" | "stress">("baseline");

  // Fetch stress scenario data when scenario is "stress"
  const {
    data: stressScenarioData,
    error: stressScenarioError,
    isLoading: isLoadingStressScenario,
  } = useBankingRatiosStressScenario(
    scenario === "stress" ? "stress" : "baseline"
  );

  // Real-time updates removed - data only updates on manual refresh

  // Memoize dashboardData - NO FALLBACK DATA
  const dashboardData = useMemo<DashboardData>(
    () => ({
      revenue:
        (data as any)?.revenue ||
        (customerStats?.total_revenue
          ? ({
              label: "Total Revenue",
              value: customerStats.total_revenue,
              change: customerStats.customer_growth_rate || 0,
              changeType:
                (customerStats.customer_growth_rate || 0) > 0
                  ? ("increase" as const)
                  : ("decrease" as const),
              format: "currency" as const,
            } as KPIMetric)
          : {
              label: "Total Revenue",
              value: 0,
              change: 0,
              changeType: "increase" as const,
              format: "currency" as const,
            }),
      loans: (data as any)?.loans || {
        label: "Active Loans",
        value: 0,
        change: 0,
        changeType: "increase" as const,
        format: "number" as const,
      },
      customers:
        (data as any)?.customers ||
        (customerStats
          ? ({
              label: "Total Customers",
              value: customerStats.total_customers || 0,
              change: customerStats.customer_growth_rate || 0,
              changeType:
                (customerStats.customer_growth_rate || 0) > 0
                  ? ("increase" as const)
                  : ("decrease" as const),
              format: "number" as const,
            } as KPIMetric)
          : {
              label: "Total Customers",
              value: 0,
              change: 0,
              changeType: "increase" as const,
              format: "number" as const,
            }),
      risk_score:
        (data as any)?.risk_score ||
        (customerStats?.average_credit_score
          ? ({
              label: "Average Credit Score",
              value: Math.round(customerStats.average_credit_score),
              change: 0,
              changeType: "increase" as const,
              format: "number" as const,
            } as KPIMetric)
          : {
              label: "Portfolio Risk Score",
              value: 0,
              change: 0,
              changeType: "increase" as const,
              format: "number" as const,
            }),
      npl_ratio: (data as any)?.npl_ratio,
      approval_rate:
        (data as any)?.approval_rate ||
        (recommendationStats
          ? ({
              label: "Approval Rate",
              value: (recommendationStats.acceptance_rate || 0) * 100,
              change: 0,
              changeType: "increase" as const,
              format: "percentage" as const,
            } as KPIMetric)
          : undefined),
    }),
    [data, customerStats, recommendationStats]
  );

  // Real-time updates removed - use static data only
  const displayData = dashboardData;

  const handleRetry = () => {
    refetchDashboard();
    refetchExecutive();
    refetchCustomerStats();
    refetchRecommendationStats();
    refetchRevenueBreakdown();
    refetchRevenueTrends();
  };

  const hasAnyError =
    error ||
    executiveError ||
    customerStatsError ||
    recommendationStatsError ||
    revenueBreakdownError ||
    revenueTrendsError ||
    bankingRatiosTargetsError ||
    stressScenarioError;

  // Transform executive dashboard data to KPI metrics
  const bankingKPIs = executiveData?.banking_kpis
    ? transformBankingKPIs(executiveData.banking_kpis)
    : {};
  const bankingRatios = executiveData?.banking_ratios
    ? transformBankingRatios(executiveData.banking_ratios)
    : {};
  const revenueMetrics = executiveData?.revenue_metrics
    ? transformRevenueMetrics(executiveData.revenue_metrics)
    : null;
  const operationalEfficiency = executiveData?.operational_efficiency
    ? transformOperationalEfficiency(executiveData.operational_efficiency)
    : {};
  const systemHealth = executiveData?.system_health
    ? transformSystemHealth(executiveData.system_health)
    : {};
  const complianceMetrics = executiveData?.compliance_metrics
    ? transformComplianceMetrics(executiveData.compliance_metrics)
    : {};

  // Debug logging in development
  if (typeof window !== "undefined" && executiveData) {
    console.log(
      "[Dashboard] Executive data check:",
      JSON.stringify(
        {
          has_executiveData: !!executiveData,
          has_banking_kpis: !!executiveData.banking_kpis,
          banking_kpis_total_assets: executiveData.banking_kpis?.total_assets,
          banking_kpis_total_deposits:
            executiveData.banking_kpis?.total_deposits,
          banking_kpis_net_income: executiveData.banking_kpis?.net_income,
          banking_kpis_object: executiveData.banking_kpis,
          bankingKPIs_keys: Object.keys(bankingKPIs),
          bankingKPIs_total_assets_value: bankingKPIs.total_assets?.value,
          bankingKPIs_total_deposits_value: bankingKPIs.total_deposits?.value,
          bankingKPIs_net_income_value: bankingKPIs.net_income?.value,
          bankingKPIs_object: bankingKPIs,
          portfolio_health_overall_score:
            executiveData.portfolio_health?.overall_score,
          revenue_metrics_breakdown_length:
            executiveData.revenue_metrics?.breakdown?.length,
          condition_check:
            executiveData?.banking_kpis &&
            (bankingKPIs.total_assets?.value !== undefined ||
              bankingKPIs.total_deposits?.value !== undefined ||
              bankingKPIs.net_income?.value !== undefined),
          condition_check_breakdown: {
            has_banking_kpis: !!executiveData?.banking_kpis,
            total_assets_check: bankingKPIs.total_assets?.value !== undefined,
            total_deposits_check:
              bankingKPIs.total_deposits?.value !== undefined,
            net_income_check: bankingKPIs.net_income?.value !== undefined,
          },
        },
        null,
        2
      )
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Dashboard Error</CardTitle>
              </div>
              <CardDescription>
                An error occurred while loading the dashboard. Please try
                refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Executive Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of your business performance
                {isMounted && dashboardCacheMetadata?.lastUpdated && (
                  <span className="ml-2 text-xs">
                    • Last updated:{" "}
                    {formatLastUpdated(dashboardCacheMetadata.lastUpdated)}
                  </span>
                )}
              </p>
              {/* Correlation ID Display */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-2">
                  <CorrelationIdDisplay variant="compact" />
                </div>
              )}
            </div>
          </div>
          {/* Action buttons row - Refresh, Date Range Filter, and Export aligned */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isMounted && (isLoading || isLoadingExecutive)}
              className="h-9"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isMounted && (isLoading || isLoadingExecutive) ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <DateRangeFilter
              inline
              dateRangeState={{
                dateRange: dateRangeState.dateRange,
                setPreset: dateRangeState.setPreset,
                setCustomRange: dateRangeState.setCustomRange,
                validation: dateRangeState.validation,
              }}
            />
            <ExportButton
              dashboardData={displayData}
              executiveData={executiveData || null}
            />
          </div>
        </div>

        {/* Error Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load dashboard data from API.
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Error: {(error as any)?.message || "Unknown error occurred"}
                  {(error as any)?.statusCode &&
                    ` (Status: ${(error as any)?.statusCode})`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => refetchDashboard()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {customerStatsError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load customer statistics from API.
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Error:{" "}
                  {(customerStatsError as any)?.message ||
                    "Unknown error occurred"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => refetchCustomerStats()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {recommendationStatsError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load recommendation statistics from API.
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Error:{" "}
                  {(recommendationStatsError as any)?.message ||
                    "Unknown error occurred"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => refetchRecommendationStats()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {executiveError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load executive dashboard data from API.
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Error:{" "}
                  {(executiveError as any)?.message || "Unknown error occurred"}
                  {(executiveError as any)?.statusCode &&
                    ` (Status: ${(executiveError as any)?.statusCode})`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => refetchExecutive()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !hasAnyError && !displayData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No dashboard data available. The API returned an empty result.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Real API Health Status - checks /health endpoint */}
            <ApiStatusIndicator
              endpoint="/api/analytics"
              label="Live"
              showResponseTime={true}
            />
            {/* SLA Status Chips for Multiple Services */}
            <SLAStatusChips compact />
          </div>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsDialog />
            <DashboardCustomization
              page="dashboard"
              availableSections={[
                "Key Performance Indicators",
                "Banking KPIs",
                "Revenue Metrics",
                "Banking Ratios",
                "Operational Efficiency",
                "System Health",
                "Compliance Metrics",
              ]}
            />
          </div>
        </div>

        {/* Primary KPI Cards */}
        <DashboardSection
          title="Key Performance Indicators"
          description="Overview of critical business metrics and performance indicators"
          icon={TrendingUp}
          variant="large"
          actions={
            <KPIPinManager
              kpis={[
                {
                  id: "revenue",
                  label: "Revenue",
                  pinned: false,
                  order: 0,
                  visible: true,
                },
                {
                  id: "loans",
                  label: "Loans",
                  pinned: false,
                  order: 1,
                  visible: true,
                },
                {
                  id: "customers",
                  label: "Customers",
                  pinned: false,
                  order: 2,
                  visible: true,
                },
                {
                  id: "risk_score",
                  label: "Risk Score",
                  pinned: false,
                  order: 3,
                  visible: true,
                },
              ]}
              onUpdate={(kpis) => {
                localStorage.setItem(
                  "dashboard_kpi_layout",
                  JSON.stringify(kpis)
                );
              }}
            />
          }
        >
          <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            role="region"
            aria-label="Key Performance Indicators"
          >
            {!isMounted || isLoading || isLoadingExecutive ? (
              <MetricsSkeleton count={4} />
            ) : (
              <>
                {(revenueMetrics || displayData.revenue) && (
                  <KPICard
                    metric={revenueMetrics || displayData.revenue}
                    aria-label="Revenue metric"
                  />
                )}
                {(bankingKPIs.total_loans || displayData.loans) && (
                  <KPICard
                    metric={bankingKPIs.total_loans || displayData.loans}
                    aria-label="Loans metric"
                  />
                )}
                {displayData.customers && (
                  <KPICard
                    metric={displayData.customers}
                    aria-label="Customers metric"
                  />
                )}
                {displayData.risk_score && (
                  <KPICard
                    metric={displayData.risk_score}
                    aria-label="Risk score metric"
                  />
                )}
              </>
            )}
          </div>
        </DashboardSection>

        {/* Banking KPIs Section */}
        <ErrorBoundary
          fallback={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Banking Metrics Error
                </CardTitle>
                <CardDescription>
                  An error occurred while loading banking metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          }
        >
          <DashboardSection
            title="Banking Metrics"
            description="Core banking performance indicators including assets, deposits, and income"
            icon={Building2}
            errorBoundary={true}
            errorFallback={
              <EmptyState
                title="Banking metrics data not available"
                description="Banking metrics data is not available. Please check your data sources."
                action={{
                  label: "Retry",
                  onClick: handleRetry,
                }}
              />
            }
          >
            {isLoadingExecutive ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : executiveData?.banking_kpis &&
              (bankingKPIs.total_assets?.value !== undefined ||
                bankingKPIs.total_deposits?.value !== undefined ||
                bankingKPIs.net_income?.value !== undefined ||
                bankingRatios.npl ||
                displayData.npl_ratio) ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {bankingKPIs.total_assets && (
                  <KPICard metric={bankingKPIs.total_assets} />
                )}
                {bankingKPIs.total_deposits && (
                  <KPICard metric={bankingKPIs.total_deposits} />
                )}
                {bankingKPIs.net_income && (
                  <KPICard metric={bankingKPIs.net_income} />
                )}
                {displayData.npl_ratio && (
                  <KPICard metric={displayData.npl_ratio} />
                )}
              </div>
            ) : (
              <EmptyState
                title="Banking metrics data not available"
                description="Banking metrics data is not available. Please check your data sources."
                action={{
                  label: "Retry",
                  onClick: handleRetry,
                }}
              />
            )}
          </DashboardSection>
        </ErrorBoundary>

        {executiveData && (
          <>
            {/* Banking Ratios Section */}
            <ErrorBoundary
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Banking Ratios Error
                    </CardTitle>
                    <CardDescription>
                      An error occurred while loading banking ratios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleRetry} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              }
            >
              <DashboardSection
                title="Banking Ratios"
                description="Key financial ratios including NIM, ROE, ROA, CAR, NPL, and CIR with stress scenario analysis"
                icon={BarChart3}
                actions={
                  Object.keys(bankingRatios).length > 0 ? (
                    <ScenarioToggle value={scenario} onChange={setScenario} />
                  ) : undefined
                }
              >
                {isLoadingExecutive ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                ) : Object.keys(bankingRatios).length > 0 ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {bankingRatios.nim && (
                        <KPICard metric={bankingRatios.nim} />
                      )}
                      {bankingRatios.roe && (
                        <KPICard metric={bankingRatios.roe} />
                      )}
                      {bankingRatios.roa && (
                        <KPICard metric={bankingRatios.roa} />
                      )}
                      {bankingRatios.car && (
                        <KPICard metric={bankingRatios.car} />
                      )}
                    </div>

                    {/* Banking Ratios Comparison Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Banking Ratios Comparison</CardTitle>
                        <CardDescription>
                          Current ratios vs targets and benchmarks
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px] w-full">
                          <BankingRatiosComparisonChart
                            data={(() => {
                              const stressRatios =
                                stressScenarioData?.ratios || {};
                              // Banking ratios are already in percentage format (e.g., 3.2 for 3.2%, 12.5 for 12.5%)
                              // No need to multiply by 100
                              return [
                                bankingRatios.nim && {
                                  ratio: "NIM",
                                  current: bankingRatios.nim.value, // Already percentage
                                  target:
                                    bankingRatiosTargets?.nim?.target || 3.5,
                                  baseline: bankingRatios.nim.value,
                                  stress:
                                    scenario === "stress" && stressRatios.nim
                                      ? stressRatios.nim.stress
                                      : undefined,
                                },
                                bankingRatios.roe && {
                                  ratio: "ROE",
                                  current: bankingRatios.roe.value, // Already percentage
                                  target:
                                    bankingRatiosTargets?.roe?.target || 13.0,
                                  baseline: bankingRatios.roe.value,
                                  stress:
                                    scenario === "stress" && stressRatios.roe
                                      ? stressRatios.roe.stress
                                      : undefined,
                                },
                                bankingRatios.roa && {
                                  ratio: "ROA",
                                  current: bankingRatios.roa.value, // Already percentage
                                  target:
                                    bankingRatiosTargets?.roa?.target || 1.3,
                                  baseline: bankingRatios.roa.value,
                                  stress:
                                    scenario === "stress" && stressRatios.roa
                                      ? stressRatios.roa.stress
                                      : undefined,
                                },
                                bankingRatios.car && {
                                  ratio: "CAR",
                                  current: bankingRatios.car.value, // Already percentage
                                  target:
                                    bankingRatiosTargets?.car?.target || 14.0,
                                  baseline: bankingRatios.car.value,
                                  stress:
                                    scenario === "stress" && stressRatios.car
                                      ? stressRatios.car.stress
                                      : undefined,
                                },
                                bankingRatios.npl && {
                                  ratio: "NPL",
                                  current: bankingRatios.npl.value, // Already percentage
                                  target:
                                    bankingRatiosTargets?.npl?.target || 3.0,
                                  baseline: bankingRatios.npl.value,
                                  stress:
                                    scenario === "stress" && stressRatios.npl
                                      ? stressRatios.npl.stress
                                      : undefined,
                                },
                                bankingRatios.cir && {
                                  ratio: "CIR",
                                  current: bankingRatios.cir.value, // Already percentage
                                  target:
                                    bankingRatiosTargets?.cir?.target || 55.0,
                                  baseline: bankingRatios.cir.value,
                                  stress:
                                    scenario === "stress" && stressRatios.cir
                                      ? stressRatios.cir.stress
                                      : undefined,
                                },
                              ].filter(Boolean) as any;
                            })()}
                            showTarget={true}
                            scenario={scenario}
                            height={400}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <EmptyState
                    title="Banking ratios data not available"
                    description="Banking ratios data is not available."
                    action={{
                      label: "Retry",
                      onClick: handleRetry,
                    }}
                  />
                )}
              </DashboardSection>
            </ErrorBoundary>
          </>
        )}

        {/* Revenue Analytics Section - Loaded after critical KPIs */}
        <ErrorBoundary
          fallback={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Revenue Analytics Error
                </CardTitle>
                <CardDescription>
                  An error occurred while loading revenue analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          }
        >
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <DashboardSection
              title="Revenue Analytics"
              description="Comprehensive revenue analysis with breakdown and trend visualization"
              icon={LineChart}
              actions={
                <DateRangeFilter
                  dateRangeState={{
                    dateRange: dateRangeState.dateRange,
                    setPreset: dateRangeState.setPreset,
                    setCustomRange: dateRangeState.setCustomRange,
                    validation: dateRangeState.validation,
                  }}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                    <CardDescription>Monthly revenue breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueBreakdownError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to load revenue breakdown data.{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => refetchRevenueBreakdown()}
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : isLoadingRevenue || isLoadingExecutive ? (
                      <Skeleton className="h-64 w-full" />
                    ) : revenueBreakdown &&
                      Array.isArray(revenueBreakdown) &&
                      revenueBreakdown.length > 0 ? (
                      <div className="h-[400px] w-full">
                        <WaterfallChart data={revenueBreakdown} />
                      </div>
                    ) : executiveData?.revenue_metrics?.breakdown &&
                      Array.isArray(executiveData.revenue_metrics.breakdown) &&
                      executiveData.revenue_metrics.breakdown.length > 0 ? (
                      <div className="h-[400px] w-full">
                        <WaterfallChart
                          data={executiveData.revenue_metrics.breakdown.map(
                            (item) => ({
                              name: item.category,
                              value: item.amount,
                            })
                          )}
                        />
                      </div>
                    ) : (
                      <EmptyState
                        title="Revenue Breakdown Data Not Available"
                        description="Revenue breakdown data is not available. Please check your data sources."
                        variant="empty"
                        action={{
                          label: "Retry",
                          onClick: handleRetry,
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Revenue trends over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueTrendsError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to load revenue trends data.{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => refetchRevenueTrends()}
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : isLoadingTrends || isLoadingExecutive ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      (() => {
                        // Handle both response formats: {data: [...]} or {trends: [...]}
                        const trendsData =
                          revenueTrends?.data || revenueTrends?.trends || [];
                        if (
                          Array.isArray(trendsData) &&
                          trendsData.length > 0
                        ) {
                          const chartData = trendsData
                            .map((item: any) => ({
                              date: item.date || item.date_str || "",
                              revenue: item.revenue || 0,
                            }))
                            .filter((item: any) => item.date);

                          if (chartData.length > 0) {
                            return (
                              <div className="h-[300px] w-full">
                                <RevenueTrendChart
                                  data={chartData}
                                  type="area"
                                  height={300}
                                />
                              </div>
                            );
                          }
                        }
                        // Show empty state when no trend data available
                        return (
                          <EmptyState
                            title="No Revenue Trend Data"
                            description="Revenue trend data is not available. This may be due to insufficient historical data."
                            variant="empty"
                            action={{
                              label: "Retry",
                              onClick: handleRetry,
                            }}
                          />
                        );
                      })()
                    )}
                  </CardContent>
                </Card>
              </div>
            </DashboardSection>
          </Suspense>
        </ErrorBoundary>

        {/* Additional Dashboard Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Health Score</CardTitle>
              <CardDescription>
                Overall portfolio risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExecutive ? (
                <Skeleton className="h-[300px] w-full" />
              ) : executiveData?.portfolio_health?.overall_score !==
                undefined ? (
                <div className="h-[300px] w-full">
                  <GaugeChart
                    value={executiveData.portfolio_health.overall_score}
                    max={100}
                    min={0}
                    label="Portfolio Health"
                  />
                </div>
              ) : (
                <EmptyState
                  title="Portfolio Health Score Not Available"
                  description="Portfolio health score data is not available."
                  variant="empty"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
            <CardDescription>
              Distribution of customers by segment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerStats?.segments ? (
              <div className="h-[400px] w-full">
                <SunburstChart
                  data={[
                    {
                      name: "Low Risk",
                      value: customerStats.segments.low_risk,
                    },
                    {
                      name: "Medium Risk",
                      value: customerStats.segments.medium_risk,
                    },
                    {
                      name: "High Risk",
                      value: customerStats.segments.high_risk,
                    },
                    {
                      name: "Very High Risk",
                      value: customerStats.segments.very_high_risk || 0,
                    },
                  ]}
                />
              </div>
            ) : (
              <EmptyState
                title="No Customer Segmentation Data"
                description="Customer segmentation data is not available. Please check your data sources."
                variant="empty"
              />
            )}
          </CardContent>
        </Card>

        {/* Portfolio Health Details */}
        <ErrorBoundary
          fallback={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Portfolio Health Error
                </CardTitle>
                <CardDescription>
                  An error occurred while loading portfolio health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          }
        >
          <DashboardSection
            title="Portfolio Health Analysis"
            description="Comprehensive portfolio health assessment across credit quality, diversification, liquidity, and profitability dimensions"
            icon={Activity}
          >
            {isLoadingExecutive ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : executiveData?.portfolio_health ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Overall Portfolio Health Gauge */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Portfolio Health</CardTitle>
                      <CardDescription>
                        Multi-dimensional health assessment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px] w-full">
                        <PortfolioHealthGauge
                          overallScore={
                            (executiveData?.portfolio_health?.health_score ??
                              executiveData?.portfolio_health?.overall_score ??
                              0) as number
                          }
                          components={
                            executiveData?.portfolio_health?.components
                              ? {
                                  credit_quality:
                                    (executiveData.portfolio_health.components
                                      .credit_quality ?? 0) * 100,
                                  diversification:
                                    (executiveData.portfolio_health.components
                                      .diversification ?? 0) * 100,
                                  liquidity:
                                    (executiveData.portfolio_health.components
                                      .liquidity ?? 0) * 100,
                                  profitability:
                                    (executiveData.portfolio_health.components
                                      .profitability ?? 0) * 100,
                                }
                              : {
                                  credit_quality: 0,
                                  diversification: 0,
                                  liquidity: 0,
                                  profitability: 0,
                                }
                          }
                          height={400}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Component Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Credit Quality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <GaugeChart
                            value={
                              (executiveData?.portfolio_health?.components
                                ?.credit_quality ?? 0) * 100
                            }
                            max={100}
                            min={0}
                            label="Credit Quality"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Diversification
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <GaugeChart
                            value={
                              (executiveData?.portfolio_health?.components
                                ?.diversification ?? 0) * 100
                            }
                            max={100}
                            min={0}
                            label="Diversification"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Liquidity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <GaugeChart
                            value={
                              (executiveData?.portfolio_health?.components
                                ?.liquidity ?? 0) * 100
                            }
                            max={100}
                            min={0}
                            label="Liquidity"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Profitability
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <GaugeChart
                            value={
                              (executiveData?.portfolio_health?.components
                                ?.profitability ?? 0) * 100
                            }
                            max={100}
                            min={0}
                            label="Profitability"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Portfolio health data not available"
                description="Portfolio health data is not available. This may be due to insufficient portfolio data."
                action={{
                  label: "Retry",
                  onClick: handleRetry,
                }}
              />
            )}
          </DashboardSection>
        </ErrorBoundary>

        {/* Operational Efficiency & System Health Section */}
        {(Object.keys(operationalEfficiency).length > 0 ||
          Object.keys(systemHealth).length > 0) && (
          <DashboardSection
            title="Operational Efficiency & System Health"
            description="Monitor operational performance metrics and system health indicators"
            icon={Activity}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {/* Operational Efficiency */}
              {executiveData?.operational_efficiency && (
                <OperationalEfficiencyCard
                  efficiency={executiveData.operational_efficiency}
                  isLoading={isLoadingExecutive}
                />
              )}

              {/* System Health */}
              {executiveData?.system_health && (
                <SystemHealthCard
                  health={executiveData.system_health}
                  isLoading={isLoadingExecutive}
                  enableRealTime={true}
                />
              )}
            </div>
          </DashboardSection>
        )}

        {/* Compliance Metrics Section */}
        {executiveData?.compliance_metrics && (
          <DashboardSection
            title="Compliance Metrics"
            description="Regulatory compliance tracking and audit metrics with violation trend analysis"
            icon={Shield}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const complianceData: {
                      nbe_compliance_rate: number;
                      regulatory_violations: number;
                      audit_score: number;
                    } = executiveData.compliance_metrics as {
                      nbe_compliance_rate: number;
                      regulatory_violations: number;
                      audit_score: number;
                    };
                    const exportData = [
                      {
                        metric: "NBE Compliance Rate",
                        value: complianceData.nbe_compliance_rate || 0,
                        status:
                          complianceData.nbe_compliance_rate >= 0.95
                            ? "Compliant"
                            : "Non-Compliant",
                      },
                      {
                        metric: "Regulatory Violations",
                        value: complianceData.regulatory_violations || 0,
                        status:
                          complianceData.regulatory_violations === 0
                            ? "Compliant"
                            : "Violations Found",
                      },
                      {
                        metric: "Audit Score",
                        value: complianceData.audit_score || 0,
                        status:
                          complianceData.audit_score >= 0.9
                            ? "Excellent"
                            : complianceData.audit_score >= 0.8
                              ? "Good"
                              : "Needs Improvement",
                      },
                    ];
                    await exportToCSV(
                      exportData,
                      "compliance_metrics",
                      undefined,
                      {
                        includeSignature: true,
                        version: "1.0.0",
                        filterSummary: "Compliance Metrics Export",
                      }
                    );
                    toast({
                      title: "Export Successful",
                      description: "Compliance metrics exported with signature",
                    });
                  } catch (error) {
                    toast({
                      title: "Export Failed",
                      description: "Failed to export compliance metrics",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Compliance
              </Button>
            }
          >
            <ComplianceMetricsCard
              compliance={executiveData.compliance_metrics}
              isLoading={isLoadingExecutive}
            />
          </DashboardSection>
        )}

        {/* ML Performance Section */}
        <ErrorBoundary
          fallback={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  ML Performance Error
                </CardTitle>
                <CardDescription>
                  An error occurred while loading ML performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          }
        >
          <DashboardSection
            title="ML Performance & Monitoring"
            description="Comprehensive model performance metrics, drift detection, feature importance, and ensemble breakdown analysis"
            icon={Brain}
            variant="large"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const mlData = executiveData?.ml_performance;
                    if (mlData) {
                      const exportData = [
                        {
                          model: "ensemble",
                          accuracy: mlData.ensemble_model?.accuracy || 0,
                          precision: mlData.ensemble_model?.precision || 0,
                          recall: mlData.ensemble_model?.recall || 0,
                          f1_score: mlData.ensemble_model?.f1_score || 0,
                          auc_roc: mlData.ensemble_model?.auc_roc || 0,
                        },
                        ...Object.entries(mlData.individual_models || {}).map(
                          ([name, metrics]: [string, any]) => ({
                            model: name,
                            accuracy: metrics?.accuracy || 0,
                            precision: metrics?.precision || 0,
                            recall: metrics?.recall || 0,
                            f1_score: metrics?.f1_score || 0,
                            auc_roc: metrics?.auc_roc || 0,
                          })
                        ),
                      ];
                      await exportToCSV(
                        exportData,
                        "ml_performance",
                        undefined,
                        {
                          includeSignature: true,
                          version: "1.0.0",
                          filterSummary: "ML Performance Metrics Export",
                        }
                      );
                      toast({
                        title: "Export Successful",
                        description:
                          "ML performance data exported with signature",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Export Failed",
                      description: "Failed to export ML performance data",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export ML Performance
              </Button>
            }
          >
            {/* Row 1: Model Performance Widget (full width) */}
            <ModelPerformanceWidget
              executiveMLData={executiveData?.ml_performance || undefined}
            />

            {/* Row 2: Drift Detection + Feature Importance (50/50) */}
            <div className="grid gap-4 md:grid-cols-2">
              <DriftDetectionWidget
                executiveMLData={executiveData?.ml_performance || undefined}
              />
              <FeatureImportanceWidget
                executiveMLData={executiveData?.ml_performance || undefined}
              />
            </div>

            {/* Row 3: Performance Trends Chart (full width) */}
            <PerformanceTrendsWidget
              executiveMLData={executiveData?.ml_performance || undefined}
            />

            {/* Row 4: Ensemble Breakdown Widget (full width) */}
            <EnsembleBreakdownWidget
              executiveMLData={executiveData?.ml_performance || undefined}
            />
          </DashboardSection>
        </ErrorBoundary>

        {/* Real-Time Scoring Feed */}
        <DashboardSection
          title="Real-Time Scoring Feed"
          description="Live credit scoring activity and decision tracking"
          icon={Activity}
          collapsible={true}
          defaultOpen={true}
        >
          <RealtimeScoringFeed />
        </DashboardSection>

        {/* Risk Alerts and Watchlist Row */}
        <DashboardSection
          title="Risk Management"
          description="Risk alerts, compliance violations, and watchlist monitoring"
          icon={AlertTriangle}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <RiskAlertsPanel
              complianceMetrics={executiveData?.compliance_metrics || undefined}
            />
            <WatchlistWidget />
          </div>
        </DashboardSection>

        {/* Market Risk Analysis */}
        <DashboardSection
          title="Market Risk Analysis"
          description="Comprehensive market risk assessment and concentration analysis"
          icon={BarChart3}
        >
          <MarketRiskWidget executiveData={executiveData || undefined} />
        </DashboardSection>

        {/* Customer Intelligence Row */}
        <DashboardSection
          title="Customer Intelligence"
          description="Top customers analysis and customer journey insights"
          icon={Users}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TopCustomersWidget />
            <CustomerJourneyInsightsWidget />
          </div>
        </DashboardSection>

        {/* Product Recommendations */}
        <DashboardSection
          title="Product Recommendations"
          description="AI-powered product recommendations based on customer profiles and behavior"
          icon={Target}
        >
          <ProductRecommendationsWidget />
        </DashboardSection>
      </div>
    </ErrorBoundary>
  );
}
