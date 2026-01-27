"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CustomerRegistrationFormData, customerRegistrationSchema } from "@/lib/utils/customerRegistrationSchema";
import { countSchemaFields, countFilledFields } from "@/lib/utils/countSchemaFields";

interface FeatureCompletenessIndicatorProps {
  formData: CustomerRegistrationFormData;
  showDetails?: boolean;
}

interface CategoryCompleteness {
  name: string;
  filled: number;
  total: number;
  percentage: number;
}

export function FeatureCompletenessIndicator({
  formData,
  showDetails = false,
}: FeatureCompletenessIndicatorProps) {
  const calculateCategoryCompleteness = (): CategoryCompleteness[] => {
    const categories: CategoryCompleteness[] = [];

    // Basic Information (required fields + optional)
    const basicFields = [
      "customer_id",
      "full_name",
      "phone_number",
      "email",
      "id_number",
      "date_of_birth",
      "gender",
      "marital_status",
      "number_of_dependents",
      "region",
      "city",
      "sub_city",
      "postal_code",
      "address",
    ];
    const basicFilled = basicFields.filter(
      (field) => hasValue(formData[field as keyof CustomerRegistrationFormData])
    ).length;
    categories.push({
      name: "Basic Information",
      filled: basicFilled,
      total: basicFields.length,
      percentage: Math.round((basicFilled / basicFields.length) * 100),
    });

    // Employment & Income
    const employmentFields = [
      "employment_status",
      "employer_name",
      "employment_sector",
      "job_title",
      "employment_years",
      "current_job_months",
      "monthly_income",
      "cards",
      "bank_name",
      "bank_account_number",
      "bank_account_type",
      "bank_account_age_months",
      "bank_avg_balance_6m",
    ];
    const employmentFilled = employmentFields.filter((field) => {
      if (field === "cards") {
        return Array.isArray(formData.cards) && formData.cards.length > 0;
      }
      return hasValue(formData[field as keyof CustomerRegistrationFormData]);
    }).length;
    categories.push({
      name: "Employment & Income",
      filled: employmentFilled,
      total: employmentFields.length,
      percentage: Math.round((employmentFilled / employmentFields.length) * 100),
    });

    // Financial Overview
    const financialFields = [
      "monthly_expenses",
      "debt_to_income_ratio",
      "scheduled_monthly_debt_service",
      "total_outstanding_balance_etb",
      "total_credit_limit_etb",
      "existing_loan_count_open",
      "cash_buffer_days",
      "income_stability_cv_6m",
      "pension_plan_participation",
      "health_insurance_coverage",
      "education_level",
    ];
    const financialFilled = financialFields.filter((field) =>
      hasValue(formData[field as keyof CustomerRegistrationFormData])
    ).length;
    categories.push({
      name: "Financial Overview",
      filled: financialFilled,
      total: financialFields.length,
      percentage: Math.round((financialFilled / financialFields.length) * 100),
    });

    return categories;
  };

  const hasValue = (value: any): boolean => {
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "number" && value === 0 && value !== 0) return false; // Allow 0 as valid
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && Object.keys(value).length === 0) return false;
    if (typeof value === "boolean") return true; // booleans are always valid
    return true;
  };

  // Calculate total fields from schema (memoized)
  const schemaCount = useMemo(() => {
    return countSchemaFields(customerRegistrationSchema);
  }, []);

  const calculateOverallCompleteness = (): {
    filledCount: number;
    totalFields: number;
    percentage: number;
  } => {
    // Count filled fields including nested fields in cards
    const { filledCount, totalCounted } = countFilledFields(formData);

    // Use actual schema count as total
    const totalFields = schemaCount.totalFields;
    
    // Calculate percentage based on actual counts
    const percentage = totalFields > 0 
      ? Math.min(Math.round((filledCount / totalFields) * 100), 100)
      : 0;

    return { filledCount, totalFields, percentage };
  };

  const categories = calculateCategoryCompleteness();
  const overall = calculateOverallCompleteness();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Completeness</CardTitle>
        <CardDescription>
          Track your progress through the registration process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Completeness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Completeness</span>
            <Badge variant={overall.percentage >= 50 ? "default" : "secondary"}>
              {overall.percentage}%
            </Badge>
          </div>
          <Progress value={overall.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Approximately {overall.filledCount} of {overall.totalFields} fields completed
          </p>
        </div>

        {/* Category Breakdown */}
        {showDetails && (
          <div className="space-y-3 pt-2 border-t">
            {categories.map((category) => (
              <div key={category.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{category.name}</span>
                  <span className="text-muted-foreground">
                    {category.filled}/{category.total}
                  </span>
                </div>
                <Progress value={category.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

