"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, AlertTriangle, History, Activity } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ExportService } from "@/lib/utils/export-service";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { useDefaultPredictionHistory } from "@/lib/api/hooks/useDefaultPredictionHistory";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/common/Pagination";
import { TrendSparkline } from "@/components/charts/TrendSparkline";
import { exportToCSV } from "@/lib/utils/exportHelpers";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { EmptyState } from "@/components/common/EmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import { CacheMetadata } from "@/components/common/CacheMetadata";

export default function DefaultPredictionHistoryPage() {
  const [customerId, setCustomerId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("all");
  const [product, setProduct] = useState<string>("all");
  const [termMin, setTermMin] = useState<string>("");
  const [termMax, setTermMax] = useState<string>("");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageSize = 50;

  // Fetch default prediction history
  const { data: historyResponse, isLoading, error } = useDefaultPredictionHistory({
    customer_id: customerId || undefined,
    start_date: dateFrom || undefined,
    end_date: dateTo || undefined,
    risk_level: riskLevel !== "all" ? riskLevel : undefined,
    product: product !== "all" ? product : undefined,
    term_min: termMin ? parseInt(termMin) : undefined,
    term_max: termMax ? parseInt(termMax) : undefined,
    amount_min: amountMin ? parseFloat(amountMin) : undefined,
    amount_max: amountMax ? parseFloat(amountMax) : undefined,
    page,
    page_size: pageSize,
  });

  const historyData = historyResponse?.items || [];

  const handleExport = async (format: "pdf" | "excel" | "csv", bulk: boolean = false) => {
    const dataToExport = bulk && selectedIds.size > 0
      ? historyData.filter((item: any) => selectedIds.has(item.id || item.prediction_id))
      : historyData;

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const correlationId = getOrCreateCorrelationId();

    if (format === "csv") {
      const exportData = dataToExport.map((item: any) => ({
        "Customer ID": item.customer_id,
        "Default Probability": `${(item.default_probability * 100).toFixed(2)}%`,
        "Risk Level": item.risk_level,
        "Survival Probability": item.survival_probability ? `${(item.survival_probability * 100).toFixed(2)}%` : "N/A",
        "Model Version": item.model_version || "N/A",
        "Correlation ID": item.correlation_id || correlationId,
        "Date": new Date(item.created_at).toISOString(),
        "Product": item.product || "N/A",
        "Loan Amount": item.loan_amount || "N/A",
        "Term (months)": item.loan_term_months || "N/A",
      }));
      await exportToCSV(exportData, "default_prediction_history", undefined, {
        includeSignature: true,
        version: "1.0.0",
        filterSummary: bulk ? `Bulk export: ${selectedIds.size} items` : `Total: ${dataToExport.length} items`,
      });
    } else if (format === "pdf") {
      ExportService.exportPredictionToPDF(
        { items: dataToExport },
        { filename: `prediction_history_${new Date().toISOString().split("T")[0]}.pdf` }
      );
    } else {
      ExportService.exportToExcel(dataToExport, {
        filename: `prediction_history_${new Date().toISOString().split("T")[0]}.xlsx`,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Default Prediction History</h1>
            <CacheMetadata cacheKey="default-prediction-history" variant="compact" />
          </div>
          <p className="text-muted-foreground">
            View and analyze past default probability predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => handleExport("csv", true)}
              disabled={selectedIds.size === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Bulk Export CSV ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={historyData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={historyData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={historyData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DashboardSection
        title="Filters"
        description="Filter prediction history by customer, date range, risk level, product, term, and amount range"
        icon={Filter}
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv", true)}
                disabled={selectedIds.size === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Bulk Export CSV ({selectedIds.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={historyData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              disabled={historyData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={historyData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </>
        }
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerAutocomplete
                value={customerId}
                onSelect={setCustomerId}
                placeholder="Search customer..."
              />
            </div>
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="very_high">Very High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="personal_loan">Personal Loan</SelectItem>
                  <SelectItem value="business_loan">Business Loan</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term (months) - Min</Label>
              <Input
                type="number"
                placeholder="Min"
                value={termMin}
                onChange={(e) => setTermMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Term (months) - Max</Label>
              <Input
                type="number"
                placeholder="Max"
                value={termMax}
                onChange={(e) => setTermMax(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (ETB) - Min</Label>
              <Input
                type="number"
                placeholder="Min"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (ETB) - Max</Label>
              <Input
                type="number"
                placeholder="Max"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        </Card>
      </DashboardSection>

      {/* History Table */}
      <DashboardSection
        title="Prediction History"
        description={`${historyData.length > 0 ? `${historyData.length} predictions found` : "No prediction history found"}. View and analyze past default probability predictions.`}
        icon={History}
      >
        <Card>
          <CardHeader>
            <CardTitle>History Table</CardTitle>
            <CardDescription>
              {historyData.length > 0
                ? `${historyData.length} predictions found`
                : "No prediction history found"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading prediction history...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error loading history: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : historyData.length === 0 ? (
            <EmptyState
              title="No Prediction History"
              description="No prediction history available. Start making predictions to see history here."
              variant="empty"
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium w-12">
                        <Checkbox
                          checked={selectedIds.size === historyData.length && historyData.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds(new Set(historyData.map((item: any) => item.id || item.prediction_id)));
                            } else {
                              setSelectedIds(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Customer ID</th>
                      <th className="p-3 text-left text-sm font-medium">Default Probability</th>
                      <th className="p-3 text-left text-sm font-medium">Risk Level</th>
                      <th className="p-3 text-left text-sm font-medium">Trend</th>
                      <th className="p-3 text-left text-sm font-medium">Survival Probability</th>
                      <th className="p-3 text-left text-sm font-medium">Model Version</th>
                      <th className="p-3 text-left text-sm font-medium">Correlation ID</th>
                      <th className="p-3 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((item: any, index: number) => {
                      const itemId = item.id || item.prediction_id;
                      const isSelected = selectedIds.has(itemId);
                      // Use trend data from API if available, otherwise show empty/no trend
                      const trendData = item.trend_data || [];
                      const isHighRisk = item.risk_level === "high" || item.risk_level === "very_high" || item.default_probability > 0.4;
                      
                      return (
                        <tr 
                          key={itemId} 
                          className={`border-b ${isSelected ? 'bg-primary/5' : ''} ${isHighRisk ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedIds);
                                if (checked) {
                                  newSet.add(itemId);
                                } else {
                                  newSet.delete(itemId);
                                }
                                setSelectedIds(newSet);
                              }}
                            />
                          </td>
                          <td className="p-3 text-sm">{item.customer_id}</td>
                          <td className="p-3 text-sm font-medium">
                            {(item.default_probability * 100).toFixed(2)}%
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                item.risk_level === "low" ? "default" :
                                item.risk_level === "medium" ? "secondary" :
                                item.risk_level === "high" || item.risk_level === "very_high" ? "destructive" : "outline"
                              }>
                                {item.risk_level}
                              </Badge>
                              {isHighRisk && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  High Risk
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <TrendSparkline 
                              data={trendData} 
                              color={isHighRisk ? "#ef4444" : "#0ea5e9"}
                            />
                          </td>
                          <td className="p-3 text-sm">
                            {item.survival_probability ? (item.survival_probability * 100).toFixed(2) + "%" : "N/A"}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {item.model_version || "N/A"}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {item.correlation_id ? (
                              <Badge variant="outline" className="text-xs font-mono">
                                {item.correlation_id.substring(0, 8)}...
                              </Badge>
                            ) : (
                              <span className="text-xs">N/A</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {historyResponse && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil((historyResponse.total || historyData.length) / pageSize)}
                  pageSize={pageSize}
                  totalItems={historyResponse.total}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </DashboardSection>
    </div>
  );
}

