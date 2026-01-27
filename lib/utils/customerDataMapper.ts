/**
 * Comprehensive Customer Data Mapper
 * Maps customer 360 data to all 197 form fields
 */

import { CreditScoringFormData } from './validation';
import { getSmartDefaults } from './smartDefaults';

export interface Customer360Data {
  customer?: any;
  profile?: any;
  credit?: any;
  risk?: any;
  bank?: any;
  mobile_money?: any;
  identity?: any;
  employment?: any;
  behavioral?: any;
  digital?: any;
  [key: string]: any;
}

/**
 * Map customer 360 data to form fields
 */
export function mapCustomer360ToFormData(
  customerData: Customer360Data | null,
  selectedCustomerId: string | undefined
): Partial<CreditScoringFormData> {
  if (!customerData || !selectedCustomerId) {
    return {};
  }

  const customer = customerData.customer || customerData;
  const profile = customerData.profile || customerData;
  const credit = customerData.credit || customerData;
  const risk = customerData.risk || customerData;
  const bank = customerData.bank || customerData;
  const mobileMoney = customerData.mobile_money || customerData;
  const identity = customerData.identity || customerData;
  const employment = customerData.employment || customerData;
  const behavioral = customerData.behavioral || customerData;
  const digital = customerData.digital || customerData;

  // Comprehensive mapping
  const formData: Partial<CreditScoringFormData> = {
    // Basic Info
    customer_id: selectedCustomerId,
    
    // Financial
    monthly_income:
      customer.monthly_income ||
      profile?.monthly_income ||
      customerData.income ||
      employment?.monthly_income ||
      0,
    monthly_expenses:
      customer.monthly_expenses ||
      profile?.monthly_expenses ||
      customerData.expenses ||
      0,
    savings_balance:
      customer.savings_balance ||
      profile?.savings_balance ||
      customerData.savings ||
      bank?.savings_balance ||
      0,
    checking_balance:
      customer.checking_balance ||
      profile?.checking_balance ||
      customerData.checking ||
      bank?.checking_balance ||
      0,
    total_debt:
      customer.total_debt ||
      profile?.total_debt ||
      customerData.debt ||
      credit?.total_debt ||
      0,
    credit_utilization_ratio:
      customer.credit_utilization_ratio ||
      profile?.credit_utilization_ratio ||
      customerData.utilization_ratio ||
      credit?.utilization_ratio ||
      30,
    
    // Credit History
    credit_history_length:
      customer.credit_history_length ||
      profile?.credit_history_length ||
      customerData.credit_history_years ||
      credit?.history_length_years ||
      0,
    number_of_credit_accounts:
      customer.number_of_credit_accounts ||
      profile?.number_of_credit_accounts ||
      customerData.credit_accounts ||
      credit?.account_count ||
      0,
    payment_history_score:
      customer.payment_history_score ||
      profile?.payment_history_score ||
      customerData.payment_score ||
      credit?.payment_score ||
      85,
    number_of_late_payments:
      customer.number_of_late_payments ||
      profile?.number_of_late_payments ||
      customerData.late_payments ||
      credit?.late_payments_count ||
      0,
    number_of_defaults:
      customer.number_of_defaults ||
      profile?.number_of_defaults ||
      customerData.defaults ||
      credit?.defaults_count ||
      0,
    
    // Core Credit Performance
    tenure_with_akafay_months:
      customer.tenure_with_akafay_months ||
      customerData.tenure_months ||
      credit?.akafay_tenure_months ||
      0,
    new_accounts_last_6m:
      credit?.new_accounts_last_6m ||
      credit?.new_accounts_6m ||
      0,
    inquiries_last_6m:
      credit?.inquiries_last_6m ||
      credit?.inquiries_6m ||
      0,
    inquiries_last_12m:
      credit?.inquiries_last_12m ||
      credit?.inquiries_12m ||
      0,
    public_record_flag:
      credit?.public_record_flag ||
      credit?.has_public_records ||
      false,
    bankruptcy_flag:
      credit?.bankruptcy_flag ||
      credit?.has_bankruptcy ||
      false,
    repossession_flag:
      credit?.repossession_flag ||
      credit?.has_repossession ||
      false,
    foreclosure_flag:
      credit?.foreclosure_flag ||
      credit?.has_foreclosure ||
      false,
    tax_lien_flag:
      credit?.tax_lien_flag ||
      credit?.has_tax_lien ||
      false,
    judgment_flag:
      credit?.judgment_flag ||
      credit?.has_judgment ||
      false,
    
    // Affordability
    existing_loan_payments:
      customer.existing_loan_payments ||
      profile?.existing_loan_payments ||
      credit?.monthly_loan_payments ||
      0,
    other_monthly_obligations:
      customer.other_monthly_obligations ||
      profile?.other_obligations ||
      0,
    
    // Bank & Mobile Money
    bank_account_age_months:
      bank?.account_age_months ||
      bank?.tenure_months ||
      customerData.bank_account_age ||
      0,
    mobile_money_account_age_months:
      mobileMoney?.account_age_months ||
      mobileMoney?.tenure_months ||
      customerData.mobile_money_age ||
      0,
    transaction_frequency:
      bank?.transaction_frequency ||
      mobileMoney?.transaction_frequency ||
      customerData.transaction_count ||
      0,
    mpesa_balance:
      mobileMoney?.balance ||
      mobileMoney?.mpesa_balance ||
      customerData.mobile_money_balance ||
      0,
    direct_deposit_flag:
      bank?.has_direct_deposit ||
      bank?.direct_deposit_flag ||
      false,
    bank_transaction_count_30d:
      bank?.transaction_count_30d ||
      bank?.transactions_30d ||
      0,
    bank_transaction_count_90d:
      bank?.transaction_count_90d ||
      bank?.transactions_90d ||
      0,
    mobile_money_transaction_count_30d:
      mobileMoney?.transaction_count_30d ||
      mobileMoney?.transactions_30d ||
      0,
    mobile_money_transaction_count_90d:
      mobileMoney?.transaction_count_90d ||
      mobileMoney?.transactions_90d ||
      0,
    
    // Identity & Fraud
    fayda_verification_status:
      identity?.fayda_verification_status ||
      identity?.id_verification_status ||
      customerData.fayda_status ||
      'Not Verified',
    kyc_level:
      identity?.kyc_level ||
      identity?.kyc_tier ||
      customerData.kyc_level ||
      'Tier1',
    device_compromise_status:
      identity?.device_compromise_status ||
      identity?.device_status ||
      'Clean',
    biometric_liveness_check:
      identity?.biometric_liveness_check ||
      identity?.biometric_status ||
      'Passed',
    phone_tenure_months:
      identity?.phone_tenure_months ||
      customerData.phone_age_months ||
      0,
    id_verification_status:
      identity?.id_verification_status ||
      identity?.id_status ||
      customerData.id_verified ? 'Verified' : 'Not Verified',
    phone_verification_status:
      identity?.phone_verification_status ||
      identity?.phone_status ||
      customerData.phone_verified ? 'Verified' : 'Not Verified',
    fraud_score:
      risk?.fraud_score ||
      identity?.fraud_score ||
      0,
    suspicious_activity_flag:
      risk?.suspicious_activity_flag ||
      identity?.suspicious_activity ||
      false,
    
    // Personal & Professional
    marital_status:
      profile?.marital_status ||
      customer.marital_status ||
      customerData.marital_status ||
      'Unknown',
    education_level:
      profile?.education_level ||
      customer.education_level ||
      customerData.education ||
      'Unknown',
    years_at_current_address:
      profile?.years_at_current_address ||
      customer.years_at_address ||
      customerData.address_years ||
      0,
    dependents:
      profile?.dependents ||
      customer.dependents ||
      customerData.dependents_count ||
      0,
    
    // Employment
    employment_status:
      customer.employment_status ||
      profile?.employment_status ||
      customerData.employment_status ||
      employment?.status ||
      'employed',
    years_employed:
      customer.years_employed ||
      profile?.years_employed ||
      customerData.employment_years ||
      employment?.years ||
      0,
    employer_name:
      customer.employer_name ||
      profile?.employer_name ||
      customerData.employer ||
      employment?.employer_name ||
      '',
    
    // Personal
    age:
      customer.age ||
      profile?.age ||
      customerData.age ||
      35,
    phone_number:
      customer.phone_number ||
      profile?.phone_number ||
      customerData.phone ||
      identity?.phone_number ||
      '',
    id_number:
      customer.id_number ||
      profile?.id_number ||
      customerData.id_number ||
      identity?.id_number ||
      '',
    region:
      customer.region ||
      profile?.region ||
      customerData.region ||
      customer.city ||
      '',
    urban_rural:
      customer.urban_rural ||
      profile?.urban_rural ||
      customerData.location_type ||
      'urban',
    business_sector:
      customer.business_sector ||
      profile?.business_sector ||
      customerData.sector ||
      employment?.sector ||
      '',
    
    // Product Specific
    loan_product_type:
      customerData.loan_product_type ||
      'PersonalLoan',
    channel_type:
      customerData.channel_type ||
      'web_dashboard',
    application_source:
      customerData.application_source ||
      'web_dashboard',
    
    // Business & Receivables
    years_in_business:
      customer.years_in_business ||
      customerData.business_years ||
      null,
    merchant_revenue_share:
      customerData.merchant_revenue_share ||
      null,
    seasonality_index:
      customerData.seasonality_index ||
      null,
    
    // Digital Behavioral
    app_usage_frequency:
      digital?.app_usage_frequency ||
      digital?.engagement_frequency ||
      behavioral?.app_usage ||
      0,
    session_duration:
      digital?.session_duration ||
      digital?.avg_session_duration ||
      behavioral?.session_duration ||
      0,
    spending_category_distribution:
      digital?.spending_category_distribution ||
      digital?.category_distribution ||
      {},
  };

  return formData;
}

/**
 * Apply smart defaults to form data
 */
export function applySmartDefaultsToFormData(
  formData: Partial<CreditScoringFormData>,
  customerData: Customer360Data | null
): Partial<CreditScoringFormData> {
  const smartDefaults = getSmartDefaults({
    formData: formData as Record<string, any>,
    customerData: customerData as Record<string, any> | null,
    systemData: {
      model_version: 'v4.0',
      channel_type: 'web_dashboard',
      application_source: 'web_dashboard',
    },
    autoFetchedData: {
      regional_economic_index: 50,
      sector_growth_rate: 5.0,
      inflation_rate: 15.0,
      unemployment_rate_regional: 5.0,
    },
  });

  return {
    ...formData,
    ...smartDefaults,
  };
}

