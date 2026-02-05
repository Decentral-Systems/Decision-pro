"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, X, Star, Trash2, Search } from "lucide-react";
// Toast notifications - using console for now, can be replaced with toast library
const showToast = (title: string, description?: string) => {
  console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
};

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  saved: boolean;
}

const SEARCH_HISTORY_KEY = "customer_search_history";
const SAVED_SEARCHES_KEY = "customer_saved_searches";
const MAX_HISTORY_ITEMS = 20;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const storedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      const storedSaved = localStorage.getItem(SAVED_SEARCHES_KEY);
      
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      if (storedSaved) {
        setSavedSearches(JSON.parse(storedSaved));
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query || query.trim().length < 2) return;

    setHistory((prev) => {
      const newHistory = [
        { query: query.trim(), timestamp: Date.now(), saved: false },
        ...prev.filter((item) => item.query !== query.trim()),
      ].slice(0, MAX_HISTORY_ITEMS);

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const saveSearch = (query: string) => {
    setSavedSearches((prev) => {
      const newSaved = [
        { query: query.trim(), timestamp: Date.now(), saved: true },
        ...prev.filter((item) => item.query !== query.trim()),
      ];

      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSaved));
      return newSaved;
    });

    // Also mark in history
    setHistory((prev) =>
      prev.map((item) =>
        item.query === query.trim() ? { ...item, saved: true } : item
      )
    );
  };

  const removeFromHistory = (query: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.query !== query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const removeSavedSearch = (query: string) => {
    setSavedSearches((prev) => {
      const newSaved = prev.filter((item) => item.query !== query);
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSaved));
      return newSaved;
    });

    // Also unmark in history
    setHistory((prev) =>
      prev.map((item) =>
        item.query === query ? { ...item, saved: false } : item
      )
    );
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    history,
    savedSearches,
    addToHistory,
    saveSearch,
    removeFromHistory,
    removeSavedSearch,
    clearHistory,
  };
}

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void;
  currentQuery?: string;
}

export function SearchHistory({ onSelectQuery, currentQuery }: SearchHistoryProps) {
  const {
    history,
    savedSearches,
    addToHistory,
    saveSearch,
    removeFromHistory,
    removeSavedSearch,
    clearHistory,
  } = useSearchHistory();

  const handleSaveSearch = (query: string) => {
    saveSearch(query);
    showToast("Search Saved", `"${query}" has been saved to your saved searches`);
  };

  const handleRemoveSaved = (query: string) => {
    removeSavedSearch(query);
    showToast("Search Removed", `"${query}" has been removed from saved searches`);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Search History</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Saved Searches</span>
            </div>
            {savedSearches.slice(0, 5).map((item) => (
              <DropdownMenuItem
                key={item.query}
                className="flex items-center justify-between cursor-pointer"
                onSelect={() => onSelectQuery(item.query)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                  <span className="truncate">{item.query}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSaved(item.query);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Recent Searches */}
        {history.length > 0 ? (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Recent Searches</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearHistory}
              >
                Clear
              </Button>
            </div>
            {history.slice(0, 10).map((item) => (
              <DropdownMenuItem
                key={`${item.query}-${item.timestamp}`}
                className="flex items-center justify-between cursor-pointer"
                onSelect={() => onSelectQuery(item.query)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{item.query}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!item.saved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveSearch(item.query);
                      }}
                      title="Save search"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.query);
                    }}
                    title="Remove from history"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No search history yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

