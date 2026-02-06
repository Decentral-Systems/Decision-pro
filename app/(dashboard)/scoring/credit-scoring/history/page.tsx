"use client";

import { useState, useMemo, Suspense } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Filter, BarChart3, List, History } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ExportService } from "@/lib/utils/export-service";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { useCreditScoringHistory } from "@/lib/api/hooks/useCreditScoringHistory";
import { ScoreComparison } from "@/components/credit/ScoreComparison";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Pagination } from "@/components/common/Pagination";
import { CacheMetadata } from "@/components/common/CacheMetadata";
import { useAuth } from "@/lib/auth/auth-context";

// Wrap main component content for Suspense
function CreditScoringHistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Initialize state from URL params
  const [customerId, setCustomerId] = useState<string>(searchParams.get("customer_id") || "");
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState<string>(searchParams.get("date_to") || "");
  const [scoreRange, setScoreRange] = useState<string>(searchParams.get("score_range") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "list");
  const [channel, setChannel] = useState<string>(searchParams.get("channel") || "all");
  const [product, setProduct] = useState<string>(searchParams.get("product") || "all");
  const [decision, setDecision] = useState<string>(searchParams.get("decision") || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort_by") || "date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sort_order") as "asc" | "desc") || "desc");
  const pageSize = 50;
  
  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (customerId) params.set("customer_id", customerId);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (scoreRange !== "all") params.set("score_range", scoreRange);
    if (channel !== "all") params.set("channel", channel);
    if (product !== "all") params.set("product", product);
    if (decision !== "all") params.set("decision", decision);
    if (sortBy !== "date") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);
    if (page > 1) params.set("page", page.toString());
    if (activeTab !== "list") params.set("tab", activeTab);
    router.replace(`/credit-scoring/history?${params.toString()}`, { scroll: false });
  }, [customerId, dateFrom, dateTo, scoreRange, channel, product, decision, sortBy, sortOrder, page, activeTab, router]);

  // Calculate score range filters
  const scoreFilters = useMemo(() => {
    const filters: { min_score?: number; max_score?: number } = {};
    switch (scoreRange) {
      case "excellent":
        filters.min_score = 750;
        break;
      case "good":
        filters.min_score = 700;
        filters.max_score = 749;
        break;
      case "fair":
        filters.min_score = 650;
        filters.max_score = 699;
        break;
      case "poor":
        filters.max_score = 649;
        break;
    }
    return filters;
  }, [scoreRange]);

  // Fetch credit scoring history
  const { data: historyResponse, isLoading, error } = useCreditScoringHistory({
    customer_id: customerId || undefined,
    start_date: dateFrom || undefined,
    end_date: dateTo || undefined,
    ...scoreFilters,
    channel: channel !== "all" ? channel : undefined,
    product: product !== "all" ? product : undefined,
    decision: decision !== "all" ? decision : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    page,
    page_size: pageSize,
  });

  const historyData = historyResponse?.items || [];

  const handleExport = (format: "pdf" | "excel") => {
    if (historyData.length === 0) {
      alert("No data to export");
      return;
    }

    if (format === "pdf") {
      ExportService.exportCreditScoreToPDF(
        { items: historyData },
        { filename: `credit_score_history_${new Date().toISOString().split("T")[0]}.pdf` }
      );
    } else {
      ExportService.exportToExcel(historyData, {
        filename: `credit_score_history_${new Date().toISOString().split("T")[0]}.xlsx`,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Credit Scoring History</h1>
            <CacheMetadata cacheKey="credit-scoring-history" variant="compact" />
          </div>
          <p className="text-muted-foreground">
            View and analyze past credit score calculations
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        description="Filter credit score history by customer, date range, score range, channel, product, and decision"
        icon={Filter}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label>Score Range</Label>
              <Select value={scoreRange} onValueChange={setScoreRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="excellent">Excellent (750+)</SelectItem>
                  <SelectItem value="good">Good (700-749)</SelectItem>
                  <SelectItem value="fair">Fair (650-699)</SelectItem>
                  <SelectItem value="poor">Poor (&lt;650)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="branch">Branch</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="api">API</SelectItem>
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
              <Label>Decision</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        </Card>
      </DashboardSection>

      {/* History with Tabs */}
      <DashboardSection
        title="Credit Scoring History"
        description="View and analyze past credit score calculations with comparison capabilities"
        icon={History}
        actions={
          <>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Compare
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {selectedIds.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              Clear Selection
            </Button>
          )}
        </div>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>
                {historyData.length > 0
                  ? `${historyData.length} credit score calculations found. Select items to compare.`
                  : "No credit score history found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading credit score history...
                </div>
              ) : error ? (
                <ErrorDisplay 
                  error={error} 
                  variant="inline"
                  onRetry={() => window.location.reload()}
                />
              ) : historyData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No credit score history available. Start calculating credit scores to see history here.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium w-12">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedIds.length === historyData.length && historyData.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(historyData.map((item: any) => item.id || item.prediction_id));
                                } else {
                                  setSelectedIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="p-3 text-left text-sm font-medium">Customer ID</th>
                          <th className="p-3 text-left text-sm font-medium">Score</th>
                          <th className="p-3 text-left text-sm font-medium">Risk Category</th>
                          <th className="p-3 text-left text-sm font-medium">Recommendation</th>
                          <th className="p-3 text-left text-sm font-medium">Model Version</th>
                          <th className="p-3 text-left text-sm font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map((item: any) => {
                          const itemId = item.id || item.prediction_id;
                          const isSelected = selectedIds.includes(itemId);
                          return (
                            <tr 
                              key={itemId} 
                              className={`border-b cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedIds(selectedIds.filter(id => id !== itemId));
                                } else if (selectedIds.length < 4) {
                                  setSelectedIds([...selectedIds, itemId]);
                                }
                              }}
                            >
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300"
                                  checked={isSelected}
                                  disabled={!isSelected && selectedIds.length >= 4}
                                  onChange={(e) => {
                                    if (e.target.checked && selectedIds.length < 4) {
                                      setSelectedIds([...selectedIds, itemId]);
                                    } else {
                                      setSelectedIds(selectedIds.filter(id => id !== itemId));
                                    }
                                  }}
                                />
                              </td>
                              <td className="p-3 text-sm">
                                <Link
                                  href={`/customers/${encodeURIComponent(item.customer_id)}`}
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.customer_id}
                                </Link>
                              </td>
                              <td className="p-3 text-sm font-medium">{item.credit_score}</td>
                              <td className="p-3 text-sm">
                                {item.correlation_id && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.correlation_id.substring(0, 8)}...
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <Badge variant={
                                  item.risk_category === "low" ? "default" :
                                  item.risk_category === "medium" ? "secondary" :
                                  item.risk_category === "high" ? "destructive" : "outline"
                                }>
                                  {item.risk_category}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">{item.approval_recommendation}</td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {item.model_version || item.version || "N/A"}
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
        </TabsContent>

        <TabsContent value="compare">
          {historyData.length > 0 ? (
            <ScoreComparison
              items={historyData}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              maxSelections={4}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No credit score history available for comparison.
              </CardContent>
            </Card>
          )}
          </TabsContent>
        </Tabs>
      </DashboardSection>
    </div>
  );
}

// Main export with Suspense boundary
export default function CreditScoringHistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Skeleton className="h-full w-full" /></div>}>
      <CreditScoringHistoryPageContent />
    </Suspense>
  );
}