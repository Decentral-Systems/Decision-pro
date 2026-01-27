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
  RowSelectionState,
} from "@tanstack/react-table";
import { User } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Shield, Activity, CheckCircle2, XCircle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { safeFormatDate } from "@/lib/utils/format";

interface UsersTableProps {
  data: User[];
  isLoading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  onUpdateRoles?: (userId: string) => void;
  onViewActivity?: (userId: string) => void;
  selectedUsers?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  currentUserId?: string;
}

const columns = (
  onEdit?: (user: User) => void,
  onDelete?: (userId: string) => void,
  onUpdateRoles?: (userId: string) => void,
  onViewActivity?: (userId: string) => void,
  rowSelection?: RowSelectionState,
  onRowSelectionChange?: (selected: Set<string>) => void,
  currentUserId?: string
): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => {
          table.toggleAllPageRowsSelected(e.target.checked);
          if (onRowSelectionChange) {
            const allIds = new Set(table.getRowModel().rows.map(row => row.original.user_id));
            onRowSelectionChange(e.target.checked ? allIds : new Set());
          }
        }}
        className="rounded border-gray-300"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => {
          row.toggleSelected(e.target.checked);
          if (onRowSelectionChange) {
            const currentSelection = new Set(Object.keys(rowSelection || {}));
            if (e.target.checked) {
              currentSelection.add(row.original.user_id);
            } else {
              currentSelection.delete(row.original.user_id);
            }
            onRowSelectionChange(currentSelection);
          }
        }}
        className="rounded border-gray-300"
      />
    ),
    enableSorting: false,
    enableHiding: false,
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
          Username
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
  },
  {
    accessorKey: "full_name",
    header: "Full Name",
    cell: ({ row }) => {
      const name = row.getValue("full_name") as string | undefined;
      return name || <span className="text-muted-foreground">—</span>;
    },
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      const isLocked = row.original.is_locked;
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
          {isLocked && <Badge variant="destructive" className="text-xs">Locked</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: "last_login",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Last Login
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
      const lastLogin = row.getValue("last_login") as string | undefined;
      return lastLogin
        ? safeFormatDate(lastLogin, "PPp", "Never")
        : <span className="text-muted-foreground">Never</span>;
    },
  },
  {
    id: "mfa_status",
    header: "MFA",
    cell: ({ row }) => {
      const mfaEnabled = row.original.mfa_enabled;
      return (
        <div className="flex items-center gap-1">
          {mfaEnabled ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">Enabled</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Disabled</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    id: "password_status",
    header: "Password",
    cell: ({ row }) => {
      const passwordExpired = row.original.password_expired;
      const passwordLastChanged = row.original.password_last_changed;
      const daysSinceChange = passwordLastChanged 
        ? Math.floor((Date.now() - new Date(passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      return (
        <div className="flex flex-col gap-1">
          {passwordExpired ? (
            <Badge variant="destructive" className="text-xs">Expired</Badge>
          ) : daysSinceChange !== null && daysSinceChange > 90 ? (
            <Badge variant="secondary" className="text-xs">Old ({daysSinceChange}d)</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">OK</Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "lockout_info",
    header: "Lockout",
    cell: ({ row }) => {
      const isLocked = row.original.is_locked;
      const lockoutUntil = row.original.lockout_until;
      const failedLoginAttempts = row.original.failed_login_attempts || 0;
      
      if (isLocked && lockoutUntil) {
        const until = new Date(lockoutUntil);
        const now = new Date();
        if (until > now) {
          const minutesLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60));
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="destructive" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Locked ({minutesLeft}m)
              </Badge>
            </div>
          );
        }
      }
      
      if (failedLoginAttempts > 0) {
        return (
          <Badge variant="secondary" className="text-xs">
            {failedLoginAttempts} failed attempts
          </Badge>
        );
      }
      
      return <span className="text-muted-foreground text-xs">—</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onEdit?.(user)}
              disabled={currentUserId === user.user_id}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
              {currentUserId === user.user_id && <span className="ml-2 text-xs text-muted-foreground">(Self)</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdateRoles?.(user.user_id)}
              disabled={currentUserId === user.user_id}
            >
              <Shield className="mr-2 h-4 w-4" />
              Update Roles
              {currentUserId === user.user_id && <span className="ml-2 text-xs text-muted-foreground">(Self)</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewActivity?.(user.user_id)}>
              <Activity className="mr-2 h-4 w-4" />
              View Activity
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(user.user_id)}
              className="text-destructive"
              disabled={currentUserId === user.user_id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
              {currentUserId === user.user_id && <span className="ml-2 text-xs">(Cannot delete self)</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function UsersTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onUpdateRoles,
  onViewActivity,
  selectedUsers = new Set(),
  onSelectionChange,
  currentUserId,
}: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Sync rowSelection with selectedUsers prop
  useEffect(() => {
    const newSelection: RowSelectionState = {};
    data.forEach((user, index) => {
      if (selectedUsers.has(user.user_id)) {
        newSelection[index.toString()] = true;
      }
    });
    setRowSelection(newSelection);
  }, [selectedUsers, data]);

  const table = useReactTable({
    data,
    columns: columns(onEdit, onDelete, onUpdateRoles, onViewActivity, rowSelection, (selected) => {
      const userIds = new Set(data.filter((_, idx) => selected.has(idx.toString())).map(u => u.user_id));
      onSelectionChange?.(userIds);
    }, currentUserId),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      // Convert row indices to user IDs
      const userIds = new Set(
        data
          .filter((_, idx) => newSelection[idx.toString()])
          .map(u => u.user_id)
      );
      onSelectionChange?.(userIds);
    },
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
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
          placeholder="Search users..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} user(s)
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
                  colSpan={columns(undefined, undefined, undefined, undefined, undefined, undefined, currentUserId).length}
                  className="h-24 text-center"
                >
                  No users found.
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


