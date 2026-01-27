"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { AuditLogEntry } from "@/types/admin";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/utils/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditLogsTableProps {
  data: AuditLogEntry[];
  isLoading?: boolean;
  onRowClick?: (log: AuditLogEntry) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: string, order: "asc" | "desc") => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "default";
    case "failure":
      return "destructive";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
};

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Timestamp
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as string;
      return safeFormatDate(timestamp, "PPp", "Unknown");
    },
  },
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          User
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const username = row.getValue("username") as string | undefined;
      const userId = row.original.user_id;
      return (
        <div className="flex items-center gap-2">
          {username || userId || <span className="text-muted-foreground">—</span>}
          {userId && (
            <a
              href={`/admin/users?search=${userId}`}
              className="text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <User className="h-3 w-3" />
            </a>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Action
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "resource_type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Resource
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "resource_id",
    header: "Resource ID",
    cell: ({ row }) => {
      const resourceId = row.getValue("resource_id") as string | undefined;
      const resourceType = row.original.resource_type;
      return (
        <div className="flex items-center gap-2">
          {resourceId || <span className="text-muted-foreground">—</span>}
          {resourceId && resourceType && (
            <a
              href={`/${resourceType}/${resourceId}`}
              className="text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <LinkIcon className="h-3 w-3" />
            </a>
          )}
        </div>
      );
    },
  },
  {
    id: "correlation_id",
    header: "Correlation ID",
    cell: ({ row }) => {
      const correlationId = (row.original.details as any)?.correlation_id;
      if (!correlationId) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant="outline" className="text-xs font-mono">
          {correlationId.substring(0, 8)}...
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={getStatusColor(status) as any}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const log = row.original;
      return <AuditLogDetailButton log={log} />;
    },
  },
];

function AuditLogDetailButton({ log }: { log: AuditLogEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4" />
        <span className="sr-only">View details</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Detailed information about this audit log entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                <p className="text-sm">{safeFormatDate(log.timestamp, "PPpp", "Unknown")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div>
                  <Badge variant={getStatusColor(log.status) as any}>{log.status}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User</label>
                <p className="text-sm">{log.username || log.user_id || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Action</label>
                <p className="text-sm font-medium">{log.action}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Resource Type</label>
                <p className="text-sm">{log.resource_type}</p>
              </div>
              {log.resource_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resource ID</label>
                  <p className="text-sm">{log.resource_id}</p>
                </div>
              )}
              {log.ip_address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="text-sm">{log.ip_address}</p>
                </div>
              )}
            </div>
            {log.details && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Details</label>
                <pre className="mt-2 p-4 bg-muted rounded-md text-sm overflow-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AuditLogsTable({ data, isLoading, onRowClick }: AuditLogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true }, // Default sort by timestamp descending
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-md">
          <div className="h-12 bg-muted animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row.original)}
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
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
    </div>
  );
}


