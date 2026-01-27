"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Calendar, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "table" | "grid" | "card" | "timeline";

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  availableViews?: ViewType[];
  className?: string;
}

const viewConfig: Record<
  ViewType,
  { icon: typeof LayoutGrid; label: string }
> = {
  table: { icon: Table2, label: "Table" },
  grid: { icon: LayoutGrid, label: "Grid" },
  card: { icon: List, label: "Card" },
  timeline: { icon: Calendar, label: "Timeline" },
};

export function ViewSwitcher({
  currentView,
  onViewChange,
  availableViews = ["table", "grid", "card", "timeline"],
  className,
}: ViewSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-1 border rounded-md p-1", className)}>
      {availableViews.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        return (
          <Button
            key={view}
            variant={currentView === view ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(view)}
            className={cn(
              "flex items-center gap-2",
              currentView === view && "bg-primary text-primary-foreground"
            )}
            title={config.label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

