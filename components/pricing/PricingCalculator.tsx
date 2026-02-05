"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingRequest } from "@/types/pricing";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { PRODUCT_TYPES } from "@/lib/constants/rules";

const pricingFormSchema = z.object({
  customer_id: z.string().min(1, "Customer ID is required"),
  product_type: z.string().min(1, "Product type is required"),
  loan_amount: z.number().min(1000, "Minimum loan amount is 1,000 ETB"),
  loan_term_months: z.number().min(1).max(60, "Maximum loan term is 60 months"),
  credit_score: z.number().min(300).max(850).optional(),
  risk_category: z.enum(["low", "medium", "high", "very_high"]).optional(),
});

type PricingFormData = z.infer<typeof pricingFormSchema>;

interface PricingCalculatorProps {
  onSubmit: (data: PricingRequest) => Promise<void>;
  isLoading?: boolean;
}

export function PricingCalculator({ onSubmit, isLoading }: PricingCalculatorProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      product_type: "PersonalLoan",
      loan_term_months: 12,
    },
  });

  const onFormSubmit = async (data: PricingFormData) => {
    await onSubmit(data as PricingRequest);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dynamic Pricing Calculator</CardTitle>
        <CardDescription>
          Calculate personalized interest rates based on customer risk profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer ID *</Label>
              <CustomerAutocomplete
                value={watch("customer_id")}
                onSelect={(customerId) => {
                  if (customerId) {
                    setValue("customer_id", customerId, { shouldValidate: true });
                  }
                }}
                placeholder="Search or enter customer ID..."
                error={errors.customer_id?.message}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type *</Label>
              <Select
                value={watch("product_type")}
                onValueChange={(value) => setValue("product_type", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="product_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_type && (
                <p className="text-sm text-destructive">{errors.product_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_amount">Loan Amount (ETB) *</Label>
              <Input
                id="loan_amount"
                type="number"
                {...register("loan_amount", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="100000"
              />
              {errors.loan_amount && (
                <p className="text-sm text-destructive">{errors.loan_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_term_months">Loan Term (months) *</Label>
              <Input
                id="loan_term_months"
                type="number"
                {...register("loan_term_months", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="12"
              />
              {errors.loan_term_months && (
                <p className="text-sm text-destructive">{errors.loan_term_months.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_score">Credit Score (300-850)</Label>
              <Input
                id="credit_score"
                type="number"
                {...register("credit_score", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="700"
              />
              {errors.credit_score && (
                <p className="text-sm text-destructive">{errors.credit_score.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_category">Risk Category</Label>
              <Select
                value={watch("risk_category") || ""}
                onValueChange={(value) =>
                  setValue("risk_category", value as any, { shouldValidate: true })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="risk_category">
                  <SelectValue placeholder="Select risk category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very_high">Very High</SelectItem>
                </SelectContent>
              </Select>
              {errors.risk_category && (
                <p className="text-sm text-destructive">{errors.risk_category.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Calculating..." : "Calculate Pricing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


