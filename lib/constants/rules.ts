/**
 * Constants for Rules Engine
 * Centralized definitions for dropdown options
 */

// Product Types - Updated and COMPLETE (PascalCase format)
export const PRODUCT_TYPES = [
  { value: "PersonalLoan", label: "Personal Loan" },
  { value: "PayBoost", label: "PayBoost" },
  { value: "BusinessLoan", label: "Business Loan" },
  { value: "MortgageLoan", label: "Mortgage Loan" },
  { value: "InvoiceAdvance", label: "Invoice Advance" },
  { value: "TrustLoan", label: "Trust Loan" },
  { value: "AutoLoan", label: "Auto Loan" },
  { value: "BNPL", label: "Buy Now Pay Later" },
  { value: "SecuredLoan", label: "Secured Loan" },
  { value: "AgricultureLoan", label: "Agriculture Loan" },
  { value: "StudentLoan", label: "Student Loan" },
  { value: "GreenLoan", label: "Green Loan" },
  { value: "RevolvingCredit", label: "Revolving Credit" },
  { value: "DeviceFinance", label: "Device Finance" },
  { value: "Overdraft", label: "Overdraft Facility" },
] as const;

// Customer Segments - Categorized structure
export const CUSTOMER_SEGMENTS = {
  employment: [
    { value: "Salaried", label: "Salaried" },
    { value: "MSME", label: "MSME" },
    { value: "Corporate", label: "Corporate" },
    { value: "Individual", label: "Individual" },
    { value: "Unemployed", label: "Unemployed" },
  ],
  risk: [
    { value: "low_risk", label: "Low Risk" },
    { value: "medium_risk", label: "Medium Risk" },
    { value: "high_risk", label: "High Risk" },
    { value: "critical_risk", label: "Critical Risk" },
  ],
  rfm: [
    { value: "champions", label: "Champions" },
    { value: "loyal_customers", label: "Loyal Customers" },
    { value: "potential_loyalists", label: "Potential Loyalists" },
    { value: "new_customers", label: "New Customers" },
    { value: "existing_customers", label: "Existing Customers" },
    { value: "at_risk", label: "At Risk" },
  ],
  value: [
    { value: "high_value", label: "High Value" },
    { value: "vip", label: "VIP" },
    { value: "premium", label: "Premium" },
  ],
} as const;

// Helper function to flatten customer segments for dropdown usage
export const getAllCustomerSegments = (): Array<{ value: string; label: string }> => {
  return [
    ...CUSTOMER_SEGMENTS.employment,
    ...CUSTOMER_SEGMENTS.risk,
    ...CUSTOMER_SEGMENTS.rfm,
    ...CUSTOMER_SEGMENTS.value,
  ];
};

// Optional: Helper to get segments by category
export const getCustomerSegmentsByCategory = (
  category: keyof typeof CUSTOMER_SEGMENTS
): Array<{ value: string; label: string }> => {
  return CUSTOMER_SEGMENTS[category];
};

// Rule Types for Custom Product Rules
export const PRODUCT_RULE_TYPES = [
  { value: "eligibility", label: "Eligibility" },
  { value: "limit_calculation", label: "Limit Calculation" },
  { value: "pricing", label: "Pricing" },
  { value: "approval", label: "Approval" },
] as const;

// Rule Types for Workflow Rules
export const WORKFLOW_RULE_TYPES = [
  { value: "approval", label: "Approval" },
  { value: "rejection", label: "Rejection" },
  { value: "review", label: "Review" },
  { value: "notification", label: "Notification" },
  { value: "limit_adjustment", label: "Limit Adjustment" },
  { value: "custom", label: "Custom" },
] as const;

// Evaluation Scope
export const EVALUATION_SCOPES = [
  { value: "all", label: "All" },
  { value: "eligibility", label: "Eligibility" },
  { value: "scoring", label: "Scoring" },
  { value: "pricing", label: "Pricing" },
  { value: "approval", label: "Approval" },
] as const;

// Error Handling
export const ERROR_HANDLING_OPTIONS = [
  { value: "continue", label: "Continue" },
  { value: "stop", label: "Stop" },
  { value: "rollback", label: "Rollback" },
] as const;

// Risk Tolerance Levels
export const RISK_TOLERANCE_LEVELS = [
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
] as const;

