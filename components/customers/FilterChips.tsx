"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterChipsProps {
  filters: {
    region?: string;
    status?: string;
    riskLevel?: string;
    minScore?: string;
    maxScore?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onRemoveFilter: (filterKey: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "string" && (value === "all" || value === "")) return false;
    return true;
  });

  if (activeFilters.length === 0) {
    return null;
  }

  const getFilterLabel = (key: string, value: string): string => {
    const labels: Record<string, (val: string) => string> = {
      region: (v) => `Region: ${v}`,
      status: (v) => `Status: ${v.charAt(0).toUpperCase() + v.slice(1)}`,
      riskLevel: (v) => `Risk: ${v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ")}`,
      minScore: (v) => `Min Score: ${v}`,
      maxScore: (v) => `Max Score: ${v}`,
      dateFrom: (v) => `From: ${new Date(v).toLocaleDateString()}`,
      dateTo: (v) => `To: ${new Date(v).toLocaleDateString()}`,
    };
    return labels[key]?.(value) || `${key}: ${value}`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="flex items-center gap-1 px-2 py-1">
          <span>{getFilterLabel(key, value as string)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

