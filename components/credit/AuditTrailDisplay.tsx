/**
 * Audit Trail Display Component
 * Shows chronological audit events for credit scoring operations
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Search,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useAuditLogs } from "@/lib/api/hooks/useAuditLogs";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/utils/exportHelpers";

interface AuditTrailDisplayProps {
  customerId?: string;
  correlationId?: string;
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

export function AuditTrailDisplay({
  customerId,
  correlationId,
  limit = 50,
  showFilters = true,
  className,
}: AuditTrailDisplayProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(limit);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Fetch audit logs
  const {
    data: auditLogsData,
    isLoading,
    error,
    refetch,
  } = useAuditLogs({
    page,
    page_size: pageSize,
    ...(customerId && { customer_id: customerId }),
    ...(correlationId && { correlation_id: correlationId }),
  });

  const auditLogs = auditLogsData?.items || [];
  const totalPages = auditLogsData?.total_pages || 1;
  const totalItems = auditLogsData?.total || 0;

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    let filtered = [...auditLogs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action?.toLowerCase().includes(query) ||
          log.user_id?.toLowerCase().includes(query) ||
          log.correlation_id?.toLowerCase().includes(query) ||
          log.event_type?.toLowerCase().includes(query)
      );
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.event_type === eventTypeFilter);
    }

    // Date filter (simplified - would need date range picker for production)
    if (dateFilter !== "all") {
      const now = new Date();
      const daysAgo = parseInt(dateFilter);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
      });
    }

    return filtered;
  }, [auditLogs, searchQuery, eventTypeFilter, dateFilter]);

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "credit_score_calculated":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "compliance_violation":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "compliance_override":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "form_data_modified":
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    const colors: Record<string, string> = {
      credit_score_calculated: "bg-green-100 text-green-800",
      compliance_violation: "bg-red-100 text-red-800",
      compliance_override: "bg-orange-100 text-orange-800",
      form_data_modified: "bg-blue-100 text-blue-800",
      customer_data_accessed: "bg-purple-100 text-purple-800",
      model_version_changed: "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge
        variant="outline"
        className={colors[eventType] || "bg-gray-100 text-gray-800"}
      >
        {eventType.replace(/_/g, " ")}
      </Badge>
    );
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    const exportData = {
      title: "Audit Trail Report",
      customerId,
      correlationId,
      generatedAt: new Date().toISOString(),
      totalItems,
      logs: filteredLogs.map((log) => ({
        timestamp: log.timestamp,
        eventType: log.event_type,
        action: log.action,
        userId: log.user_id,
        correlationId: log.correlation_id,
        customerId: log.customer_id,
        details: JSON.stringify(log.details || {}, null, 2),
      })),
    };

    switch (format) {
      case "pdf":
        exportToPDF(exportData, "audit-trail-report");
        break;
      case "excel":
        exportToExcel(exportData, "audit-trail-report");
        break;
      case "csv":
        exportToCSV(exportData, "audit-trail-report");
        break;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Credit scoring operation history</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load audit trail. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of credit scoring operations and compliance events
              {totalItems > 0 && ` (${totalItems} total events)`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                <SelectItem value="credit_score_calculated">Credit Score Calculated</SelectItem>
                <SelectItem value="compliance_violation">Compliance Violation</SelectItem>
                <SelectItem value="compliance_override">Compliance Override</SelectItem>
                <SelectItem value="form_data_modified">Form Data Modified</SelectItem>
                <SelectItem value="customer_data_accessed">Data Access</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1">Last 24 Hours</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("excel")}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Audit Logs Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No audit events found matching the current filters.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Correlation ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(log.event_type || "")}
                        {getEventTypeBadge(log.event_type || "")}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.action || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.user_id || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.correlation_id ? (
                        <code className="text-xs">
                          {log.correlation_id.substring(0, 8)}...
                        </code>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {Object.keys(log.details).length} fields
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({totalItems} total events)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
