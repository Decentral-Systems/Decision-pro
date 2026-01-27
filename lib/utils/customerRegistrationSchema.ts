/**
 * Comprehensive Zod validation schema for customer registration
 * Supports all 168 features while maintaining flexible validation
 */
import { z } from "zod";

// Ethiopian phone number validation
export const ethiopianPhoneSchema = z
  .string()
  .regex(/^(\+251|0)[0-9]{9}$/, "Invalid Ethiopian phone number format. Use +251XXXXXXXXX or 0XXXXXXXXX");

// Ethiopian ID number validation (16 digits - updated from 10)
export const ethiopianIdSchema = z
  .string()
  .regex(/^[0-9]{16}$/, "Ethiopian ID number must be exactly 16 digits");

// Card schema for multi-card support
export const employerCardSchema = z.object({
  employer_name: z.string().max(200).optional(),
  employment_status: z.enum(["Employed", "Self-Employed", "Part-time", "Unemployed", "Student", "Retired"]).optional(),
  employment_sector: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  employment_years: z.number().int().min(0).max(50).optional(),
  current_job_months: z.number().int().min(0).max(600).optional(),
  monthly_income: z.number().min(0).optional(),
});

export const bankCardSchema = z.object({
  bank_name: z.string().max(200).optional(),
  bank_account_number: z.string().max(50).optional(),
  bank_account_type: z.enum(["Checking", "Savings", "Current"]).optional(),
  bank_account_age_months: z.number().int().min(0).max(600).optional(),
  bank_avg_balance_6m: z.number().min(0).optional(),
});

export const cardSchema = z.object({
  card_number: z.number().int().positive(),
  card_name: z.string().max(100).optional(),
  is_primary: z.boolean().optional(),
  employer: employerCardSchema.optional(),
  bank: bankCardSchema.optional(),
});

// Comprehensive customer registration schema
export const customerRegistrationSchema = z.object({
  // ============================================
  // BASIC INFORMATION (Required fields)
  // ============================================
  customer_id: z.string().min(1, "Customer ID is required").max(50, "Customer ID must be less than 50 characters"),
  full_name: z.string().min(1, "Full name is required").max(200, "Full name must be less than 200 characters"),
  phone_number: ethiopianPhoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  id_number: ethiopianIdSchema,
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format").optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  marital_status: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),
  number_of_dependents: z.number().int().min(0).max(20).optional(),
  
  // Address
  region: z.string().min(1, "Region is required").max(100),
  city: z.string().min(1, "City is required").max(100),
  sub_city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  address: z.string().max(500).optional(),

  // ============================================
  // EMPLOYMENT & INCOME (Legacy + Multi-card)
  // ============================================
  // Legacy fields (for backward compatibility - converted to Card 1 if cards array not provided)
  employment_status: z.enum(["Employed", "Self-Employed", "Part-time", "Unemployed", "Student", "Retired"]).optional(),
  employer_name: z.string().max(200).optional(),
  employment_sector: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  employment_years: z.number().int().min(0).max(50).optional(),
  current_job_months: z.number().int().min(0).max(600).optional(),
  monthly_income: z.number().min(0, "Monthly income must be positive").optional(),
  
  // Multi-card support (NEW - preferred method)
  cards: z.array(cardSchema).optional(),

  // ============================================
  // FINANCIAL OVERVIEW
  // ============================================
  monthly_expenses: z.number().min(0).optional(),
  debt_to_income_ratio: z.number().min(0).max(10).optional(),
  scheduled_monthly_debt_service: z.number().min(0).optional(),
  total_outstanding_balance_etb: z.number().min(0).optional(),
  total_credit_limit_etb: z.number().min(0).optional(),
  existing_loan_count_open: z.number().int().min(0).optional(),
  cash_buffer_days: z.number().min(0).optional(),
  income_stability_cv_6m: z.number().min(0).max(1).optional(),
  pension_plan_participation: z.boolean().optional(),
  health_insurance_coverage: z.string().max(100).optional(),
  education_level: z.enum(["Primary", "Secondary", "Diploma", "Bachelor", "Master", "PhD", "Other"]).optional(),

  // ============================================
  // BANK ACCOUNT INFORMATION (Basic)
  // ============================================
  // Legacy bank fields (for backward compatibility)
  bank_name: z.string().max(200).optional(),
  bank_account_number: z.string().max(50).optional(),
  bank_account_type: z.enum(["Checking", "Savings", "Current"]).optional(),
  bank_account_age_months: z.number().int().min(0).max(600).optional(),
  bank_avg_balance_6m: z.number().min(0).optional(),

  // ============================================
  // DETAILED BANK DATA (Advanced - Optional)
  // ============================================
  // Balance data
  bank_avg_balance_1m: z.number().min(0).optional(),
  bank_avg_balance_3m: z.number().min(0).optional(),
  average_daily_balance_90d: z.number().min(0).optional(),
  min_balance_90d: z.number().min(0).optional(),
  max_balance_90d: z.number().min(0).optional(),
  
  // Salary patterns
  salary_deposit_count_6m: z.number().int().min(0).optional(),
  salary_deposit_count_3m: z.number().int().min(0).optional(),
  salary_deposit_count_12m: z.number().int().min(0).optional(),
  salary_regular_day_match_rate: z.number().min(0).max(1).optional(),
  salary_amount_avg: z.number().min(0).optional(),
  salary_amount_std: z.number().min(0).optional(),
  salary_inflow_consistency_score: z.number().min(0).max(100).optional(),
  
  // Transaction patterns
  net_inflow_volatility_90d: z.number().min(0).optional(),
  net_inflow_volatility_6m: z.number().min(0).optional(),
  monthly_inflow_avg: z.number().min(0).optional(),
  monthly_outflow_avg: z.number().min(0).optional(),
  monthly_net_flow_avg: z.number().optional(),
  
  // Balance patterns
  number_of_negative_balance_days_90d: z.number().int().min(0).optional(),
  number_of_negative_balance_days_6m: z.number().int().min(0).optional(),
  end_of_month_cash_crunch_indicator: z.boolean().optional(),
  overdraft_usage_days_90d: z.number().int().min(0).optional(),
  overdraft_usage_days_6m: z.number().int().min(0).optional(),
  
  // Payment patterns
  utility_bill_payment_count_12m: z.number().int().min(0).optional(),
  utility_bill_payment_count_6m: z.number().int().min(0).optional(),
  utility_bill_on_time_rate: z.number().min(0).max(1).optional(),
  utility_on_time_rate_12m: z.number().min(0).max(1).optional(),
  utility_recent_missed_bills_3m_flag: z.boolean().optional(),
  telecom_on_time_rate_12m: z.number().min(0).max(1).optional(),
  telecom_payment_count_12m: z.number().int().min(0).optional(),
  
  // Transaction anomalies
  merchant_spend_ratio: z.number().min(0).max(1).optional(),
  cash_deposit_anomaly_flag: z.boolean().optional(),
  cash_deposit_count_6m: z.number().int().min(0).optional(),
  cash_deposit_amount_avg: z.number().min(0).optional(),
  
  // NSF and returned payments
  nsf_count_6m: z.number().int().min(0).optional(),
  nsf_count_12m: z.number().int().min(0).optional(),
  nsf_frequency_6m: z.number().min(0).optional(),
  returned_payment_count_6m: z.number().int().min(0).optional(),
  returned_payment_count_12m: z.number().int().min(0).optional(),
  
  // Recurring patterns
  recurring_payment_count: z.number().int().min(0).optional(),
  recurring_payment_amount_avg: z.number().min(0).optional(),
  subscription_payment_count: z.number().int().min(0).optional(),

  // ============================================
  // MOBILE MONEY INFORMATION (Optional)
  // ============================================
  mobile_money_provider: z.string().max(100).optional(),
  mobile_money_account_number: z.string().max(50).optional(),
  mobile_money_inflow_outflow_ratio: z.number().min(0).optional(),
  mobile_money_transaction_count_90d: z.number().int().min(0).optional(),
  mobile_money_txn_volume_90d: z.number().min(0).optional(),
  mobile_money_avg_balance_90d: z.number().min(0).optional(),
  momo_cash_out_velocity_48hr: z.number().int().min(0).optional(),
  momo_cash_out_count_90d: z.number().int().min(0).optional(),
  momo_cash_in_count_90d: z.number().int().min(0).optional(),
  momo_transfer_count_90d: z.number().int().min(0).optional(),
  airtime_purchase_pattern_score: z.number().min(0).max(100).optional(),
  airtime_purchase_count_90d: z.number().int().min(0).optional(),
  airtime_purchase_amount_avg: z.number().min(0).optional(),
  telecom_spend_ratio: z.number().min(0).max(1).optional(),

  // ============================================
  // DIGITAL BEHAVIORAL INTELLIGENCE (Optional - Tier 4)
  // ============================================
  // App data
  app_list_categories: z.record(z.string(), z.number().int()).optional(), // e.g., {"finance": 8, "shopping": 5}
  app_count_total: z.number().int().min(0).optional(),
  app_count_finance: z.number().int().min(0).optional(),
  app_count_shopping: z.number().int().min(0).optional(),
  app_count_social: z.number().int().min(0).optional(),
  app_count_productivity: z.number().int().min(0).optional(),
  app_count_entertainment: z.number().int().min(0).optional(),
  app_count_utilities: z.number().int().min(0).optional(),
  app_engagement_frequency_30d: z.number().int().min(0).optional(),
  app_engagement_frequency_7d: z.number().int().min(0).optional(),
  app_engagement_frequency_90d: z.number().int().min(0).optional(),
  push_notification_interaction_rate: z.number().min(0).max(1).optional(),
  push_notification_sent_count_30d: z.number().int().min(0).optional(),
  push_notification_opened_count_30d: z.number().int().min(0).optional(),
  last_app_open_date: z.string().optional(),
  app_install_date: z.string().optional(),
  
  // SMS logs
  sms_financial_logs_available: z.boolean().optional(),
  sms_active_lenders_count_90d: z.number().int().min(0).optional(),
  sms_active_lenders_count_30d: z.number().int().min(0).optional(),
  sms_loan_rejection_count_90d: z.number().int().min(0).optional(),
  sms_loan_approval_count_90d: z.number().int().min(0).optional(),
  sms_transaction_count_90d: z.number().int().min(0).optional(),
  sms_financial_message_count_90d: z.number().int().min(0).optional(),
  
  // Social graph
  social_graph_connections: z.number().int().min(0).optional(),
  phone_book_size: z.number().int().min(0).optional(),
  call_log_io_ratio: z.number().min(0).optional(),
  call_log_incoming_count_30d: z.number().int().min(0).optional(),
  call_log_outgoing_count_30d: z.number().int().min(0).optional(),
  peer_vouching_count: z.number().int().min(0).optional(),
  
  // Behavioral scores
  savings_behavior_score: z.number().min(0).max(100).optional(),
  savings_transaction_count_90d: z.number().int().min(0).optional(),
  savings_amount_avg: z.number().min(0).optional(),
  discretionary_spend_ratio_90d: z.number().min(0).max(1).optional(),
  discretionary_spend_ratio_30d: z.number().min(0).max(1).optional(),
  essential_spend_ratio_90d: z.number().min(0).max(1).optional(),
  income_source_count_180d: z.number().int().min(0).optional(),
  income_source_count_90d: z.number().int().min(0).optional(),
  shared_household_expense_flag: z.boolean().optional(),
  spending_habit_consistency_score: z.number().min(0).max(100).optional(),
  monthly_spending_avg: z.number().min(0).optional(),
  monthly_spending_std: z.number().min(0).optional(),
  post_payday_spending_spike_ratio: z.number().min(0).optional(),
  weekend_social_spending_volatility: z.number().min(0).optional(),
  weekend_spending_avg: z.number().min(0).optional(),
  weekday_spending_avg: z.number().min(0).optional(),
  anonymized_peer_default_rate: z.number().min(0).max(1).optional(),
  network_risk_score: z.number().min(0).max(100).optional(),
  social_network_centrality_score: z.number().min(0).max(100).optional(),

  // ============================================
  // KYC & VERIFICATION (Optional)
  // ============================================
  kyc_level: z.enum(["Tier1", "Tier2", "Tier3"]).optional(),
  fayda_verification_status: z.enum(["Verified", "Pending", "Failed"]).optional(),
  address_verification_status: z.enum(["Verified", "Pending", "Failed"]).optional(),
  source_of_income_verified_flag: z.boolean().optional(),
  pep_or_sanctions_hit_flag: z.boolean().optional(),
  document_expiry_days: z.number().int().min(0).optional(),
  id_expiry_date: z.string().optional(),
  
  // Fraud detection
  is_device_emulator: z.boolean().optional(),
  device_compromise_status: z.string().max(50).optional(),
  session_behavior_anomaly_score: z.number().min(0).max(100).optional(),
  shared_device_fraud_link: z.boolean().optional(),
  applications_last_30d_across_devices: z.number().int().min(0).optional(),
  identity_mismatch_types_count: z.number().int().min(0).optional(),
  sim_swap_recent_flag: z.boolean().optional(),
  biometric_liveness_check_status: z.string().max(50).optional(),
  device_id_consistency_score: z.number().min(0).max(1).optional(),
  phone_tenure_months: z.number().int().min(0).optional(),
  application_velocity_user_30d: z.number().int().min(0).optional(),
  shared_contact_link_flag: z.boolean().optional(),
  gambling_registration_flag: z.boolean().optional(),

  // ============================================
  // CREDIT HISTORY (Optional)
  // ============================================
  prior_loans_count: z.number().int().min(0).optional(),
  prior_rollover_count: z.number().int().min(0).optional(),
  recent_delinquency_flag: z.boolean().optional(),
  prior_default_flag: z.boolean().optional(),
  credit_history_length_months: z.number().int().min(0).optional(),
  delinquency_30d_count_12m: z.number().int().min(0).optional(),
  delinquency_60d_count_12m: z.number().int().min(0).optional(),
  delinquency_90d_count_12m: z.number().int().min(0).optional(),

  // ============================================
  // ADDITIONAL FEATURES (Optional)
  // ============================================
  age: z.number().int().min(0).max(120).optional(),
  location_stability_score: z.number().min(0).max(1).optional(),
  community_involvement_score: z.number().min(0).max(100).optional(),
  continuous_learning_engagement: z.number().min(0).max(100).optional(),
  digital_adoption_index: z.number().min(0).max(100).optional(),
  agricultural_dependency_score: z.number().min(0).max(1).optional(),
  remittance_dependency_score: z.number().min(0).max(1).optional(),
  informal_credit_usage_score: z.number().min(0).max(1).optional(),
  local_economic_resilience_score: z.number().min(0).max(1).optional(),
  regional_unemployment_rate: z.number().min(0).max(1).optional(),
  inflation_rate_recent: z.number().min(0).max(1).optional(),
  sector_cyclicality_index: z.number().min(0).max(1).optional(),
  exchange_rate_12m_change: z.number().optional(),
  conflict_risk_index: z.number().min(0).max(1).optional(),
  drought_flood_index: z.number().min(0).max(1).optional(),
  energy_blackout_days_90d: z.number().int().min(0).optional(),
  financial_literacy_score: z.number().min(0).max(100).optional(),
  risk_tolerance_score: z.number().min(0).max(1).optional(),
  cognitive_proficiency_score: z.number().min(0).max(1).optional(),
  behavioral_consistency_score: z.number().min(0).max(1).optional(),
  online_reputation_score: z.number().min(0).max(1).optional(),
  microfinance_engagement_score: z.number().min(0).max(1).optional(),
  cooperative_membership_score: z.number().min(0).max(1).optional(),
  conscientiousness_score: z.number().min(0).max(1).optional(),
  subscription_lapse_count_12m: z.number().int().min(0).optional(),
});

export type CustomerRegistrationFormData = z.infer<typeof customerRegistrationSchema>;

// Helper schema for step-by-step validation
export const basicInfoSchema = customerRegistrationSchema.pick({
  customer_id: true,
  full_name: true,
  phone_number: true,
  email: true,
  id_number: true,
  date_of_birth: true,
  gender: true,
  marital_status: true,
  number_of_dependents: true,
  region: true,
  city: true,
  sub_city: true,
  postal_code: true,
  address: true,
});

export const employmentIncomeSchema = customerRegistrationSchema.pick({
  employment_status: true,
  employer_name: true,
  employment_sector: true,
  job_title: true,
  employment_years: true,
  current_job_months: true,
  monthly_income: true,
  cards: true,
  bank_name: true,
  bank_account_number: true,
  bank_account_type: true,
  bank_account_age_months: true,
  bank_avg_balance_6m: true,
});

export const financialOverviewSchema = customerRegistrationSchema.pick({
  monthly_expenses: true,
  debt_to_income_ratio: true,
  scheduled_monthly_debt_service: true,
  total_outstanding_balance_etb: true,
  total_credit_limit_etb: true,
  existing_loan_count_open: true,
  cash_buffer_days: true,
  income_stability_cv_6m: true,
  pension_plan_participation: true,
  health_insurance_coverage: true,
  education_level: true,
});
