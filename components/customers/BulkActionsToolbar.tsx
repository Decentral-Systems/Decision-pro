"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserCheck, UserX, Trash2, Download, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBulkActivateCustomers, useBulkDeactivateCustomers, useBulkDeleteCustomers, useBulkExportCustomers } from "@/lib/api/hooks/useCustomers";
import { exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import { CustomerComparisonModal } from "./CustomerComparisonModal";

interface BulkActionsToolbarProps {
  selectedCustomerIds: string[];
  onClearSelection: () => void;
  onActionComplete?: () => void;
}

export function BulkActionsToolbar({
  selectedCustomerIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const { toast } = useToast();
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "delete" | null;
    customerIds: string[];
  }>({ type: null, customerIds: [] });

  const activateMutation = useBulkActivateCustomers();
  const deactivateMutation = useBulkDeactivateCustomers();
  const deleteMutation = useBulkDeleteCustomers();
  const exportMutation = useBulkExportCustomers();

  const selectedCount = selectedCustomerIds.length;
  const isLoading =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending ||
    exportMutation.isPending;

  const handleActivate = () => {
    setConfirmAction({ type: "activate", customerIds: selectedCustomerIds });
  };

  const handleDeactivate = () => {
    setConfirmAction({ type: "deactivate", customerIds: selectedCustomerIds });
  };

  const handleDelete = () => {
    setConfirmAction({ type: "delete", customerIds: selectedCustomerIds });
  };

  const handleExport = async (format: "csv" | "excel" = "csv") => {
    try {
      const result = await exportMutation.mutateAsync({
        customerIds: selectedCustomerIds,
        format,
      });

      if (result?.success && result?.data) {
        if (format === "excel") {
          exportToExcel(result.data, `customers_bulk_export_${Date.now()}`);
        } else {
          exportToCSV(result.data, `customers_bulk_export_${Date.now()}`);
        }

        toast({
          title: "Export Successful",
          description: `Exported ${result.count || selectedCount} customers to ${format.toUpperCase()}`,
        });

        onActionComplete?.();
      } else {
        throw new Error("Export failed - no data returned");
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export customers",
        variant: "destructive",
      });
    }
  };

  const confirmAndExecute = async () => {
    const { type, customerIds } = confirmAction;
    if (!type || customerIds.length === 0) return;

    try {
      let result;
      let actionName: string;

      switch (type) {
        case "activate":
          result = await activateMutation.mutateAsync(customerIds);
          actionName = "activated";
          break;
        case "deactivate":
          result = await deactivateMutation.mutateAsync(customerIds);
          actionName = "deactivated";
          break;
        case "delete":
          result = await deleteMutation.mutateAsync(customerIds);
          actionName = "deleted";
          break;
        default:
          return;
      }

      if (result?.success) {
        const succeeded = result.succeeded || result.total || customerIds.length;
        const failed = result.failed || 0;

        toast({
          title: "Bulk Action Completed",
          description: `${succeeded} customer(s) ${actionName}${failed > 0 ? `. ${failed} failed.` : "."}`,
        });

        onClearSelection();
        onActionComplete?.();
      } else {
        throw new Error(result?.message || "Action failed");
      }
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to complete bulk action",
        variant: "destructive",
      });
    } finally {
      setConfirmAction({ type: null, customerIds: [] });
    }
  };

  const getActionTitle = () => {
    switch (confirmAction.type) {
      case "activate":
        return "Activate Customers";
      case "deactivate":
        return "Deactivate Customers";
      case "delete":
        return "Delete Customers";
      default:
        return "";
    }
  };

  const getActionDescription = () => {
    const count = confirmAction.customerIds.length;
    switch (confirmAction.type) {
      case "activate":
        return `Are you sure you want to activate ${count} customer(s)? This will change their status to active.`;
      case "deactivate":
        return `Are you sure you want to deactivate ${count} customer(s)? This will change their status to inactive.`;
      case "delete":
        return `Are you sure you want to delete ${count} customer(s)? This action cannot be undone.`;
      default:
        return "";
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleActivate}
            disabled={isLoading}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Activate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDeactivate}
            disabled={isLoading}
          >
            <UserX className="h-4 w-4 mr-2" />
            Deactivate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
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
            </DropdownMenuContent>
          </DropdownMenu>

          <CustomerComparisonModal selectedCustomerIds={selectedCustomerIds} />

          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <AlertDialog
        open={confirmAction.type !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction({ type: null, customerIds: [] });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionTitle()}</AlertDialogTitle>
            <AlertDialogDescription>{getActionDescription()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAndExecute}
              disabled={isLoading}
              className={
                confirmAction.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

