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
import { DefaultPredictionRequest } from "@/types/prediction";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { nbeComplianceValidator } from "@/lib/utils/nbe-compliance";
import { NBEComplianceDisplay } from "@/components/common/NBEComplianceDisplay";
import { useMemo } from "react";

const predictionFormSchema = z.object({
  customer_id: z.string().min(1, "Customer ID is required"),
  loan_amount: z.number().min(1000, "Minimum loan amount is 1,000 ETB"),
  loan_term_months: z.number().min(1).max(60, "Maximum loan term is 60 months"),
  interest_rate: z.number().min(12).max(25, "Interest rate must be between 12% and 25%"),
  monthly_income: z.number().min(0, "Monthly income must be positive"),
  existing_debt: z.number().min(0).optional(),
  employment_status: z.string().min(1, "Employment status is required"),
  years_employed: z.number().min(0).optional(),
  credit_score: z.number().min(300).max(850).optional(),
});

type PredictionFormData = z.infer<typeof predictionFormSchema>;

interface DefaultPredictionFormProps {
  onSubmit: (data: DefaultPredictionRequest) => Promise<void>;
  isLoading?: boolean;
}

export function DefaultPredictionForm({ onSubmit, isLoading }: DefaultPredictionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionFormSchema),
    defaultValues: {
      employment_status: "employed",
      loan_term_months: 12,
      interest_rate: 15,
    },
  });

  // Real-time NBE compliance validation
  const formValues = watch();
  const nbeCompliance = useMemo(() => {
    if (
      formValues.loan_amount &&
      formValues.monthly_income &&
      formValues.loan_term_months
    ) {
      return nbeComplianceValidator.validateLoanCompliance(
        formValues.loan_amount,
        formValues.monthly_income,
        formValues.loan_term_months,
        undefined,
        formValues.interest_rate
      );
    }
    return null;
  }, [
    formValues.loan_amount,
    formValues.monthly_income,
    formValues.loan_term_months,
    formValues.interest_rate,
  ]);

  const onFormSubmit = async (data: PredictionFormData) => {
    // Check NBE compliance before submission
    const compliance = nbeComplianceValidator.validateLoanCompliance(
      data.loan_amount,
      data.monthly_income,
      data.loan_term_months,
      undefined,
      data.interest_rate
    );

    if (!compliance.compliant) {
      // Form validation will handle this, but we can show a warning
      console.warn("NBE compliance violations:", compliance.violations);
    }

    await onSubmit(data as DefaultPredictionRequest);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Prediction Parameters</CardTitle>
        <CardDescription>
          Enter loan and customer information to predict default probability
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
              <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.1"
                {...register("interest_rate", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="15"
              />
              {errors.interest_rate && (
                <p className="text-sm text-destructive">{errors.interest_rate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_income">Monthly Income (ETB) *</Label>
              <Input
                id="monthly_income"
                type="number"
                {...register("monthly_income", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="50000"
              />
              {errors.monthly_income && (
                <p className="text-sm text-destructive">{errors.monthly_income.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="existing_debt">Existing Debt (ETB)</Label>
              <Input
                id="existing_debt"
                type="number"
                {...register("existing_debt", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="0"
              />
              {errors.existing_debt && (
                <p className="text-sm text-destructive">{errors.existing_debt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_status">Employment Status *</Label>
              <Select
                value={watch("employment_status")}
                onValueChange={(value) => setValue("employment_status", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="employment_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
              {errors.employment_status && (
                <p className="text-sm text-destructive">{errors.employment_status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_employed">Years Employed</Label>
              <Input
                id="years_employed"
                type="number"
                {...register("years_employed", { valueAsNumber: true })}
                disabled={isLoading}
                placeholder="5"
              />
              {errors.years_employed && (
                <p className="text-sm text-destructive">{errors.years_employed.message}</p>
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
          </div>

          {/* NBE Compliance Display */}
          {nbeCompliance && (
            <NBEComplianceDisplay compliance={nbeCompliance} />
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || (nbeCompliance ? !nbeCompliance.compliant : false)}
          >
            {isLoading ? "Predicting..." : "Predict Default Probability"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


