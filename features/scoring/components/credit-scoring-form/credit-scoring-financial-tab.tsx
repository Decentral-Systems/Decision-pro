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
import { AutoFilledFieldWrapper } from "@/components/common/AutoFilledFieldWrapper";
import type { CreditScoringSectionProps } from "../../types/credit_scoring_form.types";

export function CreditScoringFinancialTab({
  register,
  errors,
  isAutoFilled,
  getFieldInfo,
  markAsManuallyEdited,
}: CreditScoringSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Information</CardTitle>
        <CardDescription>Income, expenses, and balances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="monthly_income">Monthly Income (ETB) *</Label>
            {isAutoFilled && getFieldInfo && markAsManuallyEdited ? (
              <AutoFilledFieldWrapper
                fieldName="monthly_income"
                isAutoFilled={isAutoFilled("monthly_income")}
                dataSource={getFieldInfo("monthly_income")?.dataSource}
                onManualEdit={() => markAsManuallyEdited("monthly_income")}
              >
                <Input
                  id="monthly_income"
                  type="number"
                  {...register("monthly_income", { valueAsNumber: true })}
                  placeholder="20000"
                />
              </AutoFilledFieldWrapper>
            ) : (
              <Input
                id="monthly_income"
                type="number"
                {...register("monthly_income", { valueAsNumber: true })}
                placeholder="20000"
              />
            )}
            {errors.monthly_income && (
              <p className="text-sm text-destructive">
                {errors.monthly_income.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_expenses">Monthly Expenses (ETB) *</Label>
            <Input
              id="monthly_expenses"
              type="number"
              {...register("monthly_expenses", { valueAsNumber: true })}
              placeholder="15000"
            />
            {errors.monthly_expenses && (
              <p className="text-sm text-destructive">
                {errors.monthly_expenses.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings_balance">Savings Balance (ETB) *</Label>
            <Input
              id="savings_balance"
              type="number"
              {...register("savings_balance", { valueAsNumber: true })}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checking_balance">Checking Balance (ETB) *</Label>
            <Input
              id="checking_balance"
              type="number"
              {...register("checking_balance", { valueAsNumber: true })}
              placeholder="10000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_debt">Total Debt (ETB) *</Label>
            <Input
              id="total_debt"
              type="number"
              {...register("total_debt", { valueAsNumber: true })}
              placeholder="30000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit_utilization_ratio">
              Credit Utilization Ratio (%) *
            </Label>
            <Input
              id="credit_utilization_ratio"
              type="number"
              step="0.01"
              {...register("credit_utilization_ratio", {
                valueAsNumber: true,
              })}
              placeholder="30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collateral_value">Collateral Value (ETB)</Label>
            <Input
              id="collateral_value"
              type="number"
              {...register("collateral_value", { valueAsNumber: true })}
              placeholder="100000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
