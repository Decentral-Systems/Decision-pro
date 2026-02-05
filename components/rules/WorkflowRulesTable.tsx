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
  Play, 
  ToggleLeft, 
  ToggleRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Eye,
  ChevronRight,
  ChevronDown,
  Workflow,
} from "lucide-react";
import { WorkflowRule } from "@/types/rules";
import { RuleConditionsDisplay } from "./RuleConditionsDisplay";
import { RuleActionsDisplay } from "./RuleActionsDisplay";
import { RuleStats } from "./RuleStats";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WorkflowRulesTableProps {
  rules: WorkflowRule[];
  isLoading?: boolean;
  onEdit?: (rule: WorkflowRule) => void;
  onDelete?: (ruleId: number) => void;
  onDuplicate?: (rule: WorkflowRule) => void;
  onEvaluate?: (rule: WorkflowRule) => void;
  onToggleActive?: (ruleId: number, isActive: boolean) => void;
  onBulkDelete?: (ruleIds: number[]) => void;
  onBulkToggleActive?: (ruleIds: number[], isActive: boolean) => void;
  compact?: boolean;
}

type SortField = "rule_name" | "rule_type" | "priority" | "is_active" | "execution_count";
type SortDirection = "asc" | "desc";

export function WorkflowRulesTable({
  rules,
  isLoading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onEvaluate,
  onToggleActive,
  onBulkDelete,
  onBulkToggleActive,
  compact = false,
}: WorkflowRulesTableProps) {
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    rule_name: true,
    rule_type: true,
    product_segment: true,
    priority: true,
    conditions: true,
    actions: true,
    status: true,
    statistics: true,
    actions_menu: true,
  });

  // Sort rules
  const sortedRules = useMemo(() => {
    const sorted = [...rules].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "rule_name":
          aValue = a.rule_name.toLowerCase();
          bValue = b.rule_name.toLowerCase();
          break;
        case "rule_type":
          aValue = a.rule_type.toLowerCase();
          bValue = b.rule_type.toLowerCase();
          break;
        case "priority":
          aValue = a.priority;
          bValue = b.priority;
          break;
        case "execution_count":
          aValue = a.execution_count || 0;
          bValue = b.execution_count || 0;
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
  }, [rules, sortField, sortDirection]);

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
      setSelectedRules(new Set(sortedRules.map(r => r.id)));
    } else {
      setSelectedRules(new Set());
    }
  };

  const handleSelectRule = (ruleId: number, checked: boolean) => {
    const newSelected = new Set(selectedRules);
    if (checked) {
      newSelected.add(ruleId);
    } else {
      newSelected.delete(ruleId);
    }
    setSelectedRules(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedRules.size > 0) {
      onBulkDelete(Array.from(selectedRules));
      setSelectedRules(new Set());
    }
  };

  const handleBulkToggleActive = (isActive: boolean) => {
    if (onBulkToggleActive && selectedRules.size > 0) {
      onBulkToggleActive(Array.from(selectedRules), isActive);
      setSelectedRules(new Set());
    }
  };

  const handleExport = () => {
    const csv = [
      ["Rule Name", "Type", "Product/Segment", "Priority", "Status", "Executions", "Success", "Failures"],
      ...sortedRules.map((rule) => [
        rule.rule_name,
        rule.rule_type,
        rule.product_type || rule.customer_segment || "All",
        rule.priority.toString(),
        rule.is_active ? "Active" : "Inactive",
        (rule.execution_count || 0).toString(),
        (rule.success_count || 0).toString(),
        (rule.failure_count || 0).toString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-rules-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleRowExpansion = (ruleId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
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

  const allSelected = sortedRules.length > 0 && selectedRules.size === sortedRules.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-4">
            <Workflow className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Workflow Rules Found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first workflow rule to automate business processes and decision flows.
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
            {selectedRules.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20">
                <span className="text-sm font-medium text-primary">
                  {selectedRules.size} selected
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
                  checked={visibleColumns.rule_name}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, rule_name: checked })
                  }
                >
                  Rule Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.rule_type}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, rule_type: checked })
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
                  checked={visibleColumns.priority}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, priority: checked })
                  }
                >
                  Priority
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.conditions}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, conditions: checked })
                  }
                >
                  Conditions
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.actions}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, actions: checked })
                  }
                >
                  Actions
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.status}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, status: checked })
                  }
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.statistics}
                  onCheckedChange={(checked) =>
                    setVisibleColumns({ ...visibleColumns, statistics: checked })
                  }
                >
                  Statistics
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
                  {visibleColumns.rule_name && (
                    <TableHead className="min-w-[200px]">
                      <SortButton field="rule_name">Rule Name</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.rule_type && (
                    <TableHead className="min-w-[120px]">
                      <SortButton field="rule_type">Type</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.product_segment && (
                    <TableHead className="min-w-[160px]">Product/Segment</TableHead>
                  )}
                  {visibleColumns.priority && (
                    <TableHead className="min-w-[100px]">
                      <SortButton field="priority">Priority</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.conditions && (
                    <TableHead className="min-w-[250px]">Conditions</TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="min-w-[120px]">
                      <SortButton field="is_active">Status</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.statistics && (
                    <TableHead className="min-w-[180px]">
                      <SortButton field="execution_count">Statistics</SortButton>
                    </TableHead>
                  )}
                  {visibleColumns.actions_menu && (
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.map((rule) => {
                  const isExpanded = expandedRows.has(rule.id);
                  const isSelected = selectedRules.has(rule.id);
                  return (
                    <React.Fragment key={rule.id}>
                      <TableRow
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected && "bg-primary/5 hover:bg-primary/10",
                          !isSelected && "hover:bg-muted/50",
                          compact && "h-12"
                        )}
                        onClick={() => toggleRowExpansion(rule.id)}
                      >
                        <TableCell
                          className="w-12"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRule(rule.id, !!checked)}
                            aria-label={`Select ${rule.rule_name}`}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </TableCell>
                        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRowExpansion(rule.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        {visibleColumns.rule_name && (
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{rule.rule_name}</span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.rule_type && (
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "font-normal",
                                rule.rule_type === "automation" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                                rule.rule_type === "notification" && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
                                rule.rule_type === "escalation" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                              )}
                            >
                              {rule.rule_type}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.product_segment && (
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                              {rule.product_type && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  Product: {rule.product_type}
                                </Badge>
                              )}
                              {rule.customer_segment && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  Segment: {rule.customer_segment}
                                </Badge>
                              )}
                              {!rule.product_type && !rule.customer_segment && (
                                <span className="text-muted-foreground text-xs">All</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.priority && (
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "font-normal",
                                rule.priority === "high" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                                rule.priority === "medium" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                rule.priority === "low" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              )}
                            >
                              {rule.priority}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.conditions && (
                          <TableCell className="max-w-xs">
                            <RuleConditionsDisplay
                              conditions={rule.rule_conditions.conditions}
                              logicalOperator={rule.rule_conditions.logical_operator}
                              compact={compact}
                            />
                          </TableCell>
                        )}
                        {visibleColumns.actions && (
                          <TableCell className="max-w-xs">
                            <RuleActionsDisplay 
                              actions={rule.rule_actions.actions} 
                              compact={compact}
                            />
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            {rule.is_active ? (
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
                        {visibleColumns.statistics && (
                          <TableCell className="py-3">
                            <RuleStats
                              execution_count={rule.execution_count}
                              success_count={rule.success_count}
                              failure_count={rule.failure_count}
                              match_count={rule.execution_count ? (rule.success_count || 0) : 0}
                              action_execution_count={rule.execution_count}
                              compact={compact}
                            />
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
                                  <DropdownMenuItem onClick={() => onEdit(rule)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Rule
                                  </DropdownMenuItem>
                                )}
                                {onToggleActive && (
                                  <DropdownMenuItem
                                    onClick={() => onToggleActive(rule.id, !rule.is_active)}
                                  >
                                    {rule.is_active ? (
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
                                  <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                )}
                                {onEvaluate && (
                                  <DropdownMenuItem onClick={() => onEvaluate(rule)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Test Rule
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {onDelete && (
                                  <DropdownMenuItem
                                    onClick={() => onDelete(rule.id)}
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
                                  <h4 className="text-sm font-semibold mb-2">Rule Details</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Rule ID:</span>
                                      <span className="font-medium">#{rule.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Type:</span>
                                      <Badge variant="outline">{rule.rule_type}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Priority:</span>
                                      <Badge variant="outline">{rule.priority}</Badge>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Performance Metrics</h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Executions:</span>
                                      <span className="font-medium">{(rule.execution_count || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Success:</span>
                                      <span className="font-medium text-green-600">{(rule.success_count || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Failures:</span>
                                      <span className="font-medium text-red-600">{(rule.failure_count || 0).toLocaleString()}</span>
                                    </div>
                                    {(rule.execution_count || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Success Rate:</span>
                                        <span className="font-medium">
                                          {(((rule.success_count || 0) / (rule.execution_count || 1)) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <h4 className="text-sm font-semibold mb-2">Full Conditions</h4>
                                <div className="bg-background rounded-md p-3 border">
                                  <RuleConditionsDisplay
                                    conditions={rule.rule_conditions.conditions}
                                    logicalOperator={rule.rule_conditions.logical_operator}
                                  />
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <h4 className="text-sm font-semibold mb-2">Full Actions</h4>
                                <div className="bg-background rounded-md p-3 border">
                                  <RuleActionsDisplay actions={rule.rule_actions.actions} />
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
