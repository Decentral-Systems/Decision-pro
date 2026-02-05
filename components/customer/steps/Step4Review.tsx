"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";
import { FeatureCompletenessIndicator } from "../FeatureCompletenessIndicator";

interface Step4ReviewProps {
  formMethods?: any; // For backward compatibility
}

export function Step4Review({ formMethods: _ }: Step4ReviewProps) {
  const { getValues } = useFormContext<CustomerRegistrationFormData>();
  const formData = getValues();

  return (
    <div className="space-y-6">
      {/* Completeness Indicator */}
      <FeatureCompletenessIndicator formData={formData} showDetails={true} />

      {/* Basic Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Customer ID:</span> {formData.customer_id || "—"}
            </div>
            <div>
              <span className="font-medium">Full Name:</span> {formData.full_name || "—"}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {formData.phone_number || "—"}
            </div>
            <div>
              <span className="font-medium">Email:</span> {formData.email || "—"}
            </div>
            <div>
              <span className="font-medium">ID Number:</span> {formData.id_number || "—"}
            </div>
            <div>
              <span className="font-medium">Date of Birth:</span> {formData.date_of_birth || "—"}
            </div>
            <div>
              <span className="font-medium">Gender:</span> {formData.gender || "—"}
            </div>
            <div>
              <span className="font-medium">Marital Status:</span> {formData.marital_status || "—"}
            </div>
            <div>
              <span className="font-medium">Region:</span> {formData.region || "—"}
            </div>
            <div>
              <span className="font-medium">City:</span> {formData.city || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Summary */}
      {(formData.employment_status || formData.employer_name || formData.monthly_income) && (
        <Card>
          <CardHeader>
            <CardTitle>Employment & Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {formData.employment_status && (
                <div>
                  <span className="font-medium">Employment Status:</span> {formData.employment_status}
                </div>
              )}
              {formData.employer_name && (
                <div>
                  <span className="font-medium">Employer:</span> {formData.employer_name}
                </div>
              )}
              {formData.employment_sector && (
                <div>
                  <span className="font-medium">Sector:</span> {formData.employment_sector}
                </div>
              )}
              {formData.job_title && (
                <div>
                  <span className="font-medium">Job Title:</span> {formData.job_title}
                </div>
              )}
              {formData.monthly_income && (
                <div>
                  <span className="font-medium">Monthly Income:</span> {formData.monthly_income.toLocaleString()} ETB
                </div>
              )}
              {formData.bank_name && (
                <div>
                  <span className="font-medium">Bank:</span> {formData.bank_name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {(formData.monthly_expenses || formData.debt_to_income_ratio || formData.education_level) && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {formData.monthly_expenses && (
                <div>
                  <span className="font-medium">Monthly Expenses:</span> {formData.monthly_expenses.toLocaleString()} ETB
                </div>
              )}
              {formData.debt_to_income_ratio !== undefined && (
                <div>
                  <span className="font-medium">Debt to Income Ratio:</span> {formData.debt_to_income_ratio}
                </div>
              )}
              {formData.total_outstanding_balance_etb && (
                <div>
                  <span className="font-medium">Outstanding Balance:</span> {formData.total_outstanding_balance_etb.toLocaleString()} ETB
                </div>
              )}
              {formData.cash_buffer_days && (
                <div>
                  <span className="font-medium">Cash Buffer:</span> {formData.cash_buffer_days} days
                </div>
              )}
              {formData.education_level && (
                <div>
                  <span className="font-medium">Education Level:</span> {formData.education_level}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center p-4 border rounded-lg bg-muted/50">
        Click "Submit" to create the customer with the information above. You can go back to previous steps to make changes.
      </div>
    </div>
  );
}

