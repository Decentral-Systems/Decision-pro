/**
 * Saved Views Component
 * Allows users to save and share filter/view configurations
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Bookmark, Share2, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  columns?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  createdAt: string;
  isShared?: boolean;
  shareLink?: string;
}

interface SavedViewsProps {
  currentFilters: Record<string, any>;
  currentColumns?: string[];
  currentSort?: { sortBy?: string; sortOrder?: "asc" | "desc" };
  onLoadView: (view: SavedView) => void;
}

export function SavedViews({ currentFilters, currentColumns, currentSort, onLoadView }: SavedViewsProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Load saved views from localStorage
    const saved = localStorage.getItem("customers_saved_views");
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load saved views:", e);
      }
    }
  }, []);

  const handleSave = () => {
    if (!viewName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a view name",
        variant: "destructive",
      });
      return;
    }

    const newView: SavedView = {
      id: `view_${Date.now()}`,
      name: viewName,
      filters: currentFilters,
      columns: currentColumns,
      sortBy: currentSort?.sortBy,
      sortOrder: currentSort?.sortOrder,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedViews, newView];
    setSavedViews(updated);
    localStorage.setItem("customers_saved_views", JSON.stringify(updated));
    
    toast({
      title: "Success",
      description: `View "${viewName}" saved successfully`,
    });
    
    setViewName("");
    setSaveDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = savedViews.filter(v => v.id !== id);
    setSavedViews(updated);
    localStorage.setItem("customers_saved_views", JSON.stringify(updated));
    toast({
      title: "Success",
      description: "View deleted",
    });
  };

  const handleShare = (view: SavedView) => {
    const shareLink = `${window.location.origin}/customers?view=${view.id}`;
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Success",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Views ({savedViews.length})
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved Views</DialogTitle>
            <DialogDescription>
              Load or manage your saved filter and column configurations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {savedViews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved views. Save your current filters to create one.
              </div>
            ) : (
              savedViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{view.name}</span>
                      {view.isShared && (
                        <Badge variant="outline" className="text-xs">
                          Shared
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(view.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onLoadView(view);
                        setIsOpen(false);
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(view)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(view.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSaveDialogOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save Current View
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
            <DialogDescription>
              Save your current filters and column configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>View Name</Label>
              <Input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g., High Risk Customers"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}



