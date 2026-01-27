"use client";
import React, { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Search,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { BatchProgress, BatchItemResult } from "@/lib/utils/batchProcessor";
import { BatchPredictionInput, BatchPredictionOutput } from "@/lib/api/hooks/useBatchPrediction";
import { exportToPDF, exportToExcel } from "@/lib/utils/export-service";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { exportToCSV } from "@/lib/utils/exportHelpers";

interface BatchPredictionResultsProps {
  results: BatchItemResult<BatchPredictionInput, BatchPredictionOutput>[];
  progress: BatchProgress | null;
  className?: string;
}

type SortField = "customer_id" | "probability" | "risk" | "success";
type SortDirection = "asc" | "desc";

/**
 * BatchPredictionResults Component
 * 
 * Displays results of batch prediction processing
 */
export function BatchPredictionResults({
  results,
  progress,
  className,
}: BatchPredictionResultsProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("customer_id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Search filter
    if (search) {
      filtered = filtered.filter(r => 
        r.input.customer_id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus === "success") {
      filtered = filtered.filter(r => r.success);
    } else if (filterStatus === "failed") {
      filtered = filtered.filter(r => !r.success);
    }

    // Risk filter
    if (filterRisk !== "all") {
      filtered = filtered.filter(r => 
        r.success && r.output?.risk_level === filterRisk
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "customer_id":
          comparison = a.input.customer_id.localeCompare(b.input.customer_id);
          break;
        case "probability":
          comparison = (a.output?.default_probability || 0) - (b.output?.default_probability || 0);
          break;
        case "risk":
          const riskOrder = { low: 1, medium: 2, high: 3, very_high: 4 };
          comparison = (riskOrder[a.output?.risk_level as keyof typeof riskOrder] || 0) - 
                      (riskOrder[b.output?.risk_level as keyof typeof riskOrder] || 0);
          break;
        case "success":
          comparison = (a.success ? 1 : 0) - (b.success ? 1 : 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [results, search, filterStatus, filterRisk, sortField, sortDirection]);

  const summary = useMemo(() => {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    const riskDistribution = results.reduce((acc, r) => {
      if (r.success && r.output?.risk_level) {
        acc[r.output.risk_level] = (acc[r.output.risk_level] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const avgProbability = results
      .filter(r => r.success && r.output?.default_probability !== undefined)
      .reduce((sum, r) => sum + (r.output?.default_probability || 0), 0) / successful || 0;

    return { successful, failed, riskDistribution, avgProbability };
  }, [results]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    const correlationId = getOrCreateCorrelationId();
    const exportData = filteredResults.map(r => ({
      "Customer ID": r.input.customer_id,
      "Loan Amount": r.input.loan_amount,
      "Term (months)": r.input.loan_term_months,
      "Status": r.success ? "Success" : "Failed",
      "Default Probability": r.success ? `${((r.output?.default_probability || 0) * 100).toFixed(2)}%` : "N/A",
      "Risk Level": r.output?.risk_level || "N/A",
      "Recommendation": r.output?.recommendation || "N/A",
      "Survival Probability": r.success ? `${((r.output?.survival_probability || 0) * 100).toFixed(2)}%` : "N/A",
      "Correlation ID": correlationId,
    }));

    if (format === "pdf") {
      await exportToPDF(exportData, {
        title: "Batch Prediction Results",
        filename: `batch-results-${Date.now()}`,
      });
    } else if (format === "excel") {
      exportToExcel(exportData, {
        filename: `batch-results-${Date.now()}`,
        sheetName: "Predictions",
      });
    } else {
      await exportToCSV(exportData, "batch_prediction_results", undefined, {
        includeSignature: true,
        version: "1.0.0",
        filterSummary: `Total: ${filteredResults.length} results`,
      });
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Successful"
          value={summary.successful}
          total={results.length}
        />
        <SummaryCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          label="Failed"
          value={summary.failed}
          total={results.length}
        />
        <SummaryCard
          icon={<AlertCircle className="h-5 w-5 text-yellow-500" />}
          label="Avg Default Prob."
          value={`${(summary.avgProbability * 100).toFixed(1)}%`}
        />
        <SummaryCard
          icon={<Filter className="h-5 w-5 text-blue-500" />}
          label="Filtered"
          value={filteredResults.length}
          total={results.length}
        />
      </div>

      {/* Risk Distribution */}
      {Object.keys(summary.riskDistribution).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(summary.riskDistribution).map(([risk, count]) => (
                <div key={risk} className="flex items-center gap-2">
                  <RiskBadge risk={risk} />
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Results ({filteredResults.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("customer_id")}
                    >
                      Customer ID
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Loan</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("success")}
                    >
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("probability")}
                    >
                      Default Prob.
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("risk")}
                    >
                      Risk
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono font-medium">
                      {result.input.customer_id}
                    </TableCell>
                    <TableCell>
                      {result.input.loan_amount?.toLocaleString()} ETB
                      <span className="text-xs text-muted-foreground ml-1">
                        / {result.input.loan_term_months}m
                      </span>
                    </TableCell>
                    <TableCell>
                      {result.success ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.success && result.output ? (
                        <ProbabilityIndicator probability={result.output.default_probability} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.success && result.output ? (
                        <RiskBadge risk={result.output.risk_level} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.success && result.output ? (
                        <RecommendationBadge recommendation={result.output.recommendation} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {result.error instanceof Error ? result.error.message : 'Failed'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{result.attempts}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No results match your filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function SummaryCard({ 
  icon, 
  label, 
  value, 
  total 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string;
  total?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold">
          {value}
          {total !== undefined && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {total}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProbabilityIndicator({ probability }: { probability: number }) {
  const percent = (probability * 100).toFixed(1);
  const color = probability < 0.2 ? "text-green-600" : 
                probability < 0.4 ? "text-yellow-600" : "text-red-600";
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full",
            probability < 0.2 ? "bg-green-500" :
            probability < 0.4 ? "bg-yellow-500" : "bg-red-500"
          )}
          style={{ width: `${Math.min(probability * 100, 100)}%` }}
        />
      </div>
      <span className={cn("text-sm font-medium", color)}>{percent}%</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const variants: Record<string, string> = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    very_high: "bg-red-100 text-red-800 border-red-200",
  };
  
  return (
    <Badge variant="outline" className={cn("capitalize", variants[risk] || variants.medium)}>
      {risk.replace('_', ' ')}
    </Badge>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const variants: Record<string, string> = {
    approve: "bg-green-100 text-green-800 border-green-200",
    review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    reject: "bg-red-100 text-red-800 border-red-200",
  };
  
  return (
    <Badge variant="outline" className={cn("capitalize", variants[recommendation] || variants.review)}>
      {recommendation}
    </Badge>
  );
}

export default BatchPredictionResults;


