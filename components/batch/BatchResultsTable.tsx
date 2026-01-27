"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import { BatchCreditScoreResult } from "@/types/credit";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, ArrowUpDown, Search, RotateCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface BatchResultsTableProps {
  results: BatchCreditScoreResult[];
  onRetry?: (customerId: string) => void;
  retryingIds?: Set<string>;
}

const columns: ColumnDef<BatchCreditScoreResult>[] = [
  {
    accessorKey: "customer_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "success",
    header: "Status",
    cell: ({ row }) => {
      const success = row.getValue("success") as boolean;
      return (
        <div className="flex items-center gap-2">
          {success ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <Badge variant="default" className="bg-green-500">
                Success
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive">Failed</Badge>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "credit_score",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Credit Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const score = row.getValue("credit_score") as number | undefined;
      if (score === undefined || score === null) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <span className="font-medium">{score}</span>;
    },
  },
  {
    accessorKey: "risk_category",
    header: "Risk Category",
    cell: ({ row }) => {
      const category = row.getValue("risk_category") as
        | "low"
        | "medium"
        | "high"
        | "very_high"
        | undefined;
      if (!category) {
        return <span className="text-muted-foreground">—</span>;
      }
      const variant =
        category === "low"
          ? "default"
          : category === "medium"
          ? "secondary"
          : "destructive";
      return <Badge variant={variant}>{category}</Badge>;
    },
  },
  {
    accessorKey: "approval_recommendation",
    header: "Recommendation",
    cell: ({ row }) => {
      const recommendation = row.getValue("approval_recommendation") as
        | "approve"
        | "reject"
        | "review"
        | undefined;
      if (!recommendation) {
        return <span className="text-muted-foreground">—</span>;
      }
      const variant =
        recommendation === "approve"
          ? "default"
          : recommendation === "reject"
          ? "destructive"
          : "secondary";
      return <Badge variant={variant}>{recommendation}</Badge>;
    },
  },
  {
    accessorKey: "error",
    header: "Error",
    cell: ({ row }) => {
      const error = row.getValue("error") as string | undefined;
      if (!error) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      );
    },
  },
];

const createColumnsWithRetry = (
  onRetry?: (customerId: string) => void,
  retryingIds?: Set<string>
): ColumnDef<BatchCreditScoreResult>[] => [
  ...columns,
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const result = row.original;
      const isRetrying = retryingIds?.has(result.customer_id);
      
      if (!result.success && onRetry) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry(result.customer_id)}
            disabled={isRetrying}
          >
            <RotateCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
        );
      }
      return <span className="text-muted-foreground">—</span>;
    },
  },
];

export function BatchResultsTable({ results, onRetry, retryingIds }: BatchResultsTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const tableColumns = onRetry ? createColumnsWithRetry(onRetry, retryingIds) : columns;

  const table = useReactTable({
    data: results,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      columnFilters,
      sorting,
    },
    // Global filter for search
    filterFromLeafRows: true,
  });

  // Apply filters
  useEffect(() => {
    const filters: ColumnFiltersState = [];
    
    if (statusFilter === "success") {
      filters.push({ id: "success", value: true });
    } else if (statusFilter === "failed") {
      filters.push({ id: "success", value: false });
    }
    
    if (riskFilter !== "all") {
      filters.push({ id: "risk_category", value: riskFilter });
    }
    
    setColumnFilters(filters);
  }, [statusFilter, riskFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
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
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {results.length} result(s)
        </div>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

