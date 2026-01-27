/**
 * Create New Customer Suggestion Component
 * Shows when no search results found
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserPlus, Search } from "lucide-react";
import Link from "next/link";

interface CreateCustomerSuggestionProps {
  searchQuery: string;
  onCreateClick?: () => void;
  className?: string;
}

export function CreateCustomerSuggestion({
  searchQuery,
  onCreateClick,
  className,
}: CreateCustomerSuggestionProps) {
  return (
    <Alert className={className}>
      <Search className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">No customers found</div>
            <div className="text-sm text-muted-foreground">
              No customers match "{searchQuery}". Would you like to create a new customer?
            </div>
          </div>
          <div className="flex gap-2">
            {onCreateClick ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateClick}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Create Customer
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <Link href="/customers/new">
                  <UserPlus className="h-4 w-4" />
                  Create Customer
                </Link>
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
