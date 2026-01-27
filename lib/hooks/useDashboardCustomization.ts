"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface DashboardLayout {
  id: string;
  name: string;
  sections: string[];
  layout: Record<string, { x: number; y: number; w: number; h: number }>;
  createdAt: string;
  isDefault?: boolean;
}

/**
 * Hook for managing dashboard customization and saved layouts
 */
export function useDashboardCustomization(page: string) {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { toast } = useToast();

  // Load saved layouts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`dashboard-layouts-${page}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLayouts(parsed);
        const defaultLayout = parsed.find((l: DashboardLayout) => l.isDefault);
        if (defaultLayout) {
          setCurrentLayout(defaultLayout);
        }
      } catch (error) {
        console.error("Failed to load saved layouts:", error);
      }
    }
  }, [page]);

  // Save layout
  const saveLayout = useCallback(
    (name: string, sections: string[], layout: Record<string, any>) => {
      const newLayout: DashboardLayout = {
        id: `layout-${Date.now()}`,
        name,
        sections,
        layout,
        createdAt: new Date().toISOString(),
        isDefault: layouts.length === 0,
      };

      const updated = [...layouts, newLayout];
      setLayouts(updated);
      localStorage.setItem(`dashboard-layouts-${page}`, JSON.stringify(updated));
      
      toast({
        title: "Layout Saved",
        description: `Layout "${name}" has been saved successfully`,
      });

      return newLayout;
    },
    [layouts, page, toast]
  );

  // Load layout
  const loadLayout = useCallback(
    (layoutId: string) => {
      const layout = layouts.find((l) => l.id === layoutId);
      if (layout) {
        setCurrentLayout(layout);
        toast({
          title: "Layout Loaded",
          description: `Layout "${layout.name}" has been loaded`,
        });
        return layout;
      }
      return null;
    },
    [layouts, toast]
  );

  // Delete layout
  const deleteLayout = useCallback(
    (layoutId: string) => {
      const updated = layouts.filter((l) => l.id !== layoutId);
      setLayouts(updated);
      localStorage.setItem(`dashboard-layouts-${page}`, JSON.stringify(updated));
      
      if (currentLayout?.id === layoutId) {
        setCurrentLayout(null);
      }

      toast({
        title: "Layout Deleted",
        description: "Layout has been deleted successfully",
      });
    },
    [layouts, currentLayout, page, toast]
  );

  // Set default layout
  const setDefaultLayout = useCallback(
    (layoutId: string) => {
      const updated = layouts.map((l) => ({
        ...l,
        isDefault: l.id === layoutId,
      }));
      setLayouts(updated);
      localStorage.setItem(`dashboard-layouts-${page}`, JSON.stringify(updated));
      
      const layout = updated.find((l) => l.id === layoutId);
      if (layout) {
        setCurrentLayout(layout);
      }

      toast({
        title: "Default Layout Set",
        description: "Default layout has been updated",
      });
    },
    [layouts, page, toast]
  );

  // Reset to default
  const resetToDefault = useCallback(() => {
    const defaultLayout = layouts.find((l) => l.isDefault);
    if (defaultLayout) {
      setCurrentLayout(defaultLayout);
      toast({
        title: "Layout Reset",
        description: "Layout has been reset to default",
      });
    } else {
      setCurrentLayout(null);
      toast({
        title: "Layout Reset",
        description: "Layout has been reset",
      });
    }
  }, [layouts, toast]);

  return {
    layouts,
    currentLayout,
    isCustomizing,
    setIsCustomizing,
    saveLayout,
    loadLayout,
    deleteLayout,
    setDefaultLayout,
    resetToDefault,
  };
}
