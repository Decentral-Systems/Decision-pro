"use client";

import { DataSourceDisplay } from "@/components/common/DataSourceDisplay";
import { OfflineModeIndicator } from "@/components/common/OfflineModeIndicator";
import {
  RecentCustomersList,
  useRecentCustomers,
} from "@/components/common/RecentCustomersList";
import { AffordabilityIndicator } from "@/components/credit/AffordabilityIndicator";
import { CreditScoreResponseDisplay } from "@/components/credit/CreditScoreResponseDisplay";
import { HistoricalScoreSummary } from "@/components/credit/HistoricalScoreSummary";
import { CustomerSearchFilter } from "@/components/forms/CustomerSearchFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomer360 } from "@/features/customers/hooks/use-customer-360";
import { NbeComplianceBlock } from "@/features/scoring/components/nbe-compliance-block";
import { useSubmitCreditScore } from "@/features/scoring/hooks/mutation/use-submit-credit-score";
import { useNbeCompliance } from "@/features/scoring/hooks/use-nbe-compliance";
import {
  type CreditScoringFormData,
  creditScoringFormSchema,
} from "@/features/scoring/schema/scoring.schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";
import { useAutoFilledFields } from "@/lib/hooks/useAutoFilledFields";
import { useAuditLogger } from "@/lib/utils/audit-logger";
import { useDebounce } from "@/lib/utils/debouncedValidation";
import {
  ethiopianIdValidator,
  ethiopianPhoneValidator,
} from "@/lib/utils/ethiopianValidators";
import { saveFormData, useFormPersistence } from "@/lib/utils/form-persistance";
import { transformFormDataTo168Features } from "@/lib/utils/transformCreditScore";
import { CreditScoreResponse } from "@/types/credit";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CreditScoringBasicInfoTab } from "./credit-scoring-basic-info-tab";
import { CreditScoringCreditHistoryTab } from "./credit-scoring-credit-history-tab";
import { CreditScoringEmploymentTab } from "./credit-scoring-employment-tab";
import { CreditScoringFinancialTab } from "./credit-scoring-financial-tab";
import { CreditScoringPersonalTab } from "./credit-scoring-personal-tab";

interface CreditScoringFormProps {
  onResult?: (result: CreditScoreResponse) => void;
  customerType?: "new" | "existing";
  selectedCustomerId?: string;
  onCustomerSelect?: (customerId: string) => void;
}

export function CreditScoringForm({
  onResult,
  customerType = "new",
  selectedCustomerId,
  onCustomerSelect,
}: CreditScoringFormProps) {
  const [result, setResult] = useState<CreditScoreResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideApproved, setOverrideApproved] = useState(false);
  const { submitCreditScoreMutation, isPending } = useSubmitCreditScore();

  const {
    logComplianceViolation,
    logCreditScoreCalculation,
    logDataAccess,
    generateCorrelationId,
    setCorrelationId,
    setUserId,
  } = useAuditLogger();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToRecent } = useRecentCustomers();

  // Set user ID for audit logging
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user?.id, setUserId]);

  // Fetch customer 360 data if existing customer is selected
  const {
    data: customerData,
    isLoading: isLoadingCustomer,
    error: customerError,
  } = useCustomer360({ customerId: selectedCustomerId ?? null });

  const {
    markAsAutoFilled,
    isAutoFilled,
    getFieldInfo,
    getAllDataSources,
    getOverallConfidence,
    getLastUpdated,
    markAsManuallyEdited,
  } = useAutoFilledFields();

  // Debug logging
  useEffect(() => {
    console.log("Selected Customer ID changed:", selectedCustomerId);
    if (selectedCustomerId) {
      console.log("Fetching customer 360 data for:", selectedCustomerId);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (customerError) {
      console.error("Customer 360 fetch error:", customerError);
      setSubmitError(
        `Failed to load customer data: ${customerError.message || "Unknown error"}`
      );
    }
  }, [customerError]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<CreditScoringFormData>({
    resolver: zodResolver(creditScoringFormSchema),
    defaultValues: {
      employment_status: "employed",
      urban_rural: "urban",
    },
  });

  // Form data persistence
  const formData = watch();
  const { loadData, clearData } = useFormPersistence(formData, {
    formId: `credit_scoring_${selectedCustomerId || "new"}`,
    debounceMs: 500,
  });

  // Load saved form data on mount
  useEffect(() => {
    const savedData = loadData();
    if (savedData && !selectedCustomerId) {
      reset(savedData);
    }
  }, []); // Only on mount

  // Watch form values for NBE compliance calculation
  const loanAmount = watch("loan_amount");
  const monthlyIncome = watch("monthly_income");
  const loanTermMonths = watch("loan_term_months");
  const phoneNumber = watch("phone_number");
  const idNumber = watch("id_number");

  // Debounce values for real-time validation (100ms delay)
  const debouncedLoanAmount = useDebounce(loanAmount, 100);
  const debouncedMonthlyIncome = useDebounce(monthlyIncome, 100);
  const debouncedLoanTermMonths = useDebounce(loanTermMonths, 100);
  const debouncedPhoneNumber = useDebounce(phoneNumber, 100);
  const debouncedIdNumber = useDebounce(idNumber, 100);

  const { nbeCompliance, canSubmit } = useNbeCompliance({
    loanAmount: debouncedLoanAmount,
    monthlyIncome: debouncedMonthlyIncome,
    loanTermMonths: debouncedLoanTermMonths,
    overrideApproved,
  });

  // Real-time phone number validation
  const [phoneValidating, setPhoneValidating] = useState(false);
  const phoneValidation = useMemo(() => {
    if (!debouncedPhoneNumber) return { valid: true, isValidating: false };
    setPhoneValidating(true);
    try {
      ethiopianPhoneValidator.parse(debouncedPhoneNumber);
      setPhoneValidating(false);
      return { valid: true, isValidating: false };
    } catch (error: any) {
      setPhoneValidating(false);
      return {
        valid: false,
        isValidating: false,
        error: error.errors?.[0]?.message || "Invalid phone number",
      };
    }
  }, [debouncedPhoneNumber]);

  // Real-time ID number validation
  const [idValidating, setIdValidating] = useState(false);
  const idValidation = useMemo(() => {
    if (!debouncedIdNumber) return { valid: true, isValidating: false };
    setIdValidating(true);
    try {
      ethiopianIdValidator.parse(debouncedIdNumber);
      setIdValidating(false);
      return { valid: true, isValidating: false };
    } catch (error: any) {
      setIdValidating(false);
      return {
        valid: false,
        isValidating: false,
        error: error.errors?.[0]?.message || "Invalid ID number",
      };
    }
  }, [debouncedIdNumber]);

  // Populate form when customer data is loaded
  useEffect(() => {
    console.log("Customer data effect triggered:", {
      customerData,
      selectedCustomerId,
    });

    if (customerData && selectedCustomerId) {
      console.log("Populating form with customer data:", customerData);
      const data = customerData as Record<string, unknown> & {
        customer?: Record<string, unknown>;
        profile?: Record<string, unknown>;
        credit?: Record<string, unknown>;
        risk?: Record<string, unknown>;
        income?: unknown;
        expenses?: unknown;
        savings?: unknown;
        checking?: unknown;
        debt?: unknown;
        credit_history_years?: unknown;
        credit_accounts?: unknown;
        payment_score?: unknown;
        late_payments?: unknown;
        defaults?: unknown;
        utilization_ratio?: unknown;
        employment_status?: unknown;
        employment_years?: unknown;
        employer?: unknown;
        age?: unknown;
        phone?: unknown;
        id_number?: unknown;
        region?: unknown;
        city?: unknown;
        location_type?: unknown;
        sector?: unknown;
      };
      const customer = data.customer || data;
      const profile = data.profile || data;
      const _creditData = data.credit || data;
      const _riskData = data.risk || data;

      // Map customer data to form fields
      const formData: Partial<CreditScoringFormData> = {
        customer_id: selectedCustomerId,
        // Map financial data
        monthly_income:
          (customer.monthly_income as number | undefined) ||
          (profile?.monthly_income as number | undefined) ||
          (data.income as number | undefined) ||
          0,
        monthly_expenses:
          (customer.monthly_expenses as number | undefined) ||
          (profile?.monthly_expenses as number | undefined) ||
          (data.expenses as number | undefined) ||
          0,
        savings_balance:
          (customer.savings_balance as number | undefined) ||
          (profile?.savings_balance as number | undefined) ||
          (data.savings as number | undefined) ||
          0,
        checking_balance:
          (customer.checking_balance as number | undefined) ||
          (profile?.checking_balance as number | undefined) ||
          (data.checking as number | undefined) ||
          0,
        total_debt:
          (customer.total_debt as number | undefined) ||
          (profile?.total_debt as number | undefined) ||
          (data.debt as number | undefined) ||
          0,
        // Map credit history
        credit_history_length:
          (customer.credit_history_length as number | undefined) ||
          (profile?.credit_history_length as number | undefined) ||
          (data.credit_history_years as number | undefined) ||
          0,
        number_of_credit_accounts:
          (customer.number_of_credit_accounts as number | undefined) ||
          (profile?.number_of_credit_accounts as number | undefined) ||
          (data.credit_accounts as number | undefined) ||
          0,
        payment_history_score:
          (customer.payment_history_score as number | undefined) ||
          (profile?.payment_history_score as number | undefined) ||
          (data.payment_score as number | undefined) ||
          85,
        number_of_late_payments:
          (customer.number_of_late_payments as number | undefined) ||
          (profile?.number_of_late_payments as number | undefined) ||
          (data.late_payments as number | undefined) ||
          0,
        number_of_defaults:
          (customer.number_of_defaults as number | undefined) ||
          (profile?.number_of_defaults as number | undefined) ||
          (data.defaults as number | undefined) ||
          0,
        credit_utilization_ratio:
          (customer.credit_utilization_ratio as number | undefined) ||
          (profile?.credit_utilization_ratio as number | undefined) ||
          (data.utilization_ratio as number | undefined) ||
          30,
        // Map employment
        employment_status:
          (customer.employment_status as CreditScoringFormData["employment_status"]) ||
          (profile?.employment_status as CreditScoringFormData["employment_status"]) ||
          (data.employment_status as CreditScoringFormData["employment_status"]) ||
          "employed",
        years_employed:
          (customer.years_employed as number | undefined) ||
          (profile?.years_employed as number | undefined) ||
          (data.employment_years as number | undefined) ||
          0,
        employer_name:
          (customer.employer_name as string | undefined) ||
          (profile?.employer_name as string | undefined) ||
          (data.employer as string | undefined) ||
          "",
        // Map personal
        age:
          (customer.age as number | undefined) ||
          (profile?.age as number | undefined) ||
          (data.age as number | undefined) ||
          35,
        phone_number:
          (customer.phone_number as string | undefined) ||
          (profile?.phone_number as string | undefined) ||
          (data.phone as string | undefined) ||
          "",
        id_number:
          (customer.id_number as string | undefined) ||
          (profile?.id_number as string | undefined) ||
          (data.id_number as string | undefined) ||
          "",
        region:
          (customer.region as CreditScoringFormData["region"]) ||
          (profile?.region as CreditScoringFormData["region"]) ||
          (data.region as CreditScoringFormData["region"]) ||
          (customer.city as CreditScoringFormData["region"]) ||
          undefined,
        urban_rural:
          (customer.urban_rural as CreditScoringFormData["urban_rural"]) ||
          (profile?.urban_rural as CreditScoringFormData["urban_rural"]) ||
          (data.location_type as CreditScoringFormData["urban_rural"]) ||
          "urban",
        business_sector:
          (customer.business_sector as CreditScoringFormData["business_sector"]) ||
          (profile?.business_sector as CreditScoringFormData["business_sector"]) ||
          (data.sector as CreditScoringFormData["business_sector"]) ||
          undefined,
      };

      // Reset form with customer data
      console.log("Resetting form with data:", formData);
      reset(formData);
      setSubmitError(null); // Clear any previous errors

      // Mark all populated fields as auto-filled
      const dataTimestamp = new Date();
      Object.entries(formData).forEach(([fieldName, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Determine data source based on field
          let source: "crm" | "credit_bureau" | "bank" | "calculated" = "crm";
          if (fieldName.includes("credit") || fieldName.includes("payment")) {
            source = "credit_bureau";
          } else if (
            fieldName.includes("balance") ||
            fieldName.includes("debt")
          ) {
            source = "bank";
          } else if (
            fieldName.includes("ratio") ||
            fieldName.includes("score")
          ) {
            source = "calculated";
          }

          markAsAutoFilled(fieldName, value, source, dataTimestamp, 0.9);
        }
      });
    }
  }, [customerData, selectedCustomerId, reset, markAsAutoFilled]);

  const onSubmit = async (data: CreditScoringFormData) => {
    console.log("onSubmit called with data:", data);

    try {
      setSubmitError(null);
      console.log("Form data submitted:", data);

      // Check NBE compliance before submission
      if (nbeCompliance && !nbeCompliance.compliant && !overrideApproved) {
        // Log violation
        await logComplianceViolation(
          data.customer_id,
          nbeCompliance.violations.map((v) => ({
            rule: v.rule,
            description: v.description,
            severity: v.severity,
          })),
          data.loan_amount,
          data.monthly_income
        );

        // Show override dialog
        setShowOverrideDialog(true);
        return;
      }

      // Generate correlation ID for request tracking
      const correlationId = generateCorrelationId();

      // Log customer data access
      if (selectedCustomerId) {
        await logDataAccess(
          selectedCustomerId,
          "Customer 360",
          "Credit scoring"
        );
      }

      // Transform form data to 168-feature format
      const transformedData = transformFormDataTo168Features(data);
      console.log("Transformed to 168 features:", transformedData);

      // Submit the transformed data
      const response = await submitCreditScoreMutation(
        transformedData as CreditScoringFormData
      );
      console.log("Credit score response:", response);

      // Set correlation ID from response if available
      if (response.correlation_id) {
        setCorrelationId(response.correlation_id);
      }

      // Log credit score calculation
      await logCreditScoreCalculation(
        data.customer_id,
        response.credit_score,
        response.risk_category,
        undefined, // model version if available
        {
          loan_amount: data.loan_amount,
          loan_term_months: data.loan_term_months,
          monthly_income: data.monthly_income,
          correlation_id: response.correlation_id || correlationId,
        }
      );

      // Add to recent customers
      addToRecent({
        customer_id: data.customer_id,
        full_name: undefined, // Could be fetched from customer data
        last_score: response.credit_score,
      });

      setResult(response);
      onResult?.(response);

      // Reset override approval after successful submission
      setOverrideApproved(false);

      // Clear saved form data on successful submission
      clearData();
    } catch (error: any) {
      console.error("Credit scoring error:", error);
    }
  };

  const handleOverride = async (reason: string) => {
    setOverrideApproved(true);
    setShowOverrideDialog(false);

    // Re-submit form after override
    const formData = watch();
    submitCreditScoreMutation(formData as CreditScoringFormData);
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    // Find first error message
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      setSubmitError(`Validation error: ${firstError.message}`);
    } else {
      setSubmitError("Please fill in all required fields correctly.");
    }
  };

  const handleReset = () => {
    reset({
      employment_status: "employed",
      urban_rural: "urban",
    });
    setResult(null);
    setSubmitError(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      {/* Customer Selection for Existing Customers */}
      {customerType === "existing" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Customer Selection</CardTitle>
              <CardDescription>
                Search and select an existing customer to populate the form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerSearchFilter
                onSelectCustomer={(customerId) => {
                  console.log("Customer selected:", customerId);
                  setResult(null); // Clear previous results
                  setSubmitError(null); // Clear previous errors
                  onCustomerSelect?.(customerId);
                }}
                selectedCustomerId={selectedCustomerId}
              />
              {isLoadingCustomer && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading customer data...
                </div>
              )}
              {customerError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load customer data. Please try selecting again.
                  </AlertDescription>
                </Alert>
              )}
              {selectedCustomerId && customerData != null && (
                <Alert className="mt-4">
                  <AlertDescription>
                    Customer data loaded. You can modify any values in the form
                    below before submitting.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <RecentCustomersList
            onSelectCustomer={(customerId) => {
              setResult(null);
              setSubmitError(null);
              onCustomerSelect?.(customerId);
            }}
            maxItems={5}
          />
        </div>
      )}

      {/* Offline Mode Indicator */}
      <OfflineModeIndicator
        onSync={() => {
          // Trigger data sync when network recovers
          if (selectedCustomerId) {
            onCustomerSelect?.(selectedCustomerId);
          }
        }}
      />

      {submitError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <NbeComplianceBlock
        compliance={nbeCompliance}
        showOverrideDialog={showOverrideDialog}
        onOpenOverrideDialogChange={setShowOverrideDialog}
        onOverride={handleOverride}
        customerId={watch("customer_id")}
        supervisorId={user?.id}
      />

      {/* Data Source Display */}
      {selectedCustomerId && Object.keys(getAllDataSources()).length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DataSourceDisplay
            sources={getAllDataSources()}
            overallConfidence={getOverallConfidence()}
            lastUpdated={getLastUpdated()}
            onRefresh={() => {
              // Trigger customer data refresh
              if (selectedCustomerId) {
                onCustomerSelect?.(selectedCustomerId);
              }
            }}
          />
          {selectedCustomerId && (
            <HistoricalScoreSummary customerId={selectedCustomerId} />
          )}
        </div>
      )}

      {/* Affordability Indicator - Real-time 1/3 Salary Rule */}
      {loanAmount && monthlyIncome && loanTermMonths && (
        <AffordabilityIndicator
          loanAmount={loanAmount}
          monthlyIncome={monthlyIncome}
          loanTermMonths={loanTermMonths}
        />
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-5 flex-wrap md:flex-nowrap">
          <TabsTrigger value="basic" className="text-xs md:text-sm">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-xs md:text-sm">
            Financial
          </TabsTrigger>
          <TabsTrigger value="credit" className="text-xs md:text-sm">
            Credit History
          </TabsTrigger>
          <TabsTrigger value="employment" className="text-xs md:text-sm">
            Employment
          </TabsTrigger>
          <TabsTrigger value="personal" className="text-xs md:text-sm">
            Personal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <CreditScoringBasicInfoTab
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            customerType={customerType}
            selectedCustomerId={selectedCustomerId}
            isAutoFilled={isAutoFilled}
            getFieldInfo={getFieldInfo}
            markAsManuallyEdited={markAsManuallyEdited}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <CreditScoringFinancialTab
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isAutoFilled={isAutoFilled}
            getFieldInfo={getFieldInfo}
            markAsManuallyEdited={markAsManuallyEdited}
          />
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          <CreditScoringCreditHistoryTab
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <CreditScoringEmploymentTab
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <CreditScoringPersonalTab
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            phoneNumber={phoneNumber}
            idNumber={idNumber}
            phoneValidation={phoneValidation}
            idValidation={idValidation}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const currentData = getValues();
            saveFormData(currentData, {
              formId: `credit_scoring_${selectedCustomerId || "new"}`,
            });
            toast({
              title: "Draft Saved",
              description: "Form data has been saved as draft",
            });
          }}
        >
          Save as Draft
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isPending || isLoadingCustomer || !canSubmit}
          title={
            !canSubmit && nbeCompliance && !nbeCompliance.compliant
              ? "NBE compliance violations must be resolved or supervisor override required"
              : undefined
          }
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            "Calculate Credit Score"
          )}
        </Button>
      </div>

      {/* Advanced Response Display */}
      {result && (
        <div className="mt-6">
          <CreditScoreResponseDisplay
            response={result}
            formData={{
              loan_amount: loanAmount,
              monthly_income: monthlyIncome,
              loan_term_months: loanTermMonths,
            }}
          />
        </div>
      )}
    </form>
  );
}
