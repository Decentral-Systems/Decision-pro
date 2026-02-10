"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { AutoFilledFieldWrapper } from "@/components/common/AutoFilledFieldWrapper";
import type { CreditScoringSectionProps } from "../../types/credit_scoring_form.types";

export function CreditScoringBasicInfoTab({
  register,
  errors,
  watch,
  setValue,
  customerType = "new",
  selectedCustomerId,
  isAutoFilled,
  getFieldInfo,
  markAsManuallyEdited,
}: CreditScoringSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Customer and loan details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer ID *</Label>
            {customerType === "new" ? (
              <CustomerAutocomplete
                value={watch("customer_id") || selectedCustomerId}
                onSelect={(customerId) => {
                  if (customerId) {
                    setValue("customer_id", customerId, {
                      shouldValidate: true,
                    });
                  }
                }}
                placeholder="Search or enter customer ID..."
                error={errors.customer_id?.message}
                required
              />
            ) : (
              <Input
                id="customer_id"
                {...register("customer_id")}
                placeholder="CUST_001"
                value={selectedCustomerId || ""}
                readOnly={!!selectedCustomerId}
              />
            )}
            {errors.customer_id && (
              <p className="text-sm text-destructive">
                {errors.customer_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_amount">Loan Amount (ETB) *</Label>
            {isAutoFilled && getFieldInfo && markAsManuallyEdited ? (
              <AutoFilledFieldWrapper
                fieldName="loan_amount"
                isAutoFilled={isAutoFilled("loan_amount")}
                dataSource={getFieldInfo("loan_amount")?.dataSource}
                onManualEdit={() => markAsManuallyEdited("loan_amount")}
              >
                <Input
                  id="loan_amount"
                  type="number"
                  {...register("loan_amount", { valueAsNumber: true })}
                  placeholder="50000"
                />
              </AutoFilledFieldWrapper>
            ) : (
              <Input
                id="loan_amount"
                type="number"
                {...register("loan_amount", { valueAsNumber: true })}
                placeholder="50000"
              />
            )}
            {errors.loan_amount && (
              <p className="text-sm text-destructive">
                {errors.loan_amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_term_months">Loan Term (Months) *</Label>
            <Input
              id="loan_term_months"
              type="number"
              {...register("loan_term_months", { valueAsNumber: true })}
              placeholder="12"
            />
            {errors.loan_term_months && (
              <p className="text-sm text-destructive">
                {errors.loan_term_months.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_purpose">Loan Purpose</Label>
            <Input
              id="loan_purpose"
              {...register("loan_purpose")}
              placeholder="Business expansion"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
