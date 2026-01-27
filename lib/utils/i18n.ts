/**
 * Internationalization (i18n) Utility
 * Supports Amharic and English languages
 */

import { useState } from "react";

export type Language = "en" | "am";

export interface Translations {
  [key: string]: string | Translations;
}

// English translations (default)
const enTranslations: Translations = {
  // Form labels - Basic Info
  "form.customer_id": "Customer ID",
  "form.loan_amount": "Loan Amount",
  "form.loan_term_months": "Loan Term (Months)",
  "form.monthly_income": "Monthly Income",
  "form.monthly_expenses": "Monthly Expenses",
  "form.loan_purpose": "Loan Purpose",
  
  // Form labels - Financial
  "form.savings_balance": "Savings Balance",
  "form.checking_balance": "Checking Balance",
  "form.total_debt": "Total Debt",
  "form.credit_utilization_ratio": "Credit Utilization Ratio",
  "form.existing_loan_payments": "Existing Loan Payments",
  "form.other_monthly_obligations": "Other Monthly Obligations",
  "form.emergency_fund_months": "Emergency Fund (Months)",
  "form.savings_rate": "Savings Rate (%)",
  
  // Form labels - Credit History
  "form.credit_history_length": "Credit History Length (Years)",
  "form.number_of_credit_accounts": "Number of Credit Accounts",
  "form.payment_history_score": "Payment History Score",
  "form.number_of_late_payments": "Number of Late Payments",
  "form.number_of_defaults": "Number of Defaults",
  "form.tenure_with_akafay_months": "Tenure with Akafay (Months)",
  "form.new_accounts_last_6m": "New Accounts (Last 6 Months)",
  "form.inquiries_last_6m": "Inquiries (Last 6 Months)",
  "form.inquiries_last_12m": "Inquiries (Last 12 Months)",
  "form.utilization_trend_3m": "Utilization Trend (3 Months)",
  "form.utilization_trend_6m": "Utilization Trend (6 Months)",
  "form.public_record_flag": "Public Record",
  "form.bankruptcy_flag": "Bankruptcy",
  "form.repossession_flag": "Repossession",
  "form.foreclosure_flag": "Foreclosure",
  "form.tax_lien_flag": "Tax Lien",
  "form.judgment_flag": "Judgment",
  
  // Form labels - Employment
  "form.employment_status": "Employment Status",
  "form.years_employed": "Years Employed",
  "form.employer_name": "Employer Name",
  "form.employment_stability_score": "Employment Stability Score",
  
  // Form labels - Personal
  "form.age": "Age",
  "form.region": "Region",
  "form.urban_rural": "Urban/Rural",
  "form.business_sector": "Business Sector",
  "form.phone_number": "Phone Number",
  "form.id_number": "ID Number",
  "form.marital_status": "Marital Status",
  "form.education_level": "Education Level",
  "form.years_at_current_address": "Years at Current Address",
  "form.dependents": "Dependents",
  "form.collateral_value": "Collateral Value",
  "form.guarantor_available": "Guarantor Available",
  
  // Form labels - Bank & Mobile Money
  "form.bank_account_age_months": "Bank Account Age (Months)",
  "form.mobile_money_account_age_months": "Mobile Money Account Age (Months)",
  "form.transaction_frequency": "Transaction Frequency",
  "form.mpesa_balance": "M-Pesa Balance",
  "form.direct_deposit_flag": "Direct Deposit",
  "form.bank_transaction_count_30d": "Bank Transactions (30 Days)",
  "form.bank_transaction_count_90d": "Bank Transactions (90 Days)",
  "form.mobile_money_transaction_count_30d": "Mobile Money Transactions (30 Days)",
  "form.mobile_money_transaction_count_90d": "Mobile Money Transactions (90 Days)",
  
  // Form labels - Identity & Fraud
  "form.fayda_verification_status": "Fayda Verification Status",
  "form.kyc_level": "KYC Level",
  "form.device_compromise_status": "Device Compromise Status",
  "form.biometric_liveness_check": "Biometric Liveness Check",
  "form.phone_tenure_months": "Phone Tenure (Months)",
  "form.id_verification_status": "ID Verification Status",
  "form.phone_verification_status": "Phone Verification Status",
  "form.fraud_score": "Fraud Score",
  "form.suspicious_activity_flag": "Suspicious Activity",
  
  // Form labels - Contextual
  "form.regional_economic_index": "Regional Economic Index",
  "form.sector_growth_rate": "Sector Growth Rate",
  "form.inflation_rate": "Inflation Rate",
  "form.unemployment_rate_regional": "Regional Unemployment Rate",
  
  // Form labels - Product Specific
  "form.loan_product_type": "Loan Product Type",
  "form.channel_type": "Channel Type",
  "form.application_source": "Application Source",
  "form.cross_sell_opportunity_score": "Cross-Sell Opportunity Score",
  
  // Form labels - Business
  "form.years_in_business": "Years in Business",
  "form.industry_risk_score": "Industry Risk Score",
  "form.merchant_revenue_share": "Merchant Revenue Share",
  "form.seasonality_index": "Seasonality Index",
  
  // Form labels - Behavioral
  "form.application_velocity": "Application Velocity",
  "form.time_of_day_application": "Time of Day Application",
  "form.device_type": "Device Type",
  "form.app_usage_frequency": "App Usage Frequency",
  "form.session_duration": "Session Duration",
  "form.spending_category_distribution": "Spending Category Distribution",
  
  // Form labels - Model
  "form.model_version": "Model Version",
  "form.feature_drift_score": "Feature Drift Score",
  "form.prediction_confidence": "Prediction Confidence",
  "form.data_quality_score": "Data Quality Score",
  
  // Results
  "form.credit_score": "Credit Score",
  "form.risk_category": "Risk Category",
  "form.approval_recommendation": "Recommendation",
  
  // Buttons
  "button.submit": "Submit",
  "button.reset": "Reset",
  "button.cancel": "Cancel",
  "button.save": "Save",
  "button.export": "Export",
  
  // Messages
  "message.loading": "Loading...",
  "message.success": "Success",
  "message.error": "Error",
  "message.required": "This field is required",
  
  // Validation messages
  "validation.customer_id.required": "Customer ID is required",
  "validation.loan_amount.required": "Loan amount is required",
  "validation.loan_amount.positive": "Loan amount must be positive",
  "validation.loan_amount.min": "Loan amount must be at least 1,000 ETB (NBE minimum)",
  "validation.loan_amount.max": "Loan amount cannot exceed 5,000,000 ETB (NBE maximum)",
  "validation.loan_term_months.required": "Loan term is required",
  "validation.loan_term_months.min": "Loan term must be at least 1 month",
  "validation.loan_term_months.max": "Loan term cannot exceed 60 months (NBE maximum)",
  "validation.monthly_income.required": "Monthly income is required",
  "validation.monthly_income.positive": "Monthly income must be positive",
  "validation.monthly_expenses.min": "Monthly expenses cannot be negative",
  "validation.nbe_salary_rule": "Loan payment exceeds 1/3 of monthly income (NBE compliance rule)",
  "validation.income_expenses": "Monthly expenses cannot exceed monthly income",
  
  // Tabs
  "tab.basic": "Basic Info",
  "tab.financial": "Financial",
  "tab.credit": "Credit History",
  "tab.employment": "Employment",
  "tab.personal": "Personal",
};

// Amharic translations
const amTranslations: Translations = {
  // Form labels - Basic Info
  "form.customer_id": "የደንበኛ መለያ",
  "form.loan_amount": "የብድር መጠን",
  "form.loan_term_months": "የብድር ጊዜ (ወራት)",
  "form.monthly_income": "ወራዊ ገቢ",
  "form.monthly_expenses": "ወራዊ ወጪ",
  "form.loan_purpose": "የብድር ዓላማ",
  
  // Form labels - Financial
  "form.savings_balance": "የቁጠባ ሂሳብ",
  "form.checking_balance": "የቼክ ሂሳብ",
  "form.total_debt": "ጠቅላላ ዕዳ",
  "form.credit_utilization_ratio": "የክሬዲት አጠቃቀም ሬሾ",
  "form.existing_loan_payments": "የነባር ብድር ክፍያዎች",
  "form.other_monthly_obligations": "ሌሎች ወራዊ ግዴታዎች",
  "form.emergency_fund_months": "የአደጋ ገንዘብ (ወራት)",
  "form.savings_rate": "የቁጠባ መጠን (%)",
  
  // Form labels - Credit History
  "form.credit_history_length": "የክሬዲት ታሪክ ርዝመት (ዓመታት)",
  "form.number_of_credit_accounts": "የክሬዲት ሂሳቦች ብዛት",
  "form.payment_history_score": "የክፍያ ታሪክ ነጥብ",
  "form.number_of_late_payments": "የዘግይቶ ክፍያዎች ብዛት",
  "form.number_of_defaults": "የመደላደል ብዛት",
  "form.tenure_with_akafay_months": "ከአካፋይ ጋር የሆነ ጊዜ (ወራት)",
  "form.new_accounts_last_6m": "አዲስ ሂሳቦች (ያለፈ 6 ወር)",
  "form.inquiries_last_6m": "ጥያቄዎች (ያለፈ 6 ወር)",
  "form.inquiries_last_12m": "ጥያቄዎች (ያለፈ 12 ወር)",
  "form.utilization_trend_3m": "የአጠቃቀም አዝማሚያ (3 ወር)",
  "form.utilization_trend_6m": "የአጠቃቀም አዝማሚያ (6 ወር)",
  "form.public_record_flag": "የህዝብ መዝገብ",
  "form.bankruptcy_flag": "መጨረስ",
  "form.repossession_flag": "ወሳጅ",
  "form.foreclosure_flag": "መዝጋት",
  "form.tax_lien_flag": "የግብር ማገደድ",
  "form.judgment_flag": "ፍርድ",
  
  // Form labels - Employment
  "form.employment_status": "የስራ ሁኔታ",
  "form.years_employed": "የስራ ዓመታት",
  "form.employer_name": "የስራ ሰጪ ስም",
  "form.employment_stability_score": "የስራ መረጋጋት ነጥብ",
  
  // Form labels - Personal
  "form.age": "ዕድሜ",
  "form.region": "ክልል",
  "form.urban_rural": "ከተማ/ገጠር",
  "form.business_sector": "የንግድ ዘርፍ",
  "form.phone_number": "የስልክ ቁጥር",
  "form.id_number": "የመለያ ቁጥር",
  "form.marital_status": "የጋብቻ ሁኔታ",
  "form.education_level": "የትምህርት ደረጃ",
  "form.years_at_current_address": "በአሁኑ አድራሻ ዓመታት",
  "form.dependents": "የሚመርኮዙ",
  "form.collateral_value": "የዋስትና ዋጋ",
  "form.guarantor_available": "ዋስትና አለ",
  
  // Form labels - Bank & Mobile Money
  "form.bank_account_age_months": "የባንክ ሂሳብ ዕድሜ (ወራት)",
  "form.mobile_money_account_age_months": "የሞባይል ገንዘብ ሂሳብ ዕድሜ (ወራት)",
  "form.transaction_frequency": "የግብይት ድግግሞሽ",
  "form.mpesa_balance": "ኤም-ፔሳ ሂሳብ",
  "form.direct_deposit_flag": "ቀጥተኛ ክፍያ",
  "form.bank_transaction_count_30d": "የባንክ ግብይቶች (30 ቀናት)",
  "form.bank_transaction_count_90d": "የባንክ ግብይቶች (90 ቀናት)",
  "form.mobile_money_transaction_count_30d": "የሞባይል ገንዘብ ግብይቶች (30 ቀናት)",
  "form.mobile_money_transaction_count_90d": "የሞባይል ገንዘብ ግብይቶች (90 ቀናት)",
  
  // Form labels - Identity & Fraud
  "form.fayda_verification_status": "የፋይዳ ማረጋገጫ ሁኔታ",
  "form.kyc_level": "የKYC ደረጃ",
  "form.device_compromise_status": "የመሣሪያ አደጋ ሁኔታ",
  "form.biometric_liveness_check": "የባዮሜትሪክ ሕይወት ማረጋገጫ",
  "form.phone_tenure_months": "የስልክ ጊዜ (ወራት)",
  "form.id_verification_status": "የመለያ ማረጋገጫ ሁኔታ",
  "form.phone_verification_status": "የስልክ ማረጋገጫ ሁኔታ",
  "form.fraud_score": "የማጭበርበር ነጥብ",
  "form.suspicious_activity_flag": "የጠራጠር እንቅስቃሴ",
  
  // Form labels - Contextual
  "form.regional_economic_index": "የክልል ኢኮኖሚ መረጃ",
  "form.sector_growth_rate": "የዘርፍ እድገት መጠን",
  "form.inflation_rate": "የዋጋ ግሽበት መጠን",
  "form.unemployment_rate_regional": "የክልል የስራ አለመገኘት መጠን",
  
  // Form labels - Product Specific
  "form.loan_product_type": "የብድር ምርት አይነት",
  "form.channel_type": "የሰርጥ አይነት",
  "form.application_source": "የመተግበሪያ ምንጭ",
  "form.cross_sell_opportunity_score": "የመሻገር ሽያጭ እድል ነጥብ",
  
  // Form labels - Business
  "form.years_in_business": "በንግድ ዓመታት",
  "form.industry_risk_score": "የኢንዱስትሪ አደጋ ነጥብ",
  "form.merchant_revenue_share": "የነጋዴ ገቢ ክፍል",
  "form.seasonality_index": "የወቅት መረጃ",
  
  // Form labels - Behavioral
  "form.application_velocity": "የመተግበሪያ ፍጥነት",
  "form.time_of_day_application": "የመተግበሪያ ሰዓት",
  "form.device_type": "የመሣሪያ አይነት",
  "form.app_usage_frequency": "የመተግበሪያ አጠቃቀም ድግግሞሽ",
  "form.session_duration": "የክፍለ ጊዜ ርዝመት",
  "form.spending_category_distribution": "የምጥቃት ምድብ ስርጭት",
  
  // Form labels - Model
  "form.model_version": "የሞዴል ሥሪት",
  "form.feature_drift_score": "የባህሪ ማዞር ነጥብ",
  "form.prediction_confidence": "የትንበያ እምነት",
  "form.data_quality_score": "የውሂብ ጥራት ነጥብ",
  
  // Results
  "form.credit_score": "የክሬዲት ነጥብ",
  "form.risk_category": "የአደጋ ምድብ",
  "form.approval_recommendation": "ምክር",
  
  // Buttons
  "button.submit": "አስረክብ",
  "button.reset": "እንደገና አቀና",
  "button.cancel": "ተወው",
  "button.save": "አስቀምጥ",
  "button.export": "ወደ ውጭ ላክ",
  
  // Messages
  "message.loading": "በመጫን ላይ...",
  "message.success": "በተሳካ ሁኔታ",
  "message.error": "ስህተት",
  "message.required": "ይህ መስክ ያስፈልጋል",
  
  // Validation messages
  "validation.customer_id.required": "የደንበኛ መለያ ያስፈልጋል",
  "validation.loan_amount.required": "የብድር መጠን ያስፈልጋል",
  "validation.loan_amount.positive": "የብድር መጠን አዎንታዊ መሆን አለበት",
  "validation.loan_amount.min": "የብድር መጠን ቢያንስ 1,000 ብር (NBE ዝቅተኛ) መሆን አለበት",
  "validation.loan_amount.max": "የብድር መጠን ከ5,000,000 ብር (NBE ከፍተኛ) መብለጥ አይችልም",
  "validation.loan_term_months.required": "የብድር ጊዜ ያስፈልጋል",
  "validation.loan_term_months.min": "የብድር ጊዜ ቢያንስ 1 ወር መሆን አለበት",
  "validation.loan_term_months.max": "የብድር ጊዜ ከ60 ወር (NBE ከፍተኛ) መብለጥ አይችልም",
  "validation.monthly_income.required": "ወራዊ ገቢ ያስፈልጋል",
  "validation.monthly_income.positive": "ወራዊ ገቢ አዎንታዊ መሆን አለበት",
  "validation.monthly_expenses.min": "ወራዊ ወጪ አሉታዊ ሊሆን አይችልም",
  "validation.nbe_salary_rule": "የብድር ክፍያ ከወራዊ ገቢ 1/3 ይበልጣል (NBE ደንብ)",
  "validation.income_expenses": "ወራዊ ወጪ ከወራዊ ገቢ መብለጥ አይችልም",
  
  // Tabs
  "tab.basic": "መሰረታዊ መረጃ",
  "tab.financial": "ፋይናንሻል",
  "tab.credit": "የክሬዲት ታሪክ",
  "tab.employment": "ስራ",
  "tab.personal": "ግላዊ",
  "tab.bank": "ባንክ እና ሞባይል",
  "tab.identity": "እንዳለኝነት",
  "tab.contextual": "የዘገባ ሁኔታ",
  "tab.business": "ንግድ",
  "tab.behavioral": "የእድሳት",
  "tab.model": "የሞዴል መረጃ",
  
  // Score Explanations (Amharic)
  "explanation.credit_score": "የክሬዲት ነጥብ",
  "explanation.risk_category": "የአደጋ ምድብ",
  "explanation.approval_recommendation": "የምክር ምክር",
  "explanation.confidence": "እምነት",
  "explanation.ensemble_score": "የኢንሰምብል ነጥብ",
  "explanation.models_used": "የተጠቀሙ ሞዴሎች",
  "explanation.compliance_status": "የመሟላት ሁኔታ",
  "explanation.score_excellent": "ታላቅ",
  "explanation.score_good": "ጥሩ",
  "explanation.score_fair": "መጠነኛ",
  "explanation.score_poor": "ደካማ",
  "explanation.risk_low": "ዝቅተኛ አደጋ",
  "explanation.risk_medium": "መካከለኛ አደጋ",
  "explanation.risk_high": "ከፍተኛ አደጋ",
  "explanation.risk_very_high": "በጣም ከፍተኛ አደጋ",
  "explanation.recommendation_approve": "መግቢያ",
  "explanation.recommendation_reject": "መቀበያ",
  "explanation.recommendation_review": "ግምገማ ያስፈልጋል",
  "explanation.compliant": "የሚመለከት",
  "explanation.non_compliant": "የማይመለከት",
  "explanation.shap_description": "SHAP እሴቶች እያንዳንዱ ባህሪ ለመጨረሻው የክሬዲት ነጥብ እንዴት እንደተሳተ ያሳያሉ። አዎንታዊ እሴቶች ነጥቡን ይጨምራሉ፣ አሉታዊ እሴቶች ይቀንሳሉ።",
  "explanation.lime_description": "LIME ለዚህ ልዩ ትንበያ የአካባቢ ማብራሪያዎችን ይሰጣል፣ ለዚህ ደንበኛ የትኞቹ ባህሪያት በጣም አስፈላጊ እንደነበሩ ያሳያል።",
  "explanation.top_positive_factors": "የከፍተኛ አዎንታዊ ምክንያቶች",
  "explanation.top_risk_factors": "የከፍተኛ አደጋ ምክንያቶች",
  "explanation.feature_importance": "የባህሪ አስፈላጊነት",
  "explanation.model_predictions": "የሞዴል ትንበያዎች",
  "explanation.compliance_check": "የመሟላት ማረጋገጫ",
  "explanation.nbe_compliance": "NBE መሟላት",
  "explanation.regulatory_requirements": "የመግደያ መስፈርቶች",
  "explanation.score_range": "የነጥብ ክልል",
  "explanation.score_trend": "የነጥብ አዝማሚያ",
  "explanation.feature_contribution": "የባህሪ አስተዋጽኦ",
  "explanation.positive_impact": "አዎንታዊ ተጽእኖ",
  "explanation.negative_impact": "አሉታዊ ተጽእኖ",
  "explanation.neutral_impact": "ገለልተኛ ተጽእኖ",
  "explanation.high_positive": "ከፍተኛ አዎንታዊ",
  "explanation.high_negative": "ከፍተኛ አሉታዊ",
};

const translations: Record<Language, Translations> = {
  en: enTranslations,
  am: amTranslations,
};

let currentLanguage: Language = "en";

/**
 * Set current language
 */
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem("preferred_language", lang);
  }
}

/**
 * Get current language
 */
export function getLanguage(): Language {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("preferred_language");
    if (stored && (stored === "en" || stored === "am")) {
      return stored as Language;
    }
  }
  return currentLanguage;
}

/**
 * Initialize language from localStorage
 */
export function initLanguage(): void {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("preferred_language");
    if (stored && (stored === "en" || stored === "am")) {
      currentLanguage = stored as Language;
    }
  }
}

/**
 * Translate a key
 */
export function t(key: string, params?: Record<string, string>): string {
  const lang = getLanguage();
  const keys = key.split(".");
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations.en;
      for (const k2 of keys) {
        if (value && typeof value === "object" && k2 in value) {
          value = value[k2];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] || match;
    });
  }

  return value;
}

/**
 * Get field label translation
 */
export function getFieldLabel(fieldName: string): string {
  return t(`form.${fieldName}`) || fieldName;
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(getLanguage());

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
  };

  return {
    t,
    language,
    setLanguage: changeLanguage,
  };
}

