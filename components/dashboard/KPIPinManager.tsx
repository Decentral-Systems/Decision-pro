/**
 * KPI Pin Manager Component
 * Allows users to pin/reorder KPIs and save layout preferences
 */

"use client";

import { useState, useEffect } from "react";
import { GripVertical, Pin, PinOff, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface KPIConfig {
  id: string;
  label: string;
  pinned: boolean;
  order: number;
  visible: boolean;
}

interface KPIPinManagerProps {
  kpis: KPIConfig[];
  onUpdate: (kpis: KPIConfig[]) => void;
  className?: string;
}

export function KPIPinManager({ kpis, onUpdate, className }: KPIPinManagerProps) {
  const [localKPIs, setLocalKPIs] = useState<KPIConfig[]>(kpis);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalKPIs(kpis);
  }, [kpis]);

  const handlePin = (id: string) => {
    const updated = localKPIs.map((kpi) =>
      kpi.id === id ? { ...kpi, pinned: !kpi.pinned } : kpi
    );
    // Reorder: pinned first, then by order
    const sorted = updated.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });
    setLocalKPIs(sorted);
    onUpdate(sorted);
  };

  const handleToggleVisibility = (id: string) => {
    const updated = localKPIs.map((kpi) =>
      kpi.id === id ? { ...kpi, visible: !kpi.visible } : kpi
    );
    setLocalKPIs(updated);
    onUpdate(updated);
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const index = localKPIs.findIndex((k) => k.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localKPIs.length) return;

    const updated = [...localKPIs];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    // Update order values
    updated.forEach((kpi, i) => {
      kpi.order = i;
    });
    setLocalKPIs(updated);
    onUpdate(updated);
  };

  // Save to localStorage
  const handleSave = () => {
    localStorage.setItem("dashboard_kpi_layout", JSON.stringify(localKPIs));
    setIsOpen(false);
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_kpi_layout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalKPIs(parsed);
        onUpdate(parsed);
      } catch (e) {
        console.warn("Failed to load saved KPI layout:", e);
      }
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings2 className="h-4 w-4 mr-2" />
          Arrange KPIs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Arrange KPIs</DialogTitle>
          <DialogDescription>
            Pin, reorder, and show/hide KPIs. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {localKPIs.map((kpi, index) => (
            <div
              key={kpi.id}
              className={cn(
                "flex items-center gap-2 p-3 border rounded-lg",
                !kpi.visible && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{kpi.label}</span>
                  {kpi.pinned && (
                    <Badge variant="outline" className="text-xs">
                      Pinned
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(kpi.id, "up")}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(kpi.id, "down")}
                  disabled={index === localKPIs.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePin(kpi.id)}
                  title={kpi.pinned ? "Unpin" : "Pin"}
                >
                  {kpi.pinned ? (
                    <Pin className="h-4 w-4 text-primary" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleVisibility(kpi.id)}
                  title={kpi.visible ? "Hide" : "Show"}
                >
                  {kpi.visible ? "👁️" : "🚫"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Layout</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



