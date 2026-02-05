"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from "@/lib/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/dashboard/KeyboardShortcutsDialog";
import { usePathname } from "next/navigation";

interface KeyboardShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  addShortcut: (shortcut: KeyboardShortcut) => void;
  removeShortcut: (key: string) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const KeyboardShortcutsContext =
  createContext<KeyboardShortcutsContextType | null>(null);

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider"
    );
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  pageShortcuts?: KeyboardShortcut[];
}

/**
 * Provider component for keyboard shortcuts across the application
 */
export function KeyboardShortcutsProvider({
  children,
  pageShortcuts = [],
}: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: "k",
      ctrl: true,
      action: () => {
        // Open command palette
        const event = new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      },
      description: "Open command palette",
      global: true,
    },
    {
      key: "/",
      action: () => {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
        ) as HTMLInputElement;
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
        window.location.reload();
      },
      description: "Refresh page",
      global: true,
    },
    {
      key: "g",
      ctrl: true,
      action: () => {
        window.location.href = "/dashboard";
      },
      description: "Go to dashboard",
      global: true,
    },
    {
      key: "?",
      shift: true,
      action: () => {
        // Show shortcuts dialog - handled by component
      },
      description: "Show keyboard shortcuts",
      global: true,
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const safePageShortcuts = Array.isArray(pageShortcuts) ? pageShortcuts : [];
    const nextShortcuts = [...defaultShortcuts, ...safePageShortcuts];
    const id = setTimeout(() => {
      setShortcuts(nextShortcuts);
    }, 0);
    return () => clearTimeout(id);
  }, [mounted, pathname, pageShortcuts]);

  const addShortcut = (shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => [...prev, shortcut]);
  };

  const removeShortcut = (key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  };

  const effectiveShortcuts = mounted ? shortcuts : [];

  useKeyboardShortcuts(effectiveShortcuts, enabled);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts: effectiveShortcuts,
        addShortcut,
        removeShortcut,
        enabled,
        setEnabled,
      }}
    >
      {children}
      {mounted && <KeyboardShortcutsDialog shortcuts={effectiveShortcuts} />}
    </KeyboardShortcutsContext.Provider>
  );
}
