/**
 * Search and Filter Utilities
 * Provides utilities for global search, saved filters, and search history
 */

export interface SearchFilter {
  id: string;
  name: string;
  type: 'customers' | 'loans' | 'transactions' | 'users';
  criteria: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'customers' | 'loans' | 'transactions' | 'users';
  timestamp: Date;
  resultCount?: number;
}

/**
 * Save a search filter to localStorage
 */
export function saveSearchFilter(filter: Omit<SearchFilter, 'id' | 'createdAt' | 'updatedAt'>): SearchFilter {
  const savedFilters = getSavedFilters();
  const newFilter: SearchFilter = {
    ...filter,
    id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  savedFilters.push(newFilter);
  localStorage.setItem('saved_search_filters', JSON.stringify(savedFilters));
  
  return newFilter;
}

/**
 * Get all saved search filters
 */
export function getSavedFilters(): SearchFilter[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('saved_search_filters');
    if (!stored) return [];
    
    const filters = JSON.parse(stored);
    return filters.map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading saved filters:', error);
    return [];
  }
}

/**
 * Delete a saved search filter
 */
export function deleteSearchFilter(filterId: string): void {
  const savedFilters = getSavedFilters();
  const filtered = savedFilters.filter(f => f.id !== filterId);
  localStorage.setItem('saved_search_filters', JSON.stringify(filtered));
}

/**
 * Add a search query to history
 */
export function addToSearchHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp'>): SearchHistoryItem {
  const history = getSearchHistory();
  const newItem: SearchHistoryItem = {
    ...item,
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };
  
  // Remove duplicates and limit to last 50 items
  const filtered = history.filter(h => h.query !== newItem.query || h.type !== newItem.type);
  filtered.unshift(newItem);
  const limited = filtered.slice(0, 50);
  
  localStorage.setItem('search_history', JSON.stringify(limited));
  
  return newItem;
}

/**
 * Get search history
 */
export function getSearchHistory(limit: number = 20): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('search_history');
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return history
      .slice(0, limit)
      .map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      }));
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  localStorage.removeItem('search_history');
}

/**
 * Quick filter presets
 */
export const QUICK_FILTERS = {
  customers: {
    'high_risk': { risk_category: 'high' },
    'low_risk': { risk_category: 'low' },
    'active': { status: 'active' },
    'recent': { created_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  },
  loans: {
    'active': { status: 'active' },
    'overdue': { status: 'overdue' },
    'pending': { status: 'pending' },
    'large_loans': { min_amount: 100000 },
  },
};

/**
 * Build search query string from filter criteria
 */
export function buildSearchQuery(criteria: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.entries(criteria).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (value instanceof Date) {
        params.append(key, value.toISOString());
      } else if (typeof value === 'object') {
        params.append(key, JSON.stringify(value));
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params.toString();
}

/**
 * Parse search query string to filter criteria
 */
export function parseSearchQuery(queryString: string): Record<string, any> {
  const params = new URLSearchParams(queryString);
  const criteria: Record<string, any> = {};
  
  params.forEach((value, key) => {
    // Try to parse as JSON, otherwise use as string
    try {
      criteria[key] = JSON.parse(value);
    } catch {
      // Try to parse as date
      if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        criteria[key] = new Date(value);
      } else if (value === 'true' || value === 'false') {
        criteria[key] = value === 'true';
      } else if (!isNaN(Number(value))) {
        criteria[key] = Number(value);
      } else {
        criteria[key] = value;
      }
    }
  });
  
  return criteria;
}




