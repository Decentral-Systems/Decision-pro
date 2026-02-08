/**
 * Field Help Text Configuration
 * Provides descriptions, examples, and format information for all form fields
 */

export interface FieldHelpText {
  description: string;
  example?: string;
  format?: string;
  tips?: string[];
}

export const FIELD_HELP_TEXT: Record<string, FieldHelpText> = {
  // Basic Info
  customer_id: {
    description: "Unique identifier for the customer. Can be an existing customer ID or a new one.",
    example: "CUST-2024-001234",
    format: "Alphanumeric, 1-50 characters",
  },
  loan_amount: {
    description: "Requested loan amount in Ethiopian Birr (ETB). Must comply with NBE regulations (1,000 - 5,000,000 ETB).",
    example: "50,000 ETB",
    format: "Number, 1000-5000000",
    tips: [
      "Must comply with 1/3 salary rule",
      "Minimum: 1,000 ETB (NBE regulation)",
      "Maximum: 5,000,000 ETB (NBE regulation)",
    ],
  },
  loan_term_months: {
    description: "Loan repayment period in months. Maximum 60 months per NBE regulations.",
    example: "24 months",
    format: "Number, 1-60",
    tips: [
      "Maximum: 60 months (NBE regulation)",
      "Longer terms may have higher interest rates",
    ],
  },
  monthly_income: {
    description: "Customer's monthly income in ETB. Used for affordability calculations and NBE compliance.",
    example: "15,000 ETB",
    format: "Number, positive",
    tips: [
      "Include all sources of income",
      "Used for 1/3 salary rule validation",
    ],
  },
  monthly_expenses: {
    description: "Customer's total monthly expenses in ETB. Should not exceed monthly income.",
    example: "8,000 ETB",
    format: "Number, 0 or positive",
    tips: [
      "Include all regular monthly expenses",
      "Used for disposable income calculation",
    ],
  },

  // Credit History
  credit_history_length: {
    description: "Length of credit history in years. Longer history generally improves credit score.",
    example: "5 years",
    format: "Number, 0 or positive",
  },
  credit_utilization_ratio: {
    description: "Percentage of available credit currently being used. Lower is better (recommended <30%).",
    example: "25%",
    format: "Number, 0-100",
    tips: [
      "Optimal: Below 30%",
      "High utilization (>80%) negatively impacts score",
    ],
  },
  payment_history_score: {
    description: "Score reflecting payment history quality. Higher scores indicate better payment behavior.",
    example: "85",
    format: "Number, 0-100",
    tips: [
      "100 = Perfect payment history",
      "Based on on-time payment percentage",
    ],
  },
  number_of_late_payments: {
    description: "Count of late payments in credit history. Lower is better.",
    example: "2",
    format: "Number, 0 or positive",
  },
  number_of_defaults: {
    description: "Number of defaulted accounts. Any defaults significantly impact credit score.",
    example: "0",
    format: "Number, 0 or positive",
    tips: [
      "Defaults have severe negative impact",
      "May require additional documentation",
    ],
  },

  // Employment
  employment_status: {
    description: "Current employment status. Affects creditworthiness assessment.",
    example: "employed",
    format: "Select: employed, self_employed, unemployed, retired",
  },
  years_employed: {
    description: "Number of years at current employment. Longer tenure indicates stability.",
    example: "3 years",
    format: "Number, 0 or positive",
    tips: [
      "Longer tenure = higher stability score",
      "Less than 6 months may require additional verification",
    ],
  },

  // Personal
  age: {
    description: "Customer's age in years. Must be 18 or older.",
    example: "35",
    format: "Number, 18-100",
  },
  phone_number: {
    description: "Ethiopian phone number. Supports +251 or 0 prefix format.",
    example: "+251912345678 or 0912345678",
    format: "+251XXXXXXXXX or 0XXXXXXXXX (9 digits)",
    tips: [
      "Must include country code (+251) or leading zero (0)",
      "Exactly 9 digits after prefix",
    ],
  },
  id_number: {
    description: "Ethiopian national ID number. Must be exactly 10 digits.",
    example: "1234567890",
    format: "10 digits",
    tips: [
      "Must be exactly 10 digits",
      "Used for identity verification",
    ],
  },
  region: {
    description: "Ethiopian region where customer resides.",
    example: "Addis Ababa",
    format: "Select from Ethiopian regions",
  },
  urban_rural: {
    description: "Location type classification. Affects risk assessment.",
    example: "urban",
    format: "Select: urban or rural",
  },

  // Bank & Mobile Money
  bank_account_age_months: {
    description: "Age of primary bank account in months. Longer tenure indicates financial stability.",
    example: "24 months",
    format: "Number, 0 or positive",
  },
  mobile_money_account_age_months: {
    description: "Age of mobile money account (M-Pesa, etc.) in months.",
    example: "12 months",
    format: "Number, 0 or positive",
  },
  transaction_frequency: {
    description: "Average number of transactions per month. Higher frequency may indicate active financial behavior.",
    example: "50 transactions/month",
    format: "Number, 0 or positive",
  },
  mpesa_balance: {
    description: "Current mobile money balance in ETB.",
    example: "5,000 ETB",
    format: "Number, 0 or positive",
  },
  direct_deposit_flag: {
    description: "Whether customer receives salary via direct deposit. Indicates income stability.",
    example: "Yes/No",
    format: "Checkbox",
  },

  // Identity & Fraud
  fayda_verification_status: {
    description: "Fayda (Ethiopian national ID system) verification status. Read-only from system.",
    example: "Verified",
    format: "Read-only",
  },
  kyc_level: {
    description: "Know Your Customer (KYC) verification level. Read-only from system.",
    example: "Tier1, Tier2, Tier3",
    format: "Read-only",
  },
  fraud_score: {
    description: "Fraud risk score (0-100). Lower is better. Read-only from system.",
    example: "15",
    format: "Number, 0-100 (read-only)",
  },

  // Contextual
  regional_economic_index: {
    description: "Regional economic health index (0-100). Auto-fetched from economic data service.",
    example: "65",
    format: "Number, 0-100 (read-only)",
  },
  inflation_rate: {
    description: "Current inflation rate percentage. Auto-fetched from economic data.",
    example: "15.0%",
    format: "Percentage (read-only)",
  },

  // Business
  years_in_business: {
    description: "Number of years the business has been operating. For business loans only.",
    example: "5 years",
    format: "Number, 0 or positive",
  },
  industry_risk_score: {
    description: "Risk score for the business industry (0-100). Lower is better.",
    example: "45",
    format: "Number, 0-100",
  },
  merchant_revenue_share: {
    description: "Distribution of revenue across different merchant categories. For business loans.",
    example: "[0.4, 0.3, 0.3]",
    format: "Array of numbers (percentages)",
  },
  seasonality_index: {
    description: "Seasonal variation index for business revenue (0-100). Higher indicates more seasonal business.",
    example: "65",
    format: "Number, 0-100",
  },

  // Financial - Additional
  savings_balance: {
    description: "Current savings account balance in ETB. Higher balance indicates better financial stability.",
    example: "50,000 ETB",
    format: "Number, 0 or positive",
    tips: [
      "Higher savings = lower risk",
      "Used for emergency fund calculation",
    ],
  },
  checking_balance: {
    description: "Current checking account balance in ETB. Indicates liquidity.",
    example: "10,000 ETB",
    format: "Number, 0 or positive",
  },
  total_debt: {
    description: "Total outstanding debt across all accounts in ETB. Lower is better.",
    example: "30,000 ETB",
    format: "Number, 0 or positive",
    tips: [
      "Used for debt-to-income ratio calculation",
      "Lower debt improves credit score",
    ],
  },
  existing_loan_payments: {
    description: "Monthly payments for existing loans in ETB. Used for affordability calculation.",
    example: "5,000 ETB/month",
    format: "Number, 0 or positive",
    tips: [
      "Used for 1/3 salary rule validation",
      "Includes all active loan payments",
    ],
  },
  other_monthly_obligations: {
    description: "Other monthly financial obligations (rent, utilities, etc.) in ETB.",
    example: "3,000 ETB",
    format: "Number, 0 or positive",
  },
  emergency_fund_months: {
    description: "Number of months of expenses covered by emergency fund. Calculated automatically.",
    example: "3 months",
    format: "Number, 0 or positive (read-only)",
    tips: [
      "Calculated from savings and monthly expenses",
      "Higher emergency fund = lower risk",
    ],
  },
  savings_rate: {
    description: "Percentage of income saved monthly. Calculated automatically.",
    example: "20%",
    format: "Number, 0-100 (read-only)",
    tips: [
      "Calculated from income and expenses",
      "Higher savings rate = better financial health",
    ],
  },
  collateral_value: {
    description: "Value of collateral offered for secured loans in ETB.",
    example: "100,000 ETB",
    format: "Number, 0 or positive",
    tips: [
      "Required for secured loans",
      "Collateral reduces risk",
    ],
  },
  guarantor_available: {
    description: "Whether customer has a guarantor available for the loan.",
    example: "Yes/No",
    format: "Select: Yes or No",
    tips: [
      "Guarantor reduces default risk",
      "May improve loan terms",
    ],
  },
  loan_purpose: {
    description: "Purpose of the loan. Affects risk assessment and approval.",
    example: "Business expansion",
    format: "Text",
    tips: [
      "Business purposes may require additional documentation",
      "Some purposes have better approval rates",
    ],
  },

  // Core Credit Performance
  tenure_with_akafay_months: {
    description: "Number of months customer has been with Akafay. Longer tenure indicates loyalty and lower risk.",
    example: "24 months",
    format: "Number, 0 or positive",
    tips: [
      "Longer tenure = better relationship",
      "Existing customers have lower risk",
    ],
  },
  new_accounts_last_6m: {
    description: "Number of new credit accounts opened in the last 6 months. Lower is generally better.",
    example: "2",
    format: "Number, 0 or positive",
    tips: [
      "Too many new accounts may indicate financial stress",
      "Used for credit behavior assessment",
    ],
  },
  inquiries_last_6m: {
    description: "Number of credit inquiries in the last 6 months. Lower is better.",
    example: "3",
    format: "Number, 0 or positive",
    tips: [
      "Multiple inquiries may indicate shopping for credit",
      "Hard inquiries impact credit score",
    ],
  },
  inquiries_last_12m: {
    description: "Number of credit inquiries in the last 12 months. Lower is better.",
    example: "5",
    format: "Number, 0 or positive",
  },
  utilization_trend_3m: {
    description: "Credit utilization trend over the last 3 months (%). Decreasing trend is positive.",
    example: "30%",
    format: "Number, 0-100",
    tips: [
      "Decreasing trend = improving credit behavior",
      "Used for credit behavior analysis",
    ],
  },
  utilization_trend_6m: {
    description: "Credit utilization trend over the last 6 months (%). Decreasing trend is positive.",
    example: "25%",
    format: "Number, 0-100",
  },
  public_record_flag: {
    description: "Whether customer has public records (liens, judgments, etc.). Any public record is negative.",
    example: "No",
    format: "Checkbox",
    tips: [
      "Public records significantly impact credit score",
      "May require additional documentation",
    ],
  },
  bankruptcy_flag: {
    description: "Whether customer has declared bankruptcy. Severe negative impact.",
    example: "No",
    format: "Checkbox",
    tips: [
      "Bankruptcy has severe negative impact",
      "May require special approval process",
    ],
  },
  repossession_flag: {
    description: "Whether customer has had assets repossessed. Negative impact.",
    example: "No",
    format: "Checkbox",
  },
  foreclosure_flag: {
    description: "Whether customer has had property foreclosed. Negative impact.",
    example: "No",
    format: "Checkbox",
  },
  tax_lien_flag: {
    description: "Whether customer has tax liens. Negative impact.",
    example: "No",
    format: "Checkbox",
  },
  judgment_flag: {
    description: "Whether customer has court judgments against them. Negative impact.",
    example: "No",
    format: "Checkbox",
  },
  number_of_credit_accounts: {
    description: "Total number of active credit accounts. Moderate number is optimal.",
    example: "3",
    format: "Number, 0 or positive",
    tips: [
      "Too few accounts = limited credit history",
      "Too many accounts = potential overextension",
    ],
  },

  // Bank & Mobile Money - Additional
  bank_transaction_count_30d: {
    description: "Number of bank transactions in the last 30 days. Indicates account activity.",
    example: "20 transactions",
    format: "Number, 0 or positive",
    tips: [
      "Higher activity = active financial behavior",
      "Used for financial behavior assessment",
    ],
  },
  bank_transaction_count_90d: {
    description: "Number of bank transactions in the last 90 days. Indicates account activity.",
    example: "60 transactions",
    format: "Number, 0 or positive",
  },
  mobile_money_transaction_count_30d: {
    description: "Number of mobile money transactions in the last 30 days.",
    example: "30 transactions",
    format: "Number, 0 or positive",
  },
  mobile_money_transaction_count_90d: {
    description: "Number of mobile money transactions in the last 90 days.",
    example: "90 transactions",
    format: "Number, 0 or positive",
  },

  // Identity & Fraud - Additional
  device_compromise_status: {
    description: "Status of device security. Read-only from fraud detection system.",
    example: "Clean",
    format: "Read-only",
    tips: [
      "Compromised devices indicate fraud risk",
      "Auto-detected by system",
    ],
  },
  biometric_liveness_check: {
    description: "Result of biometric liveness verification. Read-only from system.",
    example: "Passed",
    format: "Read-only",
    tips: [
      "Ensures identity verification authenticity",
      "Required for high-value loans",
    ],
  },
  phone_tenure_months: {
    description: "Number of months customer has had the same phone number. Longer tenure indicates stability.",
    example: "36 months",
    format: "Number, 0 or positive",
    tips: [
      "Longer phone tenure = higher stability",
      "Frequent number changes may indicate risk",
    ],
  },
  id_verification_status: {
    description: "Status of ID verification. Read-only from verification system.",
    example: "Verified",
    format: "Read-only",
  },
  phone_verification_status: {
    description: "Status of phone number verification. Read-only from verification system.",
    example: "Verified",
    format: "Read-only",
  },
  suspicious_activity_flag: {
    description: "Whether suspicious activity has been detected. Read-only from fraud system.",
    example: "No",
    format: "Checkbox (read-only)",
    tips: [
      "Auto-detected by fraud detection system",
      "May require manual review",
    ],
  },

  // Personal & Professional Stability
  marital_status: {
    description: "Customer's marital status. May affect risk assessment.",
    example: "Married",
    format: "Select: Single, Married, Divorced, Widowed, Unknown",
  },
  education_level: {
    description: "Highest level of education completed. Higher education may indicate lower risk.",
    example: "Bachelor's",
    format: "Select: High School, Bachelor's, Master's, PhD, Other, Unknown",
    tips: [
      "Higher education = generally lower risk",
      "Used for risk assessment",
    ],
  },
  years_at_current_address: {
    description: "Number of years at current address. Longer tenure indicates stability.",
    example: "2 years",
    format: "Number, 0 or positive",
    tips: [
      "Longer tenure = higher stability",
      "Frequent moves may indicate instability",
    ],
  },
  dependents: {
    description: "Number of dependents. Affects affordability calculation.",
    example: "2",
    format: "Number, 0 or positive",
    tips: [
      "More dependents = higher expenses",
      "Used for affordability assessment",
    ],
  },
  employment_stability_score: {
    description: "Employment stability score (0-100). Higher indicates more stable employment.",
    example: "85",
    format: "Number, 0-100",
    tips: [
      "Based on employment history and tenure",
      "Higher score = lower risk",
    ],
  },
  employer_name: {
    description: "Name of current employer. Required for employed customers.",
    example: "ABC Company",
    format: "Text",
  },

  // Contextual & Macroeconomic - Additional
  sector_growth_rate: {
    description: "Growth rate of customer's business sector (%). Auto-fetched from economic data.",
    example: "5.0%",
    format: "Percentage (read-only)",
    tips: [
      "Growing sectors = lower risk",
      "Auto-updated from economic data",
    ],
  },
  unemployment_rate_regional: {
    description: "Regional unemployment rate (%). Auto-fetched from economic data.",
    example: "5.0%",
    format: "Percentage (read-only)",
    tips: [
      "Lower unemployment = better economic conditions",
      "Affects regional risk assessment",
    ],
  },

  // Product Specific Intelligence
  loan_product_type: {
    description: "Type of loan product. Different products have different risk profiles.",
    example: "PersonalLoan",
    format: "Select from product types",
    tips: [
      "Business loans require additional documentation",
      "Product type affects approval criteria",
    ],
  },
  channel_type: {
    description: "Channel through which application was submitted (online, branch, mobile, etc.).",
    example: "online",
    format: "Text",
  },
  application_source: {
    description: "Source of the loan application (referral, direct, marketing, etc.).",
    example: "direct",
    format: "Text",
  },
  cross_sell_opportunity_score: {
    description: "Score indicating potential for cross-selling other products (0-100).",
    example: "75",
    format: "Number, 0-100",
    tips: [
      "Higher score = better cross-sell opportunity",
      "Used for marketing purposes",
    ],
  },

  // Behavioral Intelligence
  application_velocity: {
    description: "Speed at which application was completed. Auto-captured. Read-only.",
    example: "0",
    format: "Number (read-only)",
    tips: [
      "Very fast applications may indicate fraud",
      "Auto-captured by system",
    ],
  },
  time_of_day_application: {
    description: "Time of day when application was submitted. Auto-captured. Read-only.",
    example: "Business_Hours",
    format: "Text (read-only)",
  },
  device_type: {
    description: "Type of device used for application (desktop, mobile, tablet). Auto-captured. Read-only.",
    example: "desktop",
    format: "Text (read-only)",
  },

  // Digital Behavioral Intelligence
  app_usage_frequency: {
    description: "Frequency of app usage in the last 30 days. Auto-captured. Read-only.",
    example: "15 times",
    format: "Number (read-only)",
    tips: [
      "Higher usage = engaged customer",
      "Auto-captured from app analytics",
    ],
  },
  session_duration: {
    description: "Average session duration in minutes. Auto-captured. Read-only.",
    example: "10 minutes",
    format: "Number (read-only)",
  },
  spending_category_distribution: {
    description: "Distribution of spending across categories. Auto-captured. Read-only.",
    example: "{food: 0.4, transport: 0.3, utilities: 0.3}",
    format: "Object (read-only)",
  },

  // Model Governance
  model_version: {
    description: "Version of the credit scoring model used. Read-only from system.",
    example: "v4.0",
    format: "Text (read-only)",
    tips: [
      "Model version affects scoring methodology",
      "Used for model performance tracking",
    ],
  },
  feature_drift_score: {
    description: "Score indicating how much input data has drifted from training data (0-100). Lower is better.",
    example: "10",
    format: "Number, 0-100 (read-only)",
    tips: [
      "High drift may indicate data quality issues",
      "Used for model monitoring",
    ],
  },
  prediction_confidence: {
    description: "Confidence level of the prediction (0-1). Higher indicates more reliable prediction.",
    example: "0.95",
    format: "Number, 0-1 (read-only)",
    tips: [
      "Lower confidence may require manual review",
      "Based on model certainty",
    ],
  },
  data_quality_score: {
    description: "Quality score of input data (0-100). Higher indicates better data quality.",
    example: "90",
    format: "Number, 0-100 (read-only)",
    tips: [
      "Lower quality may affect prediction accuracy",
      "Used for data validation",
    ],
  },

  // Additional missing fields - Advanced Credit Performance
  account_status_flags: {
    description: "Status flags for credit accounts (current, delinquent, charged-off, etc.).",
    example: "current",
    format: "Text",
    tips: [
      "Current accounts = positive impact",
      "Delinquent accounts = negative impact",
    ],
  },
  average_account_age_months: {
    description: "Average age of all credit accounts in months. Longer average age is positive.",
    example: "36 months",
    format: "Number, 0 or positive",
  },
  oldest_account_age_months: {
    description: "Age of the oldest credit account in months. Longer age indicates established credit history.",
    example: "60 months",
    format: "Number, 0 or positive",
  },
  credit_mix_score: {
    description: "Score reflecting diversity of credit types (0-100). Higher indicates better credit mix.",
    example: "75",
    format: "Number, 0-100",
    tips: [
      "Mix of installment and revolving credit is optimal",
      "Used for credit behavior assessment",
    ],
  },
  recent_credit_activity_score: {
    description: "Score based on recent credit activity patterns (0-100).",
    example: "80",
    format: "Number, 0-100",
  },
  payment_consistency_score: {
    description: "Score reflecting consistency of on-time payments (0-100).",
    example: "90",
    format: "Number, 0-100",
  },
  credit_limit_utilization: {
    description: "Overall credit limit utilization percentage across all accounts.",
    example: "35%",
    format: "Number, 0-100",
  },
  max_credit_limit: {
    description: "Maximum credit limit across all accounts in ETB.",
    example: "100,000 ETB",
    format: "Number, 0 or positive",
  },
  total_credit_limit: {
    description: "Total credit limit across all accounts in ETB.",
    example: "200,000 ETB",
    format: "Number, 0 or positive",
  },
  available_credit: {
    description: "Total available credit (limit - used) in ETB.",
    example: "130,000 ETB",
    format: "Number, 0 or positive",
  },
  credit_score_trend: {
    description: "Trend of credit score over time (improving, stable, declining).",
    example: "improving",
    format: "Text",
  },
  score_change_6m: {
    description: "Change in credit score over the last 6 months.",
    example: "+25 points",
    format: "Number",
  },
  score_change_12m: {
    description: "Change in credit score over the last 12 months.",
    example: "+50 points",
    format: "Number",
  },
  collections_count: {
    description: "Number of accounts in collections. Any collections are negative.",
    example: "0",
    format: "Number, 0 or positive",
    tips: [
      "Collections significantly impact credit score",
      "May require additional documentation",
    ],
  },
  charge_off_count: {
    description: "Number of charged-off accounts. Severe negative impact.",
    example: "0",
    format: "Number, 0 or positive",
  },
  settlement_count: {
    description: "Number of settled accounts. Negative impact but less severe than charge-offs.",
    example: "0",
    format: "Number, 0 or positive",
  },
  debt_to_income_ratio: {
    description: "Ratio of total debt to monthly income. Lower is better (recommended <40%).",
    example: "0.35",
    format: "Number, 0-1",
    tips: [
      "Optimal: Below 0.40 (40%)",
      "High ratio indicates financial stress",
    ],
  },
  debt_service_coverage_ratio: {
    description: "Ratio of income to debt payments. Higher is better (recommended >1.5).",
    example: "2.0",
    format: "Number, 0 or positive",
  },
  disposable_income: {
    description: "Monthly income minus expenses and debt payments in ETB. Calculated automatically.",
    example: "5,000 ETB",
    format: "Number (read-only)",
    tips: [
      "Calculated from income, expenses, and debt payments",
      "Higher disposable income = lower risk",
    ],
  },
  affordability_ratio: {
    description: "Ratio of proposed loan payment to disposable income. Lower is better.",
    example: "0.25",
    format: "Number, 0-1",
  },
  loan_to_value_ratio: {
    description: "For secured loans: ratio of loan amount to collateral value. Lower is better.",
    example: "0.70",
    format: "Number, 0-1",
    tips: [
      "Lower LTV = lower risk",
      "Used for secured loan assessment",
    ],
  },
  collateral_coverage_ratio: {
    description: "Ratio of collateral value to loan amount. Higher is better.",
    example: "1.5",
    format: "Number, 0 or positive",
  },

  // Advanced Employment & Income
  income_stability_score: {
    description: "Score reflecting stability of income over time (0-100).",
    example: "85",
    format: "Number, 0-100",
  },
  income_trend: {
    description: "Trend of income over the last 12 months (increasing, stable, declining).",
    example: "increasing",
    format: "Text",
  },
  income_volatility: {
    description: "Measure of income variability (0-100). Lower indicates more stable income.",
    example: "15",
    format: "Number, 0-100",
  },
  employment_gap_months: {
    description: "Total months of employment gaps in the last 5 years. Lower is better.",
    example: "0 months",
    format: "Number, 0 or positive",
  },
  job_change_frequency: {
    description: "Number of job changes in the last 5 years. Lower indicates more stability.",
    example: "1",
    format: "Number, 0 or positive",
  },
  industry_stability_score: {
    description: "Stability score of the employment industry (0-100).",
    example: "80",
    format: "Number, 0-100",
  },
  occupation_risk_score: {
    description: "Risk score associated with the occupation (0-100). Lower is better.",
    example: "30",
    format: "Number, 0-100",
  },
  salary_frequency: {
    description: "Frequency of salary payments (monthly, bi-weekly, weekly).",
    example: "monthly",
    format: "Text",
  },
  bonus_income: {
    description: "Annual bonus income in ETB. Optional.",
    example: "50,000 ETB",
    format: "Number, 0 or positive",
  },
  other_income: {
    description: "Other sources of income (rental, investment, etc.) in ETB per month.",
    example: "5,000 ETB",
    format: "Number, 0 or positive",
  },
  total_monthly_income: {
    description: "Total monthly income including all sources. Calculated automatically.",
    example: "20,000 ETB",
    format: "Number (read-only)",
  },

  // Advanced Personal Information
  housing_status: {
    description: "Housing status (own, rent, family, other).",
    example: "own",
    format: "Select: own, rent, family, other",
    tips: [
      "Home ownership = positive indicator",
      "Used for stability assessment",
    ],
  },
  housing_payment: {
    description: "Monthly housing payment (rent or mortgage) in ETB.",
    example: "5,000 ETB",
    format: "Number, 0 or positive",
  },
  vehicle_ownership: {
    description: "Whether customer owns a vehicle. Indicates asset ownership.",
    example: "Yes/No",
    format: "Checkbox",
  },
  vehicle_value: {
    description: "Estimated value of owned vehicle in ETB.",
    example: "200,000 ETB",
    format: "Number, 0 or positive",
  },
  property_ownership: {
    description: "Whether customer owns property. Indicates asset ownership.",
    example: "Yes/No",
    format: "Checkbox",
  },
  property_value: {
    description: "Estimated value of owned property in ETB.",
    example: "1,000,000 ETB",
    format: "Number, 0 or positive",
  },
  total_assets: {
    description: "Total estimated asset value in ETB. Calculated automatically.",
    example: "1,200,000 ETB",
    format: "Number (read-only)",
  },
  net_worth: {
    description: "Net worth (assets - liabilities) in ETB. Calculated automatically.",
    example: "1,000,000 ETB",
    format: "Number (read-only)",
  },
  citizenship_status: {
    description: "Citizenship status (citizen, resident, other).",
    example: "citizen",
    format: "Select: citizen, resident, other",
  },
  residency_years: {
    description: "Number of years of residency in Ethiopia.",
    example: "10 years",
    format: "Number, 0 or positive",
  },
  language_preference: {
    description: "Preferred language for communication (English, Amharic, etc.).",
    example: "Amharic",
    format: "Text",
  },

  // Advanced Bank & Mobile Money
  bank_account_count: {
    description: "Number of active bank accounts. Moderate number is optimal.",
    example: "2",
    format: "Number, 0 or positive",
  },
  mobile_money_account_count: {
    description: "Number of active mobile money accounts.",
    example: "1",
    format: "Number, 0 or positive",
  },
  average_monthly_deposit: {
    description: "Average monthly deposit amount in ETB. Indicates income flow.",
    example: "15,000 ETB",
    format: "Number, 0 or positive",
  },
  average_monthly_withdrawal: {
    description: "Average monthly withdrawal amount in ETB.",
    example: "12,000 ETB",
    format: "Number, 0 or positive",
  },
  account_balance_trend: {
    description: "Trend of account balance over time (increasing, stable, declining).",
    example: "increasing",
    format: "Text",
  },
  overdraft_frequency: {
    description: "Number of overdraft occurrences in the last 12 months. Lower is better.",
    example: "0",
    format: "Number, 0 or positive",
  },
  bounced_check_count: {
    description: "Number of bounced checks in the last 12 months. Lower is better.",
    example: "0",
    format: "Number, 0 or positive",
  },
  mobile_money_balance_trend: {
    description: "Trend of mobile money balance over time.",
    example: "stable",
    format: "Text",
  },
  p2p_transfer_frequency: {
    description: "Frequency of peer-to-peer transfers. Indicates active usage.",
    example: "20 transfers/month",
    format: "Number, 0 or positive",
  },
  merchant_payment_frequency: {
    description: "Frequency of merchant payments. Indicates spending behavior.",
    example: "30 payments/month",
    format: "Number, 0 or positive",
  },
  bill_payment_frequency: {
    description: "Frequency of bill payments. Indicates financial responsibility.",
    example: "5 payments/month",
    format: "Number, 0 or positive",
  },
  savings_goal_progress: {
    description: "Progress toward savings goals (0-100%). Higher indicates financial planning.",
    example: "60%",
    format: "Number, 0-100",
  },

  // Advanced Identity & Fraud
  identity_verification_score: {
    description: "Overall identity verification score (0-100). Higher indicates stronger verification.",
    example: "95",
    format: "Number, 0-100 (read-only)",
  },
  document_verification_status: {
    description: "Status of document verification. Read-only from verification system.",
    example: "Verified",
    format: "Read-only",
  },
  address_verification_status: {
    description: "Status of address verification. Read-only from verification system.",
    example: "Verified",
    format: "Read-only",
  },
  email_verification_status: {
    description: "Status of email verification. Read-only from verification system.",
    example: "Verified",
    format: "Read-only",
  },
  social_media_verification: {
    description: "Social media profile verification status. Read-only.",
    example: "Linked",
    format: "Read-only",
  },
  device_fingerprint_match: {
    description: "Whether device fingerprint matches previous sessions. Read-only.",
    example: "Match",
    format: "Read-only",
  },
  ip_address_reputation: {
    description: "Reputation score of IP address (0-100). Read-only from fraud system.",
    example: "85",
    format: "Number, 0-100 (read-only)",
  },
  vpn_detection_flag: {
    description: "Whether VPN usage was detected. Read-only.",
    example: "No",
    format: "Checkbox (read-only)",
  },
  proxy_detection_flag: {
    description: "Whether proxy usage was detected. Read-only.",
    example: "No",
    format: "Checkbox (read-only)",
  },
  location_consistency_score: {
    description: "Score indicating consistency of location data (0-100). Read-only.",
    example: "90",
    format: "Number, 0-100 (read-only)",
  },
  behavioral_biometrics_score: {
    description: "Score from behavioral biometrics analysis (0-100). Read-only.",
    example: "88",
    format: "Number, 0-100 (read-only)",
  },
  risk_signals_count: {
    description: "Number of fraud risk signals detected. Read-only.",
    example: "0",
    format: "Number, 0 or positive (read-only)",
  },
  fraud_alert_level: {
    description: "Overall fraud alert level (low, medium, high, critical). Read-only.",
    example: "low",
    format: "Text (read-only)",
  },

  // Advanced Contextual Factors
  gdp_growth_rate: {
    description: "National GDP growth rate (%). Auto-fetched from economic data.",
    example: "6.5%",
    format: "Percentage (read-only)",
  },
  interest_rate_environment: {
    description: "Current interest rate environment (low, medium, high). Auto-fetched.",
    example: "medium",
    format: "Text (read-only)",
  },
  currency_stability_index: {
    description: "Currency stability index (0-100). Auto-fetched from economic data.",
    example: "75",
    format: "Number, 0-100 (read-only)",
  },
  political_stability_index: {
    description: "Political stability index (0-100). Auto-fetched from economic data.",
    example: "70",
    format: "Number, 0-100 (read-only)",
  },
  market_volatility_index: {
    description: "Market volatility index (0-100). Auto-fetched from economic data.",
    example: "40",
    format: "Number, 0-100 (read-only)",
  },
  seasonal_adjustment_factor: {
    description: "Seasonal adjustment factor for the application period. Auto-calculated.",
    example: "1.05",
    format: "Number (read-only)",
  },
  economic_outlook_score: {
    description: "Economic outlook score for the region (0-100). Auto-fetched.",
    example: "65",
    format: "Number, 0-100 (read-only)",
  },
  industry_outlook_score: {
    description: "Industry outlook score (0-100). Auto-fetched from economic data.",
    example: "70",
    format: "Number, 0-100 (read-only)",
  },
  competitive_pressure_index: {
    description: "Competitive pressure index in the market (0-100). Auto-fetched.",
    example: "50",
    format: "Number, 0-100 (read-only)",
  },
  regulatory_environment_score: {
    description: "Regulatory environment score (0-100). Auto-fetched.",
    example: "80",
    format: "Number, 0-100 (read-only)",
  },

  // Advanced Product & Channel Intelligence
  product_affinity_score: {
    description: "Score indicating customer's affinity for the product (0-100).",
    example: "75",
    format: "Number, 0-100",
  },
  channel_preference_score: {
    description: "Score indicating preference for the application channel (0-100).",
    example: "80",
    format: "Number, 0-100",
  },
  application_completion_rate: {
    description: "Rate at which customer completes applications (0-100%).",
    example: "90%",
    format: "Number, 0-100",
  },
  previous_application_count: {
    description: "Number of previous loan applications. Lower may indicate better approval chances.",
    example: "2",
    format: "Number, 0 or positive",
  },
  previous_approval_rate: {
    description: "Rate of previous application approvals (0-100%).",
    example: "50%",
    format: "Number, 0-100",
  },
  referral_source: {
    description: "Source of referral (if applicable).",
    example: "friend",
    format: "Text",
  },
  marketing_campaign_id: {
    description: "ID of marketing campaign that led to application.",
    example: "CAMPAIGN-2024-001",
    format: "Text",
  },
  customer_segment: {
    description: "Customer segment classification (new, existing, premium, etc.).",
    example: "existing",
    format: "Text",
  },
  lifetime_value_score: {
    description: "Predicted customer lifetime value score (0-100).",
    example: "85",
    format: "Number, 0-100",
  },
  churn_risk_score: {
    description: "Risk of customer churn (0-100). Lower is better.",
    example: "20",
    format: "Number, 0-100",
  },
  engagement_score: {
    description: "Customer engagement score based on interactions (0-100).",
    example: "75",
    format: "Number, 0-100",
  },

  // Advanced Business Intelligence
  business_registration_status: {
    description: "Status of business registration. For business loans only.",
    example: "Registered",
    format: "Text",
  },
  business_license_valid: {
    description: "Whether business license is valid. For business loans only.",
    example: "Yes/No",
    format: "Checkbox",
  },
  tax_compliance_score: {
    description: "Tax compliance score (0-100). For business loans only.",
    example: "90",
    format: "Number, 0-100",
  },
  annual_revenue: {
    description: "Annual business revenue in ETB. For business loans only.",
    example: "1,000,000 ETB",
    format: "Number, 0 or positive",
  },
  annual_profit: {
    description: "Annual business profit in ETB. For business loans only.",
    example: "200,000 ETB",
    format: "Number",
  },
  profit_margin: {
    description: "Business profit margin percentage. For business loans only.",
    example: "20%",
    format: "Number, 0-100",
  },
  employee_count: {
    description: "Number of employees. For business loans only.",
    example: "10",
    format: "Number, 0 or positive",
  },
  customer_base_size: {
    description: "Size of customer base. For business loans only.",
    example: "500",
    format: "Number, 0 or positive",
  },
  supplier_count: {
    description: "Number of suppliers. For business loans only.",
    example: "5",
    format: "Number, 0 or positive",
  },
  contract_value: {
    description: "Value of active contracts in ETB. For business loans only.",
    example: "500,000 ETB",
    format: "Number, 0 or positive",
  },
  receivables_aging: {
    description: "Aging of receivables in days. For business loans only.",
    example: "30 days",
    format: "Number, 0 or positive",
  },
  inventory_turnover: {
    description: "Inventory turnover ratio. For business loans only.",
    example: "6",
    format: "Number, 0 or positive",
  },
  cash_flow_stability_score: {
    description: "Cash flow stability score (0-100). For business loans only.",
    example: "80",
    format: "Number, 0-100",
  },
  business_credit_score: {
    description: "Business-specific credit score (0-100). For business loans only.",
    example: "75",
    format: "Number, 0-100",
  },

  // Advanced Behavioral Intelligence
  click_pattern_anomaly: {
    description: "Score indicating anomalous click patterns (0-100). Read-only.",
    example: "10",
    format: "Number, 0-100 (read-only)",
  },
  keystroke_dynamics: {
    description: "Keystroke dynamics analysis score (0-100). Read-only.",
    example: "85",
    format: "Number, 0-100 (read-only)",
  },
  mouse_movement_pattern: {
    description: "Mouse movement pattern analysis score (0-100). Read-only.",
    example: "88",
    format: "Number, 0-100 (read-only)",
  },
  form_completion_time: {
    description: "Time taken to complete form in seconds. Auto-captured. Read-only.",
    example: "300 seconds",
    format: "Number (read-only)",
  },
  field_edit_count: {
    description: "Number of times fields were edited. Auto-captured. Read-only.",
    example: "5",
    format: "Number (read-only)",
  },
  help_requests_count: {
    description: "Number of help requests during form completion. Auto-captured. Read-only.",
    example: "2",
    format: "Number (read-only)",
  },
  validation_error_count: {
    description: "Number of validation errors encountered. Auto-captured. Read-only.",
    example: "3",
    format: "Number (read-only)",
  },
  session_drop_off_risk: {
    description: "Risk of session drop-off (0-100). Read-only.",
    example: "15",
    format: "Number, 0-100 (read-only)",
  },
  engagement_depth_score: {
    description: "Score indicating depth of engagement (0-100). Read-only.",
    example: "80",
    format: "Number, 0-100 (read-only)",
  },
  feature_usage_pattern: {
    description: "Pattern of feature usage. Auto-captured. Read-only.",
    example: "standard",
    format: "Text (read-only)",
  },
  navigation_pattern_score: {
    description: "Score based on navigation patterns (0-100). Read-only.",
    example: "85",
    format: "Number, 0-100 (read-only)",
  },
  attention_score: {
    description: "Score indicating attention to detail (0-100). Read-only.",
    example: "90",
    format: "Number, 0-100 (read-only)",
  },
  completion_confidence_score: {
    description: "Confidence score in form completion quality (0-100). Read-only.",
    example: "88",
    format: "Number, 0-100 (read-only)",
  },

  // Advanced Model & Data Governance
  model_ensemble_weight: {
    description: "Weight of this model in the ensemble. Read-only from system.",
    example: "0.60",
    format: "Number, 0-1 (read-only)",
  },
  prediction_timestamp: {
    description: "Timestamp of prediction. Auto-generated. Read-only.",
    example: "2024-01-27T10:30:00Z",
    format: "ISO timestamp (read-only)",
  },
  feature_completeness_score: {
    description: "Score indicating completeness of feature data (0-100). Read-only.",
    example: "95",
    format: "Number, 0-100 (read-only)",
  },
  missing_feature_count: {
    description: "Number of missing features. Read-only.",
    example: "2",
    format: "Number, 0 or positive (read-only)",
  },
  imputed_feature_count: {
    description: "Number of features that were imputed. Read-only.",
    example: "5",
    format: "Number, 0 or positive (read-only)",
  },
  outlier_feature_count: {
    description: "Number of features with outlier values. Read-only.",
    example: "1",
    format: "Number, 0 or positive (read-only)",
  },
  feature_correlation_score: {
    description: "Score indicating feature correlation quality (0-100). Read-only.",
    example: "85",
    format: "Number, 0-100 (read-only)",
  },
  model_retrain_due_date: {
    description: "Date when model retraining is due. Read-only from system.",
    example: "2024-06-01",
    format: "Date (read-only)",
  },
  last_model_update_date: {
    description: "Date of last model update. Read-only from system.",
    example: "2024-01-01",
    format: "Date (read-only)",
  },
  model_performance_degradation: {
    description: "Indication of model performance degradation (0-100). Read-only.",
    example: "5",
    format: "Number, 0-100 (read-only)",
  },
  calibration_score: {
    description: "Model calibration score (0-100). Read-only.",
    example: "92",
    format: "Number, 0-100 (read-only)",
  },
  prediction_interval_lower: {
    description: "Lower bound of prediction confidence interval. Read-only.",
    example: "650",
    format: "Number (read-only)",
  },
  prediction_interval_upper: {
    description: "Upper bound of prediction confidence interval. Read-only.",
    example: "750",
    format: "Number (read-only)",
  },
  uncertainty_score: {
    description: "Score indicating prediction uncertainty (0-100). Read-only.",
    example: "10",
    format: "Number, 0-100 (read-only)",
  },
};

/**
 * Get help text for a field
 */
export function getFieldHelpText(fieldName: string): FieldHelpText | undefined {
  return FIELD_HELP_TEXT[fieldName];
}

/**
 * Get all help text entries
 */
export function getAllFieldHelpText(): Record<string, FieldHelpText> {
  return FIELD_HELP_TEXT;
}

