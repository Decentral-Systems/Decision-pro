"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";
import { AdvancedRegistrationSections } from "../AdvancedRegistrationSections";

interface Step3FinancialOverviewProps {
  formMethods?: any; // For backward compatibility
}

export function Step3FinancialOverview({ formMethods: _ }: Step3FinancialOverviewProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CustomerRegistrationFormData>();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Expenses */}
        <div className="space-y-2">
          <Label htmlFor="monthly_expenses">Monthly Expenses (ETB)</Label>
          <Input
            id="monthly_expenses"
            type="number"
            step="0.01"
            min="0"
            placeholder="20000"
            {...register("monthly_expenses", { valueAsNumber: true })}
          />
          {errors.monthly_expenses && (
            <p className="text-sm text-destructive">
              {errors.monthly_expenses.message}
            </p>
          )}
        </div>

        {/* Debt to Income Ratio */}
        <div className="space-y-2">
          <Label htmlFor="debt_to_income_ratio">Debt to Income Ratio</Label>
          <Input
            id="debt_to_income_ratio"
            type="number"
            step="0.01"
            min="0"
            max="10"
            placeholder="0.22"
            {...register("debt_to_income_ratio", { valueAsNumber: true })}
          />
          {errors.debt_to_income_ratio && (
            <p className="text-sm text-destructive">
              {errors.debt_to_income_ratio.message}
            </p>
          )}
        </div>

        {/* Scheduled Monthly Debt Service */}
        <div className="space-y-2">
          <Label htmlFor="scheduled_monthly_debt_service">Scheduled Monthly Debt Service (ETB)</Label>
          <Input
            id="scheduled_monthly_debt_service"
            type="number"
            step="0.01"
            min="0"
            placeholder="7700"
            {...register("scheduled_monthly_debt_service", { valueAsNumber: true })}
          />
          {errors.scheduled_monthly_debt_service && (
            <p className="text-sm text-destructive">
              {errors.scheduled_monthly_debt_service.message}
            </p>
          )}
        </div>

        {/* Total Outstanding Balance */}
        <div className="space-y-2">
          <Label htmlFor="total_outstanding_balance_etb">Total Outstanding Balance (ETB)</Label>
          <Input
            id="total_outstanding_balance_etb"
            type="number"
            step="0.01"
            min="0"
            placeholder="120000"
            {...register("total_outstanding_balance_etb", { valueAsNumber: true })}
          />
          {errors.total_outstanding_balance_etb && (
            <p className="text-sm text-destructive">
              {errors.total_outstanding_balance_etb.message}
            </p>
          )}
        </div>

        {/* Total Credit Limit */}
        <div className="space-y-2">
          <Label htmlFor="total_credit_limit_etb">Total Credit Limit (ETB)</Label>
          <Input
            id="total_credit_limit_etb"
            type="number"
            step="0.01"
            min="0"
            placeholder="200000"
            {...register("total_credit_limit_etb", { valueAsNumber: true })}
          />
          {errors.total_credit_limit_etb && (
            <p className="text-sm text-destructive">
              {errors.total_credit_limit_etb.message}
            </p>
          )}
        </div>

        {/* Existing Loan Count (Open) */}
        <div className="space-y-2">
          <Label htmlFor="existing_loan_count_open">Existing Open Loans</Label>
          <Input
            id="existing_loan_count_open"
            type="number"
            min="0"
            placeholder="1"
            {...register("existing_loan_count_open", { valueAsNumber: true })}
          />
          {errors.existing_loan_count_open && (
            <p className="text-sm text-destructive">
              {errors.existing_loan_count_open.message}
            </p>
          )}
        </div>

        {/* Cash Buffer Days */}
        <div className="space-y-2">
          <Label htmlFor="cash_buffer_days">Cash Buffer (Days)</Label>
          <Input
            id="cash_buffer_days"
            type="number"
            step="0.1"
            min="0"
            placeholder="45"
            {...register("cash_buffer_days", { valueAsNumber: true })}
          />
          {errors.cash_buffer_days && (
            <p className="text-sm text-destructive">
              {errors.cash_buffer_days.message}
            </p>
          )}
        </div>

        {/* Income Stability CV (6 months) */}
        <div className="space-y-2">
          <Label htmlFor="income_stability_cv_6m">Income Stability CV (6 months)</Label>
          <Input
            id="income_stability_cv_6m"
            type="number"
            step="0.01"
            min="0"
            max="1"
            placeholder="0.08"
            {...register("income_stability_cv_6m", { valueAsNumber: true })}
          />
          {errors.income_stability_cv_6m && (
            <p className="text-sm text-destructive">
              {errors.income_stability_cv_6m.message}
            </p>
          )}
        </div>

        {/* Pension Plan Participation */}
        <div className="space-y-2">
          <Label htmlFor="pension_plan_participation">Pension Plan Participation</Label>
          <Controller
            name="pension_plan_participation"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === "true")}
                value={field.value === undefined ? undefined : field.value ? "true" : "false"}
              >
                <SelectTrigger id="pension_plan_participation">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.pension_plan_participation && (
            <p className="text-sm text-destructive">
              {errors.pension_plan_participation.message}
            </p>
          )}
        </div>

        {/* Health Insurance Coverage */}
        <div className="space-y-2">
          <Label htmlFor="health_insurance_coverage">Health Insurance Coverage</Label>
          <Input
            id="health_insurance_coverage"
            placeholder="Private, Basic, etc."
            {...register("health_insurance_coverage")}
          />
          {errors.health_insurance_coverage && (
            <p className="text-sm text-destructive">
              {errors.health_insurance_coverage.message}
            </p>
          )}
        </div>

        {/* Education Level */}
        <div className="space-y-2">
          <Label htmlFor="education_level">Education Level</Label>
          <Controller
            name="education_level"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="education_level">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.education_level && (
            <p className="text-sm text-destructive">
              {errors.education_level.message}
            </p>
          )}
        </div>
      </div>

      {/* Advanced Sections */}
      <div className="pt-4 border-t">
        <AdvancedRegistrationSections />
      </div>
    </div>
  );
}

