"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, X } from "lucide-react";
import { useSearchCustomers } from "@/features/customers/hooks/use-search-customers";
import { CustomerListItem } from "@/types/api";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { CreateCustomerSuggestion } from "./CreateCustomerSuggestion";
import { searchAnalytics } from "@/lib/utils/searchAnalytics";

interface CustomerAutocompleteProps {
  value?: string;
  onSelect: (customerId: string, customer?: CustomerListItem) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function CustomerAutocomplete({
  value,
  onSelect,
  placeholder = "Search by name, phone, email, or ID...",
  className,
  disabled = false,
  required = false,
  error,
}: CustomerAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [page, setPage] = useState(1);
  const [showLoadingAfterDelay, setShowLoadingAfterDelay] = useState(false);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search term using shared hook (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Track if search is in debounce period for loading indicator
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsDebouncing(true);
    } else {
      setIsDebouncing(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Show loading indicator after 500ms delay
  useEffect(() => {
    if (isOpen && debouncedSearchTerm.length >= 2) {
      setShowLoadingAfterDelay(false);
      setSearchCancelled(false);

      loadingTimeoutRef.current = setTimeout(() => {
        setShowLoadingAfterDelay(true);
      }, 500);

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    } else {
      setShowLoadingAfterDelay(false);
    }
  }, [isOpen, debouncedSearchTerm]);

  // Fetch customer data via route → service → hook (customers feature)
  const {
    data: searchResults,
    isLoading,
    isError,
  } = useSearchCustomers({
    query: debouncedSearchTerm,
    limit: 10,
    offset: 0,
    enabled: isOpen && debouncedSearchTerm.length >= 2 && !searchCancelled,
  });

  console.log("searched customers", searchResults);

  // Track search analytics
  useEffect(() => {
    if (
      debouncedSearchTerm.length >= 2 &&
      searchResults !== undefined &&
      !isLoading
    ) {
      const startTime = performance.now();
      const duration = performance.now() - startTime;

      searchAnalytics.trackSearch({
        query: debouncedSearchTerm,
        resultCount: searchResults?.length || 0,
        duration,
        source: "autocomplete",
      });
    }
  }, [debouncedSearchTerm, searchResults, isLoading]);

  const handleCancelSearch = () => {
    setSearchCancelled(true);
    setShowLoadingAfterDelay(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  // Load selected customer if value is provided
  useEffect(() => {
    if (value && !selectedCustomer) {
      // Try to find customer in search results or fetch it
      if (searchResults && searchResults.length > 0) {
        const found = searchResults.find((c: any) => c.customer_id === value);
        if (found) {
          setSelectedCustomer(found);
        }
      }
    }
  }, [value, searchResults, selectedCustomer]);

  const handleSelect = (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.full_name || customer.customer_id);
    setIsOpen(false);

    // Track selection in analytics
    if (debouncedSearchTerm) {
      searchAnalytics.trackSelection(
        debouncedSearchTerm,
        customer.customer_id,
        "autocomplete"
      );
    }

    onSelect(customer.customer_id, customer);
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setIsOpen(false);
    onSelect("");
    inputRef.current?.focus();
  };

  const displayValue = selectedCustomer
    ? selectedCustomer.full_name || selectedCustomer.customer_id
    : searchTerm;

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCustomer(null);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (searchTerm.length >= 2 || searchResults?.length) {
                  setIsOpen(true);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              className={cn(
                "pr-10",
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {(isLoading || isDebouncing) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!isLoading && !isDebouncing && searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {!isLoading && !isDebouncing && !searchTerm && (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          ref={popoverRef}
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {!isLoading && isError && (
            <div className="p-4 text-sm text-destructive">
              Failed to search customers. Please try again.
            </div>
          )}

          {!isLoading && !isError && debouncedSearchTerm.length < 2 && (
            <div className="p-4 text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {!isLoading &&
            !isError &&
            !searchCancelled &&
            debouncedSearchTerm.length >= 2 &&
            searchResults &&
            searchResults.length === 0 && (
              <div className="p-4">
                <CreateCustomerSuggestion searchQuery={debouncedSearchTerm} />
              </div>
            )}

          {!isLoading &&
            !isError &&
            searchResults &&
            searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((customer: any) => (
                  <button
                    key={customer.customer_id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className={cn(
                      "w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent",
                      selectedCustomer?.customer_id === customer.customer_id &&
                        "bg-accent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">
                            {customer.full_name || customer.customer_id}
                          </span>
                        </div>
                        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                          <div className="truncate">
                            ID: {customer.customer_id}
                          </div>
                          {customer.phone_number && (
                            <div className="truncate">
                              Phone: {customer.phone_number}
                            </div>
                          )}
                          {customer.email && (
                            <div className="truncate">
                              Email: {customer.email}
                            </div>
                          )}
                          {customer.customer_segment && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {customer.customer_segment}
                            </Badge>
                          )}
                          {customer.last_interaction_date && (
                            <div className="text-xs text-muted-foreground">
                              Last:{" "}
                              {new Date(
                                customer.last_interaction_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        {customer.last_credit_score !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Last Score: {customer.last_credit_score}
                          </Badge>
                        )}
                        {customer.credit_score !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Score: {customer.credit_score}
                          </Badge>
                        )}
                        {customer.risk_score !== undefined && (
                          <Badge
                            variant={
                              customer.risk_score < 0.3
                                ? "default"
                                : customer.risk_score < 0.6
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            Risk: {(customer.risk_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {/* Pagination for >10 results */}
                {searchResults && searchResults.length >= 10 && (
                  <div className="flex items-center justify-between border-t p-2">
                    <div className="text-xs text-muted-foreground">
                      Showing {searchResults.length} results
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Load more results (would need API support for pagination)
                        console.log("Load more results");
                      }}
                      className="text-xs"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {selectedCustomer && (
        <input
          type="hidden"
          name="customer_id"
          value={selectedCustomer.customer_id}
        />
      )}
    </div>
  );
}
