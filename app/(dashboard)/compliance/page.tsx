"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useComplianceData,
  useGenerateComplianceReport,
  useReviewViolation,
} from "@/lib/api/hooks/useCompliance";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToPDF } from "@/lib/utils/exportHelpers";
import { safeFormatDate } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { SLATimer } from "@/components/compliance/SLATimer";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "compliant":
      return "default";
    case "non_compliant":
      return "destructive";
    case "warning":
      return "secondary";
    default:
      return "outline";
  }
};

export default function CompliancePage() {
  const { data, isLoading, error, refetch } = useComplianceData();
  const generateReport = useGenerateComplianceReport();
  const reviewViolation = useReviewViolation();
  const { toast } = useToast();
  const [reportFormat, setReportFormat] = useState<string>("json");
  const [selectedViolations, setSelectedViolations] = useState<Set<string>>(
    new Set()
  );
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [filterCustomer, setFilterCustomer] = useState<string>("");

  // Use only API data - no fallback
  const complianceData = data || null;

  const handleGenerateReport = async () => {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 1);

    try {
      const report = await generateReport.mutateAsync({
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        format: reportFormat,
      });

      // Handle PDF generation
      if (reportFormat === "pdf" && report) {
        // Generate PDF from report data
        const htmlContent = generateComplianceReportPDF(report, complianceData);
        exportToPDF(
          htmlContent,
          `compliance_report_${report.report_id || Date.now()}`
        );
        toast({
          title: "Success",
          description: "Compliance report PDF generated and downloaded",
        });
      } else if (report?.report_id) {
        // Report generated, show success message
        toast({
          title: "Success",
          description: `Compliance report generated (ID: ${report.report_id})`,
        });
      } else {
        toast({
          title: "Success",
          description: "Compliance report generated successfully",
        });
      }
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate compliance report",
        variant: "destructive",
      });
    }
  };

  // Helper function to generate PDF HTML content
  const generateComplianceReportPDF = (report: any, data: any) => {
    const complianceRate = report.summary?.compliance_rate || 0;
    const violationsCount = report.summary?.violations_count || 0;
    const totalChecks = report.summary?.total_checks || 0;
    const compliantCount = totalChecks - violationsCount;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>NBE Compliance Report - ${report.report_id}</title>
          <style>
            @page {
              margin: 2cm;
              size: A4;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #1f2937;
              background: #ffffff;
            }
            .header {
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo-placeholder {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 20px;
            }
            .company-info h1 {
              font-size: 24pt;
              color: #1e40af;
              margin-bottom: 5px;
              font-weight: 700;
            }
            .company-info p {
              color: #6b7280;
              font-size: 10pt;
            }
            .report-meta {
              text-align: right;
              font-size: 9pt;
              color: #6b7280;
            }
            .report-meta strong {
              color: #1f2937;
            }
            .summary-section {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              border-left: 5px solid #2563eb;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-top: 20px;
            }
            .summary-card {
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              text-align: center;
            }
            .summary-card h3 {
              font-size: 9pt;
              color: #6b7280;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-card .value {
              font-size: 24pt;
              font-weight: 700;
              color: #1f2937;
            }
            .summary-card.compliant .value { color: #10b981; }
            .summary-card.violations .value { color: #ef4444; }
            .summary-card.rate .value { color: #2563eb; }
            h2 {
              font-size: 18pt;
              color: #1e40af;
              margin: 30px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #e5e7eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            thead {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
            }
            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 10pt;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 10pt;
            }
            tbody tr:hover {
              background: #f9fafb;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 9pt;
              font-weight: 600;
            }
            .status-compliant {
              background: #d1fae5;
              color: #065f46;
            }
            .status-non_compliant {
              background: #fee2e2;
              color: #991b1b;
            }
            .status-warning {
              background: #fef3c7;
              color: #92400e;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 9pt;
              color: #6b7280;
            }
            .chart-placeholder {
              background: #f9fafb;
              border: 2px dashed #d1d5db;
              border-radius: 8px;
              padding: 40px;
              text-align: center;
              color: #6b7280;
              margin: 20px 0;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo-placeholder">AIS</div>
                <div class="company-info">
                  <h1>Akafay Intelligent Services</h1>
                  <p>NBE Regulatory Compliance Report</p>
                </div>
              </div>
              <div class="report-meta">
                <p><strong>Report ID:</strong> ${report.report_id}</p>
                <p><strong>Generated:</strong> ${new Date(report.generated_at).toLocaleString()}</p>
                <p><strong>Period:</strong> ${new Date(report.period_start).toLocaleDateString()} - ${new Date(report.period_end).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <h2 style="margin-top: 0; border: none; padding: 0;">Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-card compliant">
                <h3>Compliant Checks</h3>
                <div class="value">${compliantCount}</div>
              </div>
              <div class="summary-card violations">
                <h3>Violations</h3>
                <div class="value">${violationsCount}</div>
              </div>
              <div class="summary-card rate">
                <h3>Compliance Rate</h3>
                <div class="value">${complianceRate.toFixed(1)}%</div>
              </div>
              <div class="summary-card">
                <h3>Total Checks</h3>
                <div class="value">${totalChecks}</div>
              </div>
            </div>
          </div>
          
          <h2>Compliance Metrics</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Compliance Checks</td>
                <td>${totalChecks}</td>
                <td><span class="status-badge status-compliant">Active</span></td>
                <td>100% Coverage</td>
              </tr>
              <tr>
                <td>Violations Detected</td>
                <td>${violationsCount}</td>
                <td><span class="status-badge ${violationsCount > 0 ? "status-non_compliant" : "status-compliant"}">${violationsCount > 0 ? "Action Required" : "Compliant"}</span></td>
                <td>0 Violations</td>
              </tr>
              <tr>
                <td>Compliance Rate</td>
                <td>${complianceRate.toFixed(2)}%</td>
                <td><span class="status-badge ${complianceRate >= 95 ? "status-compliant" : complianceRate >= 80 ? "status-warning" : "status-non_compliant"}">${complianceRate >= 95 ? "Excellent" : complianceRate >= 80 ? "Good" : "Needs Improvement"}</span></td>
                <td>≥ 95%</td>
              </tr>
            </tbody>
          </table>
          
          ${
            data?.rules && data.rules.length > 0
              ? `
            <h2>Compliance Rules Status</h2>
            <table>
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Last Checked</th>
                </tr>
              </thead>
              <tbody>
                ${data.rules
                  .map(
                    (rule: any) => `
                  <tr>
                    <td><strong>${rule.name || "N/A"}</strong></td>
                    <td>${rule.category || "General"}</td>
                    <td><span class="status-badge status-${rule.status || "unknown"}">${(rule.status || "unknown").replace("_", " ").toUpperCase()}</span></td>
                    <td>${rule.last_checked ? new Date(rule.last_checked).toLocaleDateString() : "N/A"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }
          
          ${
            data?.violations && data.violations.length > 0
              ? `
            <h2>Violations Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Violation ID</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Detected</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.violations
                  .slice(0, 20)
                  .map(
                    (violation: any) => `
                  <tr>
                    <td>${violation.id || "N/A"}</td>
                    <td><span class="status-badge status-${violation.severity || "medium"}">${(violation.severity || "medium").toUpperCase()}</span></td>
                    <td>${violation.description || violation.message || "N/A"}</td>
                    <td>${violation.detected_at ? new Date(violation.detected_at).toLocaleDateString() : "N/A"}</td>
                    <td><span class="status-badge status-${violation.status || "open"}">${(violation.status || "open").replace("_", " ").toUpperCase()}</span></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }
          
          <div class="footer">
            <p><strong>Akafay Intelligent Services (AIS)</strong> | NBE Compliance Reporting System</p>
            <p>This report was generated automatically by the AIS Compliance Monitoring System.</p>
            <p>For questions or concerns, please contact the Compliance Department.</p>
            <p style="margin-top: 10px; font-size: 8pt;">Report generated on ${new Date().toLocaleString()} | Correlation ID: ${report.correlation_id || "N/A"}</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Compliance Center
          </h1>
          <p className="text-muted-foreground">
            NBE regulatory compliance monitoring and reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/health" label="Live" />
        </div>
      </div>

      {/* Error Alert */}
      {error && !complianceData && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">
                Failed to load compliance data from API.
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
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && !complianceData && (
        <EmptyState
          title="No Compliance Data"
          description="Compliance data is not available. This may be due to insufficient data or API connectivity issues."
          variant="empty"
          action={{
            label: "Retry",
            onClick: () => refetch(),
          }}
        />
      )}

      {!complianceData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {complianceData && (
        <>
          {/* Compliance Metrics */}
          <DashboardSection
            title="Compliance Metrics"
            description="Key compliance performance indicators including compliance rate, violations, and resolution metrics"
            icon={Shield}
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerateReport}
                  disabled={generateReport.isPending}
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Compliance Rate
                      </CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(complianceData.metrics?.compliance_rate || 0).toFixed(
                          1
                        )}
                        %
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {complianceData.metrics?.total_checks || 0} checks
                        performed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Violations
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {complianceData.metrics?.violations_count || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {complianceData.metrics?.critical_violations || 0}{" "}
                        critical
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Resolution Rate
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {complianceData.metrics?.resolution_rate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avg resolution:{" "}
                        {complianceData.metrics
                          ?.average_resolution_time_hours || 0}
                        h
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Rules
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(complianceData.rules || []).length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        NBE regulatory rules
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </DashboardSection>

          {/* Compliance Rules */}
          <DashboardSection
            title="Compliance Rules"
            description="NBE regulatory requirements status and rule compliance tracking"
            icon={ClipboardCheck}
          >
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Rules</CardTitle>
                <CardDescription>
                  NBE regulatory requirements status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-20" />
                  ) : (
                    (complianceData.rules || []).map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{rule.name}</h3>
                            <Badge variant={getStatusColor(rule.status) as any}>
                              {rule.status}
                            </Badge>
                            <Badge
                              variant={getSeverityColor(rule.severity) as any}
                            >
                              {rule.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last checked:{" "}
                            {safeFormatDate(rule.last_checked, "PPp", "Never")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {rule.status === "compliant" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </DashboardSection>

          {/* Recent Violations */}
          <DashboardSection
            title="Recent Violations"
            description="Latest compliance violations requiring attention with filtering and bulk actions"
            icon={AlertTriangle}
            actions={
              <>
                {selectedViolations.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const correlationId = getOrCreateCorrelationId();
                        // Bulk acknowledge
                        for (const violationId of selectedViolations) {
                          await reviewViolation.mutateAsync({
                            violationId,
                            action: "acknowledge",
                            notes: `Bulk acknowledged (Correlation ID: ${correlationId})`,
                          });
                        }
                        toast({
                          title: "Success",
                          description: `${selectedViolations.size} violations acknowledged (ID: ${correlationId})`,
                        });
                        setSelectedViolations(new Set());
                        refetch();
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description:
                            error.message || "Failed to acknowledge violations",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Bulk Acknowledge ({selectedViolations.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      selectedViolations.size ===
                      (complianceData?.recent_violations || []).length
                    ) {
                      setSelectedViolations(new Set());
                    } else {
                      setSelectedViolations(
                        new Set(
                          (complianceData?.recent_violations || []).map(
                            (v: any) => v.id
                          )
                        )
                      );
                    }
                  }}
                >
                  {selectedViolations.size ===
                  (complianceData?.recent_violations || []).length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </>
            }
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Violations List</CardTitle>
                    <CardDescription>
                      Latest compliance violations requiring attention
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedViolations.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const correlationId = getOrCreateCorrelationId();
                            // Bulk acknowledge
                            for (const violationId of selectedViolations) {
                              await reviewViolation.mutateAsync({
                                violationId,
                                action: "acknowledge",
                                notes: `Bulk acknowledged (Correlation ID: ${correlationId})`,
                              });
                            }
                            toast({
                              title: "Success",
                              description: `${selectedViolations.size} violations acknowledged (ID: ${correlationId})`,
                            });
                            setSelectedViolations(new Set());
                            refetch();
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description:
                                error.message ||
                                "Failed to acknowledge violations",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Bulk Acknowledge ({selectedViolations.size})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          selectedViolations.size ===
                          (complianceData?.recent_violations || []).length
                        ) {
                          setSelectedViolations(new Set());
                        } else {
                          setSelectedViolations(
                            new Set(
                              (complianceData?.recent_violations || []).map(
                                (v: any) => v.id
                              )
                            )
                          );
                        }
                      }}
                    >
                      {selectedViolations.size ===
                      (complianceData?.recent_violations || []).length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                  <Select
                    value={filterSeverity}
                    onValueChange={setFilterSeverity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Product"
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                  />
                  <Input
                    placeholder="Branch"
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                  />
                  <Input
                    placeholder="Customer ID"
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-20" />
                  ) : !complianceData.recent_violations ||
                    complianceData.recent_violations.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No recent violations
                    </div>
                  ) : (
                    (complianceData.recent_violations || [])
                      .filter((v: any) => {
                        if (
                          filterSeverity !== "all" &&
                          v.severity !== filterSeverity
                        )
                          return false;
                        if (filterStatus !== "all" && v.status !== filterStatus)
                          return false;
                        if (
                          filterProduct &&
                          !v.product
                            ?.toLowerCase()
                            .includes(filterProduct.toLowerCase())
                        )
                          return false;
                        if (
                          filterBranch &&
                          !v.branch
                            ?.toLowerCase()
                            .includes(filterBranch.toLowerCase())
                        )
                          return false;
                        if (
                          filterCustomer &&
                          !v.customer_id?.includes(filterCustomer)
                        )
                          return false;
                        return true;
                      })
                      .map((violation) => (
                        <div
                          key={violation.id}
                          className={`flex items-center justify-between rounded-lg border p-4 ${
                            selectedViolations.has(violation.id)
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedViolations.has(violation.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedViolations(
                                    new Set([
                                      ...selectedViolations,
                                      violation.id,
                                    ])
                                  );
                                } else {
                                  const newSet = new Set(selectedViolations);
                                  newSet.delete(violation.id);
                                  setSelectedViolations(newSet);
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {violation.rule_name}
                              </h3>
                              <Badge
                                variant={
                                  getSeverityColor(violation.severity) as any
                                }
                              >
                                {violation.severity}
                              </Badge>
                              <Badge variant="outline">
                                {violation.status}
                              </Badge>
                              <SLATimer
                                detectedAt={violation.detected_at}
                                severity={violation.severity}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {violation.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {violation.loan_id && (
                                <span>Loan: {violation.loan_id}</span>
                              )}
                              {violation.customer_id && (
                                <span>Customer: {violation.customer_id}</span>
                              )}
                              <span>
                                Detected:{" "}
                                {safeFormatDate(
                                  violation.detected_at,
                                  "PPp",
                                  "Unknown"
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
                                  const correlationId =
                                    getOrCreateCorrelationId();
                                  await reviewViolation.mutateAsync({
                                    violationId: violation.id,
                                    action: "acknowledge",
                                    notes: `Reviewed by compliance officer (Correlation ID: ${correlationId})`,
                                  });
                                  toast({
                                    title: "Success",
                                    description: `Violation reviewed (Correlation ID: ${correlationId.substring(0, 8)}...)`,
                                  });
                                  refetch();
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description:
                                      error.message ||
                                      "Failed to review violation",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={reviewViolation.isPending}
                            >
                              Review
                            </Button>
                            {process.env.NODE_ENV === "development" &&
                              violation.correlation_id && (
                                <Badge variant="outline" className="text-xs">
                                  ID: {violation.correlation_id.substring(0, 8)}
                                  ...
                                </Badge>
                              )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
        </>
      )}
    </div>
  );
}
