"use client";

/**
 * Scenario Toggle Component
 * Allows switching between baseline and stress scenarios for metrics
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

export type Scenario = "baseline" | "stress";

interface ScenarioToggleProps {
  value: Scenario;
  onChange: (scenario: Scenario) => void;
  className?: string;
  showLabels?: boolean;
}

export function ScenarioToggle({
  value,
  onChange,
  className,
  showLabels = true,
}: ScenarioToggleProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 bg-muted rounded-md p-1", className)}>
      <Button
        variant={value === "baseline" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("baseline")}
        className={cn(
          "h-7 px-3 text-xs",
          value === "baseline" && "bg-background shadow-sm"
        )}
      >
        <TrendingUp className="h-3 w-3 mr-1" />
        {showLabels && "Baseline"}
      </Button>
      <Button
        variant={value === "stress" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("stress")}
        className={cn(
          "h-7 px-3 text-xs",
          value === "stress" && "bg-background shadow-sm"
        )}
      >
        <TrendingDown className="h-3 w-3 mr-1" />
        {showLabels && "Stress"}
      </Button>
    </div>
  );
}

