/**
 * Zod validation schemas for forms
 */
import { z } from "zod";
import { nbeComplianceValidator } from "./nbe-compliance";
import {
  ethiopianPhoneValidator,
  ethiopianIdValidator,
  formatETB,
  parseETB,
  etbCurrencyValidator,
  ethiopianRegionValidator,
  ethiopianBusinessSectorValidator,
  validateIncomeExpenses,
  validateLoanAffordability,
  validateCreditUtilization,
  validateEmploymentStability,
  validateAgeEmployment,
} from "./ethiopianValidators";

// Re-export Ethiopian validators
export const ethiopianPhoneSchema = ethiopianPhoneValidator;
export const ethiopianIdSchema = ethiopianIdValidator;
export { formatETB, parseETB };

// NBE compliance constants
const NBE_RULES = {
  min_loan_amount: 1000,
  max_loan_amount: 5000000,
  max_loan_term_months: 60,
  min_interest_rate: 0.12,
  max_interest_rate: 0.25,
  salary_rule_ratio: 1 / 3,
};

// Credit scoring form schema with NBE compliance - Extended with all 197 fields
export const creditScoringFormSchema = z.object({
  // Basic Info
  customer_id: z.string().min(1, "Customer ID is required"),
  loan_amount: z
    .number()
    .positive("Loan amount must be positive")
    .min(NBE_RULES.min_loan_amount, `Loan amount must be at least ${NBE_RULES.min_loan_amount.toLocaleString()} ETB (NBE minimum)`)
    .max(NBE_RULES.max_loan_amount, `Loan amount cannot exceed ${NBE_RULES.max_loan_amount.toLocaleString()} ETB (NBE maximum)`),
  loan_term_months: z
    .number()
    .int()
    .min(1, "Loan term must be at least 1 month")
    .max(NBE_RULES.max_loan_term_months, `Loan term cannot exceed ${NBE_RULES.max_loan_term_months} months (NBE maximum)`),
  monthly_income: z.number().positive("Monthly income must be positive"),
  monthly_expenses: z.number().min(0),
  
  // Financial
  savings_balance: z.number().min(0),
  checking_balance: z.number().min(0),
  total_debt: z.number().min(0),
  credit_utilization_ratio: z.number().min(0).max(100),
  
  // Credit History
  credit_history_length: z.number().int().min(0),
  number_of_credit_accounts: z.number().int().min(0),
  payment_history_score: z.number().min(0).max(100),
  number_of_late_payments: z.number().int().min(0),
  number_of_defaults: z.number().int().min(0),
  
  // Core Credit Performance - Additional fields
  tenure_with_akafay_months: z.number().int().min(0).optional(),
  new_accounts_last_6m: z.number().int().min(0).optional(),
  inquiries_last_6m: z.number().int().min(0).optional(),
  inquiries_last_12m: z.number().int().min(0).optional(),
  utilization_trend_3m: z.number().min(0).max(100).optional(),
  utilization_trend_6m: z.number().min(0).max(100).optional(),
  public_record_flag: z.boolean().optional(),
  bankruptcy_flag: z.boolean().optional(),
  repossession_flag: z.boolean().optional(),
  foreclosure_flag: z.boolean().optional(),
  tax_lien_flag: z.boolean().optional(),
  judgment_flag: z.boolean().optional(),
  
  // Affordability & Obligations - Additional fields
  existing_loan_payments: z.number().min(0).optional(),
  other_monthly_obligations: z.number().min(0).optional(),
  emergency_fund_months: z.number().min(0).optional(),
  savings_rate: z.number().min(0).max(100).optional(),
  
  // Bank & Mobile Money Dynamics
  bank_account_age_months: z.number().int().min(0).optional(),
  mobile_money_account_age_months: z.number().int().min(0).optional(),
  transaction_frequency: z.number().int().min(0).optional(),
  mpesa_balance: z.number().min(0).optional(),
  direct_deposit_flag: z.boolean().optional(),
  bank_transaction_count_30d: z.number().int().min(0).optional(),
  bank_transaction_count_90d: z.number().int().min(0).optional(),
  mobile_money_transaction_count_30d: z.number().int().min(0).optional(),
  mobile_money_transaction_count_90d: z.number().int().min(0).optional(),
  
  // Identity & Fraud Intelligence
  fayda_verification_status: z.string().optional(),
  kyc_level: z.string().optional(),
  device_compromise_status: z.string().optional(),
  biometric_liveness_check: z.string().optional(),
  phone_tenure_months: z.number().int().min(0).optional(),
  id_verification_status: z.string().optional(),
  phone_verification_status: z.string().optional(),
  fraud_score: z.number().min(0).max(100).optional(),
  suspicious_activity_flag: z.boolean().optional(),
  
  // Personal & Professional Stability
  marital_status: z.enum(["Single", "Married", "Divorced", "Widowed", "Unknown"]).optional(),
  education_level: z.enum(["High School", "Bachelor's", "Master's", "PhD", "Other", "Unknown"]).optional(),
  years_at_current_address: z.number().min(0).optional(),
  dependents: z.number().int().min(0).optional(),
  employment_stability_score: z.number().min(0).max(100).optional(),
  
  // Contextual & Macroeconomic Factors
  regional_economic_index: z.number().min(0).max(100).optional(),
  sector_growth_rate: z.number().optional(),
  inflation_rate: z.number().optional(),
  unemployment_rate_regional: z.number().min(0).max(100).optional(),
  
  // Product Specific Intelligence
  loan_product_type: z.enum([
    "PersonalLoan", "PayBoost", "BusinessLoan", "MortgageLoan", 
    "InvoiceAdvance", "TrustLoan", "AutoLoan", "BNPL", 
    "SecuredLoan", "AgricultureLoan", "StudentLoan", "GreenLoan", 
    "RevolvingCredit", "DeviceFinance", "Overdraft"
  ]).optional(),
  channel_type: z.string().optional(),
  application_source: z.string().optional(),
  cross_sell_opportunity_score: z.number().min(0).max(100).optional(),
  
  // Business & Receivables Finance
  years_in_business: z.number().min(0).optional(),
  industry_risk_score: z.number().min(0).max(100).optional(),
  merchant_revenue_share: z.array(z.number()).optional(),
  seasonality_index: z.number().min(0).max(100).optional(),
  
  // Behavioral Intelligence
  application_velocity: z.number().min(0).optional(),
  time_of_day_application: z.string().optional(),
  device_type: z.string().optional(),
  
  // Digital Behavioral Intelligence
  app_usage_frequency: z.number().int().min(0).optional(),
  session_duration: z.number().min(0).optional(),
  spending_category_distribution: z.record(z.number()).optional(),
  
  // Model Governance
  model_version: z.string().optional(),
  feature_drift_score: z.number().min(0).max(100).optional(),
  prediction_confidence: z.number().min(0).max(1).optional(),
  data_quality_score: z.number().min(0).max(100).optional(),
  
  // Employment
  employment_status: z.enum(["employed", "self_employed", "unemployed", "retired"]),
  years_employed: z.number().min(0),
  employer_name: z.string().optional(),
  
  // Personal
  age: z.number().int().min(18).max(100),
  region: ethiopianRegionValidator.optional(),
  urban_rural: z.enum(["urban", "rural"]).optional(),
  business_sector: ethiopianBusinessSectorValidator.optional(),
  
  // Optional fields
  phone_number: ethiopianPhoneSchema.optional().or(z.literal("")),
  id_number: ethiopianIdSchema.optional().or(z.literal("")),
  collateral_value: z.number().min(0).optional(),
  guarantor_available: z.boolean().optional(),
  loan_purpose: z.string().optional(),
}).refine(
  (data) => {
    // 1/3 salary rule validation
    const maxAffordablePayment = data.monthly_income * NBE_RULES.salary_rule_ratio;
    const proposedPayment = data.loan_amount / data.loan_term_months;
    return proposedPayment <= maxAffordablePayment;
  },
  {
    message: "Loan payment exceeds 1/3 of monthly income (NBE compliance rule). Please reduce loan amount or extend term.",
    path: ["loan_amount"],
  }
).refine(
  (data) => {
    // Additional validation: ensure loan amount is within affordable range
    const maxAffordableLoan = data.monthly_income * NBE_RULES.salary_rule_ratio * data.loan_term_months;
    return data.loan_amount <= maxAffordableLoan;
  },
  {
    message: "Loan amount exceeds maximum affordable amount based on income and term (NBE compliance)",
    path: ["loan_amount"],
  }
).refine(
  (data) => {
    // Cross-field validation: Income vs Expenses
    const incomeExpenseCheck = validateIncomeExpenses(
      data.monthly_income,
      data.monthly_expenses
    );
    return incomeExpenseCheck.valid;
  },
  {
    message: "Monthly expenses cannot exceed monthly income",
    path: ["monthly_expenses"],
  }
).refine(
  (data) => {
    // Cross-field validation: Credit utilization
    if (data.total_debt !== undefined && data.credit_utilization_ratio !== undefined) {
      const utilizationCheck = validateCreditUtilization(
        data.total_debt,
        data.credit_utilization_ratio
      );
      return utilizationCheck.valid;
    }
    return true;
  },
  {
    message: "Credit utilization ratio validation failed",
    path: ["credit_utilization_ratio"],
  }
).refine(
  (data) => {
    // Cross-field validation: Employment stability
    if (data.employment_status && data.years_employed !== undefined && data.monthly_income !== undefined) {
      const employmentCheck = validateEmploymentStability(
        data.employment_status,
        data.years_employed,
        data.monthly_income
      );
      return employmentCheck.valid;
    }
    return true;
  },
  {
    message: "Employment status validation failed",
    path: ["employment_status"],
  }
).refine(
  (data) => {
    // Cross-field validation: Age and employment
    if (data.age !== undefined && data.employment_status && data.years_employed !== undefined) {
      const ageCheck = validateAgeEmployment(
        data.age,
        data.employment_status,
        data.years_employed
      );
      return ageCheck.valid;
    }
    return true;
  },
  {
    message: "Age and employment validation failed",
    path: ["age"],
  }
)
.refine(
  (data) => {
    // Monthly income should be reasonable (100 to 1,000,000 ETB)
    if (data.monthly_income && (data.monthly_income < 100 || data.monthly_income > 1000000)) {
      return false;
    }
    return true;
  },
  {
    message: "Monthly income must be between 100 and 1,000,000 ETB",
    path: ["monthly_income"],
  }
);

export type CreditScoringFormData = z.infer<typeof creditScoringFormSchema>;

// Login form schema
export const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;









