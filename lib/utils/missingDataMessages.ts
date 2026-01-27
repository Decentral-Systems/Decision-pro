/**
 * Missing Data Messages Utility
 * Provides contextual messages for missing data instead of generic "N/A"
 */

export interface MissingDataContext {
  field: string;
  category: 'personal' | 'financial' | 'employment' | 'credit' | 'risk' | 'loan' | 'payment';
  isRequired?: boolean;
}

/**
 * Get contextual message for missing data
 */
export function getMissingDataMessage(context: MissingDataContext): string {
  const { field, category, isRequired } = context;

  if (isRequired) {
    return "Required - Please complete";
  }

  const messages: Record<string, Record<string, string>> = {
    personal: {
      full_name: "Name not provided",
      email: "Email not provided",
      phone_number: "Phone number not provided",
      id_number: "ID number not provided",
      date_of_birth: "Date of birth not provided",
      gender: "Gender not specified",
      marital_status: "Marital status not specified",
      age: "Age not calculated",
      region: "Region not specified",
      city: "City not specified",
      address: "Address not provided",
    },
    financial: {
      monthly_income: "Monthly income not provided",
      monthly_expenses: "Monthly expenses not provided",
      savings_balance: "Savings balance not available",
      checking_balance: "Checking balance not available",
      total_debt: "Total debt not calculated",
      available_credit: "Available credit not calculated",
    },
    employment: {
      employment_status: "Employment status not provided",
      employer_name: "Employer name not provided",
      years_employed: "Years employed not specified",
      business_sector: "Business sector not specified",
    },
    credit: {
      credit_score: "Credit score pending calculation",
      credit_history: "Credit history not available",
      utilization_ratio: "Utilization ratio not calculated",
      payment_history_score: "Payment history score not available",
    },
    risk: {
      risk_level: "Risk level not assessed",
      risk_score: "Risk score not calculated",
      alerts: "No risk alerts",
    },
    loan: {
      loans: "No loans found",
      loan_amount: "Loan amount not specified",
      loan_status: "Loan status not available",
    },
    payment: {
      payments: "No payment history",
      payment_status: "Payment status not available",
      due_date: "Due date not specified",
    },
  };

  return messages[category]?.[field] || "Not available";
}

/**
 * Get tooltip explanation for why data might be missing
 */
export function getMissingDataTooltip(context: MissingDataContext): string {
  const { field, category } = context;

  const tooltips: Record<string, Record<string, string>> = {
    personal: {
      email: "Email address is optional but recommended for communication",
      phone_number: "Phone number is required for account verification",
      date_of_birth: "Date of birth is required for age verification and compliance",
    },
    financial: {
      monthly_income: "Monthly income is required for credit assessment",
      savings_balance: "Savings balance may not be available if customer hasn't linked accounts",
    },
    credit: {
      credit_score: "Credit score is calculated after initial assessment. Please run credit scoring to generate a score.",
      credit_history: "Credit history builds up over time as customer uses credit products",
    },
  };

  return tooltips[category]?.[field] || "This information may not be available yet or may be optional";
}

/**
 * Check if field should show "Complete Profile" CTA
 */
export function shouldShowCompleteProfileCTA(context: MissingDataContext): boolean {
  const { field, isRequired } = context;
  
  const fieldsWithCTA = [
    'full_name', 'email', 'phone_number', 'id_number', 'date_of_birth',
    'monthly_income', 'employment_status', 'region'
  ];
  
  return isRequired || fieldsWithCTA.includes(field);
}


