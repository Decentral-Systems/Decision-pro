"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { getCustomerProfile } from "@/lib/utils/customer360Transform";

interface DataCompletenessIndicatorProps {
  data: Customer360Data;
}

interface FieldStatus {
  field: string;
  label: string;
  value: any;
  required: boolean;
  category: string;
}

export function DataCompletenessIndicator({ data, onEditClick }: DataCompletenessIndicatorProps) {
  const profile = getCustomerProfile(data);

  // Define all required and optional fields by category
  const fieldDefinitions: FieldStatus[] = [
    // Personal Information
    { field: "full_name", label: "Full Name", value: profile.full_name, required: true, category: "Personal" },
    { field: "email", label: "Email", value: profile.email, required: true, category: "Personal" },
    { field: "phone_number", label: "Phone Number", value: profile.phone_number, required: true, category: "Personal" },
    { field: "id_number", label: "ID Number", value: profile.id_number, required: true, category: "Personal" },
    { field: "date_of_birth", label: "Date of Birth", value: profile.date_of_birth, required: true, category: "Personal" },
    { field: "gender", label: "Gender", value: profile.gender, required: false, category: "Personal" },
    { field: "marital_status", label: "Marital Status", value: profile.marital_status, required: false, category: "Personal" },
    { field: "age", label: "Age", value: profile.age, required: false, category: "Personal" },

    // Location Information
    { field: "region", label: "Region", value: profile.region, required: true, category: "Location" },
    { field: "city", label: "City", value: profile.city, required: false, category: "Location" },
    { field: "urban_rural", label: "Urban/Rural", value: profile.urban_rural, required: false, category: "Location" },

    // Financial Information
    { field: "monthly_income", label: "Monthly Income", value: profile.monthly_income, required: true, category: "Financial" },
    { field: "monthly_expenses", label: "Monthly Expenses", value: profile.monthly_expenses, required: false, category: "Financial" },
    { field: "savings_balance", label: "Savings Balance", value: profile.savings_balance, required: false, category: "Financial" },
    { field: "checking_balance", label: "Checking Balance", value: profile.checking_balance, required: false, category: "Financial" },
    { field: "total_debt", label: "Total Debt", value: profile.total_debt, required: false, category: "Financial" },

    // Employment Information
    { field: "employment_status", label: "Employment Status", value: profile.employment_status, required: true, category: "Employment" },
    { field: "years_employed", label: "Years Employed", value: profile.years_employed, required: false, category: "Employment" },
    { field: "employer_name", label: "Employer Name", value: profile.employer_name, required: false, category: "Employment" },
    { field: "business_sector", label: "Business Sector", value: profile.business_sector, required: false, category: "Employment" },
  ];

  // Calculate completeness
  const requiredFields = fieldDefinitions.filter((f) => f.required);
  const optionalFields = fieldDefinitions.filter((f) => !f.required);

  const completedRequired = requiredFields.filter((f) => {
    const value = f.value;
    return value !== undefined && value !== null && value !== "" && value !== 0;
  }).length;

  const completedOptional = optionalFields.filter((f) => {
    const value = f.value;
    return value !== undefined && value !== null && value !== "" && value !== 0;
  }).length;

  const requiredCompleteness = (completedRequired / requiredFields.length) * 100;
  const optionalCompleteness = (completedOptional / optionalFields.length) * 100;
  const overallCompleteness = ((completedRequired + completedOptional) / fieldDefinitions.length) * 100;

  // Get missing required fields
  const missingRequired = requiredFields.filter((f) => {
    const value = f.value;
    return value === undefined || value === null || value === "" || value === 0;
  });

  // Group by category
  const fieldsByCategory = fieldDefinitions.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, FieldStatus[]>);

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getCompletenessBadge = (percentage: number) => {
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    if (percentage >= 50) return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Overall Completeness Score */}
      <Card>
        <CardHeader>
          <CardTitle>Data Completeness Score</CardTitle>
          <CardDescription>Overall data quality and completeness assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Completeness</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getCompletenessColor(overallCompleteness)}`}>
                    {overallCompleteness.toFixed(0)}%
                  </span>
                  <Badge variant={getCompletenessBadge(overallCompleteness)}>
                    {overallCompleteness >= 90 ? "Excellent" : overallCompleteness >= 70 ? "Good" : overallCompleteness >= 50 ? "Fair" : "Poor"}
                  </Badge>
                </div>
              </div>
              <Progress value={overallCompleteness} className="h-3" />
            </div>

            {/* Required vs Optional */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Required Fields</span>
                  <span className="text-sm text-muted-foreground">
                    {completedRequired} / {requiredFields.length}
                  </span>
                </div>
                <Progress value={requiredCompleteness} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {requiredCompleteness.toFixed(0)}% complete
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Optional Fields</span>
                  <span className="text-sm text-muted-foreground">
                    {completedOptional} / {optionalFields.length}
                  </span>
                </div>
                <Progress value={optionalCompleteness} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {optionalCompleteness.toFixed(0)}% complete
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Required Fields Alert */}
      {missingRequired.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">
              {missingRequired.length} required field(s) missing
            </div>
            <div className="text-sm">
              Please complete: {missingRequired.map((f) => f.label).join(", ")}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Field Completeness by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Field Completeness by Category</CardTitle>
          <CardDescription>Detailed breakdown of data completeness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(fieldsByCategory).map(([category, fields]) => {
              const completed = fields.filter((f) => {
                const value = f.value;
                return value !== undefined && value !== null && value !== "" && value !== 0;
              }).length;
              const categoryCompleteness = (completed / fields.length) * 100;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {completed} / {fields.length}
                      </span>
                      <Badge variant={getCompletenessBadge(categoryCompleteness)}>
                        {categoryCompleteness.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={categoryCompleteness} className="h-2" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {fields.map((field) => {
                      const hasValue = field.value !== undefined && field.value !== null && field.value !== "" && field.value !== 0;
                      return (
                        <div
                          key={field.field}
                          className="flex items-center gap-2 text-xs"
                        >
                          {hasValue ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span className={hasValue ? "text-muted-foreground" : "text-destructive font-medium"}>
                            {field.label}
                            {field.required && <span className="text-red-600 ml-1">*</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Recommendations</CardTitle>
          <CardDescription>Suggestions to improve data completeness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overallCompleteness < 50 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical:</strong> Data completeness is below 50%. Please complete all required fields to ensure accurate credit assessment.
                </AlertDescription>
              </Alert>
            )}
            {missingRequired.length > 0 && (
              <Alert variant={overallCompleteness < 70 ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> Complete {missingRequired.length} required field(s) to improve data quality score.
                </AlertDescription>
              </Alert>
            )}
            {overallCompleteness >= 70 && overallCompleteness < 90 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Good Progress:</strong> Consider completing optional fields to reach 90%+ completeness for better credit assessment accuracy.
                </AlertDescription>
              </Alert>
            )}
            {overallCompleteness >= 90 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Excellent:</strong> Data completeness is above 90%. Profile is well-documented and ready for comprehensive credit assessment.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

