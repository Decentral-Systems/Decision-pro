"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuditLogsTable } from "@/components/admin/AuditLogsTable";
import { AuditLogDetailDialog } from "@/components/admin/AuditLogDetailDialog";
import { useAuditLogs } from "@/lib/api/hooks/useAuditLogs";
import { AuditLogFilters, AuditLogEntry } from "@/types/admin";
import { exportToCSV, exportToPDF } from "@/lib/utils/exportHelpers";
import {
  AlertTriangle,
  Download,
  Filter,
  X,
  RefreshCw,
  Play,
  Pause,
  Save,
  Bookmark,
  TrendingUp,
  FileText,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Badge } from "@/components/ui/badge";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { useAuth } from "@/lib/auth/auth-context";
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [spikeAlert, setSpikeAlert] = useState<{
    count: number;
    timeWindow: string;
  } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAuditLogs({
    ...filters,
    page,
    page_size: 20,
    sort_by: sortBy,
    order: sortOrder,
  });

  // Detect spikes in audit log volume
  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      const recentCount = data.items.filter((log: AuditLogEntry) => {
        const logTime = new Date(log.timestamp).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return logTime > fiveMinutesAgo;
      }).length;

      if (recentCount > 100) {
        setSpikeAlert({
          count: recentCount,
          timeWindow: "5 minutes",
        });
        toast({
          title: "High Activity Alert",
          description: `${recentCount} audit log entries in the last 5 minutes`,
          variant: "destructive",
        });
      } else {
        setSpikeAlert(null);
      }
    }
  }, [data, toast]);

  // Load saved filters
  useEffect(() => {
    const saved = localStorage.getItem("audit_logs_saved_filters");
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load saved filters:", e);
      }
    }
  }, []);

  const saveCurrentFilters = () => {
    const filterName = prompt("Enter a name for this filter:");
    if (!filterName) return;

    const newFilter = {
      id: `filter_${Date.now()}`,
      name: filterName,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem("audit_logs_saved_filters", JSON.stringify(updated));
    toast({
      title: "Filter Saved",
      description: `Filter "${filterName}" saved successfully`,
    });
  };

  const loadSavedFilter = (savedFilter: any) => {
    setFilters(savedFilter.filters);
    setPage(1);
    toast({
      title: "Filter Loaded",
      description: `Filter "${savedFilter.name}" loaded`,
    });
  };

  // Real-time updates via polling
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refetch();
      }, refreshInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [autoRefresh, refreshInterval, refetch]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleExport = async () => {
    if (!data?.items || data.items.length === 0) {
      toast({
        title: "No Data",
        description: "No audit logs to export",
        variant: "destructive",
      });
      return;
    }

    const correlationId = getOrCreateCorrelationId();
    const requesterIdentity = user?.email || user?.name || "Unknown";

    const exportData = data.items.map((log) => ({
      Timestamp: log.timestamp,
      Status: log.status,
      User: log.user_id || log.username || "N/A",
      Action: log.action,
      "Resource Type": log.resource_type || "N/A",
      "Resource ID": log.resource_id || "N/A",
      "Correlation ID": (log.details as any)?.correlation_id || "N/A",
      "IP Address": log.ip_address || "N/A",
      Details: JSON.stringify(log.details || {}),
    }));

    const filterSummary =
      Object.entries(filters)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ") || "No filters";

    await exportToCSV(
      exportData,
      `audit_logs_${new Date().toISOString().split("T")[0]}`,
      undefined,
      {
        includeSignature: true,
        version: "1.0.0",
        filterSummary: filterSummary,
        requesterIdentity: requesterIdentity,
        correlationId: correlationId,
      }
    );

    toast({
      title: "Export Successful",
      description: `Audit logs exported with signature (ID: ${correlationId.substring(0, 8)}...)`,
    });
  };

  const generateAuditLogsPDF = (
    logs: AuditLogEntry[],
    filters: AuditLogFilters,
    correlationId: string,
    requesterIdentity: string
  ): string => {
    const filteredCount = logs.length;
    const successCount = logs.filter((log) => log.status === "success").length;
    const failureCount = logs.filter((log) => log.status === "failure").length;
    const errorCount = logs.filter((log) => log.status === "error").length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Logs Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .summary-item { display: inline-block; margin-right: 30px; font-weight: bold; }
          .summary-label { font-weight: normal; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          .success { color: green; }
          .failure { color: orange; }
          .error { color: red; }
          .metadata { margin-top: 20px; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Audit Logs Report</h1>
        <div class="metadata">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Requester:</strong> ${requesterIdentity}</p>
          <p><strong>Correlation ID:</strong> ${correlationId}</p>
          ${filters.start_date || filters.end_date ? `<p><strong>Date Range:</strong> ${filters.start_date || "All"} to ${filters.end_date || "All"}</p>` : ""}
          ${filters.status ? `<p><strong>Status Filter:</strong> ${filters.status}</p>` : ""}
          ${filters.action ? `<p><strong>Action Filter:</strong> ${filters.action}</p>` : ""}
          ${filters.correlation_id ? `<p><strong>Correlation ID Filter:</strong> ${filters.correlation_id}</p>` : ""}
          <p><strong>Filter Summary:</strong> ${
            Object.entries(filters)
              .filter(([_, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ") || "No filters"
          }</p>
        </div>
        <div class="summary">
          <div class="summary-item">Total: <span class="summary-label">${filteredCount}</span></div>
          <div class="summary-item">Success: <span class="summary-label">${successCount}</span></div>
          <div class="summary-item">Failure: <span class="summary-label">${failureCount}</span></div>
          <div class="summary-item">Error: <span class="summary-label">${errorCount}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource Type</th>
              <th>Resource ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            ${logs
              .slice(0, 500)
              .map(
                (log) => `
              <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td class="${log.status}">${log.status.toUpperCase()}</td>
                <td>${log.user_id || log.username || "N/A"}</td>
                <td>${log.action}</td>
                <td>${log.resource_type || "N/A"}</td>
                <td>${log.resource_id || "N/A"}</td>
                <td>${log.ip_address || "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        ${logs.length > 500 ? `<p class="metadata"><em>Showing first 500 results. Total: ${logs.length}</em></p>` : ""}
      </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    if (!data?.items || data.items.length === 0) {
      toast({
        title: "No Data",
        description: "No audit logs to export",
        variant: "destructive",
      });
      return;
    }

    const correlationId = getOrCreateCorrelationId();
    const requesterIdentity = user?.email || user?.name || "Unknown";
    const htmlContent = generateAuditLogsPDF(
      data.items,
      filters,
      correlationId,
      requesterIdentity
    );

    await exportToPDF(
      htmlContent,
      `audit_logs_${new Date().toISOString().split("T")[0]}`,
      {
        includeSignature: true,
        version: "1.0.0",
        filterSummary:
          Object.entries(filters)
            .filter(([_, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ") || "No filters",
        requesterIdentity: requesterIdentity,
        correlationId: correlationId,
      }
    );

    toast({
      title: "Export Successful",
      description: `PDF exported with signature (ID: ${correlationId.substring(0, 8)}...)`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              View system audit logs and activity history
            </p>
            {autoRefresh && (
              <Badge variant="default" className="ml-2">
                Auto-refreshing every {refreshInterval}s
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/api/v1/audit/logs" label="Live" />
          <div className="flex items-center gap-2">
            {savedFilters.length > 0 && (
              <Select
                onValueChange={(value) => {
                  const saved = savedFilters.find((f) => f.id === value);
                  if (saved) loadSavedFilter(saved);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <Bookmark className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Saved Filters" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map((filter) => (
                    <SelectItem key={filter.id} value={filter.id}>
                      {filter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            {Object.keys(filters).length > 0 && (
              <Button variant="outline" onClick={saveCurrentFilters}>
                <Save className="mr-2 h-4 w-4" />
                Save Filter
              </Button>
            )}
          </div>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Stop auto-refresh" : "Start auto-refresh"}
          >
            {autoRefresh ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Auto-refresh OFF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Spike Alert */}
      {spikeAlert && (
        <Alert variant="destructive">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            High activity detected: {spikeAlert.count} audit log entries in the
            last {spikeAlert.timeWindow}
          </AlertDescription>
        </Alert>
      )}

      {showFilters && (
        <DashboardSection
          title="Filters"
          description="Filter audit logs by status, action, resource type, correlation ID, user, and date range"
          icon={Filter}
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveCurrentFilters}
                disabled={Object.keys(filters).length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </>
          }
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("status", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failure</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Action</Label>
                  <Input
                    placeholder="Filter by action"
                    value={filters.action || ""}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <Input
                    placeholder="Filter by resource"
                    value={filters.resource_type || ""}
                    onChange={(e) =>
                      handleFilterChange("resource_type", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Correlation ID</Label>
                  <Input
                    placeholder="Search by correlation ID"
                    value={filters.correlation_id || ""}
                    onChange={(e) =>
                      handleFilterChange("correlation_id", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input
                    placeholder="Filter by user"
                    value={filters.user_id || ""}
                    onChange={(e) =>
                      handleFilterChange("user_id", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.start_date || ""}
                    onChange={(e) =>
                      handleFilterChange("start_date", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.end_date || ""}
                    onChange={(e) =>
                      handleFilterChange("end_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardSection>
      )}

      {error &&
        (error as any)?.statusCode !== 401 &&
        (error as any)?.statusCode !== 404 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load audit logs from API.
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

      {(data === null || error) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Audit Logs API is currently unavailable. Please check your
            connection or try again later.
          </AlertDescription>
        </Alert>
      )}

      <DashboardSection
        title="Audit Log Entries"
        description={`${data?.total !== undefined ? `Total: ${data.total} log entry(ies)` : "System activity logs"}. View and analyze system audit logs with filtering and export capabilities.`}
        icon={FileText}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Log Entries</CardTitle>
            <CardDescription>
              {data?.total !== undefined
                ? `Total: ${data.total} log entry(ies)`
                : "System activity logs"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogsTable
              data={data?.items || []}
              isLoading={isLoading}
              onRowClick={(log) => setSelectedLog(log)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(field, order) => {
                setSortBy(field);
                setSortOrder(order);
              }}
            />
            {data && data.total && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(data.total / 20)}
                  pageSize={20}
                  totalItems={data.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardSection>

      {selectedLog && (
        <AuditLogDetailDialog
          log={selectedLog}
          open={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
        />
      )}
    </div>
  );
}
