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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";
import { MultiCardManager } from "../MultiCardManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Step2EmploymentIncomeProps {
  formMethods?: any; // For backward compatibility
}

export function Step2EmploymentIncome({ formMethods: _ }: Step2EmploymentIncomeProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CustomerRegistrationFormData>();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="multicard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="multicard">Multi-Card (Recommended)</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Format</TabsTrigger>
        </TabsList>

        <TabsContent value="multicard" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use multi-card format to add multiple income sources (employer/bank combinations). 
              Each card represents one income source. The primary card's income will be used for calculations.
            </AlertDescription>
          </Alert>
          <MultiCardManager />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Legacy format: Single employment and bank entry. For multiple income sources, use the Multi-Card tab.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
        {/* Employment Status */}
        <div className="space-y-2">
          <Label htmlFor="employment_status">Employment Status</Label>
          <Controller
            name="employment_status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="employment_status">
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed">Employed</SelectItem>
                  <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.employment_status && (
            <p className="text-sm text-destructive">
              {errors.employment_status.message}
            </p>
          )}
        </div>

        {/* Employment Sector */}
        <div className="space-y-2">
          <Label htmlFor="employment_sector">Employment Sector</Label>
          <Input
            id="employment_sector"
            placeholder="Technology, Finance, etc."
            {...register("employment_sector")}
          />
          {errors.employment_sector && (
            <p className="text-sm text-destructive">
              {errors.employment_sector.message}
            </p>
          )}
        </div>

        {/* Employer Name */}
        <div className="space-y-2">
          <Label htmlFor="employer_name">Employer Name</Label>
          <Input
            id="employer_name"
            placeholder="Company name"
            {...register("employer_name")}
          />
          {errors.employer_name && (
            <p className="text-sm text-destructive">
              {errors.employer_name.message}
            </p>
          )}
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="job_title">Job Title</Label>
          <Input
            id="job_title"
            placeholder="Software Engineer"
            {...register("job_title")}
          />
          {errors.job_title && (
            <p className="text-sm text-destructive">
              {errors.job_title.message}
            </p>
          )}
        </div>

        {/* Employment Years */}
        <div className="space-y-2">
          <Label htmlFor="employment_years">Years of Employment</Label>
          <Input
            id="employment_years"
            type="number"
            min="0"
            max="50"
            placeholder="5"
            {...register("employment_years", { valueAsNumber: true })}
          />
          {errors.employment_years && (
            <p className="text-sm text-destructive">
              {errors.employment_years.message}
            </p>
          )}
        </div>

        {/* Current Job Months */}
        <div className="space-y-2">
          <Label htmlFor="current_job_months">Current Job (Months)</Label>
          <Input
            id="current_job_months"
            type="number"
            min="0"
            max="600"
            placeholder="24"
            {...register("current_job_months", { valueAsNumber: true })}
          />
          {errors.current_job_months && (
            <p className="text-sm text-destructive">
              {errors.current_job_months.message}
            </p>
          )}
        </div>

        {/* Monthly Income */}
        <div className="space-y-2">
          <Label htmlFor="monthly_income">Monthly Income (ETB)</Label>
          <Input
            id="monthly_income"
            type="number"
            step="0.01"
            min="0"
            placeholder="30000"
            {...register("monthly_income", { valueAsNumber: true })}
          />
          {errors.monthly_income && (
            <p className="text-sm text-destructive">
              {errors.monthly_income.message}
            </p>
          )}
        </div>

        {/* Bank Name */}
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name</Label>
          <Input
            id="bank_name"
            placeholder="Commercial Bank of Ethiopia"
            {...register("bank_name")}
          />
          {errors.bank_name && (
            <p className="text-sm text-destructive">
              {errors.bank_name.message}
            </p>
          )}
        </div>

        {/* Bank Account Number */}
        <div className="space-y-2">
          <Label htmlFor="bank_account_number">Bank Account Number</Label>
          <Input
            id="bank_account_number"
            placeholder="1234567890123"
            {...register("bank_account_number")}
          />
          {errors.bank_account_number && (
            <p className="text-sm text-destructive">
              {errors.bank_account_number.message}
            </p>
          )}
        </div>

        {/* Bank Account Type */}
        <div className="space-y-2">
          <Label htmlFor="bank_account_type">Bank Account Type</Label>
          <Controller
            name="bank_account_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="bank_account_type">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.bank_account_type && (
            <p className="text-sm text-destructive">
              {errors.bank_account_type.message}
            </p>
          )}
        </div>

        {/* Bank Account Age (Months) */}
        <div className="space-y-2">
          <Label htmlFor="bank_account_age_months">Bank Account Age (Months)</Label>
          <Input
            id="bank_account_age_months"
            type="number"
            min="0"
            max="600"
            placeholder="36"
            {...register("bank_account_age_months", { valueAsNumber: true })}
          />
          {errors.bank_account_age_months && (
            <p className="text-sm text-destructive">
              {errors.bank_account_age_months.message}
            </p>
          )}
        </div>

        {/* Bank Average Balance (6 months) */}
        <div className="space-y-2">
          <Label htmlFor="bank_avg_balance_6m">Average Balance - 6 Months (ETB)</Label>
          <Input
            id="bank_avg_balance_6m"
            type="number"
            step="0.01"
            min="0"
            placeholder="20000"
            {...register("bank_avg_balance_6m", { valueAsNumber: true })}
          />
          {errors.bank_avg_balance_6m && (
            <p className="text-sm text-destructive">
              {errors.bank_avg_balance_6m.message}
            </p>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

