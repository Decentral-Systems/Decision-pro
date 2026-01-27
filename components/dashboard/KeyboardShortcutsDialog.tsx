"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, Command } from "lucide-react";
import { KeyboardShortcut } from "@/lib/hooks/useKeyboardShortcuts";
import { Badge } from "@/components/ui/badge";

interface KeyboardShortcutsDialogProps {
  shortcuts?: KeyboardShortcut[];
  trigger?: React.ReactNode;
}

/**
 * Dialog component to display available keyboard shortcuts
 */
export function KeyboardShortcutsDialog({
  shortcuts,
  trigger,
}: KeyboardShortcutsDialogProps) {
  const [open, setOpen] = React.useState(false);
  
  // Use provided shortcuts or default to empty array
  const displayShortcuts = shortcuts || [];

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    
    if (shortcut.ctrl || shortcut.meta) {
      parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
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

  const groupedShortcuts = displayShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.global ? "Global" : "Page Specific";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Available keyboard shortcuts for faster navigation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{shortcut.description}</p>
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
          ))}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>
              Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> +{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">K</kbd> to open command
              palette
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
