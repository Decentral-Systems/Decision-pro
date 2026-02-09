"use client";

import { useState } from "react";
import { BatchUploadForm } from "@/components/forms/BatchUploadForm";
import { BatchResultsTable } from "@/components/batch/BatchResultsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useBatchCreditScore,
  useSubmitCreditScore,
} from "@/lib/api/hooks/useCreditScore";
import {
  Download,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  RotateCw,
  Upload,
  Activity,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchCreditScoreResponse } from "@/types/credit";
import {
  exportToCSV,
  exportToExcel,
  generateBatchResultsPDF,
  exportToPDF,
} from "@/lib/utils/exportHelpers";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OriginalRequestData {
  customer_id: string;
  [key: string]: any;
}

export default function BatchProcessingPage() {
  const [results, setResults] = useState<BatchCreditScoreResponse | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [originalRequests, setOriginalRequests] = useState<
    Map<string, OriginalRequestData>
  >(new Map());
  const batchMutation = useBatchCreditScore();
  const { mutateAsync: submitSingleScore } = useSubmitCreditScore();

  // Parse CSV file to extract original request data
  const parseCSVFile = async (
    file: File
  ): Promise<Map<string, OriginalRequestData>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((line) => line.trim());
          if (lines.length === 0) {
            resolve(new Map());
            return;
          }

          // Parse header
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());
          const customerIdIndex = headers.findIndex(
            (h) => h === "customer_id" || h === "customer id"
          );

          if (customerIdIndex === -1) {
            resolve(new Map());
            return;
          }

          const requestsMap = new Map<string, OriginalRequestData>();

          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim());
            if (values.length <= customerIdIndex) continue;

            const customerId = values[customerIdIndex];
            if (!customerId) continue;

            // Build request data object from CSV row
            const requestData: OriginalRequestData = {
              customer_id: customerId,
            };
            headers.forEach((header, index) => {
              if (
                index < values.length &&
                header !== "customer_id" &&
                header !== "customer id"
              ) {
                const value = values[index];
                // Try to parse as number if possible
                const numValue = parseFloat(value);
                requestData[header] = isNaN(numValue) ? value : numValue;
              }
            });

            requestsMap.set(customerId, requestData);
          }

          resolve(requestsMap);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleUpload = async (file: File) => {
    try {
      // Parse CSV to extract original request data
      const requestsMap = await parseCSVFile(file);
      setOriginalRequests(requestsMap);

      const response = await batchMutation.mutateAsync(file);
      setResults(response);
    } catch (error) {
      // Error is handled by mutation
      throw error;
    }
  };

  const handleExportCSV = () => {
    if (!results) return;
    const exportData = results.results.map((r) => ({
      "Customer ID": r.customer_id,
      Status: r.success ? "Success" : "Failed",
      "Credit Score": r.credit_score?.toString() || "",
      "Risk Category": r.risk_category || "",
      Recommendation: r.approval_recommendation || "",
      Error: r.error || "",
    }));
    exportToCSV(exportData, "batch_results");
  };

  const handleExportExcel = () => {
    if (!results) return;
    const exportData = results.results.map((r) => ({
      "Customer ID": r.customer_id,
      Status: r.success ? "Success" : "Failed",
      "Credit Score": r.credit_score?.toString() || "",
      "Risk Category": r.risk_category || "",
      Recommendation: r.approval_recommendation || "",
      Error: r.error || "",
    }));
    exportToExcel(exportData, "batch_results");
  };

  const handleExportPDF = () => {
    if (!results) return;
    const htmlContent = generateBatchResultsPDF(results.results, {
      total: results.total,
      successful: results.successful,
      failed: results.failed,
    });
    exportToPDF(htmlContent, "batch_results");
  };

  // Calculate progress (simplified - in real implementation, this would come from API)
  const progress = batchMutation.isPending
    ? 50
    : batchMutation.isSuccess
      ? 100
      : 0;

  const handleRetryRow = async (customerId: string) => {
    if (!results) return;

    setRetryingIds((prev) => new Set(prev).add(customerId));

    try {
      // Get original request data from stored map
      const originalRequest = originalRequests.get(customerId);

      if (!originalRequest) {
        console.warn(
          `Original request data not found for customer: ${customerId}`
        );
        // If required fields are missing, show error instead of using fallback
        if (!customerId) {
          throw new Error("Customer ID is required");
        }
        const response = await submitSingleScore({
          customer_id: customerId,
        } as any);

        // Update results
        setResults((prev) => {
          if (!prev) return prev;
          const updatedResults = prev.results.map((r) =>
            r.customer_id === customerId
              ? {
                  ...r,
                  success: true,
                  credit_score: response.credit_score,
                  risk_category: response.risk_category,
                }
              : r
          );
          return {
            ...prev,
            results: updatedResults,
            successful: updatedResults.filter((r) => r.success).length,
            failed: updatedResults.filter((r) => !r.success).length,
          };
        });
        return;
      }

      // Retry with original request data
      const response = await submitSingleScore(originalRequest as any);

      // Update results
      setResults((prev) => {
        if (!prev) return prev;
        const updatedResults = prev.results.map((r) =>
          r.customer_id === customerId
            ? {
                ...r,
                success: true,
                credit_score: response.credit_score,
                risk_category: response.risk_category,
                error: undefined,
              }
            : r
        );
        return {
          ...prev,
          results: updatedResults,
          successful: updatedResults.filter((r) => r.success).length,
          failed: updatedResults.filter((r) => !r.success).length,
        };
      });
    } catch (error: any) {
      console.error("Retry failed:", error);
      // Update results to show retry error
      setResults((prev) => {
        if (!prev) return prev;
        const updatedResults = prev.results.map((r) =>
          r.customer_id === customerId
            ? { ...r, error: error.message || "Retry failed" }
            : r
        );
        return { ...prev, results: updatedResults };
      });
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  const handleRetryAllFailed = async () => {
    if (!results) return;

    const failedRows = results.results.filter((r) => !r.success);
    if (failedRows.length === 0) return;

    // Retry all failed rows sequentially
    for (const row of failedRows) {
      await handleRetryRow(row.customer_id);
      // Small delay between retries to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Batch Processing
          </h1>
          <p className="text-muted-foreground">
            Upload a CSV file to process multiple credit scores at once
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/health" label="Live" />
        </div>
      </div>

      <DashboardSection
        title="Batch Upload & Processing"
        description="Upload a CSV file to process multiple credit scores at once with progress tracking"
        icon={Upload}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <BatchUploadForm
            onUpload={handleUpload}
            isUploading={batchMutation.isPending}
            progress={progress}
          />

          {results && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Processing Summary</CardTitle>
                    <CardDescription>Batch processing results</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportCSV}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportExcel}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{results.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Successful
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {results.successful}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Failed
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {results.failed}
                    </p>
                  </div>
                </div>
                {results.failed > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryAllFailed}
                    disabled={retryingIds.size > 0}
                    className="mt-4 w-full"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Retry All Failed ({results.failed})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardSection>

      {batchMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {batchMutation.error?.message ||
              "An error occurred during batch processing"}
          </AlertDescription>
        </Alert>
      )}

      {results && (
        <DashboardSection
          title="Batch Processing Results"
          description="Detailed results for each customer in the batch with retry capabilities"
          icon={Activity}
        >
          <Card>
            <CardHeader>
              <CardTitle>Results Table</CardTitle>
              <CardDescription>
                Detailed results for each customer in the batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchResultsTable
                results={results.results}
                onRetry={handleRetryRow}
                retryingIds={retryingIds}
              />
            </CardContent>
          </Card>
        </DashboardSection>
      )}
    </div>
  );
}
