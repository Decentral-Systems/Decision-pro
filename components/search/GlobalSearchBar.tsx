"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Clock, Filter } from "lucide-react";
import { getSearchHistory, addToSearchHistory } from "@/lib/utils/searchFilters";
import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GlobalSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, type?: string) => void;
  searchTypes?: Array<{ value: string; label: string; path: string }>;
  className?: string;
}

const DEFAULT_SEARCH_TYPES = [
  { value: "customers", label: "Customers", path: "/customers" },
  { value: "loans", label: "Loans", path: "/loans" },
  { value: "users", label: "Users", path: "/admin/users" },
];

export function GlobalSearchBar({
  placeholder = "Search...",
  onSearch,
  searchTypes = DEFAULT_SEARCH_TYPES,
  className,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(getSearchHistory(10));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSearch = (searchQuery: string, type?: string) => {
    if (!searchQuery.trim()) return;

    // Add to history
    addToSearchHistory({
      query: searchQuery,
      type: (type as any) || "customers",
    });

    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(searchQuery, type);
    } else {
      // Default: navigate to search results
      const selectedType = searchTypes.find((t) => t.value === type) || searchTypes[0];
      navigateTo(`${selectedType.path}?search=${encodeURIComponent(searchQuery)}`);
    }

    setIsOpen(false);
    setQuery("");
  };

  const handleHistoryClick = (item: any) => {
    setQuery(item.query);
    handleSearch(item.query, item.type);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              handleSearch(query);
            }
          }}
          className="pl-9 pr-20"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded border">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted rounded border">K</kbd>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search across customers, loans, and users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  handleSearch(query);
                }
              }}
              autoFocus
            />

            {query.trim() && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Search Results</h4>
                <div className="space-y-1">
                  {searchTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleSearch(query, type.value)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search {type.label} for &quot;{query}&quot;
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {history.length > 0 && !query.trim() && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Searches</h4>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {history.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left">{item.query}</span>
                      <span className="text-xs text-muted-foreground">{item.type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Filters</h4>
              <div className="space-y-1">
                {searchTypes.map((type) => (
                  <Button
                    key={`filter-${type.value}`}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      navigateTo(type.path);
                      setIsOpen(false);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    View {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

