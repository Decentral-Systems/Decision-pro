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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { ApprovalLevel } from "@/types/rules";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface ApprovalWorkflowTableProps {
  levels: ApprovalLevel[];
  isLoading?: boolean;
  compact?: boolean;
}

type SortField = "level" | "name" | "min_credit_score" | "max_loan_amount" | "required_approvers";
type SortDirection = "asc" | "desc";

export function ApprovalWorkflowTable({
  levels,
  isLoading = false,
  compact = false,
}: ApprovalWorkflowTableProps) {
  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    level: true,
    name: true,
    min_credit_score: true,
    max_loan_amount: true,
    required_approvers: true,
    auto_actions: true,
    escalation_threshold: true,
  });

  // Sort levels
  const sortedLevels = useMemo(() => {
    const validLevels = [...(levels || [])].filter(
      (level) => level && typeof level.level === "number"
    );

    return validLevels.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "level":
          aValue = a.level;
          bValue = b.level;
          break;
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "min_credit_score":
          aValue = a.min_credit_score || 0;
          bValue = b.min_credit_score || 0;
          break;
        case "max_loan_amount":
          aValue = a.max_loan_amount || Infinity;
          bValue = b.max_loan_amount || Infinity;
          break;
        case "required_approvers":
          aValue = a.required_approvers || 0;
          bValue = b.required_approvers || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [levels, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Level", "Name", "Min Credit Score", "Max Loan Amount", "Required Approvers", "Auto Approve", "Auto Reject", "Escalation Threshold"],
      ...sortedLevels.map((level) => [
        level.level.toString(),
        level.name || "—",
        (level.min_credit_score || 0).toString(),
        !level.max_loan_amount || level.max_loan_amount >= 999999999 || level.max_loan_amount === Infinity || !isFinite(level.max_loan_amount)
          ? "Unlimited"
          : formatCurrency(level.max_loan_amount),
        (level.required_approvers || 0).toString(),
        level.auto_approve ? "Yes" : "No",
        level.auto_reject ? "Yes" : "No",
        level.escalation_threshold ? `${(level.escalation_threshold * 100).toFixed(0)}%` : "—",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `approval-workflow-levels-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleRowExpansion = (level: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!levels || levels.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-4">
            <FileCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Approval Levels Configured</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Configure approval levels to define the workflow for loan approvals based on credit scores and amounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2">
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
                checked={visibleColumns.level}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, level: checked })
                }
              >
                Level
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.name}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, name: checked })
                }
              >
                Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.min_credit_score}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, min_credit_score: checked })
                }
              >
                Min Credit Score
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.max_loan_amount}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, max_loan_amount: checked })
                }
              >
                Max Loan Amount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.required_approvers}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, required_approvers: checked })
                }
              >
                Required Approvers
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.auto_actions}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, auto_actions: checked })
                }
              >
                Auto Actions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.escalation_threshold}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, escalation_threshold: checked })
                }
              >
                Escalation Threshold
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

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className={cn(compact && "text-sm")}>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50 border-b">
                  <TableHead className="w-12"></TableHead>
                  {visibleColumns.level && (
                    <TableHead className="min-w-[80px]">
                      <SortButton field="level">Level</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="min-w-[180px]">
                      <SortButton field="name">Name</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.min_credit_score && (
                    <TableHead className="min-w-[140px]">
                      <SortButton field="min_credit_score">Min Credit Score</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.max_loan_amount && (
                    <TableHead className="min-w-[160px]">
                      <SortButton field="max_loan_amount">Max Loan Amount</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.required_approvers && (
                    <TableHead className="min-w-[140px]">
                      <SortButton field="required_approvers">Required Approvers</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.auto_actions && (
                    <TableHead className="min-w-[140px]">Auto Actions</TableHead>
                  )}
                  {visibleColumns.escalation_threshold && (
                    <TableHead className="min-w-[160px]">Escalation Threshold</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLevels.map((level) => {
                  const isExpanded = expandedRows.has(level.level);
                  const isUnlimited = !level.max_loan_amount || 
                    level.max_loan_amount >= 999999999 || 
                    level.max_loan_amount === Infinity || 
                    !isFinite(level.max_loan_amount);
                  
                  return (
                    <React.Fragment key={level.level}>
                      <TableRow
                        className={cn(
                          "group cursor-pointer transition-colors hover:bg-muted/50",
                          compact && "h-12"
                        )}
                        onClick={() => toggleRowExpansion(level.level)}
                      >
                        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRowExpansion(level.level)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        {visibleColumns.level && (
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "font-medium",
                                level.level === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                                level.level === 2 && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
                                level.level === 3 && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                                level.level >= 4 && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              )}
                            >
                              Level {level.level}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.name && (
                          <TableCell className="font-medium">
                            <span className="truncate">{level.name || "—"}</span>
                          </TableCell>
                        )}
                        {visibleColumns.min_credit_score && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{level.min_credit_score || 0}</span>
                              {level.min_credit_score && level.min_credit_score >= 700 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>High credit score requirement</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.max_loan_amount && (
                          <TableCell>
                            {isUnlimited ? (
                              <Badge variant="secondary" className="font-normal">
                                Unlimited
                              </Badge>
                            ) : (
                              <span className="font-medium">{formatCurrency(level.max_loan_amount)}</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.required_approvers && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-medium">
                                {level.required_approvers || 0}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {(level.required_approvers || 0) === 1 ? "approver" : "approvers"}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.auto_actions && (
                          <TableCell>
                            <div className="flex gap-1.5 flex-wrap">
                              {level.auto_approve && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="default" 
                                      className="bg-green-500 hover:bg-green-600 text-white border-0"
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Auto Approve
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Automatically approves loans at this level</TooltipContent>
                                </Tooltip>
                              )}
                              {level.auto_reject && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Auto Reject
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Automatically rejects loans at this level</TooltipContent>
                                </Tooltip>
                              )}
                              {!level.auto_approve && !level.auto_reject && (
                                <Badge variant="secondary" className="font-normal">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Manual
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.escalation_threshold && (
                          <TableCell>
                            {level.escalation_threshold ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-medium">
                                  {(level.escalation_threshold * 100).toFixed(0)}%
                                </Badge>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>Escalation threshold percentage</TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length + 1} className="p-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Level Details</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Level:</span>
                                      <Badge variant="outline">{level.level}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Name:</span>
                                      <span className="font-medium">{level.name || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Min Credit Score:</span>
                                      <span className="font-medium">{level.min_credit_score || 0}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Approval Requirements</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Max Loan Amount:</span>
                                      <span className="font-medium">
                                        {isUnlimited ? "Unlimited" : formatCurrency(level.max_loan_amount)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Required Approvers:</span>
                                      <span className="font-medium">{level.required_approvers || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Escalation Threshold:</span>
                                      <span className="font-medium">
                                        {level.escalation_threshold ? `${(level.escalation_threshold * 100).toFixed(0)}%` : "—"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <h4 className="text-sm font-semibold mb-2">Auto Actions</h4>
                                <div className="bg-background rounded-md p-3 border">
                                  <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                      {level.auto_approve ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                          <span className="text-sm font-medium">Auto Approve Enabled</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">Auto Approve Disabled</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {level.auto_reject ? (
                                        <>
                                          <XCircle className="h-4 w-4 text-red-500" />
                                          <span className="text-sm font-medium">Auto Reject Enabled</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">Auto Reject Disabled</span>
                                        </>
                                      )}
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
