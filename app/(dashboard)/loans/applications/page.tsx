"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useLoanApplications,
  useCreateLoanApplication,
  useBulkLoanOperations,
} from "@/lib/api/hooks/useLoans";
import { apiGatewayClient } from "@/lib/api/clients/api-gateway";
import { useCustomerSearchAutocomplete } from "@/lib/api/hooks/useCustomers";
import { useCustomer360 } from "@/features/customers/hooks/use-customer-360";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Upload,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  useValidateNBEComplianceStandalone,
  useEvaluateProductRules,
  useEvaluateWorkflowRules,
  usePredictDefaultRisk,
} from "@/lib/api/hooks/useLoans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";

function LoanApplicationsPageContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>("");
  const [customerIdFilter, setCustomerIdFilter] = useState<string>("");
  const [nbeCompliantFilter, setNbeCompliantFilter] = useState<string>("");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("");
  const [minAmountFilter, setMinAmountFilter] = useState<string>("");
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>();
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>();
  const [approvalDateFromFilter, setApprovalDateFromFilter] = useState<
    Date | undefined
  >();
  const [approvalDateToFilter, setApprovalDateToFilter] = useState<
    Date | undefined
  >();
  const [minCreditScoreFilter, setMinCreditScoreFilter] = useState<string>("");
  const [maxCreditScoreFilter, setMaxCreditScoreFilter] = useState<string>("");
  const [applicationNumberFilter, setApplicationNumberFilter] =
    useState<string>("");
  const [customerNameFilter, setCustomerNameFilter] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedFilterPresets, setSavedFilterPresets] = useState<any[]>([]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, refetch } = useLoanApplications({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    status: statusFilter || undefined,
    loan_type: loanTypeFilter || undefined,
    customer_id: customerIdFilter || undefined,
    customer_name: customerNameFilter || undefined,
    application_number: applicationNumberFilter || undefined,
    date_from: dateFromFilter
      ? dateFromFilter.toISOString().split("T")[0]
      : undefined,
    date_to: dateToFilter
      ? dateToFilter.toISOString().split("T")[0]
      : undefined,
    approval_date_from: approvalDateFromFilter
      ? approvalDateFromFilter.toISOString().split("T")[0]
      : undefined,
    approval_date_to: approvalDateToFilter
      ? approvalDateToFilter.toISOString().split("T")[0]
      : undefined,
    min_credit_score: minCreditScoreFilter
      ? parseFloat(minCreditScoreFilter)
      : undefined,
    max_credit_score: maxCreditScoreFilter
      ? parseFloat(maxCreditScoreFilter)
      : undefined,
  });

  const createLoanMutation = useCreateLoanApplication();
  const bulkOperationsMutation = useBulkLoanOperations();
  const { toast } = useToast();

  const [bulkOperationsOpen, setBulkOperationsOpen] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<number[]>(
    []
  );
  const [bulkOperationType, setBulkOperationType] = useState<
    "update" | "validate"
  >("update");
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<string>("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerCreditScore, setCustomerCreditScore] = useState<number | null>(
    null
  );
  const [customerRiskLevel, setCustomerRiskLevel] = useState<string | null>(
    null
  );

  // Real-time validation state
  const [nbeValidation, setNbeValidation] = useState<any>(null);
  const [rulesEvaluation, setRulesEvaluation] = useState<any>(null);
  const [defaultPrediction, setDefaultPrediction] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validation hooks
  const validateNBE = useValidateNBEComplianceStandalone();
  const evaluateRules = useEvaluateProductRules();
  const evaluateWorkflow = useEvaluateWorkflowRules();
  const predictDefault = usePredictDefaultRisk();

  // Customer autocomplete
  const { data: customerSearchResults, isLoading: isSearchingCustomers } =
    useCustomerSearchAutocomplete(customerSearchQuery, {
      enabled: customerSearchQuery.length >= 2,
    });

  // Fetch customer 360 data when customer is selected
  const { data: customer360Data } = useCustomer360({
    customerId: selectedCustomer?.customer_id ?? null,
  });

  useEffect(() => {
    if (customer360Data?.credit) {
      const credit = customer360Data.credit;
      if (credit?.score) {
        setCustomerCreditScore(credit.score);
      }
      if (credit?.risk_level) {
        setCustomerRiskLevel(credit.risk_level);
      }
    }
  }, [customer360Data]);

  const [formData, setFormData] = useState({
    customer_id: "",
    loan_type: "personal_loan",
    requested_amount: "",
    loan_term_months: "",
    monthly_income: "",
    loan_purpose: "",
    collateral_id: "",
    application_notes: "",
    product_name: "",
    product_category: "",
    interest_rate: "",
    // Existing debt obligations
    existing_monthly_debt: "",
    // Employment details
    employment_type: "",
    years_at_employer: "",
    employment_verification_status: "",
    employment_contract_type: "",
    employment_stability_score: "",
    industry_stability: "",
    // Business details (for business loans)
    business_registration_number: "",
    business_type: "",
    business_sector: "",
    business_age_months: "",
    annual_revenue: "",
    // Collateral details
    collateral_type: "",
    collateral_value: "",
    collateral_ownership_verified: false,
    collateral_documentation_available: false,
    // Co-signer information
    co_signer_id: "",
    co_signer_relationship: "",
    co_signer_monthly_income: "",
    co_signer_credit_score: "",
    // Location context
    application_latitude: "",
    application_longitude: "",
    // Urgency information
    loan_urgency_score: "",
    reason_for_urgency: "",
    expected_disbursement_date: "",
  });

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Validation functions
  const validateEthiopianPhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const pattern = /^(\+251|0)[0-9]{9}$/;
    return pattern.test(phone);
  };

  const validateEthiopianIDNumber = (id: string): boolean => {
    if (!id) return true; // Optional field
    const pattern = /^[0-9]{10}$/;
    return pattern.test(id);
  };

  const validateCrossFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Loan amount vs income validation
    if (formData.requested_amount && formData.monthly_income) {
      const loanAmount = parseFloat(formData.requested_amount);
      const monthlyIncome = parseFloat(formData.monthly_income);

      if (!isNaN(loanAmount) && !isNaN(monthlyIncome) && monthlyIncome > 0) {
        const maxAffordableLoan = monthlyIncome * 12 * 5; // 5 years max
        if (loanAmount > maxAffordableLoan) {
          errors.requested_amount = `Loan amount exceeds maximum affordable amount (${maxAffordableLoan.toLocaleString()} ETB based on income)`;
        }

        // Debt-to-income ratio warning
        const existingDebt = parseFloat(formData.existing_monthly_debt || "0");
        const totalDebtService =
          existingDebt +
          loanAmount / parseFloat(formData.loan_term_months || "1");
        const debtToIncomeRatio = totalDebtService / monthlyIncome;

        if (debtToIncomeRatio > 0.5) {
          errors.existing_monthly_debt = `High debt-to-income ratio: ${(debtToIncomeRatio * 100).toFixed(1)}%. Consider reducing loan amount or term.`;
        }
      }
    }

    return errors;
  };

  // Auto-save draft functionality
  useEffect(() => {
    if (typeof window !== "undefined" && formData.customer_id) {
      const draftKey = `loan_application_draft_${formData.customer_id}`;
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              formData,
              timestamp: new Date().toISOString(),
            })
          );
          console.log(
            "[AutoSave] Draft saved for customer",
            formData.customer_id
          );
        } catch (e) {
          console.error("[AutoSave] Failed to save draft:", e);
        }
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    if (typeof window !== "undefined" && formData.customer_id) {
      const draftKey = `loan_application_draft_${formData.customer_id}`;
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.formData) {
            setFormData(draft.formData);
            toast({
              title: "Draft Restored",
              description: "Previous draft has been restored",
            });
          }
        }
      } catch (e) {
        console.error("[AutoSave] Failed to load draft:", e);
      }
    }
  }, []);

  // Check for duplicate applications
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!formData.customer_id || !formData.loan_type) return;

      try {
        const existingApps = await apiGatewayClient.listLoanApplications({
          customer_id: formData.customer_id,
          loan_type: formData.loan_type,
          limit: 10,
        });

        const items = existingApps?.data || existingApps?.items || [];
        const recentDrafts = items.filter(
          (app: any) =>
            app.application_status === "draft" &&
            app.customer_id === formData.customer_id
        );

        if (recentDrafts.length > 0) {
          setDuplicateWarning(
            `Found ${recentDrafts.length} existing draft application(s) for this customer`
          );
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {
        // Silently fail duplicate check
        console.debug("Duplicate check failed:", e);
      }
    };

    const timeoutId = setTimeout(checkDuplicates, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.customer_id, formData.loan_type]);

  // Real-time validation effect
  useEffect(() => {
    // Validate cross-field rules
    const crossFieldErrors = validateCrossFields();
    setFormErrors(crossFieldErrors);

    const validateForm = async () => {
      // Only validate if we have minimum required fields
      if (
        !formData.requested_amount ||
        !formData.loan_term_months ||
        !formData.monthly_income
      ) {
        setNbeValidation(null);
        setRulesEvaluation(null);
        setDefaultPrediction(null);
        return;
      }

      const loanAmount = parseFloat(formData.requested_amount);
      const monthlyIncome = parseFloat(formData.monthly_income);
      const loanTermMonths = parseInt(formData.loan_term_months);

      if (
        isNaN(loanAmount) ||
        isNaN(monthlyIncome) ||
        isNaN(loanTermMonths) ||
        loanAmount <= 0 ||
        monthlyIncome <= 0 ||
        loanTermMonths <= 0
      ) {
        return;
      }

      setIsValidating(true);

      try {
        // 1. NBE Compliance Validation
        try {
          const nbeResult = await validateNBE.mutateAsync({
            loan_amount: loanAmount,
            monthly_income: monthlyIncome,
            loan_term_months: loanTermMonths,
            interest_rate: formData.interest_rate
              ? parseFloat(formData.interest_rate)
              : undefined,
            monthly_debt_service: formData.existing_monthly_debt
              ? parseFloat(formData.existing_monthly_debt)
              : undefined,
          });
          setNbeValidation(nbeResult?.data || nbeResult);
        } catch (err: any) {
          // NBE validation failed, but continue with other validations
          console.warn("NBE validation failed:", err);
          // Set a basic validation result if we can calculate it client-side
          const maxAffordablePayment = monthlyIncome / 3;
          const proposedPayment = loanAmount / loanTermMonths;
          if (proposedPayment > maxAffordablePayment) {
            setNbeValidation({
              compliant: false,
              violations: [
                {
                  rule: "1/3_salary_rule",
                  description: `Proposed payment (${proposedPayment.toFixed(2)} ETB) exceeds 1/3 of monthly income (${maxAffordablePayment.toFixed(2)} ETB)`,
                },
              ],
              max_affordable_payment: maxAffordablePayment,
              max_affordable_loan: maxAffordablePayment * loanTermMonths,
            });
          }
        }

        // 2. Rules Engine Evaluation (if we have customer and product type)
        if (formData.customer_id && formData.loan_type) {
          try {
            const rulesResult = await evaluateRules.mutateAsync({
              product_type: formData.loan_type,
              application_data: {
                customer_id: formData.customer_id,
                loan_amount: loanAmount,
                monthly_income: monthlyIncome,
                loan_term_months: loanTermMonths,
                credit_score: customerCreditScore || undefined,
              },
              evaluation_scope: "all",
            });
            setRulesEvaluation(rulesResult?.data || rulesResult);

            // Also evaluate workflow rules
            try {
              const workflowResult = await evaluateWorkflow.mutateAsync({
                application_data: {
                  customer_id: formData.customer_id,
                  loan_amount: loanAmount,
                  monthly_income: monthlyIncome,
                  loan_term_months: loanTermMonths,
                  credit_score: customerCreditScore || undefined,
                  risk_level: customerRiskLevel || undefined,
                },
                product_type: formData.loan_type,
              });
              // Merge workflow results with rules evaluation
              setRulesEvaluation((prev: any) => ({
                ...(prev || {}),
                workflow: workflowResult?.data || workflowResult,
              }));
            } catch (err) {
              // Workflow evaluation failed, continue without it
              console.warn("Workflow rules evaluation failed:", err);
            }
          } catch (err) {
            // Rules evaluation failed, continue without it
            console.warn("Rules evaluation failed:", err);
          }
        }

        // 3. Default Prediction (if we have customer and required fields)
        // Only call if we have minimum required fields
        if (
          formData.customer_id &&
          loanAmount &&
          loanTermMonths &&
          monthlyIncome
        ) {
          try {
            const defaultResult = await predictDefault.mutateAsync({
              customer_id: formData.customer_id,
              loan_amount: loanAmount,
              loan_term_months: loanTermMonths,
              monthly_income: monthlyIncome,
              credit_score: customerCreditScore || undefined,
              employment_years:
                customer360Data?.employment?.years || undefined,
              age: customer360Data?.personal?.age || undefined,
            });
            setDefaultPrediction(defaultResult?.data || defaultResult);
          } catch (err: any) {
            // Default prediction failed, continue without it
            // Only log if it's not a 422 (validation error) or 404 (endpoint not found)
            if (err?.statusCode !== 422 && err?.statusCode !== 404) {
              console.warn("Default prediction failed:", err);
            }
            // Set empty prediction so UI doesn't show loading
            setDefaultPrediction(null);
          }
        } else {
          // Clear prediction if we don't have required fields
          setDefaultPrediction(null);
        }
      } catch (error) {
        console.error("Validation error:", error);
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateForm, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.requested_amount,
    formData.loan_term_months,
    formData.monthly_income,
    formData.interest_rate,
    formData.existing_monthly_debt,
    formData.customer_id,
    formData.loan_type,
    customerCreditScore,
    customerRiskLevel,
    customer360Data,
  ]);

  const handleCreateLoan = async () => {
    try {
      console.log("[handleCreateLoan] Form data:", formData);
      console.log("[handleCreateLoan] NBE validation:", nbeValidation);
      console.log("[handleCreateLoan] Button disabled check:", {
        isPending: createLoanMutation.isPending,
        nbeCompliant: nbeValidation?.compliant,
        hasViolations: nbeValidation?.violations?.length > 0,
      });

      // Basic validation
      if (!formData.customer_id) {
        console.warn("[handleCreateLoan] Customer ID missing");
        toast({
          title: "Validation Error",
          description: "Customer ID is required",
          variant: "destructive",
        });
        return;
      }
      if (
        !formData.requested_amount ||
        parseFloat(formData.requested_amount) <= 0
      ) {
        toast({
          title: "Validation Error",
          description: "Valid requested amount is required",
          variant: "destructive",
        });
        return;
      }
      if (
        !formData.loan_term_months ||
        parseInt(formData.loan_term_months) < 1 ||
        parseInt(formData.loan_term_months) > 60
      ) {
        toast({
          title: "Validation Error",
          description: "Loan term must be between 1 and 60 months",
          variant: "destructive",
        });
        return;
      }
      if (
        !formData.monthly_income ||
        parseFloat(formData.monthly_income) <= 0
      ) {
        toast({
          title: "Validation Error",
          description: "Monthly income is required for NBE compliance",
          variant: "destructive",
        });
        return;
      }

      // NBE Compliance Check - Block submission if non-compliant
      if (
        nbeValidation &&
        !nbeValidation.compliant &&
        nbeValidation.violations &&
        nbeValidation.violations.length > 0
      ) {
        toast({
          title: "NBE Compliance Violation",
          description: `Cannot submit non-compliant loan. ${nbeValidation.violations.length} violation(s) found. Please review and fix the issues.`,
          variant: "destructive",
        });
        return;
      }

      // Rules Engine Eligibility Check - Warn if not eligible
      if (
        rulesEvaluation &&
        rulesEvaluation.final_result?.decision === "reject"
      ) {
        const confirmed = window.confirm(
          "Rules Engine indicates customer is not eligible for this product. Do you want to proceed anyway?"
        );
        if (!confirmed) {
          return;
        }
      }

      // Build comprehensive application data
      const applicationData: any = {
        customer_id: formData.customer_id,
        loan_type: formData.loan_type,
        requested_amount: parseFloat(formData.requested_amount),
        loan_term_months: parseInt(formData.loan_term_months),
        monthly_income: formData.monthly_income
          ? parseFloat(formData.monthly_income)
          : undefined,
        interest_rate: formData.interest_rate
          ? parseFloat(formData.interest_rate)
          : undefined,
        loan_purpose: formData.loan_purpose || undefined,
        collateral_id: formData.collateral_id || undefined,
        application_notes: formData.application_notes || undefined,
        product_name: formData.product_name || undefined,
        product_category: formData.product_category || undefined,
      };

      // Add employment details if provided
      if (
        formData.employment_type ||
        formData.years_at_employer ||
        formData.employment_verification_status
      ) {
        applicationData.employment_stability = {
          employment_verification_status:
            formData.employment_verification_status || undefined,
          employment_contract_type:
            formData.employment_contract_type || undefined,
          years_at_current_employer: formData.years_at_employer
            ? parseFloat(formData.years_at_employer)
            : undefined,
          employment_stability_score: formData.employment_stability_score
            ? parseFloat(formData.employment_stability_score)
            : undefined,
          industry_stability_rating: formData.industry_stability || undefined,
        };
      }

      // Add business details if business loan
      if (
        formData.loan_type === "business_loan" &&
        (formData.business_registration_number || formData.business_type)
      ) {
        applicationData.business_details = {
          business_registration_number:
            formData.business_registration_number || undefined,
          business_type: formData.business_type || undefined,
          business_sector: formData.business_sector || undefined,
          business_age_months: formData.business_age_months
            ? parseInt(formData.business_age_months)
            : undefined,
          annual_revenue_etb: formData.annual_revenue
            ? parseFloat(formData.annual_revenue)
            : undefined,
        };
      }

      // Add collateral details if provided
      if (
        formData.collateral_id &&
        (formData.collateral_type || formData.collateral_value)
      ) {
        applicationData.collateral_info = {
          collateral_type: formData.collateral_type || undefined,
          collateral_value_etb: formData.collateral_value
            ? parseFloat(formData.collateral_value)
            : undefined,
          collateral_ownership_verified: formData.collateral_ownership_verified,
          collateral_documentation_available:
            formData.collateral_documentation_available,
        };
      }

      // Add co-signer information if provided
      if (formData.co_signer_id) {
        applicationData.co_signer_info = {
          co_signer_id: formData.co_signer_id,
          co_signer_relationship: formData.co_signer_relationship || undefined,
          co_signer_monthly_income_etb: formData.co_signer_monthly_income
            ? parseFloat(formData.co_signer_monthly_income)
            : undefined,
          co_signer_credit_score: formData.co_signer_credit_score
            ? parseFloat(formData.co_signer_credit_score)
            : undefined,
        };
      }

      // Add location context if provided
      if (formData.application_latitude && formData.application_longitude) {
        applicationData.location_context = {
          application_latitude: parseFloat(formData.application_latitude),
          application_longitude: parseFloat(formData.application_longitude),
        };
      }

      // Add urgency information if provided
      if (
        formData.loan_urgency_score ||
        formData.reason_for_urgency ||
        formData.expected_disbursement_date
      ) {
        applicationData.urgency_info = {
          loan_urgency_score: formData.loan_urgency_score
            ? parseFloat(formData.loan_urgency_score)
            : undefined,
          reason_for_urgency: formData.reason_for_urgency || undefined,
          expected_disbursement_date:
            formData.expected_disbursement_date || undefined,
        };
      }

      console.log(
        "[handleCreateLoan] Submitting application data:",
        applicationData
      );
      const result = await createLoanMutation.mutateAsync(applicationData);
      console.log(
        "[handleCreateLoan] Application created successfully:",
        result
      );
      console.log(
        "[handleCreateLoan] Created application ID:",
        result?.data?.id || result?.data?.application_id || result?.id
      );

      // Reset to first page to ensure new application is visible (newest applications are typically first)
      setPage(1);

      // Explicitly refetch the applications list to show the new application
      console.log("[handleCreateLoan] Refetching applications list...");
      try {
        const refetchResult = await refetch();
        console.log("[handleCreateLoan] Refetch result:", refetchResult);

        // Get items from refetch result (handle multiple structures)
        const refetchItems = Array.isArray(refetchResult.data?.data)
          ? refetchResult.data.data
          : Array.isArray(refetchResult.data?.items)
            ? refetchResult.data.items
            : Array.isArray(refetchResult.data)
              ? refetchResult.data
              : refetchResult.data?.data?.items || [];

        const refetchTotal =
          refetchResult.data?.pagination?.total ||
          refetchResult.data?.data?.total ||
          refetchResult.data?.total ||
          refetchItems.length;

        console.log(
          "[handleCreateLoan] Total applications after refetch:",
          refetchTotal
        );
        console.log(
          "[handleCreateLoan] Applications count:",
          refetchItems.length
        );

        // Check if the new application is in the list
        const newAppId =
          result?.data?.id || result?.data?.application_id || result?.id;
        const newAppNumber =
          result?.data?.application_number || result?.application_number;
        if (newAppId || newAppNumber) {
          const foundApp = refetchItems.find(
            (app: any) =>
              app.id === newAppId ||
              app.application_id === newAppId ||
              app.application_number === newAppNumber
          );
          console.log(
            "[handleCreateLoan] New application found in list:",
            foundApp ? "YES" : "NO"
          );
          if (foundApp) {
            console.log(
              "[handleCreateLoan] New application details:",
              foundApp
            );
          }
        }
      } catch (refetchError) {
        console.error(
          "[handleCreateLoan] Error refetching applications:",
          refetchError
        );
      }

      setIsCreateDialogOpen(false);
      setFormData({
        customer_id: "",
        loan_type: "personal_loan",
        requested_amount: "",
        loan_term_months: "",
        monthly_income: "",
        loan_purpose: "",
        collateral_id: "",
        application_notes: "",
        product_name: "",
        product_category: "",
        interest_rate: "",
        existing_monthly_debt: "",
        employment_type: "",
        years_at_employer: "",
        employment_verification_status: "",
        employment_contract_type: "",
        employment_stability_score: "",
        industry_stability: "",
        business_registration_number: "",
        business_type: "",
        business_sector: "",
        business_age_months: "",
        annual_revenue: "",
        collateral_type: "",
        collateral_value: "",
        collateral_ownership_verified: false,
        collateral_documentation_available: false,
        co_signer_id: "",
        co_signer_relationship: "",
        co_signer_monthly_income: "",
        co_signer_credit_score: "",
        application_latitude: "",
        application_longitude: "",
        loan_urgency_score: "",
        reason_for_urgency: "",
        expected_disbursement_date: "",
      });
      setShowAdvancedFields(false);
      setSelectedCustomer(null);
      setCustomerCreditScore(null);
      setCustomerRiskLevel(null);
      setCustomerSearchQuery("");
      setNbeValidation(null);
      setRulesEvaluation(null);
      setDefaultPrediction(null);
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({ ...formData, customer_id: customer.customer_id });
    setCustomerSearchQuery(customer.customer_id);
    // Fetch customer 360 data
    if (customer.credit_score) {
      setCustomerCreditScore(customer.credit_score);
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setLoanTypeFilter("");
    setCustomerIdFilter("");
    setNbeCompliantFilter("");
    setRiskLevelFilter("");
    setMinAmountFilter("");
    setMaxAmountFilter("");
    setDateFromFilter(undefined);
    setDateToFilter(undefined);
    setApprovalDateFromFilter(undefined);
    setApprovalDateToFilter(undefined);
    setMinCreditScoreFilter("");
    setMaxCreditScoreFilter("");
    setApplicationNumberFilter("");
    setCustomerNameFilter("");
    setSearch("");
    setPage(1);
  };

  const saveFilterPreset = () => {
    const preset = {
      name: `Preset ${savedFilterPresets.length + 1}`,
      filters: {
        status: statusFilter,
        loan_type: loanTypeFilter,
        customer_id: customerIdFilter,
        nbe_compliant: nbeCompliantFilter,
        risk_level: riskLevelFilter,
        min_amount: minAmountFilter,
        max_amount: maxAmountFilter,
        date_from: dateFromFilter,
        date_to: dateToFilter,
        approval_date_from: approvalDateFromFilter,
        approval_date_to: approvalDateToFilter,
        min_credit_score: minCreditScoreFilter,
        max_credit_score: maxCreditScoreFilter,
        application_number: applicationNumberFilter,
        customer_name: customerNameFilter,
      },
    };
    setSavedFilterPresets([...savedFilterPresets, preset]);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "loanApplicationFilterPresets",
        JSON.stringify([...savedFilterPresets, preset])
      );
    }
    toast({
      title: "Filter Preset Saved",
      description: `Filter preset "${preset.name}" has been saved`,
    });
  };

  const loadFilterPreset = (preset: any) => {
    setStatusFilter(preset.filters.status || "");
    setLoanTypeFilter(preset.filters.loan_type || "");
    setCustomerIdFilter(preset.filters.customer_id || "");
    setNbeCompliantFilter(preset.filters.nbe_compliant || "");
    setRiskLevelFilter(preset.filters.risk_level || "");
    setMinAmountFilter(preset.filters.min_amount || "");
    setMaxAmountFilter(preset.filters.max_amount || "");
    setDateFromFilter(preset.filters.date_from);
    setDateToFilter(preset.filters.date_to);
    setApprovalDateFromFilter(preset.filters.approval_date_from);
    setApprovalDateToFilter(preset.filters.approval_date_to);
    setMinCreditScoreFilter(preset.filters.min_credit_score || "");
    setMaxCreditScoreFilter(preset.filters.max_credit_score || "");
    setApplicationNumberFilter(preset.filters.application_number || "");
    setCustomerNameFilter(preset.filters.customer_name || "");
    toast({
      title: "Filter Preset Loaded",
      description: `Filter preset "${preset.name}" has been loaded`,
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Application Number",
      "Customer ID",
      "Loan Type",
      "Requested Amount",
      "Loan Term (Months)",
      "Interest Rate",
      "Status",
      "Credit Score",
      "Risk Level",
      "NBE Compliant",
      "Created At",
      "Approval Date",
    ];
    const rows = applications.map((app: any) => [
      app.application_number || "",
      app.customer_id || "",
      app.loan_type || "",
      app.requested_amount || 0,
      app.loan_term_months || 0,
      app.interest_rate || 0,
      app.application_status || "",
      app.credit_score || "",
      app.risk_level || "",
      app.nbe_compliant ? "Yes" : "No",
      app.created_at ? new Date(app.created_at).toLocaleString() : "",
      app.approval_date ? new Date(app.approval_date).toLocaleString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan_applications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${applications.length} applications to CSV`,
    });
  };

  // Load saved presets from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("loanApplicationFilterPresets");
      if (saved) {
        try {
          setSavedFilterPresets(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load filter presets:", e);
        }
      }
    }
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (loanTypeFilter) count++;
    if (customerIdFilter) count++;
    if (nbeCompliantFilter) count++;
    if (riskLevelFilter) count++;
    if (minAmountFilter) count++;
    if (maxAmountFilter) count++;
    if (dateFromFilter) count++;
    if (dateToFilter) count++;
    if (approvalDateFromFilter) count++;
    if (approvalDateToFilter) count++;
    if (minCreditScoreFilter) count++;
    if (maxCreditScoreFilter) count++;
    if (applicationNumberFilter) count++;
    if (customerNameFilter) count++;
    if (debouncedSearch) count++;
    return count;
  }, [
    statusFilter,
    loanTypeFilter,
    customerIdFilter,
    nbeCompliantFilter,
    riskLevelFilter,
    minAmountFilter,
    maxAmountFilter,
    dateFromFilter,
    dateToFilter,
    approvalDateFromFilter,
    approvalDateToFilter,
    minCreditScoreFilter,
    maxCreditScoreFilter,
    applicationNumberFilter,
    customerNameFilter,
    debouncedSearch,
  ]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-500",
      pending: "bg-yellow-500",
      under_review: "bg-blue-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      disbursed: "bg-purple-500",
      active: "bg-green-600",
      completed: "bg-gray-600",
      defaulted: "bg-red-600",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return <span className="text-muted-foreground">-</span>;
    const riskColors: Record<string, string> = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      very_high: "bg-red-500",
    };

    return (
      <Badge className={riskColors[riskLevel] || "bg-gray-500"}>
        {riskLevel.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  // Calculate monthly payment in real-time
  const calculateMonthlyPayment = useMemo(() => {
    if (!formData.requested_amount || !formData.loan_term_months) return null;

    const principal = parseFloat(formData.requested_amount);
    const months = parseInt(formData.loan_term_months);

    if (isNaN(principal) || isNaN(months) || principal <= 0 || months <= 0)
      return null;

    if (formData.interest_rate) {
      const rate = parseFloat(formData.interest_rate) / 100 / 12;
      if (rate > 0) {
        const monthlyPayment =
          (principal * (rate * Math.pow(1 + rate, months))) /
          (Math.pow(1 + rate, months) - 1);
        return monthlyPayment;
      }
    }

    // Simple calculation without interest
    return principal / months;
  }, [
    formData.requested_amount,
    formData.loan_term_months,
    formData.interest_rate,
  ]);

  // Get field-specific error message
  const getFieldError = (fieldName: string) => {
    if (!nbeValidation || !nbeValidation.violations) return null;

    const fieldErrors = nbeValidation.violations.filter((v: any) => {
      const rule = (v.rule || "").toLowerCase();
      const desc = (v.description || "").toLowerCase();

      if (fieldName === "requested_amount") {
        return (
          rule.includes("amount") ||
          desc.includes("amount") ||
          desc.includes("loan amount")
        );
      }
      if (fieldName === "loan_term_months") {
        return rule.includes("term") || desc.includes("term");
      }
      if (fieldName === "monthly_income") {
        return (
          rule.includes("salary") ||
          rule.includes("income") ||
          desc.includes("income")
        );
      }
      if (fieldName === "interest_rate") {
        return (
          rule.includes("interest") ||
          rule.includes("rate") ||
          desc.includes("rate")
        );
      }
      return false;
    });

    return fieldErrors.length > 0 ? fieldErrors[0].description : null;
  };

  // Add comprehensive diagnostic logging
  useEffect(() => {
    const dataString = data ? JSON.stringify(data, null, 2) : "null";
    console.log("[LoanApplications] Query State:", {
      isLoading,
      error: error?.message || error,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      dataStructure: data,
      rawData: dataString ? dataString.substring(0, 1000) : "null",
    });

    if (data) {
      console.log("[LoanApplications] Data Analysis:", {
        hasData: !!data.data,
        dataType: Array.isArray(data.data) ? "array" : typeof data.data,
        dataLength: Array.isArray(data.data) ? data.data.length : "N/A",
        hasPagination: !!data.pagination,
        paginationTotal: data.pagination?.total,
        hasItems: !!data.items,
        itemsLength: Array.isArray(data.items) ? data.items.length : "N/A",
        allKeys: Object.keys(data),
      });
    }
  }, [isLoading, error, data]);

  // Filter applications client-side for advanced filters
  const filteredApplications = useMemo(() => {
    // Handle different response structures
    // API returns: { success: true, data: [...items], pagination: { total: ... } }
    // After normalization: { data: [...items], pagination: { total: ... } }
    let items: any[] = [];

    if (data) {
      // Try different possible structures
      if (Array.isArray(data.data)) {
        items = data.data;
      } else if (Array.isArray(data.items)) {
        items = data.items;
      } else if (Array.isArray(data)) {
        items = data;
      } else if (data.data?.items && Array.isArray(data.data.items)) {
        items = data.data.items;
      } else if (data.data?.data && Array.isArray(data.data.data)) {
        items = data.data.data;
      }
    }

    let filtered = items || [];

    // Apply search filter (customer ID, application number, loan type)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (app: any) =>
          app.application_number?.toLowerCase().includes(searchLower) ||
          app.customer_id?.toLowerCase().includes(searchLower) ||
          app.loan_type?.toLowerCase().includes(searchLower) ||
          (app.customer_name &&
            app.customer_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply application number filter
    if (applicationNumberFilter) {
      const appNumLower = applicationNumberFilter.toLowerCase();
      filtered = filtered.filter((app: any) =>
        app.application_number?.toLowerCase().includes(appNumLower)
      );
    }

    // Apply customer name filter
    if (customerNameFilter) {
      const nameLower = customerNameFilter.toLowerCase();
      filtered = filtered.filter(
        (app: any) =>
          app.customer_name?.toLowerCase().includes(nameLower) ||
          app.customer_id?.toLowerCase().includes(nameLower)
      );
    }

    // Apply credit score range filter
    if (minCreditScoreFilter) {
      const min = parseFloat(minCreditScoreFilter);
      filtered = filtered.filter((app: any) => (app.credit_score || 0) >= min);
    }
    if (maxCreditScoreFilter) {
      const max = parseFloat(maxCreditScoreFilter);
      filtered = filtered.filter((app: any) => (app.credit_score || 0) <= max);
    }

    // Apply amount filters
    if (minAmountFilter) {
      const min = parseFloat(minAmountFilter);
      filtered = filtered.filter(
        (app: any) => (app.requested_amount || 0) >= min
      );
    }
    if (maxAmountFilter) {
      const max = parseFloat(maxAmountFilter);
      filtered = filtered.filter(
        (app: any) => (app.requested_amount || 0) <= max
      );
    }

    // Apply application date filters
    if (dateFromFilter) {
      filtered = filtered.filter((app: any) => {
        const appDate = new Date(app.created_at);
        return appDate >= dateFromFilter;
      });
    }
    if (dateToFilter) {
      filtered = filtered.filter((app: any) => {
        const appDate = new Date(app.created_at);
        appDate.setHours(23, 59, 59, 999);
        return appDate <= dateToFilter;
      });
    }

    // Apply approval date filters
    if (approvalDateFromFilter) {
      filtered = filtered.filter((app: any) => {
        if (!app.approval_date) return false;
        const approvalDate = new Date(app.approval_date);
        return approvalDate >= approvalDateFromFilter;
      });
    }
    if (approvalDateToFilter) {
      filtered = filtered.filter((app: any) => {
        if (!app.approval_date) return false;
        const approvalDate = new Date(app.approval_date);
        approvalDate.setHours(23, 59, 59, 999);
        return approvalDate <= approvalDateToFilter;
      });
    }

    // Apply NBE compliance filter
    if (nbeCompliantFilter) {
      filtered = filtered.filter((app: any) => {
        if (nbeCompliantFilter === "true") return app.nbe_compliant === true;
        if (nbeCompliantFilter === "false") return app.nbe_compliant === false;
        return true;
      });
    }

    // Apply risk level filter
    if (riskLevelFilter) {
      filtered = filtered.filter(
        (app: any) => app.risk_level === riskLevelFilter
      );
    }

    return filtered;
  }, [
    data,
    debouncedSearch,
    minAmountFilter,
    maxAmountFilter,
    dateFromFilter,
    dateToFilter,
    approvalDateFromFilter,
    approvalDateToFilter,
    nbeCompliantFilter,
    riskLevelFilter,
    minCreditScoreFilter,
    maxCreditScoreFilter,
    applicationNumberFilter,
    customerNameFilter,
  ]);

  const applications = filteredApplications;

  // Get total from pagination or data structure
  const total =
    data?.pagination?.total ||
    data?.data?.total ||
    data?.total ||
    (Array.isArray(data?.data) ? data.data.length : 0) ||
    (Array.isArray(data?.items) ? data.items.length : 0) ||
    0;

  console.log("[LoanApplications] Display State:", {
    applicationsCount: applications.length,
    total,
    filteredCount: filteredApplications.length,
    rawTotal: data?.pagination?.total || data?.data?.total || data?.total,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Applications</h1>
          <p className="text-muted-foreground">
            Manage loan applications and track their status
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              // Reset validation state when dialog closes
              setNbeValidation(null);
              setRulesEvaluation(null);
              setDefaultPrediction(null);
              setIsValidating(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Loan Application</DialogTitle>
              <DialogDescription>
                Create a new loan application for a customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_id">Customer ID *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedCustomer
                        ? `${selectedCustomer.customer_id} - ${selectedCustomer.full_name || ""}`
                        : "Search customer..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <div className="p-2">
                      <Input
                        placeholder="Search by ID or name..."
                        value={customerSearchQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomerSearchQuery(value);
                        }}
                        onKeyDown={(e) => {
                          // Prevent popover from closing on Escape when typing
                          if (
                            e.key === "Escape" &&
                            customerSearchQuery.length > 0
                          ) {
                            e.stopPropagation();
                          }
                        }}
                        autoFocus
                        className="mb-2"
                      />
                      <div className="max-h-[300px] overflow-auto">
                        {isSearchingCustomers ? (
                          <div className="flex items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </div>
                        ) : customerSearchResults &&
                          customerSearchResults.length > 0 ? (
                          customerSearchResults.map((customer: any) => (
                            <div
                              key={customer.customer_id}
                              className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-accent"
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              <div>
                                <div className="font-medium">
                                  {customer.customer_id}
                                </div>
                                {customer.full_name && (
                                  <div className="text-sm text-muted-foreground">
                                    {customer.full_name}
                                  </div>
                                )}
                              </div>
                              {customer.credit_score && (
                                <Badge variant="outline">
                                  {customer.credit_score}
                                </Badge>
                              )}
                            </div>
                          ))
                        ) : customerSearchQuery.length >= 2 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No customers found
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Type at least 2 characters to search
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedCustomer && (
                  <div className="mt-2 space-y-2 rounded-md bg-muted p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">
                        {selectedCustomer.full_name ||
                          selectedCustomer.customer_id}
                      </span>
                    </div>
                    {customerCreditScore !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Credit Score:
                        </span>
                        <Badge variant="outline">{customerCreditScore}</Badge>
                      </div>
                    )}
                    {customerRiskLevel && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Risk Level:
                        </span>
                        {getRiskBadge(customerRiskLevel)}
                      </div>
                    )}
                    {/* Customer History Display */}
                    {customer360Data && (
                      <div className="mt-2 space-y-2 border-t pt-2">
                        <div className="mb-2 text-xs font-medium">
                          Customer History:
                        </div>

                        {/* Previous Loans */}
                        {customer360Data.loans &&
                          customer360Data.loans.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Previous Loans (
                                {customer360Data.loans.length}):
                              </div>
                              <div className="max-h-32 space-y-1 overflow-y-auto">
                                {customer360Data.loans
                                  .slice(0, 5)
                                  .map((loan: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="cursor-pointer rounded border bg-background p-1.5 text-xs transition-colors hover:bg-muted"
                                      onClick={() => {
                                        if (loan.loan_id || loan.id) {
                                          navigateTo(
                                            `/loans/applications/${loan.loan_id || loan.id}`
                                          );
                                        }
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                          {loan.application_number ||
                                            loan.loan_id ||
                                            `Loan #${idx + 1}`}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {loan.status ||
                                            loan.application_status ||
                                            "N/A"}
                                        </Badge>
                                      </div>
                                      {loan.loan_amount && (
                                        <div className="mt-0.5 text-muted-foreground">
                                          {new Intl.NumberFormat("en-ET", {
                                            style: "currency",
                                            currency: "ETB",
                                          }).format(loan.loan_amount)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                {customer360Data.loans.length > 5 && (
                                  <div className="pt-1 text-center text-xs text-muted-foreground">
                                    +{customer360Data.loans.length - 5}{" "}
                                    more loans
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Payment History */}
                        {customer360Data.payments &&
                          customer360Data.payments.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Payment History (
                                {customer360Data.payments.length} records):
                              </div>
                              <div className="max-h-24 space-y-1 overflow-y-auto">
                                {customer360Data.payments
                                  .slice(0, 3)
                                  .map((payment: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="rounded border bg-background p-1.5 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                          {payment.payment_date
                                            ? new Date(
                                                payment.payment_date
                                              ).toLocaleDateString()
                                            : "Date N/A"}
                                        </span>
                                        <span className="font-medium">
                                          {payment.payment_amount
                                            ? new Intl.NumberFormat("en-ET", {
                                                style: "currency",
                                                currency: "ETB",
                                              }).format(payment.payment_amount)
                                            : "Amount N/A"}
                                        </span>
                                      </div>
                                      {payment.status && (
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                          Status: {payment.status}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                {customer360Data.payments.length > 3 && (
                                  <div className="pt-1 text-center text-xs text-muted-foreground">
                                    +{customer360Data.payments.length - 3}{" "}
                                    more payments
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Customer Risk Profile */}
                        {customer360Data.credit && (
                          <div className="space-y-1 border-t pt-1">
                            <div className="text-xs font-medium text-muted-foreground">
                              Risk Profile:
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {customer360Data.credit.credit_score && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Score:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {customer360Data.credit.credit_score}
                                  </span>
                                </div>
                              )}
                              {customer360Data.credit.risk_level && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Level:{" "}
                                  </span>
                                  {getRiskBadge(
                                    customer360Data.credit.risk_level
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {duplicateWarning && (
                  <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                    <div className="flex items-center space-x-2 text-sm text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span>{duplicateWarning}</span>
                    </div>
                  </div>
                )}
                <Input
                  id="customer_id"
                  value={formData.customer_id}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_id: e.target.value });
                    setCustomerSearchQuery(e.target.value);
                    if (!e.target.value) {
                      setSelectedCustomer(null);
                      setCustomerCreditScore(null);
                      setCustomerRiskLevel(null);
                    }
                  }}
                  placeholder="Or enter customer ID directly"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="loan_type">Loan Type</Label>
                <Select
                  value={formData.loan_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, loan_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_loan">Personal Loan</SelectItem>
                    <SelectItem value="business_loan">Business Loan</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="vehicle_loan">Vehicle Loan</SelectItem>
                    <SelectItem value="agricultural_loan">
                      Agricultural Loan
                    </SelectItem>
                    <SelectItem value="microfinance">Microfinance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="requested_amount">
                  Requested Amount (ETB) *
                </Label>
                <Input
                  id="requested_amount"
                  type="number"
                  value={formData.requested_amount}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      requested_amount: e.target.value,
                    });
                    // Trigger cross-field validation
                    setTimeout(() => {
                      const errors = validateCrossFields();
                      setFormErrors(errors);
                    }, 100);
                  }}
                  placeholder="100000"
                  className={
                    getFieldError("requested_amount") ||
                    formErrors.requested_amount
                      ? "border-red-500"
                      : ""
                  }
                />
                {getFieldError("requested_amount") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("requested_amount")}
                  </p>
                )}
                {formErrors.requested_amount && (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.requested_amount}
                  </p>
                )}
                {nbeValidation &&
                  nbeValidation.max_affordable_loan &&
                  formData.requested_amount &&
                  parseFloat(formData.requested_amount) >
                    nbeValidation.max_affordable_loan &&
                  !getFieldError("requested_amount") &&
                  !formErrors.requested_amount && (
                    <p className="mt-1 text-xs text-yellow-600">
                      Recommended max:{" "}
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(nbeValidation.max_affordable_loan)}
                    </p>
                  )}
              </div>
              <div>
                <Label htmlFor="loan_term_months">Loan Term (Months) *</Label>
                <Input
                  id="loan_term_months"
                  type="number"
                  value={formData.loan_term_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loan_term_months: e.target.value,
                    })
                  }
                  placeholder="24"
                  min="1"
                  max="60"
                  className={
                    getFieldError("loan_term_months") ? "border-red-500" : ""
                  }
                />
                {getFieldError("loan_term_months") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("loan_term_months")}
                  </p>
                )}
                {!getFieldError("loan_term_months") && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    NBE maximum: 60 months
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="monthly_income">Monthly Income (ETB) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  value={formData.monthly_income}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_income: e.target.value })
                  }
                  placeholder="15000"
                  className={
                    getFieldError("monthly_income") ? "border-red-500" : ""
                  }
                />
                {getFieldError("monthly_income") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("monthly_income")}
                  </p>
                )}
                {nbeValidation &&
                  nbeValidation.max_affordable_payment &&
                  !getFieldError("monthly_income") && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Max affordable payment:{" "}
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(nbeValidation.max_affordable_payment)}
                    </p>
                  )}
              </div>
              <div>
                <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  value={formData.interest_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, interest_rate: e.target.value })
                  }
                  placeholder="15.0"
                  min="12"
                  max="25"
                  step="0.1"
                  className={
                    getFieldError("interest_rate") ? "border-red-500" : ""
                  }
                />
                {getFieldError("interest_rate") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("interest_rate")}
                  </p>
                )}
                {!getFieldError("interest_rate") && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    NBE range: 12% - 25%
                  </p>
                )}
                {/* Real-time Monthly Payment Preview */}
                {calculateMonthlyPayment &&
                  formData.requested_amount &&
                  formData.loan_term_months && (
                    <div className="mt-2 rounded-md bg-muted p-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Estimated Monthly Payment:
                        </span>
                        <span className="text-base font-semibold">
                          {new Intl.NumberFormat("en-ET", {
                            style: "currency",
                            currency: "ETB",
                          }).format(calculateMonthlyPayment)}
                        </span>
                      </div>
                      {nbeValidation &&
                        nbeValidation.max_affordable_payment && (
                          <div
                            className={`mt-1 text-xs ${
                              calculateMonthlyPayment >
                              nbeValidation.max_affordable_payment
                                ? "text-red-600"
                                : calculateMonthlyPayment >
                                    nbeValidation.max_affordable_payment * 0.8
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {calculateMonthlyPayment >
                            nbeValidation.max_affordable_payment
                              ? `⚠️ Exceeds max affordable payment by ${new Intl.NumberFormat(
                                  "en-ET",
                                  {
                                    style: "currency",
                                    currency: "ETB",
                                  }
                                ).format(
                                  calculateMonthlyPayment -
                                    nbeValidation.max_affordable_payment
                                )}`
                              : calculateMonthlyPayment >
                                  nbeValidation.max_affordable_payment * 0.8
                                ? `⚠️ Close to limit (${((calculateMonthlyPayment / nbeValidation.max_affordable_payment) * 100).toFixed(0)}%)`
                                : "✓ Within affordable range"}
                          </div>
                        )}
                    </div>
                  )}
              </div>

              {/* Existing Debt Obligations */}
              <div>
                <Label htmlFor="existing_monthly_debt">
                  Existing Monthly Debt (ETB)
                </Label>
                <Input
                  id="existing_monthly_debt"
                  type="number"
                  value={formData.existing_monthly_debt}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      existing_monthly_debt: e.target.value,
                    });
                    // Trigger cross-field validation
                    setTimeout(() => {
                      const errors = validateCrossFields();
                      setFormErrors(errors);
                    }, 100);
                  }}
                  placeholder="0"
                  min="0"
                  className={
                    formErrors.existing_monthly_debt ? "border-yellow-500" : ""
                  }
                />
                {formErrors.existing_monthly_debt && (
                  <p className="mt-1 text-xs text-yellow-600">
                    {formErrors.existing_monthly_debt}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Total monthly debt obligations from other loans
                </p>
              </div>

              {/* Advanced Fields Toggle */}
              <div className="flex items-center justify-between border-t pt-2">
                <div>
                  <div className="text-sm font-medium">
                    Additional Information
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Employment, business, collateral, and other details
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                >
                  {showAdvancedFields ? "Hide" : "Show"} Advanced Fields
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${showAdvancedFields ? "rotate-180" : ""}`}
                  />
                </Button>
              </div>

              {/* Advanced Fields */}
              {showAdvancedFields && (
                <div className="space-y-4 border-t pt-4">
                  {/* Employment Details Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">
                      Employment Details
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employment_type">Employment Type</Label>
                        <Select
                          value={formData.employment_type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, employment_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self_employed">
                              Self Employed
                            </SelectItem>
                            <SelectItem value="unemployed">
                              Unemployed
                            </SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="years_at_employer">
                          Years at Current Employer
                        </Label>
                        <Input
                          id="years_at_employer"
                          type="number"
                          value={formData.years_at_employer}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              years_at_employer: e.target.value,
                            })
                          }
                          placeholder="2"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="employment_contract_type">
                          Contract Type
                        </Label>
                        <Select
                          value={formData.employment_contract_type}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              employment_contract_type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="permanent">Permanent</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="temporary">Temporary</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="employment_verification_status">
                          Verification Status
                        </Label>
                        <Select
                          value={formData.employment_verification_status}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              employment_verification_status: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="not_verified">
                              Not Verified
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="employment_stability_score">
                          Stability Score (0-100)
                        </Label>
                        <Input
                          id="employment_stability_score"
                          type="number"
                          value={formData.employment_stability_score}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employment_stability_score: e.target.value,
                            })
                          }
                          placeholder="85"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry_stability">
                          Industry Stability
                        </Label>
                        <Select
                          value={formData.industry_stability}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              industry_stability: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">Stable</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="volatile">Volatile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Business Details Section (for business loans) */}
                  {formData.loan_type === "business_loan" && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="text-sm font-semibold">
                        Business Details
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="business_registration_number">
                            Registration Number
                          </Label>
                          <Input
                            id="business_registration_number"
                            value={formData.business_registration_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                business_registration_number: e.target.value,
                              })
                            }
                            placeholder="BR123456789"
                          />
                        </div>
                        <div>
                          <Label htmlFor="business_type">Business Type</Label>
                          <Select
                            value={formData.business_type}
                            onValueChange={(value) =>
                              setFormData({ ...formData, business_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sole_proprietorship">
                                Sole Proprietorship
                              </SelectItem>
                              <SelectItem value="partnership">
                                Partnership
                              </SelectItem>
                              <SelectItem value="llc">LLC</SelectItem>
                              <SelectItem value="corporation">
                                Corporation
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="business_sector">
                            Business Sector
                          </Label>
                          <Input
                            id="business_sector"
                            value={formData.business_sector}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                business_sector: e.target.value,
                              })
                            }
                            placeholder="Retail, Manufacturing, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="business_age_months">
                            Business Age (Months)
                          </Label>
                          <Input
                            id="business_age_months"
                            type="number"
                            value={formData.business_age_months}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                business_age_months: e.target.value,
                              })
                            }
                            placeholder="36"
                            min="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="annual_revenue">
                            Annual Revenue (ETB)
                          </Label>
                          <Input
                            id="annual_revenue"
                            type="number"
                            value={formData.annual_revenue}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                annual_revenue: e.target.value,
                              })
                            }
                            placeholder="2000000"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collateral Details Section */}
                  {formData.collateral_id && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="text-sm font-semibold">
                        Collateral Details
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="collateral_type">
                            Collateral Type
                          </Label>
                          <Select
                            value={formData.collateral_type}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                collateral_type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="property">Property</SelectItem>
                              <SelectItem value="vehicle">Vehicle</SelectItem>
                              <SelectItem value="equipment">
                                Equipment
                              </SelectItem>
                              <SelectItem value="land">Land</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="collateral_value">
                            Collateral Value (ETB)
                          </Label>
                          <Input
                            id="collateral_value"
                            type="number"
                            value={formData.collateral_value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                collateral_value: e.target.value,
                              })
                            }
                            placeholder="500000"
                            min="0"
                          />
                        </div>
                        <div className="col-span-2 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="collateral_ownership_verified"
                              checked={formData.collateral_ownership_verified}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  collateral_ownership_verified:
                                    e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <Label
                              htmlFor="collateral_ownership_verified"
                              className="cursor-pointer"
                            >
                              Ownership Verified
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="collateral_documentation_available"
                              checked={
                                formData.collateral_documentation_available
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  collateral_documentation_available:
                                    e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <Label
                              htmlFor="collateral_documentation_available"
                              className="cursor-pointer"
                            >
                              Documentation Available
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Co-signer Information Section */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="text-sm font-semibold">
                      Co-signer Information (Optional)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="co_signer_id">
                          Co-signer Customer ID
                        </Label>
                        <Input
                          id="co_signer_id"
                          value={formData.co_signer_id}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, co_signer_id: value });
                            if (value && !validateEthiopianIDNumber(value)) {
                              setFormErrors({
                                ...formErrors,
                                co_signer_id:
                                  "Ethiopian ID must be exactly 10 digits",
                              });
                            } else {
                              const newErrors = { ...formErrors };
                              delete newErrors.co_signer_id;
                              setFormErrors(newErrors);
                            }
                          }}
                          placeholder="10-digit Ethiopian ID"
                          maxLength={10}
                        />
                        {formErrors.co_signer_id && (
                          <p className="mt-1 text-xs text-red-600">
                            {formErrors.co_signer_id}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="co_signer_relationship">
                          Relationship
                        </Label>
                        <Select
                          value={formData.co_signer_relationship}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              co_signer_relationship: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="business_partner">
                              Business Partner
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="co_signer_monthly_income">
                          Co-signer Monthly Income (ETB)
                        </Label>
                        <Input
                          id="co_signer_monthly_income"
                          type="number"
                          value={formData.co_signer_monthly_income}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              co_signer_monthly_income: e.target.value,
                            })
                          }
                          placeholder="40000"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="co_signer_credit_score">
                          Co-signer Credit Score
                        </Label>
                        <Input
                          id="co_signer_credit_score"
                          type="number"
                          value={formData.co_signer_credit_score}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              co_signer_credit_score: e.target.value,
                            })
                          }
                          placeholder="720"
                          min="0"
                          max="1000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Context Section */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="text-sm font-semibold">
                      Location Context (Optional)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="application_latitude">Latitude</Label>
                        <Input
                          id="application_latitude"
                          type="number"
                          value={formData.application_latitude}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              application_latitude: e.target.value,
                            })
                          }
                          placeholder="9.02497"
                          step="0.00001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="application_longitude">Longitude</Label>
                        <Input
                          id="application_longitude"
                          type="number"
                          value={formData.application_longitude}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              application_longitude: e.target.value,
                            })
                          }
                          placeholder="38.74689"
                          step="0.00001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Urgency Information Section */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="text-sm font-semibold">
                      Urgency Information (Optional)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="loan_urgency_score">
                          Urgency Score (0-100)
                        </Label>
                        <Input
                          id="loan_urgency_score"
                          type="number"
                          value={formData.loan_urgency_score}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              loan_urgency_score: e.target.value,
                            })
                          }
                          placeholder="70"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expected_disbursement_date">
                          Expected Disbursement Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {formData.expected_disbursement_date
                                ? format(
                                    new Date(
                                      formData.expected_disbursement_date
                                    ),
                                    "PPP"
                                  )
                                : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={
                                formData.expected_disbursement_date
                                  ? new Date(
                                      formData.expected_disbursement_date
                                    )
                                  : undefined
                              }
                              onSelect={(date) =>
                                setFormData({
                                  ...formData,
                                  expected_disbursement_date: date
                                    ? date.toISOString()
                                    : "",
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="reason_for_urgency">
                          Reason for Urgency
                        </Label>
                        <Textarea
                          id="reason_for_urgency"
                          value={formData.reason_for_urgency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reason_for_urgency: e.target.value,
                            })
                          }
                          placeholder="Seasonal inventory purchase, emergency expenses, etc."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="loan_purpose">Loan Purpose</Label>
                <Input
                  id="loan_purpose"
                  value={formData.loan_purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, loan_purpose: e.target.value })
                  }
                  placeholder="Home renovation"
                />
              </div>
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  placeholder="Standard Personal Loan"
                />
              </div>
              <div>
                <Label htmlFor="product_category">Product Category</Label>
                <Select
                  value={formData.product_category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product_category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="collateral_id">Collateral ID (Optional)</Label>
                <Input
                  id="collateral_id"
                  value={formData.collateral_id}
                  onChange={(e) =>
                    setFormData({ ...formData, collateral_id: e.target.value })
                  }
                  placeholder="COL001"
                />
              </div>
              <div>
                <Label htmlFor="application_notes">Application Notes</Label>
                <Textarea
                  id="application_notes"
                  value={formData.application_notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      application_notes: e.target.value,
                    })
                  }
                  placeholder="Additional notes about this application..."
                  rows={3}
                />
              </div>

              {/* Real-time Validation Results */}
              {(isValidating ||
                nbeValidation ||
                rulesEvaluation ||
                defaultPrediction) && (
                <div className="space-y-4 border-t pt-4">
                  {isValidating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating compliance and risk...
                    </div>
                  )}

                  {/* NBE Compliance Section */}
                  {nbeValidation && (
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <CheckCircle2
                              className={`h-4 w-4 ${nbeValidation.compliant ? "text-green-500" : "text-red-500"}`}
                            />
                            NBE Compliance
                          </CardTitle>
                          {nbeValidation.compliance_score !== undefined && (
                            <Badge
                              variant={
                                nbeValidation.compliance_score >= 80
                                  ? "default"
                                  : nbeValidation.compliance_score >= 60
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              Score: {nbeValidation.compliance_score}%
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {nbeValidation.compliant ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Loan application is NBE compliant</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {nbeValidation.violations &&
                              nbeValidation.violations.length > 0 && (
                                <div>
                                  <div className="mb-1 text-sm font-medium text-red-600">
                                    Violations:
                                  </div>
                                  <ul className="list-inside list-disc space-y-1 text-sm text-red-600">
                                    {nbeValidation.violations.map(
                                      (violation: any, idx: number) => (
                                        <li key={idx}>
                                          {violation.description ||
                                            violation.rule}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            {nbeValidation.warnings &&
                              nbeValidation.warnings.length > 0 && (
                                <div>
                                  <div className="mb-1 text-sm font-medium text-yellow-600">
                                    Warnings:
                                  </div>
                                  <ul className="list-inside list-disc space-y-1 text-sm text-yellow-600">
                                    {nbeValidation.warnings.map(
                                      (warning: any, idx: number) => (
                                        <li key={idx}>
                                          {warning.description || warning.rule}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Recommendations */}
                        {nbeValidation.recommendations &&
                          nbeValidation.recommendations.length > 0 && (
                            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                              <div className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                                Recommendations:
                              </div>
                              <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                {nbeValidation.recommendations.map(
                                  (rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {/* Monthly Payment Calculation */}
                        {formData.requested_amount &&
                          formData.loan_term_months && (
                            <div className="border-t pt-3">
                              <div className="mb-2 text-sm font-medium">
                                Payment Calculation:
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {nbeValidation.monthly_payment && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Monthly Payment:
                                    </span>
                                    <div className="text-lg font-medium">
                                      {new Intl.NumberFormat("en-ET", {
                                        style: "currency",
                                        currency: "ETB",
                                      }).format(nbeValidation.monthly_payment)}
                                    </div>
                                  </div>
                                )}
                                {formData.interest_rate &&
                                  formData.requested_amount &&
                                  formData.loan_term_months &&
                                  (() => {
                                    const principal = parseFloat(
                                      formData.requested_amount
                                    );
                                    const rate =
                                      parseFloat(formData.interest_rate) /
                                      100 /
                                      12;
                                    const months = parseInt(
                                      formData.loan_term_months
                                    );
                                    const monthlyPayment =
                                      rate > 0
                                        ? (principal *
                                            (rate *
                                              Math.pow(1 + rate, months))) /
                                          (Math.pow(1 + rate, months) - 1)
                                        : principal / months;
                                    const totalRepayment =
                                      monthlyPayment * months;
                                    const totalInterest =
                                      totalRepayment - principal;
                                    return (
                                      <>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Total Repayment:
                                          </span>
                                          <div className="font-medium">
                                            {new Intl.NumberFormat("en-ET", {
                                              style: "currency",
                                              currency: "ETB",
                                            }).format(totalRepayment)}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Total Interest:
                                          </span>
                                          <div className="font-medium">
                                            {new Intl.NumberFormat("en-ET", {
                                              style: "currency",
                                              currency: "ETB",
                                            }).format(totalInterest)}
                                          </div>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground">
                                            Interest as % of Loan:
                                          </span>
                                          <div className="font-medium">
                                            {(
                                              (totalInterest / principal) *
                                              100
                                            ).toFixed(2)}
                                            %
                                          </div>
                                        </div>
                                      </>
                                    );
                                  })()}
                              </div>
                            </div>
                          )}

                        {/* Recommended Interest Rate */}
                        {nbeValidation.recommended_interest_rate !==
                          undefined && (
                          <div className="border-t pt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-muted-foreground">
                                  Recommended Interest Rate:
                                </div>
                                <div className="text-lg font-semibold">
                                  {nbeValidation.recommended_interest_rate.toFixed(
                                    2
                                  )}
                                  %
                                </div>
                                {formData.interest_rate &&
                                  parseFloat(formData.interest_rate) !==
                                    nbeValidation.recommended_interest_rate && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      Current: {formData.interest_rate}%
                                    </div>
                                  )}
                              </div>
                              {formData.interest_rate &&
                                parseFloat(formData.interest_rate) !==
                                  nbeValidation.recommended_interest_rate && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        interest_rate:
                                          nbeValidation.recommended_interest_rate.toFixed(
                                            2
                                          ),
                                      })
                                    }
                                  >
                                    Apply
                                  </Button>
                                )}
                            </div>
                          </div>
                        )}

                        {/* One-Click Apply Recommendations */}
                        {!nbeValidation.compliant &&
                          (nbeValidation.max_affordable_loan ||
                            nbeValidation.max_affordable_payment) && (
                            <div className="border-t pt-3">
                              <div className="mb-2 text-sm font-medium">
                                Quick Fixes:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {nbeValidation.max_affordable_loan &&
                                  parseFloat(formData.requested_amount) >
                                    nbeValidation.max_affordable_loan && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setFormData({
                                          ...formData,
                                          requested_amount: Math.floor(
                                            nbeValidation.max_affordable_loan
                                          ).toString(),
                                        })
                                      }
                                    >
                                      Apply Max Loan:{" "}
                                      {new Intl.NumberFormat("en-ET", {
                                        style: "currency",
                                        currency: "ETB",
                                        maximumFractionDigits: 0,
                                      }).format(
                                        nbeValidation.max_affordable_loan
                                      )}
                                    </Button>
                                  )}
                                {nbeValidation.max_affordable_payment &&
                                  formData.loan_term_months &&
                                  (() => {
                                    const suggestedLoan =
                                      nbeValidation.max_affordable_payment *
                                      parseInt(formData.loan_term_months);
                                    if (
                                      suggestedLoan <
                                      parseFloat(
                                        formData.requested_amount || "0"
                                      )
                                    ) {
                                      return (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setFormData({
                                              ...formData,
                                              requested_amount:
                                                Math.floor(
                                                  suggestedLoan
                                                ).toString(),
                                            })
                                          }
                                        >
                                          Adjust to Affordable Amount
                                        </Button>
                                      );
                                    }
                                    return null;
                                  })()}
                              </div>
                            </div>
                          )}

                        {/* Compliance Score Breakdown */}
                        {nbeValidation.compliance_score !== undefined && (
                          <div className="border-t pt-3">
                            <div className="mb-2 text-sm font-medium">
                              Compliance Breakdown:
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  1/3 Salary Rule:
                                </span>
                                <Badge
                                  variant={
                                    nbeValidation.one_third_salary_check
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {nbeValidation.one_third_salary_check
                                    ? "Pass"
                                    : "Fail"}
                                </Badge>
                              </div>
                              {nbeValidation.interest_rate_within_limits !==
                                undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Interest Rate Limits:
                                  </span>
                                  <Badge
                                    variant={
                                      nbeValidation.interest_rate_within_limits
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {nbeValidation.interest_rate_within_limits
                                      ? "Pass"
                                      : "Fail"}
                                  </Badge>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Loan Term Limits:
                                </span>
                                <Badge
                                  variant={
                                    nbeValidation.loan_term_within_limits !==
                                    undefined
                                      ? nbeValidation.loan_term_within_limits
                                        ? "default"
                                        : "destructive"
                                      : "secondary"
                                  }
                                >
                                  {nbeValidation.loan_term_within_limits !==
                                  undefined
                                    ? nbeValidation.loan_term_within_limits
                                      ? "Pass"
                                      : "Fail"
                                    : "N/A"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Affordability Information */}
                        {nbeValidation.max_affordable_payment && (
                          <div className="grid grid-cols-2 gap-2 border-t pt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Max Affordable Payment:
                              </span>
                              <div className="font-medium">
                                {new Intl.NumberFormat("en-ET", {
                                  style: "currency",
                                  currency: "ETB",
                                }).format(nbeValidation.max_affordable_payment)}
                              </div>
                            </div>
                            {nbeValidation.max_affordable_loan && (
                              <div>
                                <span className="text-muted-foreground">
                                  Max Affordable Loan:
                                </span>
                                <div className="font-medium">
                                  {new Intl.NumberFormat("en-ET", {
                                    style: "currency",
                                    currency: "ETB",
                                  }).format(nbeValidation.max_affordable_loan)}
                                </div>
                              </div>
                            )}
                            {nbeValidation.debt_to_income_ratio !==
                              undefined && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">
                                  Debt-to-Income Ratio:
                                </span>
                                <div className="font-medium">
                                  {(
                                    nbeValidation.debt_to_income_ratio * 100
                                  ).toFixed(1)}
                                  %
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Rules Engine Results */}
                  {rulesEvaluation && (
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Info className="h-4 w-4 text-blue-500" />
                            Rules Engine Evaluation
                          </CardTitle>
                          {/* Product Eligibility Status */}
                          {rulesEvaluation.final_result?.decision && (
                            <Badge
                              variant={
                                rulesEvaluation.final_result.decision ===
                                "approve"
                                  ? "default"
                                  : rulesEvaluation.final_result.decision ===
                                      "reject"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="ml-auto"
                            >
                              {rulesEvaluation.final_result.decision ===
                              "approve"
                                ? "Eligible"
                                : rulesEvaluation.final_result.decision ===
                                    "reject"
                                  ? "Not Eligible"
                                  : "Review Required"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Eligibility Status */}
                        {rulesEvaluation.final_result?.decision && (
                          <div
                            className={`rounded-md p-3 ${
                              rulesEvaluation.final_result.decision ===
                              "approve"
                                ? "bg-green-50 dark:bg-green-950"
                                : rulesEvaluation.final_result.decision ===
                                    "reject"
                                  ? "bg-red-50 dark:bg-red-950"
                                  : "bg-yellow-50 dark:bg-yellow-950"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {rulesEvaluation.final_result.decision ===
                              "approve" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : rulesEvaluation.final_result.decision ===
                                "reject" ? (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Info className="h-4 w-4 text-yellow-600" />
                              )}
                              <div className="text-sm font-medium">
                                {rulesEvaluation.final_result.decision ===
                                "approve"
                                  ? "Customer is eligible for this product"
                                  : rulesEvaluation.final_result.decision ===
                                      "reject"
                                    ? "Customer is not eligible for this product"
                                    : "Eligibility requires manual review"}
                              </div>
                            </div>
                            {rulesEvaluation.final_result.decision ===
                              "reject" &&
                              rulesEvaluation.matched_rules && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Review matched rules below for eligibility
                                  criteria
                                </div>
                              )}
                          </div>
                        )}

                        {rulesEvaluation.final_result && (
                          <div className="space-y-2">
                            {rulesEvaluation.final_result.limits &&
                              Object.keys(rulesEvaluation.final_result.limits)
                                .length > 0 && (
                                <div>
                                  <div className="mb-1 text-sm font-medium">
                                    Dynamic Limits:
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    {Object.entries(
                                      rulesEvaluation.final_result.limits
                                    ).map(([key, value]: [string, any]) => (
                                      <div
                                        key={key}
                                        className="flex justify-between"
                                      >
                                        <span className="text-muted-foreground">
                                          {key.replace(/_/g, " ")}:
                                        </span>
                                        <span className="font-medium">
                                          {typeof value === "number"
                                            ? value.toLocaleString()
                                            : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {rulesEvaluation.final_result.pricing &&
                              Object.keys(rulesEvaluation.final_result.pricing)
                                .length > 0 && (
                                <div>
                                  <div className="mb-1 text-sm font-medium">
                                    Risk-Based Pricing:
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    {Object.entries(
                                      rulesEvaluation.final_result.pricing
                                    ).map(([key, value]: [string, any]) => (
                                      <div
                                        key={key}
                                        className="flex justify-between"
                                      >
                                        <span className="text-muted-foreground">
                                          {key.replace(/_/g, " ")}:
                                        </span>
                                        <span className="font-medium">
                                          {typeof value === "number"
                                            ? `${(value * 100).toFixed(2)}%`
                                            : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {rulesEvaluation.final_result.decision && (
                              <div>
                                <div className="mb-1 text-sm font-medium">
                                  Automated Decision:
                                </div>
                                <Badge
                                  variant={
                                    rulesEvaluation.final_result.decision ===
                                    "approve"
                                      ? "default"
                                      : rulesEvaluation.final_result
                                            .decision === "reject"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {rulesEvaluation.final_result.decision.toUpperCase()}
                                </Badge>
                              </div>
                            )}
                            {rulesEvaluation.final_result.flags &&
                              rulesEvaluation.final_result.flags.length > 0 && (
                                <div>
                                  <div className="mb-1 text-sm font-medium">
                                    Flags:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {rulesEvaluation.final_result.flags.map(
                                      (flag: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {flag}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            {rulesEvaluation.matched_rules &&
                              rulesEvaluation.matched_rules.length > 0 && (
                                <div>
                                  <div className="mb-1 text-sm font-medium">
                                    Matched Rules (
                                    {rulesEvaluation.matched_rules.length}):
                                  </div>
                                  <div className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                                    {rulesEvaluation.matched_rules.map(
                                      (rule: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-2"
                                        >
                                          <span className="text-green-600">
                                            ✓
                                          </span>
                                          <div>
                                            <div className="font-medium">
                                              {rule.rule_name || rule.rule_id}
                                            </div>
                                            {rule.matched_conditions && (
                                              <div className="mt-0.5 text-xs text-muted-foreground">
                                                Conditions:{" "}
                                                {rule.matched_conditions.join(
                                                  ", "
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            {rulesEvaluation.workflow && (
                              <div className="border-t pt-3">
                                <div className="mb-1 text-sm font-medium">
                                  Workflow Automation:
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  {rulesEvaluation.workflow.executed_actions &&
                                    rulesEvaluation.workflow.executed_actions
                                      .length > 0 && (
                                      <div>
                                        <div className="mb-1 font-medium">
                                          Actions to Execute:
                                        </div>
                                        {rulesEvaluation.workflow.executed_actions.map(
                                          (action: any, idx: number) => (
                                            <div key={idx} className="pl-2">
                                              •{" "}
                                              {action.action?.type ||
                                                action.type}{" "}
                                              - {action.rule_name || "Rule"}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Default Prediction Results */}
                  {defaultPrediction && (
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <AlertCircle
                            className={`h-4 w-4 ${
                              defaultPrediction.risk_level === "Low"
                                ? "text-green-500"
                                : defaultPrediction.risk_level === "Medium"
                                  ? "text-yellow-500"
                                  : defaultPrediction.risk_level === "High"
                                    ? "text-orange-500"
                                    : "text-red-500"
                            }`}
                          />
                          Default Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Risk Score
                            </div>
                            <div className="text-2xl font-bold">
                              {defaultPrediction.risk_score !== undefined
                                ? defaultPrediction.risk_score.toFixed(1)
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Risk Level
                            </div>
                            <Badge
                              className={
                                defaultPrediction.risk_level === "Low"
                                  ? "bg-green-500"
                                  : defaultPrediction.risk_level === "Medium"
                                    ? "bg-yellow-500"
                                    : defaultPrediction.risk_level === "High"
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }
                            >
                              {defaultPrediction.risk_level || "N/A"}
                            </Badge>
                          </div>
                        </div>

                        {/* Time to Default */}
                        {defaultPrediction.time_to_default_months !==
                          undefined &&
                          defaultPrediction.time_to_default_months > 0 && (
                            <div className="border-t pt-3">
                              <div className="mb-1 text-sm text-muted-foreground">
                                Predicted Time to Default
                              </div>
                              <div className="text-lg font-semibold">
                                {defaultPrediction.time_to_default_months}{" "}
                                months
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Estimated month when default is likely to occur
                              </div>
                            </div>
                          )}

                        {/* Default Probability */}
                        {defaultPrediction.default_probability !==
                          undefined && (
                          <div>
                            <div className="mb-1 text-sm text-muted-foreground">
                              Default Probability (12 months)
                            </div>
                            <div className="text-lg font-semibold">
                              {(
                                defaultPrediction.default_probability * 100
                              ).toFixed(2)}
                              %
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                              <div
                                className={`h-2 rounded-full ${
                                  defaultPrediction.default_probability < 0.2
                                    ? "bg-green-500"
                                    : defaultPrediction.default_probability <
                                        0.4
                                      ? "bg-yellow-500"
                                      : defaultPrediction.default_probability <
                                          0.7
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(defaultPrediction.default_probability * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Hazard Ratios */}
                        {defaultPrediction.hazard_ratio !== undefined && (
                          <div className="border-t pt-3">
                            <div className="mb-1 text-sm font-medium">
                              Hazard Ratio
                            </div>
                            <div className="text-lg font-semibold">
                              {defaultPrediction.hazard_ratio.toFixed(2)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {defaultPrediction.hazard_ratio > 1
                                ? `Risk is ${(defaultPrediction.hazard_ratio - 1) * 100}% higher than baseline`
                                : defaultPrediction.hazard_ratio < 1
                                  ? `Risk is ${(1 - defaultPrediction.hazard_ratio) * 100}% lower than baseline`
                                  : "Risk matches baseline"}
                            </div>
                          </div>
                        )}

                        {/* Risk Factors Breakdown */}
                        {defaultPrediction.risk_factors &&
                          Array.isArray(defaultPrediction.risk_factors) &&
                          defaultPrediction.risk_factors.length > 0 && (
                            <div className="border-t pt-3">
                              <div className="mb-2 text-sm font-medium">
                                Risk Factors:
                              </div>
                              <div className="space-y-2">
                                {defaultPrediction.risk_factors
                                  .slice(0, 5)
                                  .map((factor: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-muted-foreground">
                                        {factor.factor_name ||
                                          factor.name ||
                                          `Factor ${idx + 1}`}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-gray-200">
                                          <div
                                            className="h-2 rounded-full bg-red-500"
                                            style={{
                                              width: `${Math.min((factor.impact_score || factor.score || 0) * 100, 100)}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="w-12 text-right text-xs font-medium">
                                          {(
                                            (factor.impact_score ||
                                              factor.score ||
                                              0) * 100
                                          ).toFixed(0)}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Survival Probabilities */}
                        {defaultPrediction.survival_probabilities &&
                          defaultPrediction.survival_probabilities.length >
                            0 && (
                            <div className="border-t pt-3">
                              <div className="mb-1 text-sm font-medium">
                                Survival Probabilities:
                              </div>
                              <div className="space-y-1 text-xs">
                                {defaultPrediction.survival_probabilities.map(
                                  (prob: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between"
                                    >
                                      <span>
                                        {prob.time_months ||
                                          prob.time ||
                                          prob.months ||
                                          `${(idx + 1) * 6} months`}
                                        :
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-20 rounded-full bg-gray-200">
                                          <div
                                            className="h-1.5 rounded-full bg-blue-500"
                                            style={{
                                              width: `${(prob.survival_probability || prob.probability || 0) * 100}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="w-12 text-right font-medium">
                                          {(
                                            (prob.survival_probability ||
                                              prob.probability ||
                                              0) * 100
                                          ).toFixed(1)}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Recommendations */}
                        {defaultPrediction.recommendations &&
                          defaultPrediction.recommendations.length > 0 && (
                            <div className="border-t pt-3">
                              <div className="mb-1 text-sm font-medium">
                                Recommendations:
                              </div>
                              <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                                {defaultPrediction.recommendations.map(
                                  (rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLoan}
                  disabled={
                    createLoanMutation.isPending ||
                    (nbeValidation &&
                      !nbeValidation.compliant &&
                      nbeValidation.violations &&
                      nbeValidation.violations.length > 0)
                  }
                  className={
                    nbeValidation &&
                    !nbeValidation.compliant &&
                    nbeValidation.violations &&
                    nbeValidation.violations.length > 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }
                >
                  {createLoanMutation.isPending
                    ? "Creating..."
                    : "Create Application"}
                </Button>
                {nbeValidation &&
                  !nbeValidation.compliant &&
                  nbeValidation.violations &&
                  nbeValidation.violations.length > 0 && (
                    <p className="col-span-2 text-center text-xs text-red-600">
                      Cannot submit: Please fix NBE compliance violations above
                    </p>
                  )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DashboardSection
        title="Loan Applications"
        description={`Manage and track loan applications. ${total} total applications in the system.`}
        icon={FileText}
        actions={
          <>
            {selectedApplications.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setBulkOperationsOpen(true)}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Bulk Operations ({selectedApplications.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={applications.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications List</CardTitle>
                <CardDescription>{total} total applications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2 space-x-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={loanTypeFilter || "all"}
                onValueChange={(value) =>
                  setLoanTypeFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="personal_loan">Personal Loan</SelectItem>
                  <SelectItem value="business_loan">Business Loan</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="vehicle_loan">Vehicle Loan</SelectItem>
                  <SelectItem value="agricultural_loan">
                    Agricultural Loan
                  </SelectItem>
                  <SelectItem value="microfinance">Microfinance</SelectItem>
                </SelectContent>
              </Select>
              <Collapsible
                open={showAdvancedFilters}
                onOpenChange={setShowAdvancedFilters}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Advanced Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2" variant="secondary">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>Application Number</Label>
                          <Input
                            placeholder="Filter by application number"
                            value={applicationNumberFilter}
                            onChange={(e) =>
                              setApplicationNumberFilter(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Customer ID</Label>
                          <Input
                            placeholder="Filter by customer ID"
                            value={customerIdFilter}
                            onChange={(e) =>
                              setCustomerIdFilter(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Customer Name</Label>
                          <Input
                            placeholder="Filter by customer name"
                            value={customerNameFilter}
                            onChange={(e) =>
                              setCustomerNameFilter(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>NBE Compliance</Label>
                          <Select
                            value={nbeCompliantFilter || "all"}
                            onValueChange={(value) =>
                              setNbeCompliantFilter(
                                value === "all" ? "" : value
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="true">Compliant</SelectItem>
                              <SelectItem value="false">
                                Non-Compliant
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Risk Level</Label>
                          <Select
                            value={riskLevelFilter || "all"}
                            onValueChange={(value) =>
                              setRiskLevelFilter(value === "all" ? "" : value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very_high">
                                Very High
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Min Credit Score</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={minCreditScoreFilter}
                            onChange={(e) =>
                              setMinCreditScoreFilter(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Max Credit Score</Label>
                          <Input
                            type="number"
                            placeholder="1000"
                            value={maxCreditScoreFilter}
                            onChange={(e) =>
                              setMaxCreditScoreFilter(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Min Amount (ETB)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={minAmountFilter}
                            onChange={(e) => setMinAmountFilter(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Max Amount (ETB)</Label>
                          <Input
                            type="number"
                            placeholder="No limit"
                            value={maxAmountFilter}
                            onChange={(e) => setMaxAmountFilter(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Application Date From</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateFromFilter
                                  ? format(dateFromFilter, "PPP")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={dateFromFilter}
                                onSelect={setDateFromFilter}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Application Date To</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateToFilter
                                  ? format(dateToFilter, "PPP")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={dateToFilter}
                                onSelect={setDateToFilter}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Approval Date From</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {approvalDateFromFilter
                                  ? format(approvalDateFromFilter, "PPP")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={approvalDateFromFilter}
                                onSelect={setApprovalDateFromFilter}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Approval Date To</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {approvalDateToFilter
                                  ? format(approvalDateToFilter, "PPP")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={approvalDateToFilter}
                                onSelect={setApprovalDateToFilter}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {savedFilterPresets.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Filter className="mr-2 h-4 w-4" />
                                  Saved Presets ({savedFilterPresets.length})
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div className="space-y-2">
                                  {savedFilterPresets.map((preset, idx) => (
                                    <Button
                                      key={idx}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start"
                                      onClick={() => loadFilterPreset(preset)}
                                    >
                                      {preset.name}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={saveFilterPreset}
                          >
                            <Filter className="mr-2 h-4 w-4" />
                            Save Preset
                          </Button>
                        </div>
                        {activeFiltersCount > 0 && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFilters}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Clear All Filters
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportToCSV}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export CSV
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive">Failed to load applications</p>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No applications found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <input
                            type="checkbox"
                            checked={
                              selectedApplications.length ===
                                applications.length && applications.length > 0
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApplications(
                                  applications
                                    .map(
                                      (app: any) =>
                                        app.id ||
                                        app.loan_id ||
                                        app.application_id
                                    )
                                    .filter(Boolean)
                                );
                              } else {
                                setSelectedApplications([]);
                              }
                            }}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead>Application #</TableHead>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Loan Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Credit Score</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>NBE Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app: any) => {
                        const appId =
                          app.id || app.loan_id || app.application_id;
                        return (
                          <TableRow key={appId}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedApplications.includes(appId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedApplications([
                                      ...selectedApplications,
                                      appId,
                                    ]);
                                  } else {
                                    setSelectedApplications(
                                      selectedApplications.filter(
                                        (id) => id !== appId
                                      )
                                    );
                                  }
                                }}
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {app.application_number}
                            </TableCell>
                            <TableCell>{app.customer_id}</TableCell>
                            <TableCell>
                              {app.loan_type?.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("en-ET", {
                                style: "currency",
                                currency: "ETB",
                              }).format(app.requested_amount || 0)}
                            </TableCell>
                            <TableCell>{app.loan_term_months} months</TableCell>
                            <TableCell>
                              {app.credit_score ? (
                                <Badge variant="outline">
                                  {app.credit_score}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getRiskBadge(app.risk_level)}
                            </TableCell>
                            <TableCell>
                              {app.nbe_compliant !== undefined ? (
                                app.nbe_compliant ? (
                                  <Badge className="bg-green-500">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Compliant
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Non-Compliant
                                  </Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(app.application_status)}
                            </TableCell>
                            <TableCell>
                              {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Handle different ID field names
                                  const appId =
                                    app.id || app.loan_id || app.application_id;
                                  console.log(
                                    "[LoanApplications] Navigating to application:",
                                    {
                                      appId,
                                      appFields: Object.keys(app),
                                      appIdValue: app.id,
                                      loanIdValue: app.loan_id,
                                      applicationIdValue: app.application_id,
                                    }
                                  );
                                  if (appId) {
                                    navigateTo(`/loans/applications/${appId}`);
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: "Application ID not found",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, total)} of {total}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Bulk Operations Dialog */}
      <Dialog open={bulkOperationsOpen} onOpenChange={setBulkOperationsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>
              Perform bulk operations on {selectedApplications.length} selected
              application{selectedApplications.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Operation Type Selection */}
            <div>
              <Label>Operation Type</Label>
              <Select
                value={bulkOperationType}
                onValueChange={(value: "update" | "validate") =>
                  setBulkOperationType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Bulk Status Update</SelectItem>
                  <SelectItem value="validate">Bulk Validation</SelectItem>
                  <SelectItem value="export">Bulk Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkOperationType === "update" && (
              <div>
                <Label>New Status</Label>
                <Select
                  value={bulkStatusUpdate}
                  onValueChange={setBulkStatusUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bulk Import Section */}
            <div>
              <Label>Bulk Import (CSV/Excel)</Label>
              <div className="mt-2 rounded-lg border-2 border-dashed p-6 text-center">
                <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground">
                  Upload a file to import multiple applications
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Supported formats: CSV, XLSX, XLS (Max 10MB)
                </p>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  id="bulk-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "File too large",
                          description: "File size must be less than 10MB",
                          variant: "destructive",
                        });
                        return;
                      }
                      toast({
                        title: "File selected",
                        description: `Processing ${file.name}...`,
                      });
                      // File processing would go here
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("bulk-upload")?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
            </div>

            {/* Selected Applications Summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Selected Applications
                </Label>
                <Badge variant="secondary">
                  {selectedApplications.length} selected
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Applications will be processed in the order they appear in the
                list
              </div>
            </div>

            {/* Progress Tracking (if operation is in progress) */}
            {bulkOperationsMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing...</span>
                  <span className="text-muted-foreground">Please wait</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setBulkOperationsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (bulkOperationType === "update" && !bulkStatusUpdate) {
                    toast({
                      title: "Error",
                      description: "Please select a status",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (bulkOperationType === "export") {
                    // Export selected applications
                    const {
                      exportToCSV: exportCSV,
                    } = require("@/lib/utils/exportHelpers");
                    const exportData = applications
                      .filter((app: any) => {
                        const appId =
                          app.id || app.loan_id || app.application_id;
                        return selectedApplications.includes(appId);
                      })
                      .map((app: any) => ({
                        "Application #": app.application_number,
                        "Customer ID": app.customer_id,
                        "Loan Type": app.loan_type,
                        Amount: app.requested_amount,
                        Term: app.loan_term_months,
                        Status: app.application_status,
                        "Credit Score": app.credit_score,
                        "Risk Level": app.risk_level,
                      }));

                    exportCSV(
                      exportData,
                      `bulk_export_${format(new Date(), "yyyy-MM-dd")}`
                    );
                    toast({
                      title: "Success",
                      description: `Exported ${exportData.length} applications`,
                    });
                    setBulkOperationsOpen(false);
                    return;
                  }

                  try {
                    await bulkOperationsMutation.mutateAsync({
                      application_ids: selectedApplications,
                      operation: bulkOperationType,
                      ...(bulkOperationType === "update" && {
                        status: bulkStatusUpdate,
                      }),
                    });
                    setBulkOperationsOpen(false);
                    setSelectedApplications([]);
                  } catch (error) {
                    // Error handled by mutation
                  }
                }}
                disabled={
                  bulkOperationsMutation.isPending ||
                  (bulkOperationType === "update" && !bulkStatusUpdate)
                }
              >
                {bulkOperationsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : bulkOperationType === "export" ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </>
                ) : (
                  "Execute Bulk Operation"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoanApplicationsPage() {
  return (
    <ErrorBoundary>
      <LoanApplicationsPageContent />
    </ErrorBoundary>
  );
}
