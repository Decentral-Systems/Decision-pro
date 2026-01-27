"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  ToggleLeft, 
  ToggleRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  ChevronRight,
  ChevronDown,
  Shield,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { RiskAppetiteConfig } from "@/types/rules";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface RiskAppetiteTableProps {
  configs: RiskAppetiteConfig[];
  isLoading?: boolean;
  onEdit?: (config: RiskAppetiteConfig) => void;
  onDelete?: (configId: number) => void;
  onDuplicate?: (config: RiskAppetiteConfig) => void;
  onToggleActive?: (configId: number, isActive: boolean) => void;
  onBulkDelete?: (configIds: number[]) => void;
  onBulkToggleActive?: (configIds: number[], isActive: boolean) => void;
  compact?: boolean;
}

type SortField = "config_name" | "config_type" | "priority" | "is_active" | "risk_tolerance";
type SortDirection = "asc" | "desc";

export function RiskAppetiteTable({
  configs,
  isLoading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  onBulkDelete,
  onBulkToggleActive,
  compact = false,
}: RiskAppetiteTableProps) {
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedConfigs, setSelectedConfigs] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    config_name: true,
    config_type: true,
    product_segment: true,
    risk_tolerance: true,
    base_rate: true,
    limit_range: true,
    priority: true,
    status: true,
    actions_menu: true,
  });

  // Sort configs
  const sortedConfigs = useMemo(() => {
    const sorted = [...configs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "config_name":
          aValue = a.config_name.toLowerCase();
          bValue = b.config_name.toLowerCase();
          break;
        case "config_type":
          aValue = a.config_type.toLowerCase();
          bValue = b.config_type.toLowerCase();
          break;
        case "priority":
          aValue = a.priority;
          bValue = b.priority;
          break;
        case "risk_tolerance":
          aValue = a.risk_parameters?.risk_tolerance_level || "";
          bValue = b.risk_parameters?.risk_tolerance_level || "";
          break;
        case "is_active":
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [configs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConfigs(new Set(sortedConfigs.map(c => c.id)));
    } else {
      setSelectedConfigs(new Set());
    }
  };

  const handleSelectConfig = (configId: number, checked: boolean) => {
    const newSelected = new Set(selectedConfigs);
    if (checked) {
      newSelected.add(configId);
    } else {
      newSelected.delete(configId);
    }
    setSelectedConfigs(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedConfigs.size > 0) {
      onBulkDelete(Array.from(selectedConfigs));
      setSelectedConfigs(new Set());
    }
  };

  const handleBulkToggleActive = (isActive: boolean) => {
    if (onBulkToggleActive && selectedConfigs.size > 0) {
      onBulkToggleActive(Array.from(selectedConfigs), isActive);
      setSelectedConfigs(new Set());
    }
  };

  const handleExport = () => {
    const csv = [
      ["Config Name", "Type", "Product/Segment", "Risk Tolerance", "Base Rate", "Min Limit", "Max Limit", "Priority", "Status"],
      ...sortedConfigs.map((config) => [
        config.config_name,
        config.config_type,
        config.product_type || config.customer_segment || "Global",
        config.risk_parameters?.risk_tolerance_level || "—",
        config.interest_rate_adjustments?.base_rate ? `${(config.interest_rate_adjustments.base_rate * 100).toFixed(1)}%` : "—",
        config.limit_adjustments.min_limit_etb ? formatCurrency(config.limit_adjustments.min_limit_etb) : "—",
        config.limit_adjustments.max_limit_etb ? formatCurrency(config.limit_adjustments.max_limit_etb) : "—",
        config.priority.toString(),
        config.is_active ? "Active" : "Inactive",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-appetite-configs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleRowExpansion = (configId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(configId)) {
      newExpanded.delete(configId);
    } else {
      newExpanded.add(configId);
    }
    setExpandedRows(newExpanded);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-accent/50"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="ml-2 h-3.5 w-3.5 text-primary" />
        ) : (
          <ArrowDown className="ml-2 h-3.5 w-3.5 text-primary" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
      )}
    </Button>
  );

  const allSelected = sortedConfigs.length > 0 && selectedConfigs.size === sortedConfigs.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-4">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Risk Appetite Configurations</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first risk appetite configuration to define risk tolerance levels and limits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {selectedConfigs.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20">
                <span className="text-sm font-medium text-primary">
                  {selectedConfigs.size} selected
                </span>
                <div className="flex items-center gap-1">
                  {onBulkToggleActive && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleBulkToggleActive(true)}
                          >
                            <ToggleRight className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Activate selected</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleBulkToggleActive(false)}
                          >
                            <ToggleLeft className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Deactivate selected</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  {onBulkDelete && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete selected</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Columns
                  {Object.values(visibleColumns).filter(v => !v).length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {Object.values(visibleColumns).filter(v => !v).length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.config_name}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, config_name: checked })
                  }
                >
                  Config Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.config_type}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, config_type: checked })
                  }
                >
                  Type
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.product_segment}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, product_segment: checked })
                  }
                >
                  Product/Segment
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.risk_tolerance}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, risk_tolerance: checked })
                  }
                >
                  Risk Tolerance
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.base_rate}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, base_rate: checked })
                  }
                >
                  Base Rate
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.limit_range}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, limit_range: checked })
                  }
                >
                  Limit Range
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.priority}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, priority: checked })
                  }
                >
                  Priority
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.status}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, status: checked })
                  }
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to CSV</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className={cn(compact && "text-sm")}>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50 border-b">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  {visibleColumns.config_name && (
                    <TableHead className="min-w-[200px]">
                      <SortButton field="config_name">Config Name</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.config_type && (
                    <TableHead className="min-w-[120px]">
                      <SortButton field="config_type">Type</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.product_segment && (
                    <TableHead className="min-w-[160px]">Product/Segment</TableHead>
                  )}
                  {visibleColumns.risk_tolerance && (
                    <TableHead className="min-w-[140px]">
                      <SortButton field="risk_tolerance">Risk Tolerance</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.base_rate && (
                    <TableHead className="min-w-[100px]">Base Rate</TableHead>
                  )}
                  {visibleColumns.limit_range && (
                    <TableHead className="min-w-[180px]">Limit Range</TableHead>
                  )}
                  {visibleColumns.priority && (
                    <TableHead className="min-w-[100px]">
                      <SortButton field="priority">Priority</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="min-w-[120px]">
                      <SortButton field="is_active">Status</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.actions_menu && (
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedConfigs.map((config) => {
                  const isExpanded = expandedRows.has(config.id);
                  const isSelected = selectedConfigs.has(config.id);
                  const riskTolerance = config.risk_parameters?.risk_tolerance_level;
                  return (
                    <React.Fragment key={config.id}>
                      <TableRow
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected && "bg-primary/5 hover:bg-primary/10",
                          !isSelected && "hover:bg-muted/50",
                          compact && "h-12"
                        )}
                        onClick={() => toggleRowExpansion(config.id)}
                      >
                        <TableCell
                          className="w-12"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectConfig(config.id, !!checked)}
                            aria-label={`Select ${config.config_name}`}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </TableCell>
                        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRowExpansion(config.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        {visibleColumns.config_name && (
                          <TableCell className="font-medium">
                            <span className="truncate">{config.config_name}</span>
                          </TableCell>
                        )}
                        {visibleColumns.config_type && (
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {config.config_type}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.product_segment && (
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                              {config.product_type && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  Product: {config.product_type}
                                </Badge>
                              )}
                              {config.customer_segment && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  Segment: {config.customer_segment}
                                </Badge>
                              )}
                              {!config.product_type && !config.customer_segment && (
                                <span className="text-muted-foreground text-xs">Global</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.risk_tolerance && (
                          <TableCell>
                            {riskTolerance ? (
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "font-normal",
                                  riskTolerance === "low_risk" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                                  riskTolerance === "medium_risk" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                  riskTolerance === "high_risk" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                                  riskTolerance === "critical_risk" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                )}
                              >
                                {riskTolerance.replace("_", " ")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.base_rate && (
                          <TableCell>
                            {config.interest_rate_adjustments?.base_rate ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">
                                  {(config.interest_rate_adjustments.base_rate * 100).toFixed(1)}%
                                </span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {config.interest_rate_adjustments.base_rate > 0.15 ? (
                                      <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                                    ) : (
                                      <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {config.interest_rate_adjustments.base_rate > 0.15 ? "High rate" : "Low rate"}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.limit_range && (
                          <TableCell>
                            {config.limit_adjustments.min_limit_etb || config.limit_adjustments.max_limit_etb ? (
                              <div className="flex flex-col gap-0.5 text-xs">
                                <span className="text-muted-foreground">Min:</span>
                                <span className="font-medium">
                                  {config.limit_adjustments.min_limit_etb
                                    ? formatCurrency(config.limit_adjustments.min_limit_etb)
                                    : "—"}
                                </span>
                                <span className="text-muted-foreground">Max:</span>
                                <span className="font-medium">
                                  {config.limit_adjustments.max_limit_etb
                                    ? formatCurrency(config.limit_adjustments.max_limit_etb)
                                    : "Unlimited"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.priority && (
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "font-normal",
                                config.priority === "high" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                                config.priority === "medium" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                config.priority === "low" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              )}
                            >
                              {config.priority}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            {config.is_active ? (
                              <Badge 
                                variant="default" 
                                className="bg-green-500 hover:bg-green-600 text-white border-0"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.actions_menu && (
                          <TableCell 
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {onEdit && (
                                  <DropdownMenuItem onClick={() => onEdit(config)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Config
                                  </DropdownMenuItem>
                                )}
                                {onToggleActive && (
                                  <DropdownMenuItem
                                    onClick={() => onToggleActive(config.id, !config.is_active)}
                                  >
                                    {config.is_active ? (
                                      <>
                                        <ToggleLeft className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <ToggleRight className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                {onDuplicate && (
                                  <DropdownMenuItem onClick={() => onDuplicate(config)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {onDelete && (
                                  <DropdownMenuItem
                                    onClick={() => onDelete(config.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length + 2} className="p-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Configuration Details</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Config ID:</span>
                                      <span className="font-medium">#{config.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Type:</span>
                                      <Badge variant="outline">{config.config_type}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Priority:</span>
                                      <Badge variant="outline">{config.priority}</Badge>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Risk Parameters</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Risk Tolerance:</span>
                                      <Badge variant="secondary">{riskTolerance || "—"}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Base Rate:</span>
                                      <span className="font-medium">
                                        {config.interest_rate_adjustments?.base_rate
                                          ? `${(config.interest_rate_adjustments.base_rate * 100).toFixed(1)}%`
                                          : "—"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <h4 className="text-sm font-semibold mb-2">Limit Adjustments</h4>
                                <div className="bg-background rounded-md p-3 border">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Min Limit:</span>
                                      <div className="font-medium mt-1">
                                        {config.limit_adjustments.min_limit_etb
                                          ? formatCurrency(config.limit_adjustments.min_limit_etb)
                                          : "—"}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Max Limit:</span>
                                      <div className="font-medium mt-1">
                                        {config.limit_adjustments.max_limit_etb
                                          ? formatCurrency(config.limit_adjustments.max_limit_etb)
                                          : "Unlimited"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
