/**
 * Transform customer registration form data to API format
 * Handles multi-card support and legacy format compatibility
 */
import { CustomerRegistrationFormData } from "./customerRegistrationSchema";

export interface TransformedCustomerData {
  customer_id: string;
  full_name: string;
  phone_number: string;
  id_number: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  number_of_dependents?: number;
  region: string;
  city: string;
  sub_city?: string;
  postal_code?: string;
  address?: string;
  
  // Employment & Income (legacy fields - used if cards array not provided)
  employment_status?: string;
  employer_name?: string;
  employment_sector?: string;
  job_title?: string;
  employment_years?: number;
  current_job_months?: number;
  monthly_income?: number;
  
  // Bank (legacy fields)
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  bank_account_age_months?: number;
  bank_avg_balance_6m?: number;
  
  // Multi-card support (NEW - preferred)
  cards?: Array<{
    card_number: number;
    card_name?: string;
    is_primary?: boolean;
    employer?: {
      employer_name?: string;
      employment_status?: string;
      employment_sector?: string;
      job_title?: string;
      employment_years?: number;
      current_job_months?: number;
      monthly_income?: number;
    };
    bank?: {
      bank_name?: string;
      bank_account_number?: string;
      bank_account_type?: string;
      bank_account_age_months?: number;
      bank_avg_balance_6m?: number;
    };
  }>;
  
  // Financial
  monthly_expenses?: number;
  debt_to_income_ratio?: number;
  scheduled_monthly_debt_service?: number;
  total_outstanding_balance_etb?: number;
  total_credit_limit_etb?: number;
  existing_loan_count_open?: number;
  cash_buffer_days?: number;
  income_stability_cv_6m?: number;
  pension_plan_participation?: boolean;
  health_insurance_coverage?: string;
  education_level?: string;
  
  // All other optional fields (spread to include all 168 features)
  [key: string]: any;
}

/**
 * Transform form data to API-expected format
 * 
 * Rules:
 * 1. If cards array is provided and has items, use cards format (preferred)
 * 2. If cards array is empty/undefined but legacy fields exist, convert legacy to Card 1
 * 3. If both cards and legacy fields exist, prioritize cards array (per API docs)
 * 4. Include all other fields as-is
 */
export function transformCustomerRegistration(
  formData: CustomerRegistrationFormData
): TransformedCustomerData {
  const transformed: TransformedCustomerData = {
    customer_id: formData.customer_id,
    full_name: formData.full_name,
    phone_number: formData.phone_number,
    id_number: formData.id_number,
    region: formData.region,
    city: formData.city,
  };

  // Add optional basic fields
  if (formData.email) transformed.email = formData.email;
  if (formData.date_of_birth) transformed.date_of_birth = formData.date_of_birth;
  if (formData.gender) transformed.gender = formData.gender;
  if (formData.marital_status) transformed.marital_status = formData.marital_status;
  if (formData.number_of_dependents !== undefined) transformed.number_of_dependents = formData.number_of_dependents;
  if (formData.sub_city) transformed.sub_city = formData.sub_city;
  if (formData.postal_code) transformed.postal_code = formData.postal_code;
  if (formData.address) transformed.address = formData.address;

  // Handle cards vs legacy format
  const hasCards = formData.cards && formData.cards.length > 0;
  const hasLegacyFields = 
    formData.employment_status ||
    formData.employer_name ||
    formData.monthly_income ||
    formData.bank_name ||
    formData.bank_account_number;

  if (hasCards) {
    // Multi-card format (preferred)
    transformed.cards = formData.cards.map((card, index) => ({
      card_number: card.card_number || (index + 1),
      card_name: card.card_name,
      is_primary: card.is_primary || (index === 0), // First card is primary by default
      employer: card.employer ? {
        employer_name: card.employer.employer_name,
        employment_status: card.employer.employment_status,
        employment_sector: card.employer.employment_sector,
        job_title: card.employer.job_title,
        employment_years: card.employer.employment_years,
        current_job_months: card.employer.current_job_months,
        monthly_income: card.employer.monthly_income,
      } : undefined,
      bank: card.bank ? {
        bank_name: card.bank.bank_name,
        bank_account_number: card.bank.bank_account_number,
        bank_account_type: card.bank.bank_account_type,
        bank_account_age_months: card.bank.bank_account_age_months,
        bank_avg_balance_6m: card.bank.bank_avg_balance_6m,
      } : undefined,
    }));
    
    // Per API docs: When cards array is provided, DON'T include top-level employer/bank fields
    // So we skip legacy fields when cards are present
  } else if (hasLegacyFields) {
    // Legacy format: Convert to Card 1
    transformed.cards = [
      {
        card_number: 1,
        card_name: "Primary Employment",
        is_primary: true,
        employer: {
          employer_name: formData.employer_name,
          employment_status: formData.employment_status,
          employment_sector: formData.employment_sector,
          job_title: formData.job_title,
          employment_years: formData.employment_years,
          current_job_months: formData.current_job_months,
          monthly_income: formData.monthly_income,
        },
        bank: {
          bank_name: formData.bank_name,
          bank_account_number: formData.bank_account_number,
          bank_account_type: formData.bank_account_type,
          bank_account_age_months: formData.bank_account_age_months,
          bank_avg_balance_6m: formData.bank_avg_balance_6m,
        },
      },
    ];
  }

  // Financial fields
  if (formData.monthly_expenses !== undefined) transformed.monthly_expenses = formData.monthly_expenses;
  if (formData.debt_to_income_ratio !== undefined) transformed.debt_to_income_ratio = formData.debt_to_income_ratio;
  if (formData.scheduled_monthly_debt_service !== undefined) transformed.scheduled_monthly_debt_service = formData.scheduled_monthly_debt_service;
  if (formData.total_outstanding_balance_etb !== undefined) transformed.total_outstanding_balance_etb = formData.total_outstanding_balance_etb;
  if (formData.total_credit_limit_etb !== undefined) transformed.total_credit_limit_etb = formData.total_credit_limit_etb;
  if (formData.existing_loan_count_open !== undefined) transformed.existing_loan_count_open = formData.existing_loan_count_open;
  if (formData.cash_buffer_days !== undefined) transformed.cash_buffer_days = formData.cash_buffer_days;
  if (formData.income_stability_cv_6m !== undefined) transformed.income_stability_cv_6m = formData.income_stability_cv_6m;
  if (formData.pension_plan_participation !== undefined) transformed.pension_plan_participation = formData.pension_plan_participation;
  if (formData.health_insurance_coverage) transformed.health_insurance_coverage = formData.health_insurance_coverage;
  if (formData.education_level) transformed.education_level = formData.education_level;

  // Include all other fields (for advanced sections - bank details, mobile money, digital behavioral, etc.)
  // This ensures all 168 features are passed through if provided
  const excludedFields = new Set([
    "customer_id",
    "full_name",
    "phone_number",
    "id_number",
    "email",
    "date_of_birth",
    "gender",
    "marital_status",
    "number_of_dependents",
    "region",
    "city",
    "sub_city",
    "postal_code",
    "address",
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
  ]);

  // Spread all other fields
  Object.keys(formData).forEach((key) => {
    if (!excludedFields.has(key)) {
      const value = (formData as any)[key];
      if (value !== undefined && value !== null && value !== "") {
        transformed[key] = value;
      }
    }
  });

  return transformed;
}

