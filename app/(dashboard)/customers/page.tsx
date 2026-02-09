"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import {
  useCustomersList,
  useExportCustomers,
} from "@/lib/api/hooks/useCustomers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Download,
  Filter,
  X,
  Users,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Shield,
  DollarSign,
  AlertCircle,
  Activity,
  List,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  generateCustomersPDF,
} from "@/lib/utils/exportHelpers";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { useAnalyticsData } from "@/lib/api/hooks/useAnalytics";
import { PaginationControls } from "@/components/common/PaginationControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomerSearchAutocomplete } from "@/lib/api/hooks/useCustomers";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { CacheMetadata } from "@/components/common/CacheMetadata";

// Lazy load heavy components
const CustomersTable = dynamic(
  () =>
    import("@/components/data-table/CustomersTable").then((mod) => ({
      default: mod.CustomersTable,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

const CustomerCreationDialog = dynamic(
  () =>
    import("@/components/customer/CustomerCreationDialog").then((mod) => ({
      default: mod.CustomerCreationDialog,
    })),
  {
    ssr: false,
  }
);

const CustomerLifetimeValue = dynamic(
  () =>
    import("@/components/analytics/CustomerLifetimeValue").then((mod) => ({
      default: mod.CustomerLifetimeValue,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const RiskDistribution = dynamic(
  () =>
    import("@/components/analytics/RiskDistribution").then((mod) => ({
      default: mod.RiskDistribution,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

const BulkActionsToolbar = dynamic(
  () =>
    import("@/components/customers/BulkActionsToolbar").then((mod) => ({
      default: mod.BulkActionsToolbar,
    })),
  {
    ssr: false,
  }
);

const FilterChips = dynamic(
  () =>
    import("@/components/customers/FilterChips").then((mod) => ({
      default: mod.FilterChips,
    })),
  {
    ssr: false,
  }
);

const SearchHistory = dynamic(
  () =>
    import("@/components/customers/SearchHistory").then((mod) => ({
      default: mod.SearchHistory,
    })),
  {
    ssr: false,
  }
);

const AdvancedSearchBuilder = dynamic(
  () =>
    import("@/components/customers/AdvancedSearchBuilder").then((mod) => ({
      default: mod.AdvancedSearchBuilder,
    })),
  {
    ssr: false,
  }
);

const SavedViews = dynamic(
  () =>
    import("@/components/customers/SavedViews").then((mod) => ({
      default: mod.SavedViews,
    })),
  {
    ssr: false,
  }
);

const ColumnChooser = dynamic(
  () =>
    import("@/components/customers/ColumnChooser").then((mod) => ({
      default: mod.ColumnChooser,
    })),
  {
    ssr: false,
  }
);

// Import hooks that are used (must be imported directly, not lazy loaded)
import type { SearchCondition } from "@/components/customers/AdvancedSearchBuilder";

function CustomersPageContentInternal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state - use lazy initialization to only read searchParams once
  const [page, setPage] = useState(() =>
    parseInt(searchParams.get("page") || "1")
  );
  const [pageSize, setPageSize] = useState(() =>
    parseInt(searchParams.get("pageSize") || "50")
  );
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState<string>(
    () => searchParams.get("sortBy") || ""
  );
  const [order, setOrder] = useState<"asc" | "desc">(
    () => (searchParams.get("order") as "asc" | "desc") || "desc"
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Advanced filters - use lazy initialization
  const [region, setRegion] = useState<string>(
    () => searchParams.get("region") || "all"
  );
  const [riskLevel, setRiskLevel] = useState<string>(
    () => searchParams.get("riskLevel") || "all"
  );
  const [status, setStatus] = useState<string>(
    () => searchParams.get("status") || "all"
  );
  const [employmentStatus, setEmploymentStatus] = useState<string>(
    () => searchParams.get("employmentStatus") || "all"
  );
  const [minScore, setMinScore] = useState<string>(
    () => searchParams.get("minScore") || ""
  );
  const [maxScore, setMaxScore] = useState<string>(
    () => searchParams.get("maxScore") || ""
  );
  const [dateFrom, setDateFrom] = useState<string>(
    () => searchParams.get("dateFrom") || ""
  );
  const [dateTo, setDateTo] = useState<string>(
    () => searchParams.get("dateTo") || ""
  );
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Debounce search input to avoid too many API calls
  const debouncedSearch = useDebounce(search, 300);

  // Debounce filter inputs to reduce API calls
  const debouncedRegion = useDebounce(region, 300);
  const debouncedRiskLevel = useDebounce(riskLevel, 300);
  const debouncedStatus = useDebounce(status, 300);
  const debouncedEmploymentStatus = useDebounce(employmentStatus, 300);
  const debouncedMinScore = useDebounce(minScore, 300);
  const debouncedMaxScore = useDebounce(maxScore, 300);
  const debouncedDateFrom = useDebounce(dateFrom, 300);
  const debouncedDateTo = useDebounce(dateTo, 300);

  // Debounced URL synchronization - syncs all filter states to URL
  // Uses debounce to prevent too many router.replace calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      // Only add non-default values to URL
      if (page > 1) params.set("page", page.toString());
      if (pageSize !== 50) params.set("pageSize", pageSize.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (order !== "desc") params.set("order", order);
      if (region !== "all") params.set("region", region);
      if (status !== "all") params.set("status", status);
      if (riskLevel !== "all") params.set("riskLevel", riskLevel);
      if (employmentStatus !== "all")
        params.set("employmentStatus", employmentStatus);
      if (minScore) params.set("minScore", minScore);
      if (maxScore) params.set("maxScore", maxScore);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      // Use replace to avoid history pollution
      router.replace(`/customers?${params.toString()}`, { scroll: false });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    page,
    pageSize,
    debouncedSearch,
    sortBy,
    order,
    debouncedRegion,
    debouncedStatus,
    debouncedRiskLevel,
    debouncedEmploymentStatus,
    debouncedMinScore,
    debouncedMaxScore,
    debouncedDateFrom,
    debouncedDateTo,
    router,
  ]);

  // Memoize search autocomplete options
  const searchAutocompleteOptions = useMemo(
    () => ({
      limit: 5,
      enabled: search.length >= 2 && search !== debouncedSearch,
    }),
    [search, debouncedSearch]
  );

  // Get search suggestions for autocomplete
  const { data: searchSuggestions = [] } = useCustomerSearchAutocomplete(
    search,
    searchAutocompleteOptions
  );

  // Build filter params for server-side filtering - use debounced values to reduce API calls
  const filterParams = useMemo(() => {
    const params: any = {};
    if (debouncedRegion !== "all") params.region = debouncedRegion;
    if (debouncedStatus !== "all") params.status = debouncedStatus;
    if (debouncedRiskLevel !== "all") params.riskLevel = debouncedRiskLevel;
    if (debouncedEmploymentStatus !== "all")
      params.employment_status = debouncedEmploymentStatus;
    if (debouncedMinScore) params.minScore = parseFloat(debouncedMinScore);
    if (debouncedMaxScore) params.maxScore = parseFloat(debouncedMaxScore);
    if (debouncedDateFrom) params.dateFrom = debouncedDateFrom;
    if (debouncedDateTo) params.dateTo = debouncedDateTo;
    return params;
  }, [
    debouncedRegion,
    debouncedStatus,
    debouncedRiskLevel,
    debouncedEmploymentStatus,
    debouncedMinScore,
    debouncedMaxScore,
    debouncedDateFrom,
    debouncedDateTo,
  ]);

  // Memoize the complete query params object to prevent infinite re-renders
  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy || undefined,
      order: order || undefined,
      ...filterParams,
    }),
    [page, pageSize, debouncedSearch, sortBy, order, filterParams]
  );

  // Use debounced search for API call
  const { data, isLoading, error, refetch, isError } =
    useCustomersList(queryParams);

  // No fallback data - show error if API fails
  const displayData: any = data || {
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    has_more: false,
  };

  // Debug logging for troubleshooting
  if (typeof window !== "undefined") {
    console.log("[CustomersPage] Data state:", {
      isLoading,
      isError,
      hasData: !!data,
      dataItemsCount: data?.items?.length || 0,
      dataTotal: data?.total,
      error: error?.message,
      errorDetails: error,
      queryParams,
      dataStructure: data
        ? {
            hasItems: "items" in data,
            itemsIsArray: Array.isArray(data.items),
            itemsLength: data.items?.length || 0,
            hasTotal: "total" in data,
            totalValue: data.total,
            keys: Object.keys(data),
          }
        : null,
    });
  }

  const exportCustomers = useExportCustomers();

  // URL syncing removed to prevent infinite loops
  // URL will be managed by Next.js router based on searchParams

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedCustomerIds(ids);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCustomerIds([]);
  }, []);

  const handleActionComplete = useCallback(() => {
    setSelectedCustomerIds([]);
    refetch();
  }, [refetch]);

  const handleBulkAction = useCallback(
    async (action: string, customerIds: string[]) => {
      try {
        const correlationId = getOrCreateCorrelationId();
        // Log bulk action with correlation ID for audit trail
        console.log(
          `Bulk action: ${action} on ${customerIds.length} customers`,
          { correlationId }
        );

        // In real implementation, call API with correlation ID
        toast({
          title: "Bulk Action Initiated",
          description: `${action} on ${customerIds.length} customers (ID: ${correlationId.substring(0, 8)}...)`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to perform bulk action",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleExportCSV = useCallback(() => handleExport("csv"), []);
  const handleExportExcel = useCallback(() => handleExport("excel"), []);
  const handleExportPDF = useCallback(() => handleExport("pdf"), []);
  const handleClearSearch = useCallback(() => handleSearch(""), [handleSearch]);
  const handleToggleFilters = useCallback(
    () => setShowFilters((prev) => !prev),
    []
  );
  const handleRefetch = useCallback(() => refetch(), [refetch]);

  // Calculate total pages
  const totalPages = displayData.total
    ? Math.ceil(displayData.total / pageSize)
    : 1;

  const handleExport = useCallback(
    async (format: "csv" | "excel" | "pdf" = "csv") => {
      try {
        // Apply current filters to export
        const exportParams = {
          format,
          limit: displayData.total || 10000, // Export all customers (up to reasonable limit)
          ...filterParams,
          search: debouncedSearch || undefined,
        };

        const result = await exportCustomers.mutateAsync(exportParams);
        if (result?.data && Array.isArray(result.data)) {
          if (format === "excel") {
            exportToExcel(result.data, "customers_export");
          } else if (format === "pdf") {
            // For PDF, we'll generate HTML and use print
            const htmlContent = generateCustomersPDF(result.data, filterParams);
            exportToPDF(htmlContent, "customers_export");
          } else {
            exportToCSV(result.data, "customers_export");
          }
          toast({
            title: "Success",
            description: `Exported ${result.data.length} customers to ${format.toUpperCase()}`,
          });
        } else {
          toast({
            title: "Error",
            description: "No data to export",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to export customers",
          variant: "destructive",
        });
      }
    },
    [displayData.total, filterParams, debouncedSearch, exportCustomers, toast]
  );

  const handleAddCustomer = () => {
    setCreateDialogOpen(true);
  };

  const handleCustomerCreated = () => {
    refetch(); // Refresh customer list after creation
  };

  // Use server-side filtered data directly - API handles filtering via filterParams
  // Only apply minimal client-side filtering for edge cases or unsupported fields
  let filteredItems = displayData.items || [];

  // Note: Most filtering is done server-side via filterParams
  // Client-side filtering below is only for fields not supported by the API
  // or for additional validation

  const activeFilterCount = [
    region !== "all",
    riskLevel !== "all",
    status !== "all",
    employmentStatus !== "all",
    minScore,
    maxScore,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  // Filter change handlers - only update state, URL will be synced via useEffect
  const handleRegionChange = useCallback((value: string) => {
    setRegion(value);
    setPage(1);
  }, []);

  const handleRiskLevelChange = useCallback((value: string) => {
    setRiskLevel(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleEmploymentStatusChange = useCallback((value: string) => {
    setEmploymentStatus(value);
    setPage(1);
  }, []);

  const handleMinScoreChange = useCallback((value: string) => {
    setMinScore(value);
    setPage(1);
  }, []);

  const handleMaxScoreChange = useCallback((value: string) => {
    setMaxScore(value);
    setPage(1);
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setPage(1);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setPage(1);
  }, []);

  const handleRemoveFilter = useCallback((filterKey: string) => {
    switch (filterKey) {
      case "region":
        setRegion("all");
        break;
      case "status":
        setStatus("all");
        break;
      case "riskLevel":
        setRiskLevel("all");
        break;
      case "employmentStatus":
        setEmploymentStatus("all");
        break;
      case "minScore":
        setMinScore("");
        break;
      case "maxScore":
        setMaxScore("");
        break;
      case "dateFrom":
        setDateFrom("");
        break;
      case "dateTo":
        setDateTo("");
        break;
    }
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setRegion("all");
    setRiskLevel("all");
    setStatus("all");
    setEmploymentStatus("all");
    setMinScore("");
    setMaxScore("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  // REMOVED automatic URL syncing to prevent infinite loops
  // URL will be updated only on explicit user actions (page navigation, search, etc.)

  // Analytics time range selector
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<string>("all");

  // Memoize analytics params to prevent infinite re-renders
  const analyticsParams = useMemo(
    () => ({
      type: "portfolio,risk,scoring",
      time_range: analyticsTimeRange,
    }),
    [analyticsTimeRange]
  );

  // Fetch real analytics data with refetch capability
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
    isRefetching: isRefetchingAnalytics,
  } = useAnalyticsData(analyticsParams);

  // Transform API data for components - no fallback to customer list data
  // Show proper empty states when analytics API is unavailable
  const clvData = useMemo(() => {
    try {
      // Check if we have analytics data (even if portfolio is empty, we should still have the structure)
      if (
        analyticsData?.analytics?.portfolio !== undefined &&
        !analyticsError
      ) {
        // Use real analytics data if available
        const portfolio = analyticsData.analytics.portfolio;

        // Validate and extract data safely
        const customers = Array.isArray(portfolio?.customers)
          ? portfolio.customers
          : [];
        const trends = Array.isArray(portfolio?.trends) ? portfolio.trends : [];

        return {
          customers,
          trends,
        };
      }
    } catch (error) {
      // Log error only in development
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        console.error("[Analytics] CLV Data Transformation Error:", error);
      }
    }

    // Return empty structure - no fallback to customer list to avoid misleading analytics
    return { customers: [], trends: [] };
  }, [analyticsData, analyticsError]);

  const riskData = useMemo(() => {
    try {
      // Check if we have analytics data (even if risk is empty, we should still have the structure)
      if (analyticsData?.analytics?.risk !== undefined && !analyticsError) {
        const risk = analyticsData.analytics.risk;

        // Validate and extract data safely
        const categories = Array.isArray(risk?.categories)
          ? risk.categories
          : [];
        const trends = Array.isArray(risk?.trends) ? risk.trends : [];
        const scoreDistribution = Array.isArray(risk?.scoreDistribution)
          ? risk.scoreDistribution
          : [];
        const regionalData = Array.isArray(risk?.regionalData)
          ? risk.regionalData
          : [];

        return {
          categories,
          trends,
          scoreDistribution,
          regionalData,
        };
      }
    } catch (error) {
      // Log error only in development
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        console.error("[Analytics] Risk Data Transformation Error:", error);
      }
    }

    // Return empty structure - no fallback to customer list to avoid misleading analytics
    return {
      categories: [],
      trends: [],
      scoreDistribution: [],
      regionalData: [],
    };
  }, [analyticsData, analyticsError]);

  const { customers: clvCustomers, trends: clvTrends } = clvData;
  const {
    categories: riskCategories,
    trends: riskTrends,
    scoreDistribution,
    regionalData,
  } = riskData;

  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Customers Page Error</CardTitle>
              </div>
              <CardDescription>
                An error occurred while loading the customers page. Please try
                refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
              <CacheMetadata cacheKey="customers" variant="compact" />
            </div>
            <p className="text-muted-foreground">
              {displayData.total !== undefined && displayData.total > 0
                ? `Total: ${displayData.total} customer(s) - Manage and view all customers`
                : "Manage and view all customers"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ApiStatusIndicator endpoint="/api/v1/customers" label="Live" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exportCustomers.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={handleAddCustomer}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {isError && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load customers from API.
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

        {!isLoading &&
          !isError &&
          data &&
          (!data.items ||
            !Array.isArray(data.items) ||
            data.items.length === 0) &&
          displayData.total === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No customers found. The API returned an empty result.
              </AlertDescription>
            </Alert>
          )}

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <Users className="h-4 w-4" />
              Customer List
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Search Bar with Autocomplete */}
            <DashboardSection
              title="Search & Filters"
              description="Search customers and apply advanced filters to find specific customer records"
              icon={Filter}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Search customers by name, phone, email, ID, or customer ID..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pr-10"
                      />
                      {search && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => handleSearch("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <SearchHistory
                      onSelectQuery={(query) => handleSearch(query)}
                      currentQuery={search}
                    />
                    <AdvancedSearchBuilder
                      onSearch={(
                        conditions: SearchCondition[],
                        logic: "AND" | "OR"
                      ) => {
                        // Convert advanced search conditions to simple search string
                        // For now, combine conditions with the logic operator
                        const searchString = conditions
                          .map((c) => `${c.field}:${c.value}`)
                          .join(logic === "AND" ? " AND " : " OR ");
                        handleSearch(searchString);
                      }}
                      onClear={() => handleSearch("")}
                    />
                  </div>
                  <div className="relative">
                    {/* Autocomplete suggestions */}
                    {search.length >= 2 &&
                      searchSuggestions.length > 0 &&
                      search !== debouncedSearch && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                          {searchSuggestions.map((customer: any) => (
                            <div
                              key={customer.customer_id || customer.id}
                              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                const searchValue =
                                  customer.customer_id ||
                                  customer.id ||
                                  customer.full_name ||
                                  "";
                                handleSearch(searchValue);
                              }}
                            >
                              <div className="font-medium">
                                {customer.full_name || customer.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {customer.customer_id || customer.id} •{" "}
                                {customer.phone_number || customer.phone}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </DashboardSection>

            {/* Advanced Filters */}
            <DashboardSection
              title="Advanced Filters"
              description="Filter customers by region, risk level, status, employment, credit score range, and date range"
              icon={Filter}
              badge={
                activeFilterCount > 0
                  ? {
                      label: `${activeFilterCount} Active`,
                      variant: "secondary",
                    }
                  : undefined
              }
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Filter Options</CardTitle>
                      <CardDescription>
                        Apply multiple filters to narrow down customer search
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <SavedViews
                        currentFilters={filterParams}
                        currentSort={{ sortBy, sortOrder: order }}
                        onLoadView={(view) => {
                          // Apply saved view filters
                          if (view.filters.region)
                            setRegion(view.filters.region);
                          if (view.filters.status)
                            setStatus(view.filters.status);
                          if (view.filters.riskLevel)
                            setRiskLevel(view.filters.riskLevel);
                          if (view.sortBy) setSortBy(view.sortBy);
                          if (view.sortOrder) setOrder(view.sortOrder);
                        }}
                      />
                      <ColumnChooser
                        columns={[
                          {
                            id: "customer_id",
                            label: "Customer ID",
                            visible: true,
                            order: 0,
                          },
                          {
                            id: "name",
                            label: "Name",
                            visible: true,
                            order: 1,
                            isPII: true,
                          },
                          {
                            id: "phone",
                            label: "Phone",
                            visible: true,
                            order: 2,
                            isPII: true,
                          },
                          {
                            id: "email",
                            label: "Email",
                            visible: true,
                            order: 3,
                            isPII: true,
                          },
                          {
                            id: "credit_score",
                            label: "Credit Score",
                            visible: true,
                            order: 4,
                          },
                          {
                            id: "risk_level",
                            label: "Risk Level",
                            visible: true,
                            order: 5,
                          },
                        ]}
                        onUpdate={(cols) => {
                          // Save column visibility
                          localStorage.setItem(
                            "customers_table_columns",
                            JSON.stringify(cols)
                          );
                        }}
                        userRole={user?.roles?.[0]}
                      />
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        {showFilters ? "Hide" : "Show"} Filters
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {activeFilterCount > 0 && (
                  <div className="mt-4">
                    <FilterChips
                      filters={{
                        region: region !== "all" ? region : undefined,
                        status: status !== "all" ? status : undefined,
                        riskLevel: riskLevel !== "all" ? riskLevel : undefined,
                        employmentStatus:
                          employmentStatus !== "all"
                            ? employmentStatus
                            : undefined,
                        minScore: minScore || undefined,
                        maxScore: maxScore || undefined,
                        dateFrom: dateFrom || undefined,
                        dateTo: dateTo || undefined,
                      }}
                      onRemoveFilter={handleRemoveFilter}
                      onClearAll={clearFilters}
                    />
                  </div>
                )}
                {showFilters && (
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Region</Label>
                        <Select
                          value={region}
                          onValueChange={handleRegionChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            <SelectItem value="Addis Ababa">
                              Addis Ababa
                            </SelectItem>
                            <SelectItem value="Oromia">Oromia</SelectItem>
                            <SelectItem value="Amhara">Amhara</SelectItem>
                            <SelectItem value="Tigray">Tigray</SelectItem>
                            <SelectItem value="SNNP">SNNP</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Risk Level</Label>
                        <Select
                          value={riskLevel}
                          onValueChange={handleRiskLevelChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Risk Levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Risk Levels</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="very_high">Very High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={status}
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Employment Status</Label>
                        <Select
                          value={employmentStatus}
                          onValueChange={handleEmploymentStatusChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Employment Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              All Employment Statuses
                            </SelectItem>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self_employed">
                              Self Employed
                            </SelectItem>
                            <SelectItem value="unemployed">
                              Unemployed
                            </SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Min Credit Score</Label>
                        <Input
                          type="number"
                          placeholder="300"
                          value={minScore}
                          onChange={(e) => setMinScore(e.target.value)}
                          onBlur={(e) => handleMinScoreChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleMinScoreChange(e.currentTarget.value);
                            }
                          }}
                          min={300}
                          max={850}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Credit Score</Label>
                        <Input
                          type="number"
                          placeholder="850"
                          value={maxScore}
                          onChange={(e) => setMaxScore(e.target.value)}
                          onBlur={(e) => handleMaxScoreChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleMaxScoreChange(e.currentTarget.value);
                            }
                          }}
                          min={300}
                          max={850}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date From</Label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          onBlur={(e) => handleDateFromChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleDateFromChange(e.currentTarget.value);
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date To</Label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          onBlur={(e) => handleDateToChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleDateToChange(e.currentTarget.value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </DashboardSection>

            <DashboardSection
              title="Customer List"
              description={`${filteredItems.length > 0 ? `Showing ${filteredItems.length} of ${displayData.total || 0} customer(s)` : "Search and filter customers"}. Manage customer records with bulk actions.`}
              icon={List}
              badge={
                selectedCustomerIds.length > 0
                  ? {
                      label: `${selectedCustomerIds.length} Selected`,
                      variant: "secondary",
                    }
                  : undefined
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>Customers Table</CardTitle>
                  <CardDescription>
                    {filteredItems.length > 0
                      ? `Showing ${filteredItems.length} of ${displayData.total || 0} customer(s)`
                      : "Search and filter customers"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCustomerIds.length > 0 && (
                    <div className="mb-4">
                      <BulkActionsToolbar
                        selectedCustomerIds={selectedCustomerIds}
                        onClearSelection={handleClearSelection}
                        onActionComplete={handleActionComplete}
                      />
                    </div>
                  )}
                  <CustomersTable
                    data={filteredItems || []}
                    isLoading={isLoading}
                    onSelectionChange={handleSelectionChange}
                    onBulkAction={handleBulkAction}
                  />
                  {!isLoading && displayData.total > 0 && (
                    <PaginationControls
                      currentPage={page}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={displayData.total}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      pageSizeOptions={[25, 50, 100, 250, 500]}
                    />
                  )}
                </CardContent>
              </Card>
            </DashboardSection>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Header with Controls */}
            <DashboardSection
              title="Customer Analytics"
              description="Comprehensive analytics and insights for your customer portfolio including lifetime value and risk distribution"
              icon={BarChart3}
              actions={
                <Select
                  value={analyticsTimeRange}
                  onValueChange={setAnalyticsTimeRange}
                >
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                  <CardDescription>
                    Comprehensive analytics and insights for your customer
                    portfolio
                  </CardDescription>
                </CardHeader>
              </Card>
            </DashboardSection>

            {/* Analytics Summary Cards */}
            {!analyticsLoading && !analyticsError && analyticsData && (
              <DashboardSection
                title="Analytics Summary"
                description="Key customer analytics metrics including total customers, risk distribution, and customer lifetime value"
                icon={Activity}
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Customers
                          </p>
                          <p className="text-2xl font-bold">
                            {(clvCustomers.length || 0).toLocaleString()}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Risk Categories
                          </p>
                          <p className="text-2xl font-bold">
                            {riskCategories.length}
                          </p>
                        </div>
                        <Shield className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            High Risk %
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {riskCategories.length > 0
                              ? `${(
                                  (riskCategories
                                    .filter(
                                      (c) =>
                                        c.level === "high" ||
                                        c.level === "very_high"
                                    )
                                    .reduce((sum, c) => sum + c.count, 0) /
                                    riskCategories.reduce(
                                      (sum, c) => sum + c.count,
                                      0
                                    )) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Avg CLV
                          </p>
                          <p className="text-2xl font-bold">
                            {clvCustomers.length > 0
                              ? `${(clvCustomers.reduce((sum, c) => sum + c.clv, 0) / clvCustomers.length / 1000).toFixed(0)}k ETB`
                              : "0 ETB"}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DashboardSection>
            )}

            {/* Customer Analytics Dashboard */}
            <DashboardSection
              title="Customer Analytics Dashboard"
              description="Detailed customer analytics including lifetime value trends and risk distribution analysis"
              icon={BarChart3}
            >
              {analyticsLoading ? (
                <div className="grid gap-6">
                  <Card>
                    <CardContent className="py-12">
                      <Skeleton className="h-64 w-full" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-12">
                      <Skeleton className="h-64 w-full" />
                    </CardContent>
                  </Card>
                </div>
              ) : analyticsError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Failed to Load Analytics</AlertTitle>
                  <AlertDescription>
                    {analyticsError?.message ||
                      "Unknown error occurred while loading analytics data."}
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchAnalytics()}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-6">
                  {/* Always show Risk Distribution component - it handles empty states internally */}
                  <RiskDistribution
                    categories={riskCategories}
                    trends={riskTrends}
                    scoreDistribution={scoreDistribution}
                    regionalData={regionalData}
                    title="Portfolio Risk Distribution"
                    description="Risk analysis across your customer portfolio"
                  />

                  {/* Always show Customer Lifetime Value component - it handles empty states internally */}
                  <CustomerLifetimeValue
                    customers={clvCustomers}
                    trends={clvTrends}
                    title="Customer Lifetime Value"
                    description="CLV analysis and customer segmentation"
                  />
                </div>
              )}
            </DashboardSection>
          </TabsContent>
        </Tabs>

        <CustomerCreationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCustomerCreated}
        />
      </div>
    </ErrorBoundary>
  );
}

// Main export with Suspense boundary
export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      }
    >
      <CustomersPageContentInternal />
    </Suspense>
  );
}
