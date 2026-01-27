"use client";
import React, { useState } from "react";
import { creditScoringClient } from "@/lib/api/clients/credit-scoring";
import { useCreateCustomerNote } from "@/lib/api/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToPDF } from "@/lib/utils/exportHelpers";
import { VirtualizedTableBody } from "./VirtualizedTableBody";

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
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { CustomerListItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { navigateTo } from "@/lib/utils/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, MoreHorizontal, Download, Trash2, UserCheck, UserX, Settings2, Check, Calculator, Mail, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomersTableProps {
  data: CustomerListItem[];
  isLoading?: boolean;
  onBulkAction?: (action: string, customerIds: string[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

const createColumns = (
  onBulkAction?: (action: string, customerIds: string[]) => void,
  onCalculateCreditScore?: (customerId: string) => Promise<void>,
  onSendEmail?: (email: string, customerId: string) => void,
  onAddNote?: (customerId: string) => void,
  onExportCustomer?: (customer: CustomerListItem) => Promise<void>
): ColumnDef<CustomerListItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "customer_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Customer ID
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
      const customerId = row.getValue("customer_id") as string;
      return (
        <Link
          href={`/customers/${customerId}`}
          className="text-primary hover:underline font-medium"
        >
          {customerId}
        </Link>
      );
    },
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Name
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
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | undefined;
      return email || <span className="text-muted-foreground">—</span>;
    },
  },
  {
    accessorKey: "phone_number",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone_number") as string | undefined;
      return phone || <span className="text-muted-foreground">—</span>;
    },
  },
  {
    accessorKey: "region",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Region
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
      const region = row.getValue("region") as string | undefined;
      return region || <span className="text-muted-foreground">—</span>;
    },
  },
  {
    accessorKey: "credit_score",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Credit Score
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
      const score = row.getValue("credit_score") as number | undefined;
      // Handle 0 as a valid score (means score hasn't been calculated yet)
      if (score === undefined || score === null) {
        return <span className="text-muted-foreground">—</span>;
      }
      // Show 0 scores with a special indicator
      if (score === 0) {
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">0</span>
            <span className="text-xs text-muted-foreground">(Pending)</span>
          </div>
        );
      }
      const scoreColor =
        score >= 700
          ? "bg-green-500"
          : score >= 600
          ? "bg-yellow-500"
          : "bg-red-500";
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{score}</span>
          <div className={`w-2 h-2 rounded-full ${scoreColor}`} />
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string | undefined) || "active";
      const variant =
        status === "active"
          ? "default"
          : status === "inactive"
          ? "secondary"
          : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const customerId = row.original.customer_id;
      const customer = row.original;
      
      const handleRunCreditScore = async () => {
        if (onCalculateCreditScore) {
          await onCalculateCreditScore(customerId);
        }
      };
      
      const handleSendEmail = () => {
        if (onSendEmail) {
          onSendEmail(customer.email || "", customerId);
        } else {
          // Fallback to mailto
          const email = customer.email || "";
          if (email) {
            window.location.href = `mailto:${email}`;
          }
        }
      };
      
      const handleAddNote = () => {
        if (onAddNote) {
          onAddNote(customerId);
        }
      };
      
      const handleExportCustomer = async () => {
        if (onExportCustomer) {
          await onExportCustomer(customer);
        }
      };
      
      return (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            title="View 360"
            onClick={() => navigateTo(`/customers/${customerId}`)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View customer</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRunCreditScore}>
                <Calculator className="mr-2 h-4 w-4" />
                Run Credit Score
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendEmail} disabled={!customer.email}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddNote}>
                <FileText className="mr-2 h-4 w-4" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCustomer}>
                <Download className="mr-2 h-4 w-4" />
                Export Customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/customers/${customerId}`} className="flex items-center">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

const COLUMN_VISIBILITY_STORAGE_KEY = "customers-table-column-visibility";

export function CustomersTable({ data, isLoading, onBulkAction, onSelectionChange }: CustomersTableProps) {
  const { toast } = useToast();
  const createNoteMutation = useCreateCustomerNote();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Load column visibility from localStorage on mount
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn("Failed to load column visibility from localStorage", e);
      }
    }
    return {};
  });

  // Save column visibility to localStorage when it changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility));
      } catch (e) {
        console.warn("Failed to save column visibility to localStorage", e);
      }
    }
  }, [columnVisibility]);

  // Handlers for customer actions
  const handleCalculateCreditScore = async (customerId: string) => {
    try {
      toast({
        title: "Calculating credit score...",
        description: "Please wait while we calculate the credit score.",
      });
      
      // Fetch customer 360 data to get required fields for scoring
      const customer360 = await creditScoringClient.getCustomer360(customerId);
      
      if (!customer360) {
        throw new Error("Customer data not found");
      }
      
      // Build credit score request from customer 360 data
      const scoreRequest = {
        customer_id: customerId,
        // Add required fields from customer360
        ...customer360,
      };
      
      const result = await creditScoringClient.submitCreditScore(scoreRequest as any);
      
      toast({
        title: "Credit score calculated",
        description: `Credit score: ${result.credit_score} (${result.risk_category})`,
      });
      
      // Invalidate customer queries to refresh the table
      // This will be handled by React Query cache invalidation
    } catch (error: any) {
      console.error("Failed to calculate credit score:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to calculate credit score",
        variant: "destructive",
      });
    }
  };
  
  const handleSendEmail = (email: string, customerId: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
      toast({
        title: "Opening email client",
        description: `Preparing email to ${email}`,
      });
    } else {
      toast({
        title: "No email available",
        description: "This customer does not have an email address.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddNote = (customerId: string) => {
    // Open a simple prompt for note (can be enhanced with a dialog component)
    const noteContent = prompt("Enter note content:");
    if (noteContent && noteContent.trim()) {
      createNoteMutation.mutate(
        {
          customerId,
          note: {
            content: noteContent.trim(),
            type: "general",
          },
        },
        {
          onSuccess: () => {
            toast({
              title: "Note added",
              description: "Customer note has been added successfully.",
            });
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error.message || "Failed to add note",
              variant: "destructive",
            });
          },
        }
      );
    }
  };
  
  const handleExportCustomer = async (customer: CustomerListItem) => {
    try {
      toast({
        title: "Exporting customer data...",
        description: "Preparing export file...",
      });
      
      // Convert customer to array for export
      const customerData = [customer];
      const filename = `customer_${customer.customer_id}_${new Date().toISOString().split('T')[0]}`;
      
      // Export as CSV
      exportToCSV(customerData, filename);
      
      toast({
        title: "Export complete",
        description: "Customer data has been exported successfully.",
      });
    } catch (error: any) {
      console.error("Failed to export customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to export customer data",
        variant: "destructive",
      });
    }
  };

  const columns = createColumns(
    onBulkAction,
    handleCalculateCreditScore,
    handleSendEmail,
    handleAddNote,
    handleExportCustomer
  );

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
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCustomerIds = React.useMemo(
    () => selectedRows.map((row) => row.original.customer_id),
    [selectedRows]
  );

  // Notify parent of selection changes - use ref to track previous value
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  const prevSelectedIdsRef = React.useRef<string[]>([]);
  
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  React.useEffect(() => {
    // Only call callback if selection actually changed
    const prevIds = prevSelectedIdsRef.current;
    const hasChanged = 
      selectedCustomerIds.length !== prevIds.length ||
      selectedCustomerIds.some((id, index) => id !== prevIds[index]);
    
    if (hasChanged && onSelectionChangeRef.current) {
      prevSelectedIdsRef.current = selectedCustomerIds;
      onSelectionChangeRef.current(selectedCustomerIds);
    }
  }, [selectedCustomerIds]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
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
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search customers..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-4">
          {/* Column Visibility Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide() && column.id !== "select")
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      className="capitalize"
                      onSelect={(e) => {
                        e.preventDefault();
                        column.toggleVisibility(!column.getIsVisible());
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                          className="h-4 w-4"
                        />
                        <span className="flex-1">
                          {column.id === "customer_id"
                            ? "Customer ID"
                            : column.id === "full_name"
                            ? "Full Name"
                            : column.id === "email"
                            ? "Email"
                            : column.id === "phone_number"
                            ? "Phone"
                            : column.id === "region"
                            ? "Region"
                            : column.id === "credit_score"
                            ? "Credit Score"
                            : column.id === "status"
                            ? "Status"
                            : column.id === "created_at"
                            ? "Created At"
                            : column.id === "actions"
                            ? "Actions"
                            : column.id}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {selectedCustomerIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedCustomerIds.length} selected
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onBulkAction?.("export", selectedCustomerIds)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onBulkAction?.("activate", selectedCustomerIds)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onBulkAction?.("deactivate", selectedCustomerIds)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onBulkAction?.("delete", selectedCustomerIds)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} customer(s)
          </div>
        </div>
      </div>
      <div className="border rounded-md overflow-hidden">
        {table.getRowModel().rows.length > 50 ? (
          // Use virtual scrolling for large datasets (>50 rows)
          <div className="relative">
            <div className="sticky top-0 z-10 bg-background border-b">
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
              </Table>
            </div>
            <VirtualizedTableBody
              rows={table.getRowModel().rows}
              renderRow={(row) => (
                <>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </>
              )}
              emptyMessage="No customers found."
              estimateRowHeight={64}
              overscan={5}
              columnCount={table.getAllColumns().filter(col => col.getIsVisible()).length}
            />
          </div>
        ) : (
          // Use standard rendering for small datasets
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
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
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

