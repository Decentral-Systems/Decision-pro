/**
 * Column Chooser Component
 * Allows users to show/hide and reorder table columns
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Settings2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  isPII?: boolean;
}

interface ColumnChooserProps {
  columns: ColumnConfig[];
  onUpdate: (columns: ColumnConfig[]) => void;
  userRole?: string;
}

export function ColumnChooser({ columns, onUpdate, userRole }: ColumnChooserProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [isOpen, setIsOpen] = useState(false);

  // Filter PII columns based on role
  const canViewPII = userRole === "admin" || userRole === "credit_analyst" || userRole === "risk_manager";
  const visibleColumns = canViewPII 
    ? localColumns 
    : localColumns.filter(col => !col.isPII);

  const handleToggleVisibility = (id: string) => {
    const updated = localColumns.map(col =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updated);
    onUpdate(updated);
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const index = localColumns.findIndex(c => c.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localColumns.length) return;

    const updated = [...localColumns];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((col, i) => {
      col.order = i;
    });
    setLocalColumns(updated);
    onUpdate(updated);
  };

  // Save to localStorage
  const handleSave = () => {
    localStorage.setItem("customers_table_columns", JSON.stringify(localColumns));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
          <DialogDescription>
            Show/hide and reorder table columns. PII columns are hidden for limited roles.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {visibleColumns.map((col, index) => (
            <div
              key={col.id}
              className={cn(
                "flex items-center gap-2 p-3 border rounded-lg",
                !col.visible && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <Checkbox
                checked={col.visible}
                onCheckedChange={() => handleToggleVisibility(col.id)}
              />
              <Label className="flex-1 cursor-pointer">
                {col.label}
                {col.isPII && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    PII
                  </Badge>
                )}
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(col.id, "up")}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(col.id, "down")}
                  disabled={index === visibleColumns.length - 1}
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

