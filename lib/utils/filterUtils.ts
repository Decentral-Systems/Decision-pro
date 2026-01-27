/**
 * Filter Utilities for Customer Intelligence
 * 
 * Provides utilities for advanced filtering including:
 * - Date range filtering
 * - Multi-select filters
 * - Saved filter presets
 * - Filter combinations (AND/OR logic)
 * - URL parameter serialization/deserialization
 */

/**
 * Date range filter
 */
export interface DateRangeFilter {
  start?: Date;
  end?: Date;
}

/**
 * Multi-select filter
 */
export interface MultiSelectFilter<T = string> {
  selected: T[];
  mode?: "AND" | "OR"; // Default: OR
}

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Complete filter state for Customer Intelligence
 */
export interface FilterState {
  // Recommendations filters
  recommendations?: {
    status?: MultiSelectFilter<"active" | "applied" | "dismissed">;
    dateRange?: DateRangeFilter;
    scoreRange?: { min?: number; max?: number };
    productTypes?: MultiSelectFilter<string>;
  };
  
  // Insights filters
  insights?: {
    categories?: MultiSelectFilter<string>;
    dateRange?: DateRangeFilter;
    confidenceRange?: { min?: number; max?: number };
  };
  
  // Life events filters
  lifeEvents?: {
    eventTypes?: MultiSelectFilter<string>;
    dateRange?: DateRangeFilter;
    impacts?: MultiSelectFilter<string>;
    confidenceRange?: { min?: number; max?: number };
  };
  
  // History filters
  history?: {
    actions?: MultiSelectFilter<"applied" | "dismissed">;
    dateRange?: DateRangeFilter;
  };
}

/**
 * Serialize filter state to URL parameters
 */
export function serializeFiltersToURL(filters: Partial<FilterState>): URLSearchParams {
  const params = new URLSearchParams();

  // Recommendations filters
  if (filters.recommendations) {
    const rec = filters.recommendations;
    
    if (rec.status?.selected.length) {
      params.set("rec_status", rec.status.selected.join(","));
      if (rec.status.mode === "AND") {
        params.set("rec_status_mode", "AND");
      }
    }
    
    if (rec.dateRange?.start) {
      params.set("rec_date_from", rec.dateRange.start.toISOString().split("T")[0]);
    }
    if (rec.dateRange?.end) {
      params.set("rec_date_to", rec.dateRange.end.toISOString().split("T")[0]);
    }
    
    if (rec.scoreRange?.min !== undefined) {
      params.set("rec_score_min", rec.scoreRange.min.toString());
    }
    if (rec.scoreRange?.max !== undefined) {
      params.set("rec_score_max", rec.scoreRange.max.toString());
    }
    
    if (rec.productTypes?.selected.length) {
      params.set("rec_product_types", rec.productTypes.selected.join(","));
      if (rec.productTypes.mode === "AND") {
        params.set("rec_product_types_mode", "AND");
      }
    }
  }

  // Insights filters
  if (filters.insights) {
    const ins = filters.insights;
    
    if (ins.categories?.selected.length) {
      params.set("ins_categories", ins.categories.selected.join(","));
      if (ins.categories.mode === "AND") {
        params.set("ins_categories_mode", "AND");
      }
    }
    
    if (ins.dateRange?.start) {
      params.set("ins_date_from", ins.dateRange.start.toISOString().split("T")[0]);
    }
    if (ins.dateRange?.end) {
      params.set("ins_date_to", ins.dateRange.end.toISOString().split("T")[0]);
    }
    
    if (ins.confidenceRange?.min !== undefined) {
      params.set("ins_confidence_min", ins.confidenceRange.min.toString());
    }
    if (ins.confidenceRange?.max !== undefined) {
      params.set("ins_confidence_max", ins.confidenceRange.max.toString());
    }
  }

  // Life events filters
  if (filters.lifeEvents) {
    const events = filters.lifeEvents;
    
    if (events.eventTypes?.selected.length) {
      params.set("events_types", events.eventTypes.selected.join(","));
      if (events.eventTypes.mode === "AND") {
        params.set("events_types_mode", "AND");
      }
    }
    
    if (events.dateRange?.start) {
      params.set("events_date_from", events.dateRange.start.toISOString().split("T")[0]);
    }
    if (events.dateRange?.end) {
      params.set("events_date_to", events.dateRange.end.toISOString().split("T")[0]);
    }
    
    if (events.impacts?.selected.length) {
      params.set("events_impacts", events.impacts.selected.join(","));
      if (events.impacts.mode === "AND") {
        params.set("events_impacts_mode", "AND");
      }
    }
    
    if (events.confidenceRange?.min !== undefined) {
      params.set("events_confidence_min", events.confidenceRange.min.toString());
    }
    if (events.confidenceRange?.max !== undefined) {
      params.set("events_confidence_max", events.confidenceRange.max.toString());
    }
  }

  // History filters
  if (filters.history) {
    const hist = filters.history;
    
    if (hist.actions?.selected.length) {
      params.set("hist_actions", hist.actions.selected.join(","));
      if (hist.actions.mode === "AND") {
        params.set("hist_actions_mode", "AND");
      }
    }
    
    if (hist.dateRange?.start) {
      params.set("hist_date_from", hist.dateRange.start.toISOString().split("T")[0]);
    }
    if (hist.dateRange?.end) {
      params.set("hist_date_to", hist.dateRange.end.toISOString().split("T")[0]);
    }
  }

  return params;
}

/**
 * Deserialize URL parameters to filter state
 */
export function deserializeFiltersFromURL(params: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  // Recommendations filters
  const recStatus = params.get("rec_status");
  if (recStatus) {
    filters.recommendations = {
      ...filters.recommendations,
      status: {
        selected: recStatus.split(",") as Array<"active" | "applied" | "dismissed">,
        mode: params.get("rec_status_mode") === "AND" ? "AND" : "OR",
      },
    };
  }

  const recDateFrom = params.get("rec_date_from");
  const recDateTo = params.get("rec_date_to");
  if (recDateFrom || recDateTo) {
    filters.recommendations = {
      ...filters.recommendations,
      dateRange: {
        start: recDateFrom ? new Date(recDateFrom) : undefined,
        end: recDateTo ? new Date(recDateTo) : undefined,
      },
    };
  }

  const recScoreMin = params.get("rec_score_min");
  const recScoreMax = params.get("rec_score_max");
  if (recScoreMin || recScoreMax) {
    filters.recommendations = {
      ...filters.recommendations,
      scoreRange: {
        min: recScoreMin ? parseFloat(recScoreMin) : undefined,
        max: recScoreMax ? parseFloat(recScoreMax) : undefined,
      },
    };
  }

  const recProductTypes = params.get("rec_product_types");
  if (recProductTypes) {
    filters.recommendations = {
      ...filters.recommendations,
      productTypes: {
        selected: recProductTypes.split(","),
        mode: params.get("rec_product_types_mode") === "AND" ? "AND" : "OR",
      },
    };
  }

  // Insights filters
  const insCategories = params.get("ins_categories");
  if (insCategories) {
    filters.insights = {
      ...filters.insights,
      categories: {
        selected: insCategories.split(","),
        mode: params.get("ins_categories_mode") === "AND" ? "AND" : "OR",
      },
    };
  }

  const insDateFrom = params.get("ins_date_from");
  const insDateTo = params.get("ins_date_to");
  if (insDateFrom || insDateTo) {
    filters.insights = {
      ...filters.insights,
      dateRange: {
        start: insDateFrom ? new Date(insDateFrom) : undefined,
        end: insDateTo ? new Date(insDateTo) : undefined,
      },
    };
  }

  const insConfidenceMin = params.get("ins_confidence_min");
  const insConfidenceMax = params.get("ins_confidence_max");
  if (insConfidenceMin || insConfidenceMax) {
    filters.insights = {
      ...filters.insights,
      confidenceRange: {
        min: insConfidenceMin ? parseFloat(insConfidenceMin) : undefined,
        max: insConfidenceMax ? parseFloat(insConfidenceMax) : undefined,
      },
    };
  }

  // Life events filters
  const eventsTypes = params.get("events_types");
  if (eventsTypes) {
    filters.lifeEvents = {
      ...filters.lifeEvents,
      eventTypes: {
        selected: eventsTypes.split(","),
        mode: params.get("events_types_mode") === "AND" ? "AND" : "OR",
      },
    };
  }

  const eventsDateFrom = params.get("events_date_from");
  const eventsDateTo = params.get("events_date_to");
  if (eventsDateFrom || eventsDateTo) {
    filters.lifeEvents = {
      ...filters.lifeEvents,
      dateRange: {
        start: eventsDateFrom ? new Date(eventsDateFrom) : undefined,
        end: eventsDateTo ? new Date(eventsDateTo) : undefined,
      },
    };
  }

  const eventsImpacts = params.get("events_impacts");
  if (eventsImpacts) {
    filters.lifeEvents = {
      ...filters.lifeEvents,
      impacts: {
        selected: eventsImpacts.split(","),
        mode: params.get("events_impacts_mode") === "AND" ? "AND" : "OR",
      },
    };
  }

  const eventsConfidenceMin = params.get("events_confidence_min");
  const eventsConfidenceMax = params.get("events_confidence_max");
  if (eventsConfidenceMin || eventsConfidenceMax) {
    filters.lifeEvents = {
      ...filters.lifeEvents,
      confidenceRange: {
        min: eventsConfidenceMin ? parseFloat(eventsConfidenceMin) : undefined,
        max: eventsConfidenceMax ? parseFloat(eventsConfidenceMax) : undefined,
      },
    };
  }

  // History filters
  const histActions = params.get("hist_actions");
  if (histActions) {
    filters.history = {
      ...filters.history,
      actions: {
        selected: histActions.split(",") as Array<"applied" | "dismissed">,
        mode: params.get("hist_actions_mode") === "AND" ? "AND" : "OR",
      },
    };
  }

  const histDateFrom = params.get("hist_date_from");
  const histDateTo = params.get("hist_date_to");
  if (histDateFrom || histDateTo) {
    filters.history = {
      ...filters.history,
      dateRange: {
        start: histDateFrom ? new Date(histDateFrom) : undefined,
        end: histDateTo ? new Date(histDateTo) : undefined,
      },
    };
  }

  return filters;
}

/**
 * Save filter preset to localStorage
 */
export function saveFilterPreset(preset: Omit<FilterPreset, "id" | "createdAt" | "updatedAt">): string {
  const id = `preset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fullPreset: FilterPreset = {
    ...preset,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const presets = loadFilterPresets();
  presets.push(fullPreset);
  localStorage.setItem("customer_intelligence_filter_presets", JSON.stringify(presets));

  return id;
}

/**
 * Load all filter presets from localStorage
 */
export function loadFilterPresets(): FilterPreset[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem("customer_intelligence_filter_presets");
    if (!stored) return [];
    
    const presets = JSON.parse(stored) as FilterPreset[];
    // Convert date strings back to Date objects
    return presets.map((preset) => ({
      ...preset,
      createdAt: new Date(preset.createdAt),
      updatedAt: new Date(preset.updatedAt),
    }));
  } catch (error) {
    console.error("Error loading filter presets:", error);
    return [];
  }
}

/**
 * Delete a filter preset
 */
export function deleteFilterPreset(id: string): void {
  const presets = loadFilterPresets();
  const filtered = presets.filter((p) => p.id !== id);
  localStorage.setItem("customer_intelligence_filter_presets", JSON.stringify(filtered));
}

/**
 * Update a filter preset
 */
export function updateFilterPreset(id: string, updates: Partial<Omit<FilterPreset, "id" | "createdAt">>): void {
  const presets = loadFilterPresets();
  const index = presets.findIndex((p) => p.id === id);
  if (index === -1) return;

  presets[index] = {
    ...presets[index],
    ...updates,
    updatedAt: new Date(),
  };
  localStorage.setItem("customer_intelligence_filter_presets", JSON.stringify(presets));
}

/**
 * Apply multi-select filter logic (AND/OR)
 */
export function applyMultiSelectFilter<T>(
  items: T[],
  filter: MultiSelectFilter<string>,
  getValue: (item: T) => string
): T[] {
  if (filter.selected.length === 0) return items;

  const mode = filter.mode || "OR";

  if (mode === "OR") {
    // Item matches if it matches ANY selected value
    return items.filter((item) => filter.selected.includes(getValue(item)));
  } else {
    // Item matches if it matches ALL selected values (useful for tags/categories)
    return items.filter((item) => {
      const value = getValue(item);
      return filter.selected.every((selected) => value.includes(selected));
    });
  }
}

/**
 * Apply date range filter
 */
export function applyDateRangeFilter<T>(
  items: T[],
  dateRange: DateRangeFilter,
  getDate: (item: T) => Date | string | undefined
): T[] {
  if (!dateRange.start && !dateRange.end) return items;

  return items.filter((item) => {
    const itemDate = getDate(item);
    if (!itemDate) return false;

    const date = typeof itemDate === "string" ? new Date(itemDate) : itemDate;
    if (isNaN(date.getTime())) return false;

    if (dateRange.start && date < dateRange.start) return false;
    if (dateRange.end) {
      // Include the end date (set to end of day)
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (date > endDate) return false;
    }

    return true;
  });
}

/**
 * Apply numeric range filter
 */
export function applyNumericRangeFilter<T>(
  items: T[],
  range: { min?: number; max?: number },
  getValue: (item: T) => number | undefined
): T[] {
  if (range.min === undefined && range.max === undefined) return items;

  return items.filter((item) => {
    const value = getValue(item);
    if (value === undefined) return false;

    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;

    return true;
  });
}

