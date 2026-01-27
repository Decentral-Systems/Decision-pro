"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface WidgetPosition {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  order?: number; // Added for WidgetGrid compatibility
}

export interface DashboardLayout {
  widgets: WidgetPosition[];
  version: number;
}

const DEFAULT_LAYOUT_KEY = "dashboard_layout";
const LAYOUT_VERSION = 1;

export function useDashboardLayout(
  defaultWidgets: WidgetPosition[],
  syncWithURL: boolean = true
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize layout from URL or localStorage
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    if (typeof window === "undefined") {
      return { widgets: defaultWidgets, version: LAYOUT_VERSION };
    }

    // Try URL first if syncWithURL is enabled
    if (syncWithURL) {
      const urlLayout = searchParams.get('layout');
      if (urlLayout) {
        try {
          const decoded = decodeURIComponent(urlLayout);
          const parsed = JSON.parse(decoded) as DashboardLayout;
          if (parsed.version === LAYOUT_VERSION && Array.isArray(parsed.widgets)) {
            return parsed;
          }
        } catch (e) {
          console.warn("[useDashboardLayout] Failed to parse URL layout:", e);
        }
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(DEFAULT_LAYOUT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DashboardLayout;
        if (parsed.version === LAYOUT_VERSION) {
          return parsed;
        }
      } catch (e) {
        console.warn("[useDashboardLayout] Failed to load saved layout:", e);
      }
    }

    return { widgets: defaultWidgets, version: LAYOUT_VERSION };
  });

  // Sync layout to URL when it changes
  useEffect(() => {
    if (!syncWithURL || typeof window === "undefined") return;

    const params = new URLSearchParams(searchParams.toString());
    const layoutJson = JSON.stringify(layout);
    const encoded = encodeURIComponent(layoutJson);
    
    // Only update URL if layout actually changed
    const currentLayout = params.get('layout');
    if (currentLayout !== encoded) {
      params.set('layout', encoded);
      const newUrl = `${pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [layout, syncWithURL, pathname, router, searchParams]);

  // Read from URL when it changes
  useEffect(() => {
    if (!syncWithURL || typeof window === "undefined") return;

    const urlLayout = searchParams.get('layout');
    if (urlLayout) {
      try {
        const decoded = decodeURIComponent(urlLayout);
        const parsed = JSON.parse(decoded) as DashboardLayout;
        if (parsed.version === LAYOUT_VERSION && Array.isArray(parsed.widgets)) {
          setLayout(parsed);
          // Also save to localStorage for offline access
          localStorage.setItem(DEFAULT_LAYOUT_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn("[useDashboardLayout] Failed to parse URL layout:", e);
      }
    }
  }, [searchParams, syncWithURL]);

  const saveLayout = useCallback((widgets: WidgetPosition[]) => {
    const newLayout: DashboardLayout = {
      widgets,
      version: LAYOUT_VERSION,
    };
    setLayout(newLayout);
    if (typeof window !== "undefined") {
      localStorage.setItem(DEFAULT_LAYOUT_KEY, JSON.stringify(newLayout));
    }
  }, []);

  const resetLayout = useCallback(() => {
    const defaultLayout = { widgets: defaultWidgets, version: LAYOUT_VERSION };
    setLayout(defaultLayout);
    if (typeof window !== "undefined") {
      localStorage.removeItem(DEFAULT_LAYOUT_KEY);
      // Also remove from URL
      if (syncWithURL) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('layout');
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [defaultWidgets, syncWithURL, pathname, router, searchParams]);

  const [isEditMode, setIsEditMode] = useState(false);
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  return {
    layout: layout.widgets,
    saveLayout,
    resetLayout,
    isEditMode,
    toggleEditMode,
  };
}
