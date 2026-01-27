/**
 * Customer 360 Data Transformation Utilities
 * Transforms API responses into component-friendly formats
 */

export interface Customer360Data {
  customer_id: string;
  profile?: any;
  credit?: any;
  risk?: any;
  loans?: any;
  payments?: any;
  engagement?: any;
  journey?: any;
  intelligence?: any;
  [key: string]: any;
}

export interface CustomerProfile {
  customer_id: string;
  full_name?: string;
  customer_name?: string;
  email?: string;
  phone_number?: string;
  id_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  region?: string;
  city?: string;
  urban_rural?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  savings_balance?: number;
  checking_balance?: number;
  total_debt?: number;
  employment_status?: string;
  years_employed?: number;
  employer_name?: string;
  business_sector?: string;
  age?: number;
  status?: string;
  account_status?: string;
  created_at?: string;
  [key: string]: any;
}

export interface CreditData {
  score?: number;
  credit_score?: number;
  ensemble_score?: number;
  history?: Array<{ date: string; score: number; [key: string]: any }>;
  credit_history?: Array<{ date: string; score: number; [key: string]: any }>;
  utilization_ratio?: number;
  credit_utilization_ratio?: number;
  available_credit?: number;
  payment_history_score?: number;
  credit_history_length?: number;
  number_of_credit_accounts?: number;
  [key: string]: any;
}

export interface RiskData {
  level?: string;
  risk_level?: string;
  risk_score?: number;
  score?: number;
  alerts?: Array<{ type: string; message: string; [key: string]: any }>;
  assessment?: {
    risk_score?: number;
    factors?: Array<{ name: string; impact: number; [key: string]: any }>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface LoanData {
  loans?: Array<{
    loan_id?: string;
    loan_amount?: number;
    status?: string;
    monthly_payment?: number;
    remaining_balance?: number;
    outstanding_balance?: number;
    loan_type?: string;
    interest_rate?: number;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  }>;
  total_loans?: number;
  active_loans?: number;
  total_outstanding?: number;
  total_borrowed?: number;
  [key: string]: any;
}

export interface FeatureCategory {
  name: string;
  features: Array<{ name: string; value: any; importance?: number }>;
}

/**
 * Transform raw API response to structured Customer360Data
 * 
 * This function consolidates multiple API response formats into a single consistent structure.
 * It handles various response shapes:
 * - Direct nested objects (data.profile, data.credit)
 * - Flat structures (data.credit_score, data.risk_level)
 * - Wrapped responses (data.customer.profile)
 * 
 * @param rawData - Raw API response data
 * @returns Standardized Customer360Data object
 */
export function transformCustomer360Data(rawData: any): Customer360Data {
  if (!rawData) return {} as Customer360Data;

  // Standardized customer ID extraction
  const customerId = 
    rawData.customer_id || 
    rawData.profile?.customer_id || 
    rawData.customer?.customer_id || 
    rawData.id || 
    "";

  const transformed: Customer360Data = {
    customer_id: customerId,
  };

  // Standardized profile extraction - single function handles all variations
  transformed.profile = extractProfileData(rawData);

  // Standardized credit data extraction
  transformed.credit = extractCreditData(rawData);

  // Standardized risk data extraction
  transformed.risk = extractRiskData(rawData);

  // Standardized loans data extraction
  transformed.loans = extractLoansData(rawData);

  // Standardized payments data extraction
  transformed.payments = extractPaymentsData(rawData);

  // Standardized engagement data extraction
  transformed.engagement = extractEngagementData(rawData);

  // Standardized journey data extraction
  transformed.journey = extractJourneyData(rawData);

  // Standardized intelligence data extraction
  transformed.intelligence = extractIntelligenceData(rawData);

  // Preserve any other fields that aren't part of the standard structure
  const standardKeys = ["profile", "credit", "risk", "loans", "payments", "engagement", "journey", "intelligence", "customer_id", "id"];
  Object.keys(rawData).forEach((key) => {
    if (!standardKeys.includes(key)) {
      transformed[key] = rawData[key];
    }
  });

  return transformed;
}

/**
 * Extract profile data from various response formats
 * Handles: data.profile, data.customer, data.profile.customer
 */
function extractProfileData(rawData: any): any {
  return rawData.profile || rawData.customer || rawData.profile?.customer || {};
}

/**
 * Extract credit data from various response formats
 * Handles: data.credit, data.credit_score, data.credit_history
 */
function extractCreditData(rawData: any): CreditData {
  if (rawData.credit) {
    return rawData.credit;
  }
  
  return {
    score: rawData.credit_score || rawData.credit_history?.credit_score || 0,
    credit_score: rawData.credit_score || rawData.credit_history?.credit_score || 0,
    history: rawData.credit_history?.credit_history || rawData.credit_history || [],
    utilization_ratio: rawData.credit_utilization_ratio || 0,
    available_credit: rawData.available_credit || 0,
  };
}

/**
 * Extract risk data from various response formats
 * Handles: data.risk, data.risk_level, data.risk_score
 */
function extractRiskData(rawData: any): RiskData {
  if (rawData.risk) {
    return rawData.risk;
  }
  
  return {
    level: rawData.risk_level || "medium",
    risk_level: rawData.risk_level || "medium",
    score: rawData.risk_score || 0.5,
    risk_score: rawData.risk_score || 0.5,
    alerts: rawData.risk_alerts || [],
  };
}

/**
 * Extract loans data from various response formats
 * Handles: data.loans, data.loan_portfolio
 */
function extractLoansData(rawData: any): LoanData {
  const loansData = rawData.loans || rawData.loan_portfolio;
  if (!loansData) {
    return {
      loans: [],
      total_loans: 0,
      active_loans: 0,
      total_outstanding: 0,
      total_borrowed: 0,
    };
  }

  const loansArray = Array.isArray(loansData) ? loansData : (loansData.loans || []);
  
  return {
    loans: loansArray,
    total_loans: loansData.total_loans || loansArray.length,
    active_loans: loansData.active_loans || loansArray.filter((l: any) => 
      l.status === "active" || l.status === "approved" || l.status === "open"
    ).length,
    total_outstanding: loansData.total_outstanding || loansArray.reduce((sum: number, loan: any) => 
      sum + (loan.outstanding_balance || loan.remaining_balance || 0), 0
    ),
    total_borrowed: loansData.total_borrowed || loansArray.reduce((sum: number, loan: any) => 
      sum + (loan.loan_amount || 0), 0
    ),
  };
}

/**
 * Extract payments data from various response formats
 * Handles: data.payments, data.payment_history
 */
function extractPaymentsData(rawData: any): any {
  if (rawData.payments) {
    return rawData.payments;
  }
  
  return {
    history: rawData.payment_history?.payments || rawData.payment_history || [],
    upcoming: rawData.payment_schedule || [],
  };
}

/**
 * Extract engagement data from various response formats
 * Handles: data.engagement, data.gamification
 */
function extractEngagementData(rawData: any): any {
  if (rawData.engagement) {
    return rawData.engagement;
  }
  
  return {
    points: rawData.gamification?.points_balance || 0,
    level: rawData.gamification?.customer_level || "",
    touchpoints: rawData.engagement?.total_touchpoints || 0,
  };
}

/**
 * Extract journey data from various response formats
 * Handles: data.journey, data.customer_journey
 */
function extractJourneyData(rawData: any): any {
  return rawData.journey || rawData.customer_journey || {
    current_stage: rawData.journey_stage || "",
    milestones: [],
  };
}

/**
 * Extract intelligence data from various response formats
 * Handles: data.intelligence, data.recommendations, data.insights
 */
function extractIntelligenceData(rawData: any): any {
  if (rawData.intelligence) {
    return rawData.intelligence;
  }
  
  return {
    recommendations: rawData.recommendations || [],
    insights: rawData.insights?.insights || rawData.insights || [],
    life_events: rawData.life_events || [],
  };
}

/**
 * Extract and categorize all 197 customer features
 */
export function extractCustomerFeatures(data: Customer360Data): FeatureCategory[] {
  const categories: FeatureCategory[] = [];
  
  // Traditional Financial Features
  const traditionalFinancial: FeatureCategory = {
    name: "Traditional Financial Features",
    features: [],
  };

  if (data.profile) {
    const profile = data.profile.customer || data.profile;
    
    // Income and expenses
    if (profile.monthly_income !== undefined) traditionalFinancial.features.push({ name: "Monthly Income", value: profile.monthly_income });
    if (profile.monthly_expenses !== undefined) traditionalFinancial.features.push({ name: "Monthly Expenses", value: profile.monthly_expenses });
    if (profile.savings_balance !== undefined) traditionalFinancial.features.push({ name: "Savings Balance", value: profile.savings_balance });
    if (profile.checking_balance !== undefined) traditionalFinancial.features.push({ name: "Checking Balance", value: profile.checking_balance });
    if (profile.total_debt !== undefined) traditionalFinancial.features.push({ name: "Total Debt", value: profile.total_debt });
    
    // Ratios
    if (profile.monthly_income && profile.total_debt) {
      traditionalFinancial.features.push({
        name: "Debt-to-Income Ratio",
        value: (profile.total_debt / profile.monthly_income).toFixed(4),
      });
    }
    if (profile.monthly_income && profile.monthly_expenses) {
      traditionalFinancial.features.push({
        name: "Expense-to-Income Ratio",
        value: (profile.monthly_expenses / profile.monthly_income).toFixed(4),
      });
    }
  }

  if (traditionalFinancial.features.length > 0) {
    categories.push(traditionalFinancial);
  }

  // Credit Features
  if (data.credit) {
    const creditFeatures: FeatureCategory = {
      name: "Credit Features",
      features: [],
    };

    if (data.credit.score !== undefined) creditFeatures.features.push({ name: "Credit Score", value: data.credit.score });
    if (data.credit.utilization_ratio !== undefined) creditFeatures.features.push({ name: "Credit Utilization Ratio", value: data.credit.utilization_ratio });
    if (data.credit.payment_history_score !== undefined) creditFeatures.features.push({ name: "Payment History Score", value: data.credit.payment_history_score });
    if (data.credit.credit_history_length !== undefined) creditFeatures.features.push({ name: "Credit History Length (months)", value: data.credit.credit_history_length });
    if (data.credit.number_of_credit_accounts !== undefined) creditFeatures.features.push({ name: "Number of Credit Accounts", value: data.credit.number_of_credit_accounts });
    if (data.credit.available_credit !== undefined) creditFeatures.features.push({ name: "Available Credit", value: data.credit.available_credit });

    if (creditFeatures.features.length > 0) {
      categories.push(creditFeatures);
    }
  }

  // Employment Features
  if (data.profile) {
    const profile = data.profile.customer || data.profile;
    const employmentFeatures: FeatureCategory = {
      name: "Employment Features",
      features: [],
    };

    if (profile.employment_status) employmentFeatures.features.push({ name: "Employment Status", value: profile.employment_status });
    if (profile.years_employed !== undefined) employmentFeatures.features.push({ name: "Years Employed", value: profile.years_employed });
    if (profile.employer_name) employmentFeatures.features.push({ name: "Employer Name", value: profile.employer_name });
    if (profile.business_sector) employmentFeatures.features.push({ name: "Business Sector", value: profile.business_sector });

    if (employmentFeatures.features.length > 0) {
      categories.push(employmentFeatures);
    }
  }

  // Demographic Features
  if (data.profile) {
    const profile = data.profile.customer || data.profile;
    const demographicFeatures: FeatureCategory = {
      name: "Demographic Features",
      features: [],
    };

    if (profile.age !== undefined) demographicFeatures.features.push({ name: "Age", value: profile.age });
    if (profile.gender) demographicFeatures.features.push({ name: "Gender", value: profile.gender });
    if (profile.marital_status) demographicFeatures.features.push({ name: "Marital Status", value: profile.marital_status });
    if (profile.region) demographicFeatures.features.push({ name: "Region", value: profile.region });
    if (profile.city) demographicFeatures.features.push({ name: "City", value: profile.city });
    if (profile.urban_rural) demographicFeatures.features.push({ name: "Urban/Rural", value: profile.urban_rural });

    if (demographicFeatures.features.length > 0) {
      categories.push(demographicFeatures);
    }
  }

  // Risk Features
  if (data.risk) {
    const riskFeatures: FeatureCategory = {
      name: "Risk Features",
      features: [],
    };

    if (data.risk.level) riskFeatures.features.push({ name: "Risk Level", value: data.risk.level });
    if (data.risk.score !== undefined) riskFeatures.features.push({ name: "Risk Score", value: data.risk.score });
    if (data.risk.assessment?.risk_score !== undefined) {
      riskFeatures.features.push({ name: "Assessment Risk Score", value: data.risk.assessment.risk_score });
    }

    if (riskFeatures.features.length > 0) {
      categories.push(riskFeatures);
    }
  }

  // Alternative Data Features
  if (data.profile || data.alternative_data) {
    const profile = data.profile?.customer || data.profile || {};
    const altData = data.alternative_data || {};
    const alternativeFeatures: FeatureCategory = {
      name: "Alternative Data Features",
      features: [],
    };

    // Telecom and Communication Features
    if (profile.telecom_payment_history !== undefined) alternativeFeatures.features.push({ name: "Telecom Payment History", value: profile.telecom_payment_history });
    if (profile.call_pattern_consistency !== undefined) alternativeFeatures.features.push({ name: "Call Pattern Consistency", value: profile.call_pattern_consistency });
    if (profile.data_usage_pattern !== undefined) alternativeFeatures.features.push({ name: "Data Usage Pattern", value: profile.data_usage_pattern });
    if (profile.international_call_frequency !== undefined) alternativeFeatures.features.push({ name: "International Call Frequency", value: profile.international_call_frequency });
    if (altData.phone_usage_pattern !== undefined) alternativeFeatures.features.push({ name: "Phone Usage Pattern", value: altData.phone_usage_pattern });
    if (altData.call_frequency !== undefined) alternativeFeatures.features.push({ name: "Call Frequency", value: altData.call_frequency });
    if (altData.monthly_phone_bills !== undefined) alternativeFeatures.features.push({ name: "Monthly Phone Bills", value: altData.monthly_phone_bills });

    // Utility Payment Features
    if (profile.utility_payment_history !== undefined) alternativeFeatures.features.push({ name: "Utility Payment History", value: profile.utility_payment_history });
    if (profile.rent_payment_history !== undefined) alternativeFeatures.features.push({ name: "Rent Payment History", value: profile.rent_payment_history });
    if (altData.utility_payment_consistency !== undefined) alternativeFeatures.features.push({ name: "Utility Payment Consistency", value: altData.utility_payment_consistency });
    if (altData.monthly_electricity_bill !== undefined) alternativeFeatures.features.push({ name: "Monthly Electricity Bill", value: altData.monthly_electricity_bill });
    if (altData.monthly_water_bill !== undefined) alternativeFeatures.features.push({ name: "Monthly Water Bill", value: altData.monthly_water_bill });

    // Gig Economy Features
    if (profile.gig_economy_income !== undefined) alternativeFeatures.features.push({ name: "Gig Economy Income", value: profile.gig_economy_income });
    if (profile.ride_sharing_score !== undefined) alternativeFeatures.features.push({ name: "Ride Sharing Score", value: profile.ride_sharing_score });
    if (profile.food_delivery_score !== undefined) alternativeFeatures.features.push({ name: "Food Delivery Score", value: profile.food_delivery_score });
    if (profile.freelance_platform_score !== undefined) alternativeFeatures.features.push({ name: "Freelance Platform Score", value: profile.freelance_platform_score });
    if (altData.gig_income_stability !== undefined) alternativeFeatures.features.push({ name: "Gig Income Stability", value: altData.gig_income_stability });
    if (altData.monthly_gig_income !== undefined) alternativeFeatures.features.push({ name: "Monthly Gig Income", value: altData.monthly_gig_income });

    // Digital & Social Features
    if (profile.digital_payment_activity_rating !== undefined) alternativeFeatures.features.push({ name: "Digital Payment Activity Rating", value: profile.digital_payment_activity_rating });
    if (profile.social_connections_networks_rating !== undefined) alternativeFeatures.features.push({ name: "Social Connections Networks Rating", value: profile.social_connections_networks_rating });
    if (profile.online_presence_rating !== undefined) alternativeFeatures.features.push({ name: "Online Presence Rating", value: profile.online_presence_rating });
    if (profile.social_media_score !== undefined) alternativeFeatures.features.push({ name: "Social Media Score", value: profile.social_media_score });
    if (altData.digital_footprint_score !== undefined) alternativeFeatures.features.push({ name: "Digital Footprint Score", value: altData.digital_footprint_score });
    if (altData.social_media_activity !== undefined) alternativeFeatures.features.push({ name: "Social Media Activity", value: altData.social_media_activity });

    // Transactional & Device Features
    if (profile.device_data_score !== undefined) alternativeFeatures.features.push({ name: "Device Data Score", value: profile.device_data_score });
    if (profile.ecommerce_transaction_score !== undefined) alternativeFeatures.features.push({ name: "E-commerce Transaction Score", value: profile.ecommerce_transaction_score });
    if (profile.transaction_behavior_score !== undefined) alternativeFeatures.features.push({ name: "Transaction Behavior Score", value: profile.transaction_behavior_score });
    if (profile.transaction_anomaly_score !== undefined) alternativeFeatures.features.push({ name: "Transaction Anomaly Score", value: profile.transaction_anomaly_score });

    // IoT and Device Data Features
    if (profile.iot_device_count !== undefined) alternativeFeatures.features.push({ name: "IoT Device Count", value: profile.iot_device_count });
    if (profile.smart_home_score !== undefined) alternativeFeatures.features.push({ name: "Smart Home Score", value: profile.smart_home_score });
    if (profile.wearable_device_usage !== undefined) alternativeFeatures.features.push({ name: "Wearable Device Usage", value: profile.wearable_device_usage });
    if (profile.connected_car_score !== undefined) alternativeFeatures.features.push({ name: "Connected Car Score", value: profile.connected_car_score });

    // Behavioral Features
    if (profile.psychometric_score !== undefined) alternativeFeatures.features.push({ name: "Psychometric Score", value: profile.psychometric_score });
    if (profile.cognitive_behavior_score !== undefined) alternativeFeatures.features.push({ name: "Cognitive Behavior Score", value: profile.cognitive_behavior_score });
    if (profile.payment_consistency_score !== undefined) alternativeFeatures.features.push({ name: "Payment Consistency Score", value: profile.payment_consistency_score });

    // Location & Lifestyle Features
    if (profile.location_risk_score !== undefined) alternativeFeatures.features.push({ name: "Location Risk Score", value: profile.location_risk_score });
    if (profile.location_and_lifestyle_rating !== undefined) alternativeFeatures.features.push({ name: "Location and Lifestyle Rating", value: profile.location_and_lifestyle_rating });
    if (profile.neighborhood_economic_vitality_score !== undefined) alternativeFeatures.features.push({ name: "Neighborhood Economic Vitality Score", value: profile.neighborhood_economic_vitality_score });

    // Macroeconomic Features
    if (profile.regional_unemployment_rate !== undefined) alternativeFeatures.features.push({ name: "Regional Unemployment Rate", value: profile.regional_unemployment_rate });
    if (profile.local_inflation_rate !== undefined) alternativeFeatures.features.push({ name: "Local Inflation Rate", value: profile.local_inflation_rate });
    if (profile.economic_conditions !== undefined) alternativeFeatures.features.push({ name: "Economic Conditions", value: profile.economic_conditions });
    if (profile.external_credit_rating !== undefined) alternativeFeatures.features.push({ name: "External Credit Rating", value: profile.external_credit_rating });

    if (alternativeFeatures.features.length > 0) {
      categories.push(alternativeFeatures);
    }
  }

  // Behavioral Features Category
  if (data.profile || data.behavioral_data) {
    const profile = data.profile?.customer || data.profile || {};
    const behavioralData = data.behavioral_data || {};
    const behavioralFeatures: FeatureCategory = {
      name: "Behavioral Features",
      features: [],
    };

    // Financial Behavior
    if (profile.financial_literacy_rating !== undefined) behavioralFeatures.features.push({ name: "Financial Literacy Rating", value: profile.financial_literacy_rating });
    if (profile.behavioral_biometrics_score !== undefined) behavioralFeatures.features.push({ name: "Behavioral Biometrics Score", value: profile.behavioral_biometrics_score });
    if (profile.fintech_engagement_index !== undefined) behavioralFeatures.features.push({ name: "Fintech Engagement Index", value: profile.fintech_engagement_index });
    if (profile.mobile_usage_pattern_score !== undefined) behavioralFeatures.features.push({ name: "Mobile Usage Pattern Score", value: profile.mobile_usage_pattern_score });

    // Spending Patterns
    if (profile.cart_abandonedment_rate !== undefined) behavioralFeatures.features.push({ name: "Cart Abandonment Rate", value: profile.cart_abandonedment_rate });
    if (profile.online_purchase_reliability !== undefined) behavioralFeatures.features.push({ name: "Online Purchase Reliability", value: profile.online_purchase_reliability });
    if (profile.real_time_spending_adjustment !== undefined) behavioralFeatures.features.push({ name: "Real-time Spending Adjustment", value: profile.real_time_spending_adjustment });

    // Subscription & Payment Consistency
    if (profile.subscription_payment_consistency !== undefined) behavioralFeatures.features.push({ name: "Subscription Payment Consistency", value: profile.subscription_payment_consistency });
    if (profile.consistency_and_reliability_rating !== undefined) behavioralFeatures.features.push({ name: "Consistency and Reliability Rating", value: profile.consistency_and_reliability_rating });

    // BNPL Features
    if (profile.num_bnpl_loans !== undefined) behavioralFeatures.features.push({ name: "Number of BNPL Loans", value: profile.num_bnpl_loans });
    if (profile.bnpl_avg_purchase_amount !== undefined) behavioralFeatures.features.push({ name: "BNPL Average Purchase Amount", value: profile.bnpl_avg_purchase_amount });
    if (profile.bnpl_repayment_ratio !== undefined) behavioralFeatures.features.push({ name: "BNPL Repayment Ratio", value: profile.bnpl_repayment_ratio });
    if (profile.bnpl_credit_limit !== undefined) behavioralFeatures.features.push({ name: "BNPL Credit Limit", value: profile.bnpl_credit_limit });
    if (profile.bnpl_purchase_frequency !== undefined) behavioralFeatures.features.push({ name: "BNPL Purchase Frequency", value: profile.bnpl_purchase_frequency });
    if (profile.bnpl_late_payments !== undefined) behavioralFeatures.features.push({ name: "BNPL Late Payments", value: profile.bnpl_late_payments });

    if (behavioralFeatures.features.length > 0) {
      categories.push(behavioralFeatures);
    }
  }

  // Additional Financial Ratios and Metrics
  if (data.profile) {
    const profile = data.profile.customer || data.profile;
    const financialMetrics: FeatureCategory = {
      name: "Financial Metrics & Ratios",
      features: [],
    };

    // Income & Savings Metrics
    if (profile.average_monthly_saving !== undefined) financialMetrics.features.push({ name: "Average Monthly Saving", value: profile.average_monthly_saving });
    if (profile.average_monthly_withdrawal !== undefined) financialMetrics.features.push({ name: "Average Monthly Withdrawal", value: profile.average_monthly_withdrawal });
    if (profile.total_transacted_amount !== undefined) financialMetrics.features.push({ name: "Total Transacted Amount", value: profile.total_transacted_amount });
    if (profile.amount_invested_monthly !== undefined) financialMetrics.features.push({ name: "Amount Invested Monthly", value: profile.amount_invested_monthly });
    if (profile.savings_amount !== undefined) financialMetrics.features.push({ name: "Savings Amount", value: profile.savings_amount });

    // Account Metrics
    if (profile.bank_account_opened_year !== undefined) financialMetrics.features.push({ name: "Bank Account Opened Year", value: profile.bank_account_opened_year });
    if (profile.mobile_money_usage !== undefined) financialMetrics.features.push({ name: "Mobile Money Usage", value: profile.mobile_money_usage });
    if (profile.num_dependents !== undefined) financialMetrics.features.push({ name: "Number of Dependents", value: profile.num_dependents });
    if (profile.residential_area !== undefined) financialMetrics.features.push({ name: "Residential Area", value: profile.residential_area });

    // Advanced Ratios
    if (profile.income_expense_ratio !== undefined) financialMetrics.features.push({ name: "Income Expense Ratio", value: profile.income_expense_ratio });
    if (profile.income_volatility_6m !== undefined) financialMetrics.features.push({ name: "Income Volatility (6 months)", value: profile.income_volatility_6m });
    if (profile.installment_utilization_ratio !== undefined) financialMetrics.features.push({ name: "Installment Utilization Ratio", value: profile.installment_utilization_ratio });
    if (profile.credit_limit_change_6m_percent !== undefined) financialMetrics.features.push({ name: "Credit Limit Change (6m %)", value: profile.credit_limit_change_6m_percent });
    if (profile.bank_balance_avg_90d_etb !== undefined) financialMetrics.features.push({ name: "Bank Balance Avg (90d ETB)", value: profile.bank_balance_avg_90d_etb });

    if (financialMetrics.features.length > 0) {
      categories.push(financialMetrics);
    }
  }

  // Add any additional features from raw data (feature_data, features object, etc.)
  const rawFeatureSources = [
    data.profile?.features,
    data.features,
    data.profile?.feature_data,
    data.feature_data,
    data.credit?.feature_data,
    data.profile?.customer?.features,
  ];

  rawFeatureSources.forEach((featureSource) => {
    if (featureSource && typeof featureSource === "object") {
      Object.entries(featureSource).forEach(([key, value]) => {
        // Skip if already extracted
        const alreadyExtracted = categories.some((cat) =>
          cat.features.some((f) => f.name.toLowerCase() === key.toLowerCase().replace(/_/g, " "))
        );
        if (alreadyExtracted) return;

        // Try to find a category for this feature or add to "Other Features"
        let category = categories.find((c) => c.name === "Other Features");
        if (!category) {
          category = { name: "Other Features", features: [] };
          categories.push(category);
        }
        const featureName = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        category.features.push({ name: featureName, value });
      });
    }
  });

  return categories;
}

/**
 * Get customer profile with standardized defaults
 * 
 * Consolidates multiple profile data sources into a single consistent structure.
 * Handles variations in field names (e.g., customer_name vs full_name, phone vs phone_number).
 * 
 * @param data - Customer360Data object
 * @returns Standardized CustomerProfile object
 */
export function getCustomerProfile(data: Customer360Data): CustomerProfile {
  // Standardized profile extraction - handles nested structures
  const profile = data.profile?.customer || data.profile || data.customer || {};
  
  // Standardized field mapping with consistent fallbacks
  return {
    customer_id: data.customer_id || profile.customer_id || "",
    full_name: profile.full_name || profile.customer_name || profile.name || "",
    email: profile.email || "",
    phone_number: profile.phone_number || profile.phone || "",
    id_number: profile.id_number || "",
    date_of_birth: profile.date_of_birth || profile.dob || "",
    gender: profile.gender || "",
    marital_status: profile.marital_status || "",
    region: profile.region || "",
    city: profile.city || "",
    urban_rural: profile.urban_rural || profile.location_type || "",
    monthly_income: profile.monthly_income || 0,
    monthly_expenses: profile.monthly_expenses || 0,
    savings_balance: profile.savings_balance || 0,
    checking_balance: profile.checking_balance || 0,
    total_debt: profile.total_debt || 0,
    employment_status: profile.employment_status || "",
    years_employed: profile.years_employed || profile.employment_years || 0,
    employer_name: profile.employer_name || profile.employer || "",
    business_sector: profile.business_sector || profile.sector || "",
    age: profile.age || 0,
    status: profile.status || profile.account_status || "active",
    created_at: profile.created_at || "",
    ...profile,
  };
}

/**
 * Get credit data with standardized defaults
 * 
 * Consolidates multiple credit score field names into consistent structure.
 * Handles: score, credit_score, ensemble_score variations.
 * 
 * @param data - Customer360Data object
 * @returns Standardized CreditData object
 */
export function getCreditData(data: Customer360Data): CreditData {
  // Standardized credit score extraction - prioritize ensemble_score, then credit_score, then score
  const creditScore = 
    data.credit?.ensemble_score || 
    data.credit?.credit_score || 
    data.credit?.score || 
    0;

  return {
    score: creditScore,
    credit_score: creditScore,
    ensemble_score: data.credit?.ensemble_score || creditScore,
    history: data.credit?.history || data.credit?.credit_history || [],
    utilization_ratio: data.credit?.utilization_ratio || data.credit?.credit_utilization_ratio || 0,
    credit_utilization_ratio: data.credit?.credit_utilization_ratio || data.credit?.utilization_ratio || 0,
    available_credit: data.credit?.available_credit || 0,
    payment_history_score: data.credit?.payment_history_score || 0,
    credit_history_length: data.credit?.credit_history_length || 0,
    number_of_credit_accounts: data.credit?.number_of_credit_accounts || 0,
    ...data.credit,
  };
}

/**
 * Get risk data with standardized defaults
 * 
 * Consolidates risk level and score field variations.
 * Defaults to "medium" risk level if not specified.
 * 
 * @param data - Customer360Data object
 * @returns Standardized RiskData object
 */
export function getRiskData(data: Customer360Data): RiskData {
  // Standardized risk level extraction
  const riskLevel = data.risk?.level || data.risk?.risk_level || "medium";
  const riskScore = data.risk?.score || data.risk?.risk_score || 0.5;

  return {
    level: riskLevel,
    risk_level: riskLevel,
    score: riskScore,
    risk_score: riskScore,
    alerts: data.risk?.alerts || [],
    assessment: data.risk?.assessment || {},
    ...data.risk,
  };
}

/**
 * Get loans data with standardized defaults
 * 
 * Consolidates loan array and summary data into consistent structure.
 * Calculates active loans and totals if not provided.
 * 
 * @param data - Customer360Data object
 * @returns Standardized LoanData object
 */
export function getLoansData(data: Customer360Data): LoanData {
  // Standardized loans array extraction
  const loans = data.loans?.loans || data.loans || [];
  const loanArray = Array.isArray(loans) ? loans : [];

  // Standardized active loan status detection
  const activeStatuses = ["active", "approved", "open", "current"];
  const activeLoans = loanArray.filter((l: any) => 
    activeStatuses.includes((l.status || "").toLowerCase())
  );

  // Standardized outstanding balance calculation
  const totalOutstanding = loanArray.reduce((sum: number, loan: any) => 
    sum + (loan.outstanding_balance || loan.remaining_balance || 0), 0
  );

  // Standardized total borrowed calculation
  const totalBorrowed = loanArray.reduce((sum: number, loan: any) => 
    sum + (loan.loan_amount || 0), 0
  );

  return {
    loans: loanArray,
    total_loans: data.loans?.total_loans || loanArray.length,
    active_loans: data.loans?.active_loans || activeLoans.length,
    total_outstanding: data.loans?.total_outstanding || totalOutstanding,
    total_borrowed: data.loans?.total_borrowed || totalBorrowed,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number | undefined | null, currency: string = "ETB"): string {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateString;
  }
}

/**
 * Get credit score label
 */
export function getCreditScoreLabel(score: number): { label: string; color: string } {
  if (score >= 750) return { label: "Excellent", color: "text-green-600" };
  if (score >= 700) return { label: "Good", color: "text-blue-600" };
  if (score >= 650) return { label: "Fair", color: "text-yellow-600" };
  if (score >= 600) return { label: "Poor", color: "text-orange-600" };
  return { label: "Very Poor", color: "text-red-600" };
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: string): string {
  const levelLower = level.toLowerCase();
  if (levelLower === "low") return "bg-green-500";
  if (levelLower === "medium") return "bg-yellow-500";
  if (levelLower === "high") return "bg-orange-500";
  if (levelLower === "very_high" || levelLower === "very high") return "bg-red-500";
  return "bg-gray-500";
}

/**
 * Calculate trend from historical data
 * Compares current value to a previous period (30/60/90 days ago)
 */
export interface TrendResult {
  direction: "up" | "down" | "stable";
  percentageChange: number;
  previousValue: number | null;
  currentValue: number;
  periodDays: number;
}

export function calculateTrend(
  currentValue: number,
  history: Array<{ date: string; score?: number; value?: number; [key: string]: any }>,
  periodDays: number = 30
): TrendResult {
  if (!history || history.length === 0) {
    return {
      direction: "stable",
      percentageChange: 0,
      previousValue: null,
      currentValue,
      periodDays,
    };
  }

  // Sort history by date (oldest first)
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0).getTime();
    const dateB = new Date(b.date || b.timestamp || 0).getTime();
    return dateA - dateB;
  });

  // Find value from periodDays ago
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  let previousValue: number | null = null;
  for (const entry of sortedHistory) {
    const entryDate = new Date(entry.date || entry.timestamp || 0);
    if (entryDate <= cutoffDate) {
      previousValue = entry.score || entry.value || entry.credit_score || null;
    } else {
      break;
    }
  }

  // If no previous value found, use the oldest value
  if (previousValue === null && sortedHistory.length > 0) {
    const oldest = sortedHistory[0];
    previousValue = oldest.score || oldest.value || oldest.credit_score || null;
  }

  if (previousValue === null || previousValue === 0) {
    return {
      direction: "stable",
      percentageChange: 0,
      previousValue: null,
      currentValue,
      periodDays,
    };
  }

  const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
  const direction = Math.abs(percentageChange) < 0.01 ? "stable" : percentageChange > 0 ? "up" : "down";

  return {
    direction,
    percentageChange, // Return signed percentage (negative for downward trends)
    previousValue,
    currentValue,
    periodDays,
  };
}

/**
 * Calculate percentile ranking
 * Returns a string like "Top 10%", "Above Average", "Below Average", etc.
 */
export function calculatePercentileRanking(value: number, average: number, standardDeviation?: number): string {
  if (value === average) return "Average";
  
  const diff = value - average;
  const percentDiff = standardDeviation && standardDeviation > 0 
    ? (diff / standardDeviation) * 100 
    : (diff / average) * 100;

  if (percentDiff >= 50) return "Top 10%";
  if (percentDiff >= 25) return "Top 25%";
  if (percentDiff >= 10) return "Above Average";
  if (percentDiff >= -10) return "Average";
  if (percentDiff >= -25) return "Below Average";
  if (percentDiff >= -50) return "Bottom 25%";
  return "Bottom 10%";
}

/**
 * Format data freshness indicator
 * Returns time since last update and staleness status
 */
export interface DataFreshness {
  lastUpdated: Date | null;
  isStale: boolean;
  stalenessHours: number;
  stalenessMessage: string;
}

export function getDataFreshness(lastUpdated: string | Date | null | undefined): DataFreshness {
  if (!lastUpdated) {
    return {
      lastUpdated: null,
      isStale: true,
      stalenessHours: Infinity,
      stalenessMessage: "Data timestamp not available",
    };
  }

  const lastUpdatedDate = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const stalenessMs = now.getTime() - lastUpdatedDate.getTime();
  const stalenessHours = stalenessMs / (1000 * 60 * 60);
  const isStale = stalenessHours > 24;

  let stalenessMessage = "";
  if (stalenessHours < 1) {
    stalenessMessage = "Updated less than an hour ago";
  } else if (stalenessHours < 24) {
    stalenessMessage = `Updated ${Math.floor(stalenessHours)} hours ago`;
  } else if (stalenessHours < 48) {
    stalenessMessage = `Updated ${Math.floor(stalenessHours / 24)} day ago`;
  } else {
    stalenessMessage = `Updated ${Math.floor(stalenessHours / 24)} days ago`;
  }

  return {
    lastUpdated: lastUpdatedDate,
    isStale,
    stalenessHours,
    stalenessMessage,
  };
}




