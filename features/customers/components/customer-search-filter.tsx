"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Loader2 } from "lucide-react";
import { useCustomersList } from "@/lib/api/hooks/useCustomers";

interface CustomerSearchFilterProps {
  onSelectCustomer: (customerId: string) => void;
  selectedCustomerId?: string;
}

export function CustomerSearchFilter({
  onSelectCustomer,
  selectedCustomerId,
}: CustomerSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [riskLevel, setRiskLevel] = useState<string>("all");
  const [minCreditScore, setMinCreditScore] = useState<string>("");
  const [maxCreditScore, setMaxCreditScore] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Build search params
  const searchParams: any = {
    page,
    page_size: 20,
  };

  if (searchTerm) searchParams.search = searchTerm;
  if (region && region !== "all") searchParams.region = region;
  if (riskLevel && riskLevel !== "all") searchParams.risk_level = riskLevel;
  if (status && status !== "all") searchParams.status = status;

  const { data, isLoading, isError } = useCustomersList(searchParams);

  // Filter by credit score range client-side (since API might not support it)
  const filteredCustomers =
    data?.items?.filter((customer) => {
      if (customer.credit_score !== undefined) {
        if (
          minCreditScore &&
          customer.credit_score < parseFloat(minCreditScore)
        ) {
          return false;
        }
        if (
          maxCreditScore &&
          customer.credit_score > parseFloat(maxCreditScore)
        ) {
          return false;
        }
      }
      return true;
    }) || [];

  const handleSelectCustomer = (customerId: string) => {
    console.log("CustomerSearchFilter: Selecting customer:", customerId);
    if (customerId) {
      onSelectCustomer(customerId);
      setIsDialogOpen(false);
      // Reset filters
      setSearchTerm("");
      setRegion("all");
      setRiskLevel("all");
      setMinCreditScore("");
      setMaxCreditScore("");

      setStatus("all");
      setPage(1);
    } else {
      console.error("Invalid customer ID:", customerId);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRegion("all");
    setRiskLevel("all");
    setMinCreditScore("");
    setMaxCreditScore("");
    setStatus("all");
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    (region && region !== "all") ||
    (riskLevel && riskLevel !== "all") ||
    minCreditScore ||
    maxCreditScore ||
    (status && status !== "all");

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
          <Search className="mr-2 h-4 w-4" />
          {selectedCustomerId
            ? `Selected: ${selectedCustomerId}`
            : "Search Existing Customer"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search & Filter Customers</DialogTitle>
          <DialogDescription>
            Find and select an existing customer to populate the form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary">
                    {
                      [
                        searchTerm && "Search",
                        region && region !== "all" && "Region",
                        riskLevel && riskLevel !== "all" && "Risk",
                        minCreditScore && "Min Score",
                        maxCreditScore && "Max Score",
                        status && status !== "all" && "Status",
                      ].filter(Boolean).length
                    }{" "}
                    active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="filter-region">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="filter-region">
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="Addis Ababa">Addis Ababa</SelectItem>
                      <SelectItem value="Oromia">Oromia</SelectItem>
                      <SelectItem value="Amhara">Amhara</SelectItem>
                      <SelectItem value="Tigray">Tigray</SelectItem>
                      <SelectItem value="SNNP">SNNP</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-risk">Risk Level</Label>
                  <Select value={riskLevel} onValueChange={setRiskLevel}>
                    <SelectTrigger id="filter-risk">
                      <SelectValue placeholder="All Risk Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="very_high">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="filter-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-score">Min Credit Score</Label>
                  <Input
                    id="min-score"
                    type="number"
                    placeholder="300"
                    value={minCreditScore}
                    onChange={(e) => setMinCreditScore(e.target.value)}
                    min={300}
                    max={850}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-score">Max Credit Score</Label>
                  <Input
                    id="max-score"
                    type="number"
                    placeholder="850"
                    value={maxCreditScore}
                    onChange={(e) => setMaxCreditScore(e.target.value)}
                    min={300}
                    max={850}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Results ({filteredCustomers.length}
                {data?.total !== undefined && ` of ${data.total}`})
              </Label>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              )}
            </div>

            {isError && (
              <div className="rounded-md border border-destructive p-4 text-sm text-destructive">
                Failed to load customers. Please try again.
              </div>
            )}

            {!isLoading && !isError && filteredCustomers.length === 0 && (
              <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                No customers found. Try adjusting your filters.
              </div>
            )}

            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.customer_id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedCustomerId === customer.customer_id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => handleSelectCustomer(customer.customer_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {customer.full_name || customer.customer_id}
                        </div>
                        <div className="space-x-4 text-sm text-muted-foreground">
                          <span>ID: {customer.customer_id}</span>
                          {customer.phone_number && (
                            <span>Phone: {customer.phone_number}</span>
                          )}
                          {customer.email && (
                            <span>Email: {customer.email}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {customer.credit_score !== undefined && (
                          <Badge variant="outline">
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
                          >
                            Risk: {customer.risk_score.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data && data.has_more && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.has_more || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
