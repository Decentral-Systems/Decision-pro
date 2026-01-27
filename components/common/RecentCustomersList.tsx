/**
 * Recent Customers List Component
 * Shows recently accessed customers for quick selection
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface RecentCustomer {
  customer_id: string;
  full_name?: string;
  last_accessed: Date;
  last_score?: number;
}

interface RecentCustomersListProps {
  onSelectCustomer: (customerId: string) => void;
  maxItems?: number;
  className?: string;
}

const STORAGE_KEY = "recent_customers";

export function RecentCustomersList({
  onSelectCustomer,
  maxItems = 5,
  className,
}: RecentCustomersListProps) {
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);

  // Load recent customers from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        const customers = parsed
          .map((c: any) => ({
            ...c,
            last_accessed: new Date(c.last_accessed),
          }))
          .sort((a: RecentCustomer, b: RecentCustomer) => 
            b.last_accessed.getTime() - a.last_accessed.getTime()
          )
          .slice(0, maxItems);
        setRecentCustomers(customers);
      }
    } catch (error) {
      console.warn("Failed to load recent customers:", error);
    }
  }, [maxItems]);

  const handleSelect = (customer: RecentCustomer) => {
    // Update last accessed time
    const updated = recentCustomers.map((c) =>
      c.customer_id === customer.customer_id
        ? { ...c, last_accessed: new Date() }
        : c
    );
    setRecentCustomers(updated);
    
    // Save to localStorage
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.warn("Failed to save recent customers:", error);
    }

    onSelectCustomer(customer.customer_id);
  };

  const handleRemove = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentCustomers.filter((c) => c.customer_id !== customerId);
    setRecentCustomers(updated);
    
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to update recent customers:", error);
    }
  };

  if (recentCustomers.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Recent Customers
        </CardTitle>
        <CardDescription className="text-xs">
          Quickly access recently viewed customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentCustomers.map((customer) => (
            <div
              key={customer.customer_id}
              className="flex items-center justify-between p-2 rounded border hover:bg-accent cursor-pointer transition-colors group"
              onClick={() => handleSelect(customer)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {customer.full_name || customer.customer_id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(customer.last_accessed, "MMM dd, HH:mm")}
                  </div>
                </div>
                {customer.last_score !== undefined && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {customer.last_score}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleRemove(customer.customer_id, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to add customer to recent list
 */
export function useRecentCustomers() {
  const addToRecent = (customer: {
    customer_id: string;
    full_name?: string;
    last_score?: number;
  }) => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const existing: RecentCustomer[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      const filtered = existing.filter((c) => c.customer_id !== customer.customer_id);
      
      // Add to beginning
      const updated: RecentCustomer[] = [
        {
          ...customer,
          last_accessed: new Date(),
        },
        ...filtered,
      ].slice(0, 10); // Keep max 10

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.warn("Failed to add to recent customers:", error);
    }
  };

  return { addToRecent };
}
