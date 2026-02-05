"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Filter, 
  X, 
  CalendarIcon, 
  RotateCcw,
  Check
} from "lucide-react";
import { format } from "date-fns";

export interface RealtimeFilters {
  minScore: number | null;
  maxScore: number | null;
  riskCategory: string | null;
  customerId: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
}

const DEFAULT_FILTERS: RealtimeFilters = {
  minScore: null,
  maxScore: null,
  riskCategory: null,
  customerId: null,
  dateFrom: null,
  dateTo: null,
  autoRefresh: true,
  refreshInterval: 5000,
};

const STORAGE_KEY = "realtime-scoring-filters";

interface RealtimeScoringFiltersProps {
  filters: RealtimeFilters;
  onFiltersChange: (filters: RealtimeFilters) => void;
  onApply?: () => void;
  className?: string;
}

/**
 * Realtime Scoring Filters Component
 * 
 * Provides advanced filtering options for the real-time scoring page
 */
export function RealtimeScoringFilters({
  filters,
  onFiltersChange,
  onApply,
  className,
}: RealtimeScoringFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<RealtimeFilters>(filters);

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "autoRefresh" || key === "refreshInterval") return false;
    return value !== null && value !== "";
  }).length;

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.dateFrom) parsed.dateFrom = new Date(parsed.dateFrom);
        if (parsed.dateTo) parsed.dateTo = new Date(parsed.dateTo);
        setLocalFilters({ ...DEFAULT_FILTERS, ...parsed });
        onFiltersChange({ ...DEFAULT_FILTERS, ...parsed });
      }
    } catch (e) {
      console.warn("Failed to load saved filters:", e);
    }
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onApply?.();
    setIsOpen(false);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localFilters));
    } catch (e) {
      console.warn("Failed to save filters:", e);
    }
  }, [localFilters, onFiltersChange, onApply]);

  const handleReset = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    localStorage.removeItem(STORAGE_KEY);
  }, [onFiltersChange]);

  const handleQuickFilter = useCallback((key: keyof RealtimeFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleRemoveFilter = useCallback((key: keyof RealtimeFilters) => {
    const newFilters = { ...filters, [key]: null };
    onFiltersChange(newFilters);
    setLocalFilters({ ...localFilters, [key]: null });
  }, [filters, localFilters, onFiltersChange]);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Quick Filters */}
      <QuickFilterSelect
        label="Risk"
        value={filters.riskCategory}
        options={[
          { value: "low", label: "Low Risk" },
          { value: "medium", label: "Medium Risk" },
          { value: "high", label: "High Risk" },
          { value: "critical", label: "Critical Risk" },
        ]}
        onChange={(value) => handleQuickFilter("riskCategory", value)}
      />

      {/* Score Range Quick Select */}
      <Select
        value={filters.minScore !== null ? `${filters.minScore}-${filters.maxScore}` : "all"}
        onValueChange={(value) => {
          if (value === "all") {
            handleQuickFilter("minScore", null);
            handleQuickFilter("maxScore", null);
          } else {
            const [min, max] = value.split("-").map(Number);
            onFiltersChange({ ...filters, minScore: min, maxScore: max });
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Score Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Scores</SelectItem>
          <SelectItem value="750-850">750-850 (Excellent)</SelectItem>
          <SelectItem value="650-749">650-749 (Good)</SelectItem>
          <SelectItem value="550-649">550-649 (Fair)</SelectItem>
          <SelectItem value="300-549">300-549 (Poor)</SelectItem>
        </SelectContent>
      </Select>

      {/* Active Filter Badges */}
      {filters.customerId && (
        <FilterBadge
          label={`Customer: ${filters.customerId}`}
          onRemove={() => handleRemoveFilter("customerId")}
        />
      )}
      {filters.dateFrom && (
        <FilterBadge
          label={`From: ${format(filters.dateFrom, "MMM dd")}`}
          onRemove={() => handleRemoveFilter("dateFrom")}
        />
      )}
      {filters.dateTo && (
        <FilterBadge
          label={`To: ${format(filters.dateTo, "MMM dd")}`}
          onRemove={() => handleRemoveFilter("dateTo")}
        />
      )}

      {/* Advanced Filters Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Configure filters for real-time scoring data
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Customer ID Filter */}
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                placeholder="Enter customer ID..."
                value={localFilters.customerId || ""}
                onChange={(e) => 
                  setLocalFilters({ ...localFilters, customerId: e.target.value || null })
                }
              />
            </div>

            {/* Score Range Filter */}
            <div className="space-y-4">
              <Label>Credit Score Range</Label>
              <div className="px-2">
                <Slider
                  value={[
                    localFilters.minScore || 300,
                    localFilters.maxScore || 850,
                  ]}
                  min={300}
                  max={850}
                  step={10}
                  onValueChange={([min, max]) => 
                    setLocalFilters({ ...localFilters, minScore: min, maxScore: max })
                  }
                />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>{localFilters.minScore || 300}</span>
                  <span>{localFilters.maxScore || 850}</span>
                </div>
              </div>
            </div>

            {/* Risk Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="riskCategory">Risk Category</Label>
              <Select
                value={localFilters.riskCategory || "all"}
                onValueChange={(value) => 
                  setLocalFilters({ 
                    ...localFilters, 
                    riskCategory: value === "all" ? null : value 
                  })
                }
              >
                <SelectTrigger id="riskCategory">
                  <SelectValue placeholder="Select risk category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="critical">Critical Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !localFilters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateFrom 
                        ? format(localFilters.dateFrom, "PPP")
                        : "From date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateFrom || undefined}
                      onSelect={(date) => 
                        setLocalFilters({ ...localFilters, dateFrom: date || null })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !localFilters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateTo 
                        ? format(localFilters.dateTo, "PPP")
                        : "To date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateTo || undefined}
                      onSelect={(date) => 
                        setLocalFilters({ ...localFilters, dateTo: date || null })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Auto Refresh Settings */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoRefresh">Auto Refresh</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh the score feed
                  </p>
                </div>
                <Switch
                  id="autoRefresh"
                  checked={localFilters.autoRefresh}
                  onCheckedChange={(checked) => 
                    setLocalFilters({ ...localFilters, autoRefresh: checked })
                  }
                />
              </div>

              {localFilters.autoRefresh && (
                <div className="space-y-2">
                  <Label>Refresh Interval</Label>
                  <Select
                    value={String(localFilters.refreshInterval)}
                    onValueChange={(value) => 
                      setLocalFilters({ 
                        ...localFilters, 
                        refreshInterval: Number(value) 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1 second</SelectItem>
                      <SelectItem value="3000">3 seconds</SelectItem>
                      <SelectItem value="5000">5 seconds</SelectItem>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds</SelectItem>
                      <SelectItem value="60000">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button onClick={handleApply} className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Clear All Button */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      )}
    </div>
  );
}

// Helper Components
interface QuickFilterSelectProps {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}

function QuickFilterSelect({ label, value, options, onChange }: QuickFilterSelectProps) {
  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onChange(v === "all" ? null : v)}
    >
      <SelectTrigger className="w-[130px] h-9">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

/**
 * Hook for using realtime filters
 */
export function useRealtimeFilters(initialFilters?: Partial<RealtimeFilters>) {
  const [filters, setFilters] = useState<RealtimeFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const applyFilters = useCallback(<T extends { credit_score?: number; risk_category?: string; customer_id?: string; created_at?: string }>(
    data: T[]
  ): T[] => {
    return data.filter((item) => {
      // Score range filter
      if (filters.minScore !== null && item.credit_score !== undefined) {
        if (item.credit_score < filters.minScore) return false;
      }
      if (filters.maxScore !== null && item.credit_score !== undefined) {
        if (item.credit_score > filters.maxScore) return false;
      }

      // Risk category filter
      if (filters.riskCategory && item.risk_category) {
        if (item.risk_category.toLowerCase() !== filters.riskCategory.toLowerCase()) {
          return false;
        }
      }

      // Customer ID filter
      if (filters.customerId && item.customer_id) {
        if (!item.customer_id.toLowerCase().includes(filters.customerId.toLowerCase())) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateFrom && item.created_at) {
        const itemDate = new Date(item.created_at);
        if (itemDate < filters.dateFrom) return false;
      }
      if (filters.dateTo && item.created_at) {
        const itemDate = new Date(item.created_at);
        if (itemDate > filters.dateTo) return false;
      }

      return true;
    });
  }, [filters]);

  return {
    filters,
    setFilters,
    applyFilters,
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    hasActiveFilters: Object.entries(filters).some(([key, value]) => {
      if (key === "autoRefresh" || key === "refreshInterval") return false;
      return value !== null && value !== "";
    }),
  };
}

export { DEFAULT_FILTERS };
export type { RealtimeFilters };


