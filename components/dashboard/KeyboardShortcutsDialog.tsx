"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { KeyboardShortcut } from "@/lib/hooks/useKeyboardShortcuts";
import { Badge } from "@/components/ui/badge";

interface KeyboardShortcutsDialogProps {
  shortcuts?: KeyboardShortcut[];
  trigger?: React.ReactNode;
}

const isMac = () =>
  typeof navigator !== "undefined" && navigator.platform.includes("Mac");

/**
 * Dialog component to display available keyboard shortcuts
 */
export function KeyboardShortcutsDialog({
  shortcuts,
  trigger,
}: KeyboardShortcutsDialogProps) {
  const [open, setOpen] = useState(false);
  const [modifierKey, setModifierKey] = useState<"⌘" | "Ctrl">("Ctrl");

  useEffect(() => {
    setModifierKey(isMac() ? "⌘" : "Ctrl");
  }, []);

  const displayShortcuts = shortcuts || [];

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];

    if (shortcut.ctrl || shortcut.meta) {
      parts.push(modifierKey);
    }
    if (shortcut.shift) {
      parts.push("Shift");
    }
    if (shortcut.alt) {
      parts.push("Alt");
    }
    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
  };

  const groupedShortcuts = displayShortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.global ? "Global" : "Page Specific";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Keyboard className="mr-2 h-4 w-4" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Available keyboard shortcuts for faster navigation
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {shortcut.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatKey(shortcut)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>
              Tip: Press{" "}
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>{" "}
              + <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">K</kbd>{" "}
              to open command palette
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
