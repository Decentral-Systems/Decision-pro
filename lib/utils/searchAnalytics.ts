/**
 * Search Analytics Utility
 * Tracks search performance and user behavior
 */

export interface SearchEvent {
  query: string;
  resultCount: number;
  selectedResult?: string;
  timestamp: number;
  duration?: number;
  source: "autocomplete" | "search-page" | "global-search";
}

export interface SearchAnalytics {
  totalSearches: number;
  averageResultCount: number;
  averageDuration: number;
  topQueries: Array<{ query: string; count: number }>;
  noResultQueries: string[];
  successfulSearches: number;
}

class SearchAnalyticsService {
  private events: SearchEvent[] = [];
  private readonly maxEvents = 100; // Keep last 100 events
  private readonly storageKey = "search_analytics";

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  /**
   * Track a search event
   */
  trackSearch(event: Omit<SearchEvent, "timestamp">): void {
    const fullEvent: SearchEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    this.saveToStorage();
  }

  /**
   * Track search result selection
   */
  trackSelection(query: string, selectedId: string, source: SearchEvent["source"]): void {
    const event = this.events.find(
      (e) => e.query === query && e.source === source && !e.selectedResult
    );

    if (event) {
      event.selectedResult = selectedId;
      this.saveToStorage();
    }
  }

  /**
   * Get analytics summary
   */
  getAnalytics(): SearchAnalytics {
    if (this.events.length === 0) {
      return {
        totalSearches: 0,
        averageResultCount: 0,
        averageDuration: 0,
        topQueries: [],
        noResultQueries: [],
        successfulSearches: 0,
      };
    }

    const successfulSearches = this.events.filter((e) => e.resultCount > 0).length;
    const noResultQueries = this.events
      .filter((e) => e.resultCount === 0)
      .map((e) => e.query);

    // Calculate averages
    const totalResults = this.events.reduce((sum, e) => sum + e.resultCount, 0);
    const totalDuration = this.events
      .filter((e) => e.duration !== undefined)
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    const durationCount = this.events.filter((e) => e.duration !== undefined).length;

    // Top queries
    const queryCounts = new Map<string, number>();
    this.events.forEach((e) => {
      queryCounts.set(e.query, (queryCounts.get(e.query) || 0) + 1);
    });

    const topQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches: this.events.length,
      averageResultCount: totalResults / this.events.length,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      topQueries,
      noResultQueries: Array.from(new Set(noResultQueries)),
      successfulSearches,
    };
  }

  /**
   * Clear analytics
   */
  clearAnalytics(): void {
    this.events = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
        // Filter out old events (older than 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.events = this.events.filter((e) => e.timestamp > sevenDaysAgo);
      }
    } catch (error) {
      console.warn("Failed to load search analytics:", error);
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.warn("Failed to save search analytics:", error);
    }
  }
}

// Singleton instance
export const searchAnalytics = new SearchAnalyticsService();
