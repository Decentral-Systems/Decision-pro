"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Save, Trash2, RotateCcw } from "lucide-react";
import { useDashboardCustomization, DashboardLayout } from "@/lib/hooks/useDashboardCustomization";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface DashboardCustomizationProps {
  page: string;
  availableSections: string[];
  trigger?: React.ReactNode;
}

/**
 * Component for managing dashboard customization and saved layouts
 */
export function DashboardCustomization({
  page,
  availableSections,
  trigger,
}: DashboardCustomizationProps) {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const {
    layouts,
    currentLayout,
    saveLayout,
    loadLayout,
    deleteLayout,
    setDefaultLayout,
    resetToDefault,
  } = useDashboardCustomization(page);
  const { toast } = useToast();

  const handleSave = () => {
    if (!layoutName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a layout name",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, you would capture the current layout state
    // For now, we'll save a placeholder
    saveLayout(layoutName, availableSections, {});
    setLayoutName("");
    setSaveDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dashboard Customization</DialogTitle>
            <DialogDescription>
              Save and manage custom dashboard layouts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Current Layout */}
            {currentLayout && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{currentLayout.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentLayout.sections.length} sections
                    </p>
                  </div>
                  {currentLayout.isDefault && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Saved Layouts */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Saved Layouts
              </Label>
              {layouts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No saved layouts. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {layouts.map((layout) => (
                    <div
                      key={layout.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{layout.name}</p>
                          {layout.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {layout.sections.length} sections •{" "}
                          {new Date(layout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadLayout(layout.id)}
                        >
                          Load
                        </Button>
                        {!layout.isDefault && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDefaultLayout(layout.id)}
                            >
                              Set Default
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLayout(layout.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(true)}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Layout
              </Button>
              <Button
                variant="outline"
                onClick={resetToDefault}
                disabled={!currentLayout}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Layout</DialogTitle>
            <DialogDescription>
              Enter a name for your custom dashboard layout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="layout-name">Layout Name</Label>
              <Input
                id="layout-name"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="My Custom Layout"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Layout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
