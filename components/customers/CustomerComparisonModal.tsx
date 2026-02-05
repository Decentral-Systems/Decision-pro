"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomersList } from "@/lib/api/hooks/useCustomers";
import { CustomerListItem } from "@/types/api";
import { Users, X, TrendingUp, TrendingDown } from "lucide-react";
import { formatDate } from "@/lib/utils/customer360Transform";

interface CustomerComparisonModalProps {
  selectedCustomerIds: string[];
  onClose?: () => void;
}

export function CustomerComparisonModal({ selectedCustomerIds, onClose }: CustomerComparisonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customersToCompare, setCustomersToCompare] = useState<string[]>(() => 
    selectedCustomerIds.slice(0, 4)
  );
  
  // Fetch data for all customers to compare
  const { data: customersData, isLoading } = useCustomersList({
    page: 1,
    page_size: 100, // Get enough to find our customers
  });

  const customers = customersData?.items || [];
  const comparisonCustomers = customers.filter((c) => customersToCompare.includes(c.customer_id));

  const handleAddCustomer = (customerId: string) => {
    if (customersToCompare.length < 4 && !customersToCompare.includes(customerId)) {
      setCustomersToCompare([...customersToCompare, customerId]);
    }
  };

  const handleRemoveCustomer = (customerId: string) => {
    setCustomersToCompare(customersToCompare.filter((id) => id !== customerId));
  };

  const getComparisonValue = (field: keyof CustomerListItem) => {
    const values = comparisonCustomers.map((c) => c[field]);
    if (values.length === 0) return null;
    
    // For numeric fields, calculate stats
    if (typeof values[0] === "number") {
      const nums = values.filter((v): v is number => typeof v === "number");
      if (nums.length === 0) return null;
      return {
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
        values: nums,
      };
    }
    
    return { values };
  };

  const renderComparisonRow = (label: string, field: keyof CustomerListItem, formatter?: (val: any) => string) => {
    const comparison = getComparisonValue(field);
    if (!comparison) return null;

    const numericComparison = comparison.values && typeof comparison.values[0] === "number";

    return (
      <tr className="border-b">
        <td className="p-3 font-medium">{label}</td>
        {comparisonCustomers.map((customer) => {
          const value = customer[field];
          const formatted = formatter ? formatter(value) : String(value || "N/A");
          const isBest = numericComparison && value === comparison.max;
          const isWorst = numericComparison && value === comparison.min && comparison.values.length > 1;

          return (
            <td key={customer.customer_id} className="p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className={isBest ? "text-green-600 font-bold" : isWorst ? "text-red-600" : ""}>
                  {formatted}
                </span>
                {isBest && <TrendingUp className="h-4 w-4 text-green-600" />}
                {isWorst && <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
            </td>
          );
        })}
        {/* Fill empty columns */}
        {Array.from({ length: 4 - comparisonCustomers.length }).map((_, i) => (
          <td key={`empty-${i}`} className="p-3 text-center text-muted-foreground">
            —
          </td>
        ))}
      </tr>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={selectedCustomerIds.length < 2}>
          <Users className="h-4 w-4 mr-2" />
          Compare ({selectedCustomerIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Customers</DialogTitle>
          <DialogDescription>
            Compare up to 4 customers side-by-side. Select customers to compare below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Customers to Compare (up to 4)</label>
            <div className="flex flex-wrap gap-2">
              {customersToCompare.map((customerId) => {
                const customer = customers.find((c) => c.customer_id === customerId);
                return (
                  <Badge key={customerId} variant="secondary" className="gap-2">
                    {customer?.full_name || customerId}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveCustomer(customerId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
              {customersToCompare.length < 4 && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value) handleAddCustomer(value);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter((c) => !customersToCompare.includes(c.customer_id))
                      .map((customer) => (
                        <SelectItem key={customer.customer_id} value={customer.customer_id}>
                          {customer.full_name} ({customer.customer_id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Comparison Table */}
          {comparisonCustomers.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold">Metric</th>
                        {comparisonCustomers.map((customer) => (
                          <th key={customer.customer_id} className="p-3 text-center font-semibold">
                            <div className="flex flex-col items-center gap-1">
                              <span>{customer.full_name || "Unknown"}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {customer.customer_id}
                              </span>
                            </div>
                          </th>
                        ))}
                        {Array.from({ length: 4 - comparisonCustomers.length }).map((_, i) => (
                          <th key={`empty-header-${i}`} className="p-3 text-center text-muted-foreground">
                            —
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {renderComparisonRow("Customer ID", "customer_id")}
                      {renderComparisonRow("Full Name", "full_name")}
                      {renderComparisonRow("Email", "email")}
                      {renderComparisonRow("Phone", "phone_number")}
                      {renderComparisonRow("Region", "region")}
                      {renderComparisonRow("Credit Score", "credit_score", (val) => String(val || 0))}
                      {renderComparisonRow("Risk Level", "risk_level")}
                      {renderComparisonRow("Status", "status")}
                      {renderComparisonRow("Created At", "created_at", (val) => formatDate(val))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {comparisonCustomers.length < 2 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select at least 2 customers to compare</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

