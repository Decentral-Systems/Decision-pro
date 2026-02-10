"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  creditScoringFormSchema,
  CreditScoringFormData,
} from "@/lib/utils/validation";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubmitCreditScore } from "@/lib/api/hooks/useCreditScore";
import { CreditScoreResponse } from "@/types/credit";
import { useState, useEffect, useMemo } from "react";
import { transformFormDataTo168Features } from "@/lib/utils/transformCreditScore";
import { CustomerSearchFilter } from "@/components/forms/CustomerSearchFilter";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { CreditScoreResponseDisplay } from "@/components/credit/CreditScoreResponseDisplay";
import { useCustomer360 } from "@/features/customers/hooks/use-customer-360";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuditLogger } from "@/lib/utils/audit-logger";
import { useAuth } from "@/lib/auth/auth-context";
import { useDebounce } from "@/lib/utils/debouncedValidation";
import {
  InlineValidation,
  ValidatedField,
} from "@/components/common/ValidationIndicator";
import { useNbeCompliance } from "@/features/scoring/hooks/use-nbe-compliance";
import { NbeComplianceBlock } from "@/features/scoring/components/nbe-compliance-block";
import {
  ethiopianPhoneValidator,
  ethiopianIdValidator,
} from "@/lib/utils/ethiopianValidators";
import { AffordabilityIndicator } from "@/components/credit/AffordabilityIndicator";
import { useFormPersistence, saveFormData } from "@/lib/utils/formPersistence";
import { useToast } from "@/hooks/use-toast";
import {
  RecentCustomersList,
  useRecentCustomers,
} from "@/components/common/RecentCustomersList";
import { AutoFilledFieldWrapper } from "@/components/common/AutoFilledFieldWrapper";
import { DataSourceDisplay } from "@/components/common/DataSourceDisplay";
import { HistoricalScoreSummary } from "@/components/credit/HistoricalScoreSummary";
import { useAutoFilledFields } from "@/lib/hooks/useAutoFilledFields";
import { OfflineModeIndicator } from "@/components/common/OfflineModeIndicator";

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
  const submitMutation = useSubmitCreditScore();
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
      // Only restore if no customer is selected (to avoid overwriting customer data)
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
      const response = await submitMutation.mutateAsync(transformedData as any);
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
      const errorMessage =
        error?.message ||
        error?.detail ||
        error?.response?.data?.detail ||
        "Failed to calculate credit score. Please try again.";
      setSubmitError(errorMessage);
    }
  };

  const handleOverride = async (reason: string) => {
    setOverrideApproved(true);
    setShowOverrideDialog(false);

    // Re-submit form after override
    const formData = watch();
    await onSubmit(formData as CreditScoringFormData);
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

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
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
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Income, expenses, and balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthly_income">Monthly Income (ETB) *</Label>
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
                  {errors.monthly_income && (
                    <p className="text-sm text-destructive">
                      {errors.monthly_income.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_expenses">
                    Monthly Expenses (ETB) *
                  </Label>
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
                  <Label htmlFor="savings_balance">
                    Savings Balance (ETB) *
                  </Label>
                  <Input
                    id="savings_balance"
                    type="number"
                    {...register("savings_balance", { valueAsNumber: true })}
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checking_balance">
                    Checking Balance (ETB) *
                  </Label>
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
                  <Label htmlFor="collateral_value">
                    Collateral Value (ETB)
                  </Label>
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
        </TabsContent>

        {/* Credit History Tab */}
        <TabsContent value="credit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit History</CardTitle>
              <CardDescription>
                Credit accounts and payment history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credit_history_length">
                    Credit History Length (Years) *
                  </Label>
                  <Input
                    id="credit_history_length"
                    type="number"
                    {...register("credit_history_length", {
                      valueAsNumber: true,
                    })}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number_of_credit_accounts">
                    Number of Credit Accounts *
                  </Label>
                  <Input
                    id="number_of_credit_accounts"
                    type="number"
                    {...register("number_of_credit_accounts", {
                      valueAsNumber: true,
                    })}
                    placeholder="3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_history_score">
                    Payment History Score (0-100) *
                  </Label>
                  <Input
                    id="payment_history_score"
                    type="number"
                    {...register("payment_history_score", {
                      valueAsNumber: true,
                    })}
                    placeholder="85"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number_of_late_payments">
                    Number of Late Payments *
                  </Label>
                  <Input
                    id="number_of_late_payments"
                    type="number"
                    {...register("number_of_late_payments", {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number_of_defaults">
                    Number of Defaults *
                  </Label>
                  <Input
                    id="number_of_defaults"
                    type="number"
                    {...register("number_of_defaults", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
              <CardDescription>Employment status and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employment_status">Employment Status *</Label>
                  <Controller
                    name="employment_status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self_employed">
                            Self Employed
                          </SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_employed">Years Employed *</Label>
                  <Input
                    id="years_employed"
                    type="number"
                    step="0.1"
                    {...register("years_employed", { valueAsNumber: true })}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="employer_name">Employer Name</Label>
                  <Input
                    id="employer_name"
                    {...register("employer_name")}
                    placeholder="Company Name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Demographics and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    {...register("age", { valueAsNumber: true })}
                    placeholder="35"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <ValidatedField
                    status={
                      !phoneNumber
                        ? "idle"
                        : phoneValidation.isValidating
                          ? "validating"
                          : phoneValidation.valid
                            ? "valid"
                            : "invalid"
                    }
                  >
                    <Input
                      id="phone_number"
                      {...register("phone_number")}
                      placeholder="+251912345678"
                      className={
                        phoneValidation.valid && phoneNumber
                          ? "border-green-500"
                          : ""
                      }
                    />
                  </ValidatedField>
                  {phoneNumber && (
                    <InlineValidation
                      status={
                        phoneValidation.isValidating
                          ? "validating"
                          : phoneValidation.valid
                            ? "valid"
                            : "invalid"
                      }
                      message={
                        phoneValidation.isValidating
                          ? "Validating..."
                          : phoneValidation.valid
                            ? "Valid Ethiopian phone number"
                            : phoneValidation.error || "Invalid format"
                      }
                    />
                  )}
                  {errors.phone_number && (
                    <p className="text-sm text-destructive">
                      {errors.phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <ValidatedField
                    status={
                      !idNumber
                        ? "idle"
                        : idValidation.isValidating
                          ? "validating"
                          : idValidation.valid
                            ? "valid"
                            : "invalid"
                    }
                  >
                    <Input
                      id="id_number"
                      {...register("id_number")}
                      placeholder="1234567890"
                      maxLength={10}
                      className={
                        idValidation.valid && idNumber ? "border-green-500" : ""
                      }
                    />
                  </ValidatedField>
                  {idNumber && (
                    <InlineValidation
                      status={
                        idValidation.isValidating
                          ? "validating"
                          : idValidation.valid
                            ? "valid"
                            : "invalid"
                      }
                      message={
                        idValidation.isValidating
                          ? "Validating..."
                          : idValidation.valid
                            ? "Valid Ethiopian ID number"
                            : idValidation.error || "Must be exactly 10 digits"
                      }
                    />
                  )}
                  {errors.id_number && (
                    <p className="text-sm text-destructive">
                      {errors.id_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    {...register("region")}
                    placeholder="Addis Ababa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urban_rural">Urban/Rural</Label>
                  <Controller
                    name="urban_rural"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urban">Urban</SelectItem>
                          <SelectItem value="rural">Rural</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_sector">Business Sector</Label>
                  <Input
                    id="business_sector"
                    {...register("business_sector")}
                    placeholder="Technology"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guarantor_available">
                    Guarantor Available
                  </Label>
                  <Controller
                    name="guarantor_available"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
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
          disabled={submitMutation.isPending || isLoadingCustomer || !canSubmit}
          title={
            !canSubmit && nbeCompliance && !nbeCompliance.compliant
              ? "NBE compliance violations must be resolved or supervisor override required"
              : undefined
          }
        >
          {submitMutation.isPending ? (
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
