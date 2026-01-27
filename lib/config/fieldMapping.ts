/**
 * Field Mapping Configuration
 * Maps form fields to 168-feature API structure with smart default strategies
 */

export interface FieldMapping {
  formField: string;
  apiPath: string[];
  source: 'user_input' | 'customer_360' | 'calculated' | 'system' | 'auto_fetched';
  required: boolean;
  defaultValue?: any;
  calculation?: (formData: any, customerData?: any) => any;
}

export const FIELD_MAPPINGS: FieldMapping[] = [
  // Core Credit Performance Fields
  {
    formField: 'tenure_with_akafay_months',
    apiPath: ['core_credit_performance', 'tenure_with_akafay_months'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'new_accounts_last_6m',
    apiPath: ['core_credit_performance', 'new_credit_lines_opened_6m'],
    source: 'user_input',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'inquiries_last_6m',
    apiPath: ['core_credit_performance', 'recent_hard_inquiries_12m'],
    source: 'user_input',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'inquiries_last_12m',
    apiPath: ['core_credit_performance', 'recent_hard_inquiries_12m'],
    source: 'user_input',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'public_record_flag',
    apiPath: ['core_credit_performance', 'collections_flag'],
    source: 'user_input',
    required: false,
    defaultValue: false,
  },
  {
    formField: 'bankruptcy_flag',
    apiPath: ['core_credit_performance', 'bankruptcy_flag'],
    source: 'user_input',
    required: false,
    defaultValue: false,
  },
  {
    formField: 'repossession_flag',
    apiPath: ['core_credit_performance', 'prior_default_or_chargeoff_flag'],
    source: 'user_input',
    required: false,
    defaultValue: false,
  },
  {
    formField: 'foreclosure_flag',
    apiPath: ['core_credit_performance', 'prior_default_or_chargeoff_flag'],
    source: 'user_input',
    required: false,
    defaultValue: false,
  },
  {
    formField: 'tax_lien_flag',
    apiPath: ['core_credit_performance', 'collections_flag'],
    source: 'user_input',
    required: false,
    defaultValue: false,
  },
  {
    formField: 'judgment_flag',
    apiPath: ['core_credit_performance', 'collections_flag'],
    source: 'user_input',
    required: false,
    defaultValue: false,
  },
  {
    formField: 'utilization_trend_3m',
    apiPath: ['core_credit_performance', 'credit_mix_diversity_index'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      // Calculate from credit history if available
      return formData.credit_utilization_ratio || 0;
    },
  },
  {
    formField: 'utilization_trend_6m',
    apiPath: ['core_credit_performance', 'credit_mix_diversity_index'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      return formData.credit_utilization_ratio || 0;
    },
  },
  
  // Affordability Fields
  {
    formField: 'existing_loan_payments',
    apiPath: ['affordability_and_obligations', 'scheduled_monthly_debt_service'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'other_monthly_obligations',
    apiPath: ['affordability_and_obligations', 'scheduled_monthly_debt_service'],
    source: 'user_input',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'emergency_fund_months',
    apiPath: ['affordability_and_obligations', 'cash_buffer_days'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      if (formData.monthly_expenses > 0 && formData.savings_balance > 0) {
        return (formData.savings_balance / formData.monthly_expenses) / 30;
      }
      return 0;
    },
  },
  {
    formField: 'savings_rate',
    apiPath: ['affordability_and_obligations', 'residual_income_ratio'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      if (formData.monthly_income > 0) {
        return (formData.savings_balance / formData.monthly_income) * 100;
      }
      return 0;
    },
  },
  
  // Bank & Mobile Money Fields
  {
    formField: 'bank_account_age_months',
    apiPath: ['bank_and_mobile_money_dynamics', 'primary_bank_tenure_months'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'mobile_money_account_age_months',
    apiPath: ['bank_and_mobile_money_dynamics', 'primary_bank_tenure_months'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'transaction_frequency',
    apiPath: ['bank_and_mobile_money_dynamics', 'mobile_money_txn_count_90d'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'mpesa_balance',
    apiPath: ['bank_and_mobile_money_dynamics', 'mobile_money_txn_volume_90d'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'direct_deposit_flag',
    apiPath: ['bank_and_mobile_money_dynamics', 'salary_deposit_count_6m'],
    source: 'customer_360',
    required: false,
    calculation: (formData, customerData) => {
      return (customerData?.salary_deposit_count_6m || 0) > 0;
    },
  },
  
  // Identity & Fraud Fields
  {
    formField: 'fayda_verification_status',
    apiPath: ['identity_and_fraud_intelligence', 'fayda_verification_status'],
    source: 'customer_360',
    required: true,
    defaultValue: 'Not Verified',
  },
  {
    formField: 'kyc_level',
    apiPath: ['identity_and_fraud_intelligence', 'kyc_level'],
    source: 'customer_360',
    required: true,
    defaultValue: 'Tier1',
  },
  {
    formField: 'device_compromise_status',
    apiPath: ['identity_and_fraud_intelligence', 'device_compromise_status'],
    source: 'system',
    required: true,
    defaultValue: 'Clean',
  },
  {
    formField: 'biometric_liveness_check',
    apiPath: ['identity_and_fraud_intelligence', 'biometric_liveness_check_status'],
    source: 'system',
    required: true,
    defaultValue: 'Passed',
  },
  {
    formField: 'phone_tenure_months',
    apiPath: ['identity_and_fraud_intelligence', 'phone_tenure_months'],
    source: 'customer_360',
    required: false,
    calculation: (formData, customerData) => {
      // Calculate from customer registration date or phone number age
      return customerData?.phone_tenure_months || 0;
    },
  },
  
  // Personal & Professional Fields
  {
    formField: 'marital_status',
    apiPath: ['personal_and_professional_stability', 'marital_status'],
    source: 'user_input',
    required: false,
    defaultValue: 'Unknown',
  },
  {
    formField: 'education_level',
    apiPath: ['personal_and_professional_stability', 'education_level'],
    source: 'user_input',
    required: false,
    defaultValue: 'Unknown',
  },
  {
    formField: 'years_at_current_address',
    apiPath: ['personal_and_professional_stability', 'location_stability_score'],
    source: 'user_input',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'dependents',
    apiPath: ['personal_and_professional_stability', 'dependents_count'],
    source: 'user_input',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'employment_stability_score',
    apiPath: ['personal_and_professional_stability', 'years_in_profession'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      if (formData.years_employed > 3) return 0.8;
      if (formData.years_employed > 1) return 0.6;
      return 0.4;
    },
  },
  
  // Contextual & Macroeconomic Fields
  {
    formField: 'regional_economic_index',
    apiPath: ['contextual_and_macroeconomic_factors', 'local_economic_resilience_score'],
    source: 'auto_fetched',
    required: false,
    defaultValue: 50,
  },
  {
    formField: 'sector_growth_rate',
    apiPath: ['contextual_and_macroeconomic_factors', 'sector_cyclicality_index'],
    source: 'auto_fetched',
    required: false,
    defaultValue: 5.0,
  },
  {
    formField: 'inflation_rate',
    apiPath: ['contextual_and_macroeconomic_factors', 'inflation_rate_recent'],
    source: 'auto_fetched',
    required: false,
    defaultValue: 15.0,
  },
  {
    formField: 'unemployment_rate_regional',
    apiPath: ['contextual_and_macroeconomic_factors', 'regional_unemployment_rate'],
    source: 'auto_fetched',
    required: false,
    defaultValue: 5.0,
  },
  
  // Product Specific Fields
  {
    formField: 'loan_product_type',
    apiPath: ['product_specific_intelligence', 'product_type'],
    source: 'user_input',
    required: true,
    defaultValue: 'PersonalLoan',
  },
  {
    formField: 'channel_type',
    apiPath: ['additional_context', 'application_channel'],
    source: 'system',
    required: true,
    defaultValue: 'web_dashboard',
  },
  {
    formField: 'application_source',
    apiPath: ['additional_context', 'application_channel'],
    source: 'system',
    required: true,
    defaultValue: 'web_dashboard',
  },
  {
    formField: 'cross_sell_opportunity_score',
    apiPath: ['product_specific_intelligence', 'relationship_strength_proxy'],
    source: 'calculated',
    required: false,
    calculation: (formData, customerData) => {
      // Calculate based on customer history
      return customerData?.prior_loans_count_akafay > 0 ? 0.7 : 0.3;
    },
  },
  
  // Business & Receivables Fields
  {
    formField: 'years_in_business',
    apiPath: ['business_and_receivables_finance', 'years_in_business'],
    source: 'user_input',
    required: false,
    defaultValue: null,
  },
  {
    formField: 'industry_risk_score',
    apiPath: ['business_and_receivables_finance', 'industry_risk_score'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      // Calculate based on business_sector
      const sectorRiskMap: Record<string, number> = {
        'Technology': 30,
        'Finance': 40,
        'Agriculture': 60,
        'Retail': 50,
        'Manufacturing': 45,
      };
      return sectorRiskMap[formData.business_sector || ''] || 50;
    },
  },
  {
    formField: 'merchant_revenue_share',
    apiPath: ['business_and_receivables_finance', 'merchant_revenue_share_top_3'],
    source: 'user_input',
    required: false,
    defaultValue: null,
  },
  {
    formField: 'seasonality_index',
    apiPath: ['business_and_receivables_finance', 'seasonality_index_12m'],
    source: 'user_input',
    required: false,
    defaultValue: null,
  },
  
  // Behavioral Intelligence Fields (mostly auto-captured)
  {
    formField: 'application_velocity',
    apiPath: ['identity_and_fraud_intelligence', 'application_velocity_user_30d'],
    source: 'system',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'time_of_day_application',
    apiPath: ['digital_behavioral_intelligence', 'app_submission_timestamp_context'],
    source: 'system',
    required: false,
    calculation: () => {
      const hour = new Date().getHours();
      if (hour >= 9 && hour < 17) return 'Business_Hours';
      if (hour >= 17 && hour < 22) return 'Evening';
      if (hour >= 22 || hour < 6) return 'Late_Night';
      return 'Early_Morning';
    },
  },
  {
    formField: 'device_type',
    apiPath: ['identity_and_fraud_intelligence', 'is_device_emulator'],
    source: 'system',
    required: false,
    calculation: () => {
      if (typeof window !== 'undefined') {
        const ua = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(ua)) return 'mobile';
        return 'desktop';
      }
      return 'desktop';
    },
  },
  
  // Digital Behavioral Fields
  {
    formField: 'app_usage_frequency',
    apiPath: ['digital_behavioral_intelligence', 'app_engagement_frequency_30d'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'session_duration',
    apiPath: ['digital_behavioral_intelligence', 'app_engagement_frequency_30d'],
    source: 'customer_360',
    required: false,
    defaultValue: 0,
  },
  {
    formField: 'spending_category_distribution',
    apiPath: ['digital_behavioral_intelligence', 'device_installed_app_categories'],
    source: 'customer_360',
    required: false,
    defaultValue: {},
  },
  
  // Model Governance Fields
  {
    formField: 'model_version',
    apiPath: ['model_governance_and_monitoring', 'model_version'],
    source: 'system',
    required: true,
    defaultValue: 'v4.0',
  },
  {
    formField: 'feature_drift_score',
    apiPath: ['model_governance_and_monitoring', 'data_quality_score'],
    source: 'system',
    required: false,
    defaultValue: 0.9,
  },
  {
    formField: 'prediction_confidence',
    apiPath: ['model_governance_and_monitoring', 'model_confidence_score'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      // Calculate based on data completeness
      const requiredFields = ['customer_id', 'loan_amount', 'monthly_income'];
      const filledFields = requiredFields.filter(f => formData[f] !== undefined && formData[f] !== null && formData[f] !== '');
      return filledFields.length / requiredFields.length;
    },
  },
  {
    formField: 'data_quality_score',
    apiPath: ['model_governance_and_monitoring', 'data_quality_score'],
    source: 'calculated',
    required: false,
    calculation: (formData) => {
      // Calculate based on field completeness
      const totalFields = Object.keys(formData).length;
      const filledFields = Object.values(formData).filter(v => v !== undefined && v !== null && v !== '').length;
      return Math.min(1.0, filledFields / Math.max(1, totalFields));
    },
  },
];

/**
 * Get field mapping by form field name
 */
export function getFieldMapping(formField: string): FieldMapping | undefined {
  return FIELD_MAPPINGS.find(m => m.formField === formField);
}

/**
 * Get all mappings for a specific source
 */
export function getMappingsBySource(source: FieldMapping['source']): FieldMapping[] {
  return FIELD_MAPPINGS.filter(m => m.source === source);
}

/**
 * Get API path for a form field
 */
export function getApiPath(formField: string): string[] | undefined {
  const mapping = getFieldMapping(formField);
  return mapping?.apiPath;
}

