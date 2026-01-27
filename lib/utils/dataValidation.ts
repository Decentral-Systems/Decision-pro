/**
 * Data Validation Utilities
 * Provides comprehensive data validation for payments and other financial data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number; // 0-100
  quality: number; // 0-100
}

export interface ValidationOptions {
  required?: string[];
  min?: Record<string, number>;
  max?: Record<string, number>;
  patterns?: Record<string, RegExp>;
  customValidators?: Record<string, (value: any) => string | null>;
}

/**
 * Validate payment data
 */
export function validatePaymentData(
  data: Record<string, any>,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const required = options.required || [];
  const min = options.min || {};
  const max = options.max || {};
  const patterns = options.patterns || {};
  const customValidators = options.customValidators || {};

  // Check required fields
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  // Check minimum values
  for (const [field, minValue] of Object.entries(min)) {
    if (data[field] !== undefined && data[field] !== null) {
      const numValue = Number(data[field]);
      if (isNaN(numValue) || numValue < minValue) {
        errors.push(`Field '${field}' must be at least ${minValue}`);
      }
    }
  }

  // Check maximum values
  for (const [field, maxValue] of Object.entries(max)) {
    if (data[field] !== undefined && data[field] !== null) {
      const numValue = Number(data[field]);
      if (isNaN(numValue) || numValue > maxValue) {
        errors.push(`Field '${field}' must be at most ${maxValue}`);
      }
    }
  }

  // Check patterns
  for (const [field, pattern] of Object.entries(patterns)) {
    if (data[field] !== undefined && data[field] !== null) {
      const strValue = String(data[field]);
      if (!pattern.test(strValue)) {
        errors.push(`Field '${field}' does not match required format`);
      }
    }
  }

  // Custom validators
  for (const [field, validator] of Object.entries(customValidators)) {
    if (data[field] !== undefined && data[field] !== null) {
      const error = validator(data[field]);
      if (error) {
        errors.push(error);
      }
    }
  }

  // Calculate completeness
  const allFields = new Set([
    ...required,
    ...Object.keys(min),
    ...Object.keys(max),
    ...Object.keys(patterns),
    ...Object.keys(customValidators),
  ]);
  const filledFields = Array.from(allFields).filter(
    (field) => data[field] !== undefined && data[field] !== null && data[field] !== ""
  ).length;
  const completeness = allFields.size > 0 ? (filledFields / allFields.size) * 100 : 100;

  // Calculate quality score (based on errors and warnings)
  const totalChecks = errors.length + warnings.length;
  const quality = totalChecks === 0 ? 100 : Math.max(0, 100 - (errors.length * 10) - (warnings.length * 5));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completeness,
    quality,
  };
}

/**
 * Validate Ethiopian phone number
 */
export function validateEthiopianPhoneNumber(phone: string): boolean {
  // Ethiopian phone number pattern: +251XXXXXXXXX or 0XXXXXXXXX
  const pattern = /^(\+251|0)[0-9]{9}$/;
  return pattern.test(phone);
}

/**
 * Validate Ethiopian ID number
 */
export function validateEthiopianID(id: string): boolean {
  // Ethiopian ID number pattern: 10 digits
  const pattern = /^[0-9]{10}$/;
  return pattern.test(id);
}

/**
 * Validate ETB currency amount
 */
export function validateETBAmount(amount: number | string): boolean {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount >= 0 && numAmount <= 1000000000; // Max 1 billion ETB
}

/**
 * Validate loan amount against 1/3 salary rule
 */
export function validateLoanAffordability(
  loanAmount: number,
  monthlyIncome: number,
  loanTermMonths: number
): { isValid: boolean; maxAffordable: number; monthlyPayment: number; message: string } {
  const monthlyPayment = loanAmount / loanTermMonths;
  const maxAffordablePayment = monthlyIncome / 3;
  const maxAffordableLoan = maxAffordablePayment * loanTermMonths;

  const isValid = monthlyPayment <= maxAffordablePayment;

  return {
    isValid,
    maxAffordable: maxAffordableLoan,
    monthlyPayment,
    message: isValid
      ? "Loan amount is within affordability limits"
      : `Loan payment (${monthlyPayment.toFixed(2)} ETB) exceeds 1/3 of monthly income (${maxAffordablePayment.toFixed(2)} ETB)`,
  };
}

/**
 * Check data completeness
 */
export function checkDataCompleteness(
  data: Record<string, any>,
  requiredFields: string[]
): { percentage: number; missing: string[]; complete: string[] } {
  const missing: string[] = [];
  const complete: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missing.push(field);
    } else {
      complete.push(field);
    }
  }

  const percentage = requiredFields.length > 0
    ? (complete.length / requiredFields.length) * 100
    : 100;

  return {
    percentage,
    missing,
    complete,
  };
}

/**
 * Detect data anomalies
 */
export function detectAnomalies(
  data: Record<string, any>,
  expectedRanges: Record<string, { min: number; max: number }>
): string[] {
  const anomalies: string[] = [];

  for (const [field, range] of Object.entries(expectedRanges)) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = Number(data[field]);
      if (!isNaN(value)) {
        if (value < range.min || value > range.max) {
          anomalies.push(
            `Field '${field}' (${value}) is outside expected range [${range.min}, ${range.max}]`
          );
        }
      }
    }
  }

  return anomalies;
}

