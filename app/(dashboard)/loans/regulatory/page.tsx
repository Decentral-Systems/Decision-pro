"use client";

import React, { useState, useMemo, useCallback } from "react";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  BarChart3,
  Shield,
  Bell,
  Users,
  DollarSign,
  Target,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  usePortfolioOverview,
  useGenerateNBEComplianceReport,
} from "@/lib/api/hooks/useLoans";
import { format, subDays } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Quick date range presets
const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 3 months", value: "3m", days: 90 },
  { label: "Last 6 months", value: "6m", days: 180 },
  { label: "Last year", value: "1y", days: 365 },
  { label: "Custom", value: "custom", days: 0 },
];

function RegulatoryReportingPageContent() {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPeriodStart, setReportPeriodStart] = useState<string>("");
  const [reportPeriodEnd, setReportPeriodEnd] = useState<string>("");
  const [selectedViolationType, setSelectedViolationType] = useState<string>("all");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [executiveViewMode, setExecutiveViewMode] = useState("summary");

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

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = usePortfolioOverview({
    date_from: effectiveDateRange.dateFrom || undefined,
    date_to: effectiveDateRange.dateTo || undefined,
  });

  const generateReportMutation = useGenerateNBEComplianceReport();

  const portfolioData = overview?.data || {};

  // Enhanced compliance metrics calculation
  const complianceMetrics = useMemo(() => {
    const totalLoans = portfolioData.total_loans_count || 0;
    const compliantLoans = portfolioData.compliant_loans_count || Math.floor(totalLoans * 0.92); // Mock 92% compliance
    const nonCompliantLoans = totalLoans - compliantLoans;
    const complianceRate = totalLoans > 0 ? (compliantLoans / totalLoans * 100) : 0;
    
    // Mock violation data - in real implementation, this would come from API
    const violations = [
      { violation_type: "salary_rule", count: Math.floor(nonCompliantLoans * 0.4), severity: "high", description: "1/3 salary rule violations" },
      { violation_type: "interest_rate", count: Math.floor(nonCompliantLoans * 0.3), severity: "medium", description: "Interest rate outside 12-25% range" },
      { violation_type: "loan_term", count: Math.floor(nonCompliantLoans * 0.2), severity: "medium", description: "Loan term exceeds 60 months" },
      { violation_type: "loan_amount", count: Math.floor(nonCompliantLoans * 0.1), severity: "low", description: "Loan amount outside limits" },
    ];

    return {
      totalLoans,
      compliantLoans,
      nonCompliantLoans,
      complianceRate,
      violations,
    };
  }, [portfolioData]);

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
      
      toast({
        title: "Success",
        description: "NBE compliance report generated successfully",
      });
      
      setReportDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = (format: "csv" | "excel" | "pdf") => {
    const exportData = [
      {
        "Period": `${effectiveDateRange.dateFrom} to ${effectiveDateRange.dateTo}`,
        "Total Loans": complianceMetrics.totalLoans,
        "Compliant Loans": complianceMetrics.compliantLoans,
        "Non-Compliant Loans": complianceMetrics.nonCompliantLoans,
        "Compliance Rate": `${complianceMetrics.complianceRate.toFixed(2)}%`,
      },
      ...complianceMetrics.violations.map((v: any) => ({
        "Violation Type": v.violation_type,
        "Count": v.count,
        "Severity": v.severity,
        "Description": v.description,
      })),
    ];

    if (format === "csv") {
      exportToCSV(exportData, `nbe_compliance_report_${format(new Date(), "yyyy-MM-dd")}`);
    } else if (format === "excel") {
      exportToExcel(exportData, `nbe_compliance_report_${format(new Date(), "yyyy-MM-dd")}`);
    }

    toast({
      title: "Success",
      description: `Report exported as ${format.toUpperCase()}`,
    });
  };

  // Filter violations
  const filteredViolations = selectedViolationType === "all"
    ? complianceMetrics.violations
    : complianceMetrics.violations.filter((v: any) => v.violation_type === selectedViolationType);

  // Violation type distribution
  const violationTypeData = complianceMetrics.violations.map(v => ({
    name: v.violation_type.replace('_', ' ').toUpperCase(),
    value: v.count,
    severity: v.severity,
  }));

  // Compliance trend data (mock - would come from historical data)
  const complianceTrendData = useMemo(() => [
    { month: "Jan", rate: 95.2, violations: 12, critical: 2 },
    { month: "Feb", rate: 94.8, violations: 15, critical: 3 },
    { month: "Mar", rate: 96.1, violations: 9, critical: 1 },
    { month: "Apr", rate: 95.5, violations: 11, critical: 2 },
    { month: "May", rate: 96.8, violations: 7, critical: 1 },
    { month: "Jun", rate: complianceMetrics.complianceRate, violations: complianceMetrics.nonCompliantLoans, critical: Math.floor(complianceMetrics.nonCompliantLoans * 0.2) },
  ], [complianceMetrics]);

  // Generate compliance alerts
  const complianceAlerts = useMemo(() => {
    const alerts = [];
    
    if (complianceMetrics.complianceRate < 90) {
      alerts.push({
        type: "critical",
        title: "Low Compliance Rate",
        message: `Compliance rate is ${complianceMetrics.complianceRate.toFixed(1)}%, below 90% threshold`,
        action: "Review and address violations immediately"
      });
    }
    
    const salaryViolations = complianceMetrics.violations.find(v => v.violation_type === "salary_rule");
    if (salaryViolations && salaryViolations.count > 5) {
      alerts.push({
        type: "warning",
        title: "High Salary Rule Violations",
        message: `${salaryViolations.count} applications violate the 1/3 salary rule`,
        action: "Review income verification processes"
      });
    }
    
    const interestViolations = complianceMetrics.violations.find(v => v.violation_type === "interest_rate");
    if (interestViolations && interestViolations.count > 0) {
      alerts.push({
        type: "warning",
        title: "Interest Rate Violations",
        message: `${interestViolations.count} applications have interest rates outside NBE limits`,
        action: "Adjust pricing models to comply with 12-25% range"
      });
    }
    
    return alerts;
  }, [complianceMetrics]);

  // Executive summary metrics
  const executiveSummary = useMemo(() => ({
    totalPortfolioValue: portfolioData.total_portfolio_value || 0,
    complianceScore: complianceMetrics.complianceRate,
    riskLevel: complianceMetrics.complianceRate >= 95 ? "Low" : complianceMetrics.complianceRate >= 90 ? "Medium" : "High",
    criticalViolations: complianceMetrics.violations.filter(v => v.severity === "high").reduce((sum, v) => sum + v.count, 0),
    monthlyTrend: complianceTrendData.length >= 2 ? 
      complianceTrendData[complianceTrendData.length - 1].rate - complianceTrendData[complianceTrendData.length - 2].rate : 0,
  }), [portfolioData, complianceMetrics, complianceTrendData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NBE Regulatory Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive compliance monitoring, violation tracking, and regulatory reporting
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetchOverview()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setReportDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Enhanced Filters with Quick Presets */}
      <DashboardSection
        title="Reporting Period & Filters"
        description="Select date range and filters for regulatory compliance analysis"
        icon={Calendar}
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

              {/* Custom Date Range */}
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

              {/* Additional Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Violation Type</Label>
                  <Select value={selectedViolationType} onValueChange={setSelectedViolationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="salary_rule">1/3 Salary Rule</SelectItem>
                      <SelectItem value="interest_rate">Interest Rate</SelectItem>
                      <SelectItem value="loan_term">Loan Term</SelectItem>
                      <SelectItem value="loan_amount">Loan Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Executive View</Label>
                  <Select value={executiveViewMode} onValueChange={setExecutiveViewMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Executive Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis</SelectItem>
                      <SelectItem value="trends">Trend Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant={alertsEnabled ? "default" : "outline"}
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                    className="w-full"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {alertsEnabled ? "Alerts On" : "Alerts Off"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Compliance Alerts */}
      {alertsEnabled && complianceAlerts.length > 0 && (
        <DashboardSection
          title="Compliance Alerts"
          description="Critical compliance issues requiring immediate attention"
          icon={Bell}
        >
          <div className="space-y-4">
            {complianceAlerts.map((alert, index) => (
              <Alert key={index} variant={alert.type === "critical" ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>
                  {alert.message}
                  <br />
                  <strong>Action Required:</strong> {alert.action}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </DashboardSection>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="executive" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Executive
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Compliance Metrics */}
          <DashboardSection
            title="NBE Compliance Metrics"
            description="Key compliance performance indicators and regulatory adherence metrics"
            icon={Shield}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {complianceMetrics.complianceRate.toFixed(2)}%
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {complianceMetrics.complianceRate >= 95 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        {complianceMetrics.compliantLoans} of {complianceMetrics.totalLoans} loans compliant
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliant Loans</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600">
                        {complianceMetrics.compliantLoans}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {complianceMetrics.totalLoans > 0
                          ? ((complianceMetrics.compliantLoans / complianceMetrics.totalLoans) * 100).toFixed(1)
                          : 0}% of total portfolio
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Violations</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-red-600">
                        {complianceMetrics.nonCompliantLoans}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {complianceMetrics.violations.length} violation types
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className={`text-2xl font-bold ${
                        executiveSummary.riskLevel === "Low" ? "text-green-600" :
                        executiveSummary.riskLevel === "Medium" ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {executiveSummary.riskLevel}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Based on compliance rate
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>

          {/* Compliance Distribution */}
          <DashboardSection
            title="Compliance Distribution Analysis"
            description="Visual breakdown of compliance status and violation types"
            icon={BarChart3}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status Distribution</CardTitle>
                  <CardDescription>Overall compliance vs non-compliance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Compliant", value: complianceMetrics.compliantLoans, color: "#00C49F" },
                            { name: "Non-Compliant", value: complianceMetrics.nonCompliantLoans, color: "#FF8042" }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#00C49F" />
                          <Cell fill="#FF8042" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Violation Types Breakdown</CardTitle>
                  <CardDescription>Distribution of different violation categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : violationTypeData.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                      <p className="text-muted-foreground">No violations found</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={violationTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-6">
          <DashboardSection
            title="Compliance Violations Tracking"
            description="Detailed tracking and analysis of compliance violations with severity levels"
            icon={AlertTriangle}
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("csv")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("excel")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Violations Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown of compliance violations by type and severity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : filteredViolations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <p className="text-muted-foreground">No violations found for selected criteria</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Violation Type</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Recommended Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredViolations.map((violation: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {violation.violation_type.replace('_', ' ').toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{violation.count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                violation.severity === "high"
                                  ? "destructive"
                                  : violation.severity === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {violation.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{violation.description}</TableCell>
                          <TableCell>
                            {violation.severity === "high" ? "Immediate review required" :
                             violation.severity === "medium" ? "Review within 48 hours" :
                             "Review during next audit cycle"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </DashboardSection>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <DashboardSection
            title="Compliance Trend Analysis"
            description="Historical compliance performance and trend analysis"
            icon={TrendingUp}
          >
            <Card>
              <CardHeader>
                <CardTitle>Monthly Compliance Trends</CardTitle>
                <CardDescription>Compliance rate and violation trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={complianceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="rate" 
                        fill="#8884d8" 
                        stroke="#8884d8"
                        fillOpacity={0.3}
                        name="Compliance Rate (%)"
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="violations" 
                        fill="#ff7300" 
                        name="Total Violations"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="critical" 
                        stroke="#ff0000" 
                        strokeWidth={3}
                        name="Critical Violations"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </DashboardSection>
        </TabsContent>

        {/* Executive Tab */}
        <TabsContent value="executive" className="space-y-6">
          <DashboardSection
            title="Executive Summary Dashboard"
            description="High-level compliance overview for executive reporting and decision making"
            icon={Users}
          >
            {/* Executive KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Portfolio Compliance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold flex items-center gap-2 ${
                    executiveSummary.complianceScore >= 95 ? "text-green-600" :
                    executiveSummary.complianceScore >= 90 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    <Shield className="h-6 w-6" />
                    {executiveSummary.complianceScore.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {executiveSummary.monthlyTrend >= 0 ? "↗" : "↘"} 
                    {Math.abs(executiveSummary.monthlyTrend).toFixed(1)}% vs last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6" />
                    {executiveSummary.criticalViolations}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Portfolio Value at Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                      notation: "compact",
                    }).format(executiveSummary.totalPortfolioValue * (1 - executiveSummary.complianceScore / 100))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Non-compliant portfolio value
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Executive Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Executive Actions</CardTitle>
                <CardDescription>Priority actions based on current compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executiveSummary.complianceScore < 90 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Immediate Action Required</AlertTitle>
                      <AlertDescription>
                        Compliance rate below 90% threshold. Recommend immediate review of loan approval processes and staff training on NBE regulations.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {executiveSummary.criticalViolations > 0 && (
                    <Alert>
                      <Bell className="h-4 w-4" />
                      <AlertTitle>Critical Violations Detected</AlertTitle>
                      <AlertDescription>
                        {executiveSummary.criticalViolations} critical violations require executive review. Consider implementing additional approval layers for high-risk applications.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Continuous Monitoring</AlertTitle>
                    <AlertDescription>
                      Maintain current compliance monitoring processes and consider quarterly compliance training for all loan officers.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate NBE Compliance Report</DialogTitle>
            <DialogDescription>
              Generate a comprehensive compliance report for regulatory submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Period Start</Label>
              <Input
                type="date"
                value={reportPeriodStart}
                onChange={(e) => setReportPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Report Period End</Label>
              <Input
                type="date"
                value={reportPeriodEnd}
                onChange={(e) => setReportPeriodEnd(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setReportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending || !reportPeriodStart || !reportPeriodEnd}
              >
                {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RegulatoryReportingPage() {
  return (
    <ErrorBoundary>
      <RegulatoryReportingPageContent />
    </ErrorBoundary>
  );
}
