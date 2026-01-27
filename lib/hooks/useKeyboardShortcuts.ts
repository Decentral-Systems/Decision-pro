"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  global?: boolean; // If true, works on all pages
}

/**
 * Hook for managing keyboard shortcuts across the application
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      shortcuts.forEach((shortcut) => {
        // Skip if shortcut is not global and we're not on the right page
        if (!shortcut.global) {
          // Could add page-specific logic here
        }

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Default keyboard shortcuts for the application
 */
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: "k",
    ctrl: true,
    action: () => {
      // Open command palette (if implemented)
      console.log("Command palette");
    },
    description: "Open command palette",
    global: true,
  },
  {
    key: "/",
    action: () => {
      // Focus search (if on page with search)
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: "Focus search",
    global: true,
  },
  {
    key: "r",
    ctrl: true,
    action: () => {
      // Refresh current page data
      window.location.reload();
    },
    description: "Refresh page",
    global: true,
  },
  {
    key: "g",
    ctrl: true,
    action: () => {
      // Go to dashboard
      window.location.href = "/dashboard";
    },
    description: "Go to dashboard",
    global: true,
  },
  {
    key: "e",
    ctrl: true,
    action: () => {
      // Export data (if on page with export)
      const exportButton = document.querySelector('button:has-text("Export"), [aria-label*="Export"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.click();
      }
    },
    description: "Export data",
    global: false,
  },
];

/**
 * Hook for page-specific keyboard shortcuts
 */
export function usePageShortcuts(
  pageShortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const allShortcuts = [...defaultShortcuts, ...pageShortcuts];
  useKeyboardShortcuts(allShortcuts, enabled);
}
