"use client";

import React, { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { useDateRange } from "@/lib/hooks/useDateRange";
import type { UseDateRangeOptions, UseDateRangeReturn } from "@/lib/hooks/useDateRange";
import type { DateRangePreset } from "@/lib/utils/dateUtils";

interface DateRangeFilterProps {
  /**
   * Options for useDateRange hook (only used if dateRangeState is not provided)
   */
  options?: UseDateRangeOptions;

  /**
   * Optional: Use shared date range state from parent component
   * If provided, this component will use the parent's state instead of creating its own
   */
  dateRangeState?: Pick<UseDateRangeReturn, "dateRange" | "setPreset" | "setCustomRange" | "validation">;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show preset buttons
   * @default true
   */
  showPresets?: boolean;

  /**
   * Show custom date picker
   * @default true
   */
  showCustomPicker?: boolean;

  /**
   * Render inline (preset buttons only, no vertical layout)
   * @default false
   */
  inline?: boolean;
}

const PRESET_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

function DateRangeFilterComponent({
  options,
  dateRangeState,
  className,
  showPresets = true,
  showCustomPicker = true,
  inline = false,
}: DateRangeFilterProps) {
  // Use provided date range state or create own instance
  // If dateRangeState is provided, we use it directly and don't create a hook instance
  // Otherwise, create own instance with provided options
  const ownDateRangeState = useDateRange(
    dateRangeState 
      ? { ...options, syncWithURL: false } // Disable URL sync if using parent's state
      : options
  );
  const { dateRange, setPreset, setCustomRange, validation } = dateRangeState || ownDateRangeState;
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(
    format(dateRange.startDate, 'yyyy-MM-dd')
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    format(dateRange.endDate, 'yyyy-MM-dd')
  );

  // Update temp dates when dateRange changes
  useEffect(() => {
    setTempStartDate(format(dateRange.startDate, 'yyyy-MM-dd'));
    setTempEndDate(format(dateRange.endDate, 'yyyy-MM-dd'));
  }, [dateRange]);

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomInputs(true);
    } else {
      setPreset(preset);
      setShowCustomInputs(false);
    }
  };

  const handleCustomRangeApply = () => {
    try {
      const startDate = new Date(tempStartDate + 'T00:00:00');
      const endDate = new Date(tempEndDate + 'T23:59:59');
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        setCustomRange(startDate, endDate);
        setShowCustomInputs(false);
      }
    } catch (error) {
      console.error('[DateRangeFilter] Error parsing custom dates:', error);
    }
  };

  const formatDateRange = () => {
    if (dateRange.preset && dateRange.preset !== 'custom') {
      return PRESET_OPTIONS.find(p => p.value === dateRange.preset)?.label || 'Select range';
    }
    return `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`;
  };

  // If inline mode, only render preset buttons
  if (inline) {
    return (
      <div className={cn("flex items-center gap-1 flex-wrap", className)}>
        {showPresets && (
          <>
            {PRESET_OPTIONS.filter(p => p.value !== 'custom').map((preset) => (
              <Button
                key={preset.value}
                variant={dateRange.preset === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick(preset.value)}
                className="h-9 text-xs"
              >
                {preset.label}
              </Button>
            ))}
            {showCustomPicker && (
              <Button
                variant={showCustomInputs || dateRange.preset === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCustomInputs(!showCustomInputs)}
                className="h-9 text-xs"
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                Custom
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Preset buttons */}
      {showPresets && (
        <div className="flex items-center gap-1 flex-wrap">
          {PRESET_OPTIONS.filter(p => p.value !== 'custom').map((preset) => (
            <Button
              key={preset.value}
              variant={dateRange.preset === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset.value)}
              className="h-8 text-xs"
            >
              {preset.label}
            </Button>
          ))}
          {showCustomPicker && (
            <Button
              variant={showCustomInputs || dateRange.preset === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCustomInputs(!showCustomInputs)}
              className="h-8 text-xs"
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              Custom
            </Button>
          )}
        </div>
      )}

      {/* Custom date range inputs */}
      {showCustomPicker && showCustomInputs && (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">From:</label>
            <Input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="h-8 w-32 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">To:</label>
            <Input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              min={tempStartDate}
              className="h-8 w-32 text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={handleCustomRangeApply}
            className="h-8 text-xs"
          >
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInputs(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Current range display */}
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <CalendarIcon className="h-3 w-3" />
        {formatDateRange()}
      </div>

      {/* Validation badge */}
      {!validation.valid && validation.error && (
        <Badge variant="destructive" className="text-xs w-fit">
          {validation.error}
        </Badge>
      )}
    </div>
  );
}

export const DateRangeFilter = memo(DateRangeFilterComponent);

