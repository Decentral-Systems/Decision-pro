/**
 * Executive Dashboard Data Transformation Utilities
 * Transforms backend API responses to frontend data structures
 */

import { KPIMetric } from "@/types/dashboard";
import {
  ExecutiveDashboardData,
  BankingKPIs,
  BankingRatios,
  RevenueMetrics,
  OperationalEfficiency,
  SystemHealth,
  ComplianceMetrics,
} from "@/types/dashboard";

/**
 * Validate banking KPIs data structure
 * Returns true if data is valid, false otherwise
 */
export function validateBankingKPIs(kpis: any): boolean {
  if (!kpis || typeof kpis !== 'object') {
    return false;
  }
  
  // Check that at least one required field exists
  const hasRequiredField = 
    kpis.total_assets !== undefined ||
    kpis.total_deposits !== undefined ||
    kpis.total_loans !== undefined ||
    kpis.net_income !== undefined;
  
  if (!hasRequiredField) {
    // Suppress warnings in production - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[validateBankingKPIs] No required fields found');
    }
    return false;
  }
  
  // Validate numeric fields are numbers
  const numericFields = ['total_assets', 'total_deposits', 'total_loans', 'net_income'];
  for (const field of numericFields) {
      if (kpis[field] !== undefined && (typeof kpis[field] !== 'number' || isNaN(kpis[field]))) {
        // Suppress warnings in production
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[validateBankingKPIs] Invalid ${field}:`, kpis[field]);
        }
        return false;
      }
  }
  
  return true;
}

/**
 * Validate banking ratios data structure
 * Returns true if data is valid, false otherwise
 */
export function validateBankingRatios(ratios: any): boolean {
  if (!ratios || typeof ratios !== 'object') {
    return false;
  }
  
  // Check that at least one ratio exists
  const hasRatio = 
    ratios.nim !== undefined ||
    ratios.roe !== undefined ||
    ratios.roa !== undefined ||
    ratios.npl !== undefined ||
    ratios.car !== undefined ||
    ratios.cir !== undefined;
  
  if (!hasRatio) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[validateBankingRatios] No ratios found');
    }
    return false;
  }
  
  // Validate percentage ranges (0-1000% is reasonable for banking ratios)
  const percentageFields = ['nim', 'roe', 'roa', 'npl', 'car', 'cir', 'ldr'];
  for (const field of percentageFields) {
    if (ratios[field] !== undefined) {
      const value = ratios[field];
      if (typeof value !== 'number' || isNaN(value)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[validateBankingRatios] Invalid ${field}:`, value);
        }
        return false;
      }
      // NPL should be 0-100%, others can be wider range
      if (field === 'npl' && (value < 0 || value > 100)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[validateBankingRatios] NPL out of range (0-100%):`, value);
        }
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validate revenue metrics data structure
 * Returns true if data is valid, false otherwise
 */
export function validateRevenueMetrics(revenue: any): boolean {
  if (!revenue || typeof revenue !== 'object') {
    return false;
  }
  
  // Check that total_revenue exists and is valid
  if (revenue.total_revenue !== undefined) {
    if (typeof revenue.total_revenue !== 'number' || isNaN(revenue.total_revenue) || revenue.total_revenue < 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[validateRevenueMetrics] Invalid total_revenue:', revenue.total_revenue);
      }
      return false;
    }
  }
  
  // Validate breakdown if present
  if (revenue.breakdown !== undefined) {
    if (!Array.isArray(revenue.breakdown)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[validateRevenueMetrics] Breakdown is not an array:', revenue.breakdown);
      }
      return false;
    }
    
    // Validate each breakdown item - ensure breakdown is not undefined before iterating
    if (revenue.breakdown && revenue.breakdown.length > 0) {
      for (const item of revenue.breakdown) {
        if (!item || typeof item !== 'object') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[validateRevenueMetrics] Invalid breakdown item:', item);
          }
          return false;
        }
        if ((item.name === undefined && item.category === undefined) || 
            (item.value === undefined && item.amount === undefined)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[validateRevenueMetrics] Breakdown item missing required fields:', item);
          }
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Transform raw banking KPIs to KPIMetric format
 * Includes data validation to ensure values are within expected ranges
 */
export function transformBankingKPIs(kpis: BankingKPIs): Record<string, KPIMetric> {
  // Validate input data
  if (!validateBankingKPIs(kpis)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[transformBankingKPIs] Invalid KPIs data, returning empty object');
    }
    return {};
  }
  // Validate and clamp values to prevent invalid data
  const clampCurrency = (value: number | undefined): number => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    return Math.max(0, value); // Currency values should be non-negative
  };

  const clampPercentage = (value: number | undefined): number | undefined => {
    if (value === undefined || value === null || isNaN(value)) return undefined;
    // Allow negative percentages for decreases, but clamp extreme values
    return Math.max(-1000, Math.min(1000, value));
  };

  const total_assets = clampCurrency(kpis.total_assets);
  const total_deposits = clampCurrency(kpis.total_deposits);
  const total_loans = clampCurrency(kpis.total_loans);
  const net_income = clampCurrency(kpis.net_income);
  const assets_growth = clampPercentage(kpis.assets_growth);
  const deposits_growth = clampPercentage(kpis.deposits_growth);
  const loans_growth = clampPercentage(kpis.loans_growth);
  const income_growth = clampPercentage(kpis.income_growth);

  // Log warnings only in development for invalid data (suppress in production)
  if (process.env.NODE_ENV === "development") {
    if (kpis.total_assets !== undefined && kpis.total_assets < 0) {
      console.warn("[transformBankingKPIs] Invalid total_assets value (negative):", kpis.total_assets);
    }
    if (kpis.total_deposits !== undefined && kpis.total_deposits < 0) {
      console.warn("[transformBankingKPIs] Invalid total_deposits value (negative):", kpis.total_deposits);
    }
  }
  // In production, silently clamp invalid values without warnings

  return {
    total_assets: {
      label: "Total Assets",
      value: total_assets,
      change: assets_growth,
      changeType: (assets_growth || 0) > 0 ? "increase" : (assets_growth || 0) < 0 ? "decrease" : "neutral",
      format: "currency",
    },
    total_deposits: {
      label: "Total Deposits",
      value: total_deposits,
      change: deposits_growth,
      changeType: (deposits_growth || 0) > 0 ? "increase" : (deposits_growth || 0) < 0 ? "decrease" : "neutral",
      format: "currency",
    },
    total_loans: {
      label: "Total Loans",
      value: total_loans,
      change: loans_growth,
      changeType: (loans_growth || 0) > 0 ? "increase" : (loans_growth || 0) < 0 ? "decrease" : "neutral",
      format: "currency",
    },
    net_income: {
      label: "Net Income",
      value: net_income,
      change: income_growth,
      changeType: (income_growth || 0) > 0 ? "increase" : (income_growth || 0) < 0 ? "decrease" : "neutral",
      format: "currency",
    },
  };
}

/**
 * Transform banking ratios to KPIMetric format
 * Includes data validation to ensure percentage values are within reasonable ranges
 */
export function transformBankingRatios(ratios: BankingRatios): Record<string, KPIMetric> {
  // Validate input data
  if (!validateBankingRatios(ratios)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[transformBankingRatios] Invalid ratios data, returning empty object');
    }
    return {};
  }
  
  const result: Record<string, KPIMetric> = {};

  // Validate percentage values (typically 0-100, but allow some reasonable range)
  const clampPercentage = (value: number | undefined, min: number = 0, max: number = 1000): number | undefined => {
    if (value === undefined || value === null || isNaN(value)) return undefined;
    return Math.max(min, Math.min(max, value));
  };

  if (ratios.nim !== undefined) {
    const validatedValue = clampPercentage(ratios.nim, -100, 100);
    if (validatedValue !== undefined) {
      result.nim = {
        label: "Net Interest Margin (NIM)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  if (ratios.roe !== undefined) {
    const validatedValue = clampPercentage(ratios.roe, -100, 1000);
    if (validatedValue !== undefined) {
      result.roe = {
        label: "Return on Equity (ROE)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  if (ratios.roa !== undefined) {
    const validatedValue = clampPercentage(ratios.roa, -100, 100);
    if (validatedValue !== undefined) {
      result.roa = {
        label: "Return on Assets (ROA)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  if (ratios.npl !== undefined) {
    const validatedValue = clampPercentage(ratios.npl, 0, 100); // NPL should be 0-100%
    if (validatedValue !== undefined) {
      result.npl = {
        label: "Non-Performing Loans (NPL)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  if (ratios.car !== undefined) {
    const validatedValue = clampPercentage(ratios.car, 0, 1000); // CAR can exceed 100%
    if (validatedValue !== undefined) {
      result.car = {
        label: "Capital Adequacy Ratio (CAR)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  if (ratios.cir !== undefined) {
    const validatedValue = clampPercentage(ratios.cir, 0, 1000); // CIR can exceed 100%
    if (validatedValue !== undefined) {
      result.cir = {
        label: "Cost-to-Income Ratio (CIR)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  if (ratios.ldr !== undefined) {
    const validatedValue = clampPercentage(ratios.ldr, 0, 1000); // LDR can exceed 100%
    if (validatedValue !== undefined) {
      result.ldr = {
        label: "Loan-to-Deposit Ratio (LDR)",
        value: validatedValue,
        format: "percentage",
      };
    }
  }

  return result;
}

/**
 * Transform revenue metrics to KPIMetric format
 * Includes data validation to ensure values are valid
 */
export function transformRevenueMetrics(revenue: RevenueMetrics): KPIMetric | null {
  // Validate input data
  if (!validateRevenueMetrics(revenue)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[transformRevenueMetrics] Invalid revenue data, returning null');
    }
    return null;
  }
  
  // Validate and clamp values
  const clampCurrency = (value: number | undefined): number => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    return Math.max(0, value); // Revenue should be non-negative
  };

  const clampPercentage = (value: number | undefined): number | undefined => {
    if (value === undefined || value === null || isNaN(value)) return undefined;
    return Math.max(-1000, Math.min(1000, value)); // Allow reasonable growth ranges
  };

  const total_revenue = clampCurrency(revenue.total_revenue);
  const growth_rate = clampPercentage(revenue.growth_rate);

  return {
    label: "Total Revenue",
    value: total_revenue,
    change: growth_rate,
    changeType: (growth_rate || 0) > 0 ? "increase" : (growth_rate || 0) < 0 ? "decrease" : "neutral",
    format: "currency",
  };
}

/**
 * Transform operational efficiency metrics
 */
export function transformOperationalEfficiency(efficiency: OperationalEfficiency): Record<string, KPIMetric> {
  const result: Record<string, KPIMetric> = {};

  if (efficiency.processing_time !== undefined) {
    result.processing_time = {
      label: "Processing Time",
      value: efficiency.processing_time,
      format: "number",
    };
  }

  if (efficiency.automation_rate !== undefined) {
    result.automation_rate = {
      label: "Automation Rate",
      value: efficiency.automation_rate,
      format: "percentage",
    };
  }

  if (efficiency.throughput !== undefined) {
    result.throughput = {
      label: "Throughput",
      value: efficiency.throughput,
      format: "number",
    };
  }

  if (efficiency.error_rate !== undefined) {
    result.error_rate = {
      label: "Error Rate",
      value: efficiency.error_rate,
      format: "percentage",
    };
  }

  return result;
}

/**
 * Transform system health metrics
 */
export function transformSystemHealth(health: SystemHealth): Record<string, KPIMetric> {
  const result: Record<string, KPIMetric> = {};

  if (health.cpu_usage !== undefined) {
    result.cpu_usage = {
      label: "CPU Usage",
      value: health.cpu_usage,
      format: "percentage",
    };
  }

  if (health.memory_usage !== undefined) {
    result.memory_usage = {
      label: "Memory Usage",
      value: health.memory_usage,
      format: "percentage",
    };
  }

  if (health.disk_usage !== undefined) {
    result.disk_usage = {
      label: "Disk Usage",
      value: health.disk_usage,
      format: "percentage",
    };
  }

  if (health.network_usage !== undefined) {
    result.network_usage = {
      label: "Network Usage",
      value: health.network_usage,
      format: "percentage",
    };
  }

  return result;
}

/**
 * Transform compliance metrics
 */
export function transformComplianceMetrics(compliance: ComplianceMetrics): Record<string, KPIMetric> {
  const result: Record<string, KPIMetric> = {};

  if (compliance.compliance_rate !== undefined) {
    result.compliance_rate = {
      label: "Compliance Rate",
      value: compliance.compliance_rate,
      format: "percentage",
    };
  }

  if (compliance.compliance_score !== undefined) {
    result.compliance_score = {
      label: "Compliance Score",
      value: compliance.compliance_score,
      format: "number",
    };
  }

  if (compliance.violations_count !== undefined) {
    result.violations_count = {
      label: "Violations Count",
      value: compliance.violations_count,
      format: "number",
    };
  }

  return result;
}

/**
 * Transform raw executive dashboard API response to structured format
 */
export function transformExecutiveDashboardData(rawData: any): ExecutiveDashboardData | null {
  if (!rawData || typeof rawData !== "object") {
    if (process.env.NODE_ENV === "development") {
      console.warn("[transformExecutiveDashboardData] Invalid rawData:", rawData);
    }
    return null;
  }

  try {
    // Log raw data structure for debugging
    console.log("[transformExecutiveDashboardData] Processing raw data:", {
      hasTotalAssets: 'total_assets' in rawData,
      hasTotalDeposits: 'total_deposits' in rawData,
      hasTotalLoans: 'total_loans' in rawData,
      hasNetIncome: 'net_income' in rawData,
      hasBankingRatios: 'banking_ratios' in rawData,
      hasRevenueMetrics: 'revenue_metrics' in rawData,
      hasBankingKPIs: 'banking_kpis' in rawData,
      hasData: 'data' in rawData,
      topLevelKeys: Object.keys(rawData).slice(0, 20),
      sampleValues: {
        total_assets: rawData.total_assets,
        total_deposits: rawData.total_deposits,
        total_loans: rawData.total_loans,
        net_income: rawData.net_income,
      }
    });
    
    // Validate transformations as we go
    const validationErrors: string[] = [];
    // Handle different response structures
    const data = rawData.data || rawData;

    // API returns banking KPIs at top level (total_assets, total_deposits, etc.)
    // and banking_ratios as an object
    const bankingKPIsData = {
        total_assets: data.banking_kpis?.total_assets || data.total_assets || 0,
        total_deposits: data.banking_kpis?.total_deposits || data.total_deposits || 0,
        total_loans: data.banking_kpis?.total_loans || data.total_loans || 0,
        net_income: data.banking_kpis?.net_income || data.net_income || 0,
        assets_growth: data.banking_kpis?.assets_growth || data.assets_growth || 0,
        deposits_growth: data.banking_kpis?.deposits_growth || data.deposits_growth || 0,
        loans_growth: data.banking_kpis?.loans_growth || data.loans_growth || 0,
        income_growth: data.banking_kpis?.income_growth || data.income_growth || 0,
      };
    
    // Validate banking KPIs
    if (!validateBankingKPIs(bankingKPIsData)) {
      validationErrors.push('banking_kpis');
    }
    
    const bankingRatiosData = {
        nim: data.banking_ratios?.nim,
        roe: data.banking_ratios?.roe,
        roa: data.banking_ratios?.roa,
        npl: data.banking_ratios?.npl || data.banking_ratios?.npl_ratio,
        car: data.banking_ratios?.car,
        cir: data.banking_ratios?.cir,
        ldr: data.banking_ratios?.ldr,
        lcr: data.banking_ratios?.lcr,
      };
    
    // Validate banking ratios
    if (!validateBankingRatios(bankingRatiosData)) {
      validationErrors.push('banking_ratios');
    }
    
    const revenueMetricsData = {
        total_revenue: data.revenue_metrics?.total_revenue || data.revenue_metrics?.monthly_revenue || data.total_revenue || 0,
        interest_income: data.revenue_metrics?.interest_income,
        non_interest_income: data.revenue_metrics?.non_interest_income || (data.revenue_metrics?.processing_fees && data.revenue_metrics?.late_fees ? (data.revenue_metrics.processing_fees + data.revenue_metrics.late_fees) : undefined),
        growth_rate: data.revenue_metrics?.growth_rate || data.revenue_growth,
        breakdown: data.revenue_metrics?.breakdown || data.revenue_breakdown,
      };
    
    // Validate revenue metrics
    if (!validateRevenueMetrics(revenueMetricsData)) {
      validationErrors.push('revenue_metrics');
    }
    
    const transformed = {
      banking_kpis: bankingKPIsData,
      banking_ratios: bankingRatiosData,
      revenue_metrics: revenueMetricsData,
      portfolio_health: {
        overall_score: data.portfolio_health?.overall_score || data.portfolio_health_score || 0,
        components: {
          credit_quality: data.portfolio_health?.components?.credit_quality || data.portfolio_health?.credit_quality || 0,
          diversification: data.portfolio_health?.components?.diversification || data.portfolio_health?.diversification || 0,
          liquidity: data.portfolio_health?.components?.liquidity || data.portfolio_health?.liquidity || 0,
          profitability: data.portfolio_health?.components?.profitability || data.portfolio_health?.profitability || 0,
        },
      },
      operational_efficiency: {
        processing_time: data.operational_efficiency?.processing_time,
        automation_rate: data.operational_efficiency?.automation_rate,
        throughput: data.operational_efficiency?.throughput,
        error_rate: data.operational_efficiency?.error_rate,
        historical_data: data.operational_efficiency?.historical_data,
      },
      system_health: {
        cpu_usage: data.system_health?.cpu_usage,
        memory_usage: data.system_health?.memory_usage,
        disk_usage: data.system_health?.disk_usage,
        network_usage: data.system_health?.network_usage,
        service_status: data.system_health?.service_status,
      },
      compliance_metrics: {
        compliance_rate: data.compliance_metrics?.compliance_rate,
        violations_count: data.compliance_metrics?.violations_count,
        violations_trend: data.compliance_metrics?.violations_trend,
        compliance_score: data.compliance_metrics?.compliance_score,
      },
      ml_performance: {
        ensemble_model: data.ml_performance?.ensemble_model,
        individual_models: data.ml_performance?.individual_models,
        prediction_metrics: data.ml_performance?.prediction_metrics,
        feature_importance: data.ml_performance?.feature_importance,
      },
      timestamp: data.timestamp || new Date().toISOString(),
    };

    // Log validation errors if any
    if (validationErrors.length > 0 && process.env.NODE_ENV === "development") {
      console.warn("[transformExecutiveDashboardData] Validation errors in:", validationErrors.join(', '));
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.debug("[transformExecutiveDashboardData] Transformed data:", {
        banking_kpis_total_assets: transformed.banking_kpis.total_assets,
        banking_kpis_total_deposits: transformed.banking_kpis.total_deposits,
        banking_kpis_total_loans: transformed.banking_kpis.total_loans,
        banking_kpis_net_income: transformed.banking_kpis.net_income,
        portfolio_health_overall_score: transformed.portfolio_health.overall_score,
        revenue_metrics_total_revenue: transformed.revenue_metrics.total_revenue,
        banking_kpis_object: transformed.banking_kpis,
        validation_errors: validationErrors,
      });
    }

    return transformed;
  } catch (error) {
    console.error("[transformExecutiveDashboardData] Error transforming data:", error);
    if (process.env.NODE_ENV === "development") {
      console.error("[transformExecutiveDashboardData] Error stack:", (error as Error).stack);
    }
    return null;
  }
}



