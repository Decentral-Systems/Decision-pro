"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  PieChart,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  Target,
  Layers,
  Filter,
  Eye,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  usePortfolioOverview,
  useProductPerformance,
  useGenerateNBEComplianceReport,
} from "@/lib/api/hooks/useLoans";
import { format, subDays } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

// Lazy load chart components for better performance
const SunburstChart = dynamic(() => import("@/components/charts/SunburstChart").then(mod => ({ default: mod.SunburstChart })), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
  ssr: false,
});

const DrillDownChart = dynamic(() => import("@/components/charts/DrillDownChart"), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
  ssr: false,
});

const InteractiveChart = dynamic(() => import("@/components/charts/InteractiveChart"), {
  loading: () => <Skeleton className="h-[400px] w-full" />,
  ssr: false,
});

// Quick date range presets
const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 3 months", value: "3m", days: 90 },
  { label: "Last 6 months", value: "6m", days: 180 },
  { label: "Last year", value: "1y", days: 365 },
  { label: "Custom", value: "custom", days: 0 },
];

// Chart type options
const CHART_TYPES = [
  { label: "Bar Chart", value: "bar", icon: BarChart3 },
  { label: "Line Chart", value: "line", icon: LineChartIcon },
  { label: "Area Chart", value: "area", icon: Activity },
  { label: "Pie Chart", value: "pie", icon: PieChart },
];

function PortfolioAnalyticsPageContent() {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [loanType, setLoanType] = useState<string>("all");
  const [productType, setProductType] = useState<string>("all");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPeriodStart, setReportPeriodStart] = useState<string>("");
  const [reportPeriodEnd, setReportPeriodEnd] = useState<string>("");
  const [chartType, setChartType] = useState("bar");
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState("value");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previous");

  // Handle date preset changes
  const handleDatePresetChange = useCallback((preset: string) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const presetConfig = DATE_PRESETS.find(p => p.value === preset);
      if (presetConfig && presetConfig.days > 0) {
        const endDate = new Date();
        const startDate = subDays(endDate, presetConfig.days);
        setDateFrom(format(startDate, "yyyy-MM-dd"));
        setDateTo(format(endDate, "yyyy-MM-dd"));
      }
    }
  }, []);

  // Calculate effective date range
  const effectiveDateRange = useMemo(() => {
    if (datePreset === "custom") {
      return { dateFrom, dateTo };
    }
    const presetConfig = DATE_PRESETS.find(p => p.value === datePreset);
    if (presetConfig && presetConfig.days > 0) {
      const endDate = new Date();
      const startDate = subDays(endDate, presetConfig.days);
      return {
        dateFrom: format(startDate, "yyyy-MM-dd"),
        dateTo: format(endDate, "yyyy-MM-dd"),
      };
    }
    return { dateFrom: "", dateTo: "" };
  }, [datePreset, dateFrom, dateTo]);

  // API calls with enhanced parameters
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = usePortfolioOverview({
    date_from: effectiveDateRange.dateFrom || undefined,
    date_to: effectiveDateRange.dateTo || undefined,
    loan_type: loanType !== "all" ? loanType : undefined,
  });

  const { data: productData, isLoading: productLoading, refetch: refetchProducts } = useProductPerformance({
    product_type: productType !== "all" ? productType : undefined,
    date_from: effectiveDateRange.dateFrom || undefined,
    date_to: effectiveDateRange.dateTo || undefined,
  });

  const generateReportMutation = useGenerateNBEComplianceReport();

  const portfolioData = overview?.data || {};
  const products = productData?.data?.products || [];

  const handleGenerateReport = async () => {
    if (!reportPeriodStart || !reportPeriodEnd) {
      toast({
        title: "Error",
        description: "Please select both start and end dates for the report",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateReportMutation.mutateAsync({
        period_start: reportPeriodStart,
        period_end: reportPeriodEnd,
      });
      
      // In a real implementation, you would download the report
      toast({
        title: "Success",
        description: "NBE compliance report generated successfully",
      });
      setReportDialogOpen(false);
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(amount || 0);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Enhanced chart data preparation
  const portfolioDistributionData = useMemo(() => {
    if (!portfolioData) return [];
    return [
      { 
        name: "Active", 
        value: portfolioData.total_outstanding_amount || 0, 
        count: portfolioData.active_loans_count || 0,
        percentage: portfolioData.total_portfolio_value ? 
          ((portfolioData.total_outstanding_amount || 0) / portfolioData.total_portfolio_value * 100) : 0
      },
      { 
        name: "Overdue", 
        value: portfolioData.overdue_amount || 0, 
        count: portfolioData.overdue_loans || 0,
        percentage: portfolioData.total_portfolio_value ? 
          ((portfolioData.overdue_amount || 0) / portfolioData.total_portfolio_value * 100) : 0
      },
      { 
        name: "Defaulted", 
        value: portfolioData.defaulted_amount || 0, 
        count: portfolioData.defaulted_loans || 0,
        percentage: portfolioData.total_portfolio_value ? 
          ((portfolioData.defaulted_amount || 0) / portfolioData.total_portfolio_value * 100) : 0
      },
    ];
  }, [portfolioData]);

  const productPerformanceChartData = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.map((product: any) => ({
      name: product.product_type || "Unknown",
      value: product.total_value || 0,
      loans: product.total_loans || 0,
      defaultRate: (product.default_rate || 0) * 100,
      approvalRate: (product.approval_rate || 0) * 100,
      avgLoanSize: product.average_loan_size || 0,
      avgInterestRate: product.average_interest_rate || 0,
      outstandingAmount: product.total_outstanding || 0,
    }));
  }, [products]);

  // Portfolio at Risk (PAR) analysis data
  const parAnalysisData = useMemo(() => {
    if (!portfolioData) return [];
    return [
      { name: "PAR 30", value: portfolioData.par_30_percentage || 0, amount: portfolioData.par_30 || 0 },
      { name: "PAR 60", value: portfolioData.par_60_percentage || 0, amount: portfolioData.par_60 || 0 },
      { name: "PAR 90", value: portfolioData.par_90_percentage || 0, amount: portfolioData.par_90 || 0 },
    ];
  }, [portfolioData]);

  // Trend analysis data (mock data - would come from historical API)
  const trendAnalysisData = useMemo(() => {
    const baseValue = portfolioData.total_portfolio_value || 0;
    return [
      { month: "Jan", portfolioValue: baseValue * 0.7, activeLoans: (portfolioData.active_loans_count || 0) * 0.7, defaultRate: 2.1 },
      { month: "Feb", portfolioValue: baseValue * 0.75, activeLoans: (portfolioData.active_loans_count || 0) * 0.75, defaultRate: 2.3 },
      { month: "Mar", portfolioValue: baseValue * 0.8, activeLoans: (portfolioData.active_loans_count || 0) * 0.8, defaultRate: 1.9 },
      { month: "Apr", portfolioValue: baseValue * 0.85, activeLoans: (portfolioData.active_loans_count || 0) * 0.85, defaultRate: 2.0 },
      { month: "May", portfolioValue: baseValue * 0.9, activeLoans: (portfolioData.active_loans_count || 0) * 0.9, defaultRate: 1.8 },
      { month: "Jun", portfolioValue: baseValue, activeLoans: portfolioData.active_loans_count || 0, defaultRate: portfolioData.default_rate * 100 || 1.7 },
    ];
  }, [portfolioData]);

  // Comparative analysis data
  const comparativeAnalysisData = useMemo(() => {
    if (!comparisonMode) return productPerformanceChartData;
    
    // Add comparison period data (mock - would come from API)
    return productPerformanceChartData.map(product => ({
      ...product,
      previousValue: product.value * 0.85, // Mock previous period data
      previousLoans: Math.floor(product.loans * 0.9),
      growth: ((product.value - (product.value * 0.85)) / (product.value * 0.85) * 100),
    }));
  }, [productPerformanceChartData, comparisonMode]);

  // Drill-down functionality
  const handleDrillDown = useCallback((dataPoint: any, level: number) => {
    setDrillDownLevel(level + 1);
    // In a real implementation, this would fetch more detailed data
    toast({
      title: "Drill Down",
      description: `Drilling down into ${dataPoint.name} data`,
    });
  }, [toast]);

  const handleDrillUp = useCallback(() => {
    if (drillDownLevel > 0) {
      setDrillDownLevel(drillDownLevel - 1);
    }
  }, [drillDownLevel]);

  // Enhanced export functions
  const handleExportCSV = useCallback(() => {
    const exportData = [
      {
        "Metric": "Portfolio Overview",
        "Total Portfolio Value": portfolioData.total_portfolio_value || 0,
        "Active Loans Count": portfolioData.active_loans_count || 0,
        "Outstanding Amount": portfolioData.total_outstanding_amount || 0,
        "Overdue Amount": portfolioData.overdue_amount || 0,
        "Default Rate": formatPercent(portfolioData.default_rate || 0),
        "Collection Efficiency": formatPercent(portfolioData.collection_efficiency || 0),
        "Average Loan Size": portfolioData.average_loan_size || 0,
        "Average Interest Rate": formatPercent(portfolioData.average_interest_rate || 0),
        "PAR 30": formatPercent(portfolioData.par_30_percentage || 0),
        "PAR 60": formatPercent(portfolioData.par_60_percentage || 0),
        "PAR 90": formatPercent(portfolioData.par_90_percentage || 0),
      },
      ...products.map((product: any) => ({
        "Metric": `Product - ${product.product_type}`,
        "Total Value": product.total_value || 0,
        "Total Loans": product.total_loans || 0,
        "Active Loans": product.active_loans || 0,
        "Default Rate": formatPercent(product.default_rate || 0),
        "Approval Rate": formatPercent(product.approval_rate || 0),
        "Average Loan Size": product.average_loan_size || 0,
        "Average Interest Rate": formatPercent(product.average_interest_rate || 0),
      })),
    ];
    exportToCSV(exportData, `portfolio_analytics_${format(new Date(), "yyyy-MM-dd")}`);
    toast({
      title: "Success",
      description: "Portfolio data exported to CSV",
    });
  }, [portfolioData, products, toast]);

  const handleExportExcel = useCallback(() => {
    const exportData = [
      {
        "Metric": "Portfolio Overview",
        "Total Portfolio Value": portfolioData.total_portfolio_value || 0,
        "Active Loans Count": portfolioData.active_loans_count || 0,
        "Outstanding Amount": portfolioData.total_outstanding_amount || 0,
        "Overdue Amount": portfolioData.overdue_amount || 0,
        "Default Rate": formatPercent(portfolioData.default_rate || 0),
        "Collection Efficiency": formatPercent(portfolioData.collection_efficiency || 0),
        "Average Loan Size": portfolioData.average_loan_size || 0,
        "Average Interest Rate": formatPercent(portfolioData.average_interest_rate || 0),
        "PAR 30": formatPercent(portfolioData.par_30_percentage || 0),
        "PAR 60": formatPercent(portfolioData.par_60_percentage || 0),
        "PAR 90": formatPercent(portfolioData.par_90_percentage || 0),
      },
      ...products.map((product: any) => ({
        "Metric": `Product - ${product.product_type}`,
        "Total Value": product.total_value || 0,
        "Total Loans": product.total_loans || 0,
        "Active Loans": product.active_loans || 0,
        "Default Rate": formatPercent(product.default_rate || 0),
        "Approval Rate": formatPercent(product.approval_rate || 0),
        "Average Loan Size": product.average_loan_size || 0,
        "Average Interest Rate": formatPercent(product.average_interest_rate || 0),
      })),
    ];
    exportToExcel(exportData, `portfolio_analytics_${format(new Date(), "yyyy-MM-dd")}`);
    toast({
      title: "Success",
      description: "Portfolio data exported to Excel",
    });
  }, [portfolioData, products, toast]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time portfolio performance metrics with interactive charts and drill-down capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { refetchOverview(); refetchProducts(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Portfolio Report</DialogTitle>
                <DialogDescription>
                  Generate a comprehensive portfolio analytics report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="report_start">Period Start</Label>
                  <Input
                    id="report_start"
                    type="date"
                    value={reportPeriodStart}
                    onChange={(e) => setReportPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="report_end">Period End</Label>
                  <Input
                    id="report_end"
                    type="date"
                    value={reportPeriodEnd}
                    onChange={(e) => setReportPeriodEnd(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                  >
                    {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Filters with Quick Presets */}
      <DashboardSection
        title="Analytics Filters & Controls"
        description="Filter portfolio data and customize chart views with quick date presets and comparison modes"
        icon={Filter}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Quick Date Presets */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Date Range</Label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={datePreset === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDatePresetChange(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range (shown when Custom is selected) */}
              {datePreset === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Filters and Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Loan Type</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="personal_loan">Personal Loan</SelectItem>
                      <SelectItem value="business_loan">Business Loan</SelectItem>
                      <SelectItem value="agricultural_loan">Agricultural Loan</SelectItem>
                      <SelectItem value="microfinance">Microfinance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Product Type</Label>
                  <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="short_term">Short Term</SelectItem>
                      <SelectItem value="medium_term">Medium Term</SelectItem>
                      <SelectItem value="long_term">Long Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chart Type</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant={comparisonMode ? "default" : "outline"}
                    onClick={() => setComparisonMode(!comparisonMode)}
                    className="w-full"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {comparisonMode ? "Comparison On" : "Comparison Off"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Tabbed Analytics Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <DashboardSection
            title="Portfolio Overview Metrics"
            description="Real-time key performance indicators with trend analysis"
            icon={Target}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {formatCurrency(portfolioData.total_portfolio_value || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {portfolioData.active_loans_count || 0} active loans
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {formatCurrency(portfolioData.total_outstanding_amount || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {((portfolioData.total_outstanding_amount || 0) / (portfolioData.total_portfolio_value || 1) * 100).toFixed(1)}% of total
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio at Risk</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPercent((portfolioData.overdue_amount || 0) / (portfolioData.total_outstanding_amount || 1))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(portfolioData.overdue_amount || 0)} overdue
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercent(portfolioData.collection_efficiency || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                        Efficient collection
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>

          {/* Interactive Portfolio Distribution */}
          <DashboardSection
            title="Portfolio Distribution Analysis"
            description="Interactive visualization of portfolio distribution with drill-down capabilities"
            icon={PieChart}
            actions={
              <div className="flex items-center gap-2">
                {drillDownLevel > 0 && (
                  <Button variant="outline" size="sm" onClick={handleDrillUp}>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Drill Up
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedMetric(selectedMetric === "value" ? "count" : "value")}>
                  <Layers className="h-4 w-4 mr-2" />
                  {selectedMetric === "value" ? "Show Count" : "Show Value"}
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Portfolio Distribution by {selectedMetric === "value" ? "Amount" : "Count"}
                  </CardTitle>
                  <CardDescription>
                    Click on segments to drill down into detailed analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : portfolioDistributionData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No portfolio data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={portfolioDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey={selectedMetric}
                          onClick={(data) => handleDrillDown(data, drillDownLevel)}
                          className="cursor-pointer"
                        >
                          {portfolioDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [
                            selectedMetric === "value" ? formatCurrency(value as number) : value,
                            name
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Portfolio Status Breakdown
                  </CardTitle>
                  <CardDescription>Detailed metrics by portfolio status</CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {portfolioDistributionData.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => handleDrillDown(item, drillDownLevel)}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }} />
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{item.count} loans</Badge>
                              <Badge>{item.percentage.toFixed(1)}%</Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{formatCurrency(item.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <DashboardSection
            title="Product Performance Analysis"
            description="Comparative analysis across products with drill-down capabilities"
            icon={BarChart3}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant={comparisonMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonMode(!comparisonMode)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {comparisonMode ? "Hide Comparison" : "Show Comparison"}
                </Button>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Total Value</SelectItem>
                    <SelectItem value="loans">Loan Count</SelectItem>
                    <SelectItem value="defaultRate">Default Rate</SelectItem>
                    <SelectItem value="approvalRate">Approval Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Product Performance Comparison
                  </CardTitle>
                  <CardDescription>
                    {comparisonMode ? "Current vs Previous Period" : "Current Period Performance"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : comparativeAnalysisData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No product performance data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      {comparisonMode ? (
                        <ComposedChart data={comparativeAnalysisData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              selectedMetric === "value" || selectedMetric === "avgLoanSize" ? 
                                formatCurrency(value as number) : 
                                selectedMetric.includes("Rate") ? 
                                  formatPercent((value as number) / 100) : 
                                  value,
                              name
                            ]}
                          />
                          <Legend />
                          <Bar dataKey={selectedMetric} fill="#8884d8" name="Current" />
                          <Bar dataKey={`previous${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} fill="#82ca9d" name="Previous" />
                        </ComposedChart>
                      ) : (
                        <BarChart data={comparativeAnalysisData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              selectedMetric === "value" || selectedMetric === "avgLoanSize" ? 
                                formatCurrency(value as number) : 
                                selectedMetric.includes("Rate") ? 
                                  formatPercent((value as number) / 100) : 
                                  value,
                              name
                            ]}
                          />
                          <Legend />
                          <Bar 
                            dataKey={selectedMetric} 
                            fill="#8884d8" 
                            onClick={(data) => handleDrillDown(data, drillDownLevel)}
                            className="cursor-pointer"
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Metrics Table
                  </CardTitle>
                  <CardDescription>Detailed performance breakdown by product</CardDescription>
                </CardHeader>
                <CardContent>
                  {productLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No product performance data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {products.map((product: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => handleDrillDown(product, drillDownLevel)}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-lg">{product.product_type || "Unknown"}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{product.total_loans || 0} loans</Badge>
                              <Badge variant="secondary">{product.active_loans || 0} active</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Value:</span>
                                <span className="font-medium">
                                  {formatCurrency(product.total_value || 0)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Loan Size:</span>
                                <span className="font-medium">
                                  {formatCurrency(product.average_loan_size || 0)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Interest:</span>
                                <span className="font-medium">
                                  {formatPercent(product.average_interest_rate || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Default Rate:</span>
                                <span className={`font-medium flex items-center gap-1 ${
                                  (product.default_rate || 0) > 0.05 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {formatPercent(product.default_rate || 0)}
                                  {(product.default_rate || 0) > 0.05 ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Approval Rate:</span>
                                <span className="font-medium text-blue-600">
                                  {formatPercent(product.approval_rate || 0)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Outstanding:</span>
                                <span className="font-medium">
                                  {formatCurrency(product.total_outstanding || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-6">
          <DashboardSection
            title="Portfolio at Risk (PAR) Analysis"
            description="Comprehensive risk analysis with aging buckets and trend monitoring"
            icon={AlertCircle}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    PAR Aging Analysis
                  </CardTitle>
                  <CardDescription>Portfolio at Risk by aging buckets</CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : parAnalysisData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No PAR data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={parAnalysisData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === "value" ? `${value}%` : formatCurrency(value as number),
                            name === "value" ? "PAR %" : "Amount"
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#ff6b6b" name="PAR %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Risk Metrics Summary
                  </CardTitle>
                  <CardDescription>Key risk indicators and thresholds</CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Total PAR</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            ((portfolioData.overdue_amount || 0) / (portfolioData.total_outstanding_amount || 1)) > 0.05 
                              ? "destructive" : "secondary"
                          }>
                            {formatPercent((portfolioData.overdue_amount || 0) / (portfolioData.total_outstanding_amount || 1))}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(portfolioData.overdue_amount || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {parAnalysisData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.value > 3 ? "destructive" : item.value > 1 ? "default" : "secondary"}>
                              {item.value.toFixed(2)}%
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Default Rate</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            (portfolioData.default_rate || 0) > 0.05 ? "destructive" : "secondary"
                          }>
                            {formatPercent(portfolioData.default_rate || 0)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(portfolioData.defaulted_amount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <DashboardSection
            title="Portfolio Trend Analysis"
            description="Historical performance trends and forecasting with comparative time periods"
            icon={TrendingUp}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Portfolio Performance Trends
                </CardTitle>
                <CardDescription>
                  Multi-metric trend analysis over time with growth indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={trendAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === "portfolioValue" ? formatCurrency(value as number) :
                          name === "defaultRate" ? `${value}%` : value,
                          name === "portfolioValue" ? "Portfolio Value" :
                          name === "activeLoans" ? "Active Loans" : "Default Rate %"
                        ]}
                      />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="portfolioValue" 
                        fill="#8884d8" 
                        stroke="#8884d8"
                        fillOpacity={0.3}
                        name="Portfolio Value"
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="activeLoans" 
                        fill="#82ca9d" 
                        name="Active Loans"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="defaultRate" 
                        stroke="#ff7300" 
                        strokeWidth={3}
                        name="Default Rate %"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </DashboardSection>

          {/* Growth Metrics */}
          <DashboardSection
            title="Growth & Performance Indicators"
            description="Key growth metrics and performance indicators with period-over-period comparison"
            icon={Activity}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Portfolio Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    +15.2%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs previous period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Loan Volume Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    +8.7%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    new loans this period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Risk Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    -0.3%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    default rate reduction
                  </p>
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PortfolioAnalyticsPage() {
  return (
    <ErrorBoundary>
      <PortfolioAnalyticsPageContent />
    </ErrorBoundary>
  );
}
