/**
 * Timeline Utilities
 * Functions for formatting and processing life events data for timeline visualization
 */

import type { LifeEvent } from "@/types/recommendations";
import { format, parseISO, isValid, isDate } from "date-fns";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  eventType: string;
  confidence?: number;
  impact?: string;
  metadata?: {
    originalEvent: LifeEvent;
    [key: string]: unknown;
  };
}

export interface TimelineData {
  events: TimelineEvent[];
  dateRange: {
    start: Date;
    end: Date;
  };
  eventTypes: string[];
  impacts: string[];
}

/**
 * Format a date string or Date object to a Date object
 */
export function parseEventDate(date: string | Date | undefined | null): Date | null {
  if (!date) return null;
  
  if (isDate(date)) {
    return isValid(date) ? date : null;
  }
  
  if (typeof date === "string") {
    try {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Convert LifeEvent to TimelineEvent format
 */
export function formatEventForTimeline(event: LifeEvent, index: number): TimelineEvent | null {
  // Parse the event date
  const eventDate = parseEventDate(event.date || event.timestamp);
  
  // If no valid date, skip this event (or use current date as fallback)
  if (!eventDate) {
    console.warn(`Event at index ${index} has no valid date, skipping timeline display`);
    return null;
  }
  
  // Generate unique ID
  const id = event.id || `event-${index}-${eventDate.getTime()}`;
  
  // Get event type
  const eventType = (event.event_type || event.event || "Unknown").toLowerCase();
  
  return {
    id,
    title: event.event_type || event.event || "Life Event",
    description: event.description || undefined,
    date: eventDate,
    eventType,
    confidence: event.confidence,
    impact: event.impact?.toLowerCase(),
    metadata: {
      originalEvent: event,
    },
  };
}

/**
 * Format multiple life events for timeline
 */
export function formatEventsForTimeline(events: LifeEvent[]): TimelineData {
  const timelineEvents: TimelineEvent[] = [];
  const eventTypesSet = new Set<string>();
  const impactsSet = new Set<string>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  
  events.forEach((event, index) => {
    const timelineEvent = formatEventForTimeline(event, index);
    
    if (timelineEvent) {
      timelineEvents.push(timelineEvent);
      
      // Track event types
      eventTypesSet.add(timelineEvent.eventType);
      
      // Track impacts
      if (timelineEvent.impact) {
        impactsSet.add(timelineEvent.impact);
      }
      
      // Track date range
      if (!minDate || timelineEvent.date < minDate) {
        minDate = timelineEvent.date;
      }
      if (!maxDate || timelineEvent.date > maxDate) {
        maxDate = timelineEvent.date;
      }
    }
  });
  
  // Sort events by date (ascending)
  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate date range with padding (add 1 day before and after)
  const dateRange = {
    start: minDate ? new Date(minDate.getTime() - 24 * 60 * 60 * 1000) : new Date(),
    end: maxDate ? new Date(maxDate.getTime() + 24 * 60 * 60 * 1000) : new Date(),
  };
  
  return {
    events: timelineEvents,
    dateRange,
    eventTypes: Array.from(eventTypesSet).sort(),
    impacts: Array.from(impactsSet).sort(),
  };
}

/**
 * Filter timeline events by criteria
 */
export function filterTimelineEvents(
  events: TimelineEvent[],
  filters: {
    eventTypes?: string[];
    impacts?: string[];
    dateRange?: { start: Date; end: Date };
    confidenceThreshold?: number;
  }
): TimelineEvent[] {
  return events.filter((event) => {
    // Filter by event type
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      if (!filters.eventTypes.includes(event.eventType)) {
        return false;
      }
    }
    
    // Filter by impact
    if (filters.impacts && filters.impacts.length > 0) {
      if (!event.impact || !filters.impacts.includes(event.impact)) {
        return false;
      }
    }
    
    // Filter by date range
    if (filters.dateRange) {
      if (event.date < filters.dateRange.start || event.date > filters.dateRange.end) {
        return false;
      }
    }
    
    // Filter by confidence threshold
    if (filters.confidenceThreshold !== undefined && event.confidence !== undefined) {
      if (event.confidence < filters.confidenceThreshold) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get color for event type
 */
export function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    marriage: "bg-blue-500",
    divorce: "bg-red-500",
    birth: "bg-green-500",
    death: "bg-gray-500",
    job_change: "bg-purple-500",
    relocation: "bg-orange-500",
    education: "bg-yellow-500",
    health: "bg-pink-500",
    financial: "bg-indigo-500",
    default: "bg-primary",
  };
  
  return colors[eventType] || colors.default;
}

/**
 * Get color for impact level
 */
export function getImpactColor(impact?: string): string {
  if (!impact) return "bg-gray-400";
  
  const colors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
    positive: "bg-blue-500",
    negative: "bg-red-500",
    neutral: "bg-gray-500",
  };
  
  return colors[impact] || colors.neutral;
}

/**
 * Format date for timeline display
 */
export function formatTimelineDate(date: Date): string {
  return format(date, "MMM dd, yyyy");
}

/**
 * Format date with time for timeline display
 */
export function formatTimelineDateTime(date: Date): string {
  return format(date, "MMM dd, yyyy HH:mm");
}

/**
 * Get time scale for timeline (day, week, month, year, all)
 */
export function getTimeScale(startDate: Date, endDate: Date): "day" | "week" | "month" | "year" | "all" {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays <= 7) return "day";
  if (diffDays <= 60) return "week";
  if (diffDays <= 365) return "month";
  if (diffDays <= 365 * 5) return "year";
  return "all";
}

/**
 * Group events by date for better visualization
 */
export function groupEventsByDate(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const grouped = new Map<string, TimelineEvent[]>();
  
  events.forEach((event) => {
    const dateKey = format(event.date, "yyyy-MM-dd");
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    
    grouped.get(dateKey)!.push(event);
  });
  
  return grouped;
}

