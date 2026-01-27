/**
 * Centralized Validation Service
 * Provides unified validation for all form fields and business rules
 */

import { nbeComplianceValidator, NBEComplianceResult } from "@/lib/utils/nbe-compliance";
import { ethiopianPhoneValidator, ethiopianIdValidator } from "@/lib/utils/ethiopianValidators";
import { z } from "zod";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  isValidating?: boolean;
}

export interface FieldValidationResult extends ValidationResult {
  field: string;
  value: any;
  timestamp: Date;
}

export interface AffordabilityCalculation {
  maxAffordablePayment: number;
  maxAffordableLoan: number;
  proposedPayment: number;
  affordabilityRatio: number; // proposed / max (should be <= 1)
  isAffordable: boolean;
}

export class ValidationService {
  private validationCache: Map<string, { result: ValidationResult; timestamp: number }> = new Map();
  private readonly cacheTTL = 5000; // 5 seconds cache
  private validationMetrics: {
    totalValidations: number;
    cacheHits: number;
    cacheMisses: number;
    averageValidationTime: number;
  } = {
    totalValidations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageValidationTime: 0,
  };

  /**
   * Validate Ethiopian phone number
   */
  validatePhoneNumber(phone: string): ValidationResult {
    const startTime = performance.now();
    this.validationMetrics.totalValidations++;
    
    const cacheKey = `phone_${phone}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      const duration = performance.now() - startTime;
      this.updateAverageTime(duration);
      return cached;
    }

    try {
      ethiopianPhoneValidator.parse(phone);
      const result = { valid: true };
      this.setCachedResult(cacheKey, result);
      const duration = performance.now() - startTime;
      this.updateAverageTime(duration);
      return result;
    } catch (error: any) {
      const result = {
        valid: false,
        error: error.errors?.[0]?.message || "Invalid Ethiopian phone number format",
      };
      this.setCachedResult(cacheKey, result);
      const duration = performance.now() - startTime;
      this.updateAverageTime(duration);
      return result;
    }
  }

  /**
   * Validate Ethiopian ID number
   */
  validateIdNumber(id: string): ValidationResult {
    const cacheKey = `id_${id}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      ethiopianIdValidator.parse(id);
      const result = { valid: true };
      this.setCachedResult(cacheKey, result);
      return result;
    } catch (error: any) {
      const result = {
        valid: false,
        error: error.errors?.[0]?.message || "Invalid Ethiopian ID number format",
      };
      this.setCachedResult(cacheKey, result);
      return result;
    }
  }

  /**
   * Validate NBE compliance
   */
  validateNBECompliance(
    loanAmount: number,
    monthlyIncome: number,
    loanTermMonths: number,
    monthlyPayment?: number,
    interestRate?: number
  ): NBEComplianceResult {
    return nbeComplianceValidator.validateLoanCompliance(
      loanAmount,
      monthlyIncome,
      loanTermMonths,
      monthlyPayment,
      interestRate
    );
  }

  /**
   * Calculate affordability based on 1/3 salary rule
   */
  calculateAffordability(
    loanAmount: number,
    monthlyIncome: number,
    loanTermMonths: number
  ): AffordabilityCalculation {
    const maxAffordablePayment = monthlyIncome / 3;
    const proposedPayment = loanAmount / loanTermMonths;
    const affordabilityRatio = proposedPayment / maxAffordablePayment;
    const maxAffordableLoan = maxAffordablePayment * loanTermMonths;

    return {
      maxAffordablePayment,
      maxAffordableLoan,
      proposedPayment,
      affordabilityRatio,
      isAffordable: affordabilityRatio <= 1,
    };
  }

  /**
   * Validate loan amount within NBE limits
   */
  validateLoanAmount(amount: number): ValidationResult {
    const min = 1000;
    const max = 5000000;

    if (amount < min) {
      return {
        valid: false,
        error: `Loan amount must be at least ${min.toLocaleString()} ETB`,
      };
    }

    if (amount > max) {
      return {
        valid: false,
        error: `Loan amount cannot exceed ${max.toLocaleString()} ETB`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate loan term within NBE limits
   */
  validateLoanTerm(months: number): ValidationResult {
    const max = 60;

    if (months > max) {
      return {
        valid: false,
        error: `Loan term cannot exceed ${max} months`,
      };
    }

    if (months < 1) {
      return {
        valid: false,
        error: "Loan term must be at least 1 month",
      };
    }

    return { valid: true };
  }

  /**
   * Validate monthly income
   */
  validateMonthlyIncome(income: number): ValidationResult {
    if (income <= 0) {
      return {
        valid: false,
        error: "Monthly income must be greater than 0",
      };
    }

    return { valid: true };
  }

  /**
   * Validate multiple fields at once
   */
  validateFields(fields: Record<string, any>): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    if (fields.phone_number) {
      results.phone_number = this.validatePhoneNumber(fields.phone_number);
    }

    if (fields.id_number) {
      results.id_number = this.validateIdNumber(fields.id_number);
    }

    if (fields.loan_amount) {
      results.loan_amount = this.validateLoanAmount(fields.loan_amount);
    }

    if (fields.loan_term_months) {
      results.loan_term_months = this.validateLoanTerm(fields.loan_term_months);
    }

    if (fields.monthly_income) {
      results.monthly_income = this.validateMonthlyIncome(fields.monthly_income);
    }

    // NBE compliance validation if all required fields present
    if (fields.loan_amount && fields.monthly_income && fields.loan_term_months) {
      const compliance = this.validateNBECompliance(
        fields.loan_amount,
        fields.monthly_income,
        fields.loan_term_months
      );
      results.nbe_compliance = {
        valid: compliance.compliant,
        error: compliance.violations.length > 0
          ? compliance.violations.map((v) => v.description).join("; ")
          : undefined,
      };
    }

    return results;
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get cached validation result
   */
  private getCachedResult(key: string): ValidationResult | null {
    const cached = this.validationCache.get(key);
    if (!cached) {
      this.validationMetrics.cacheMisses++;
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.validationCache.delete(key);
      this.validationMetrics.cacheMisses++;
      return null;
    }

    this.validationMetrics.cacheHits++;
    return cached.result;
  }

  /**
   * Get validation performance metrics
   */
  getMetrics() {
    const cacheHitRate =
      this.validationMetrics.totalValidations > 0
        ? (this.validationMetrics.cacheHits / this.validationMetrics.totalValidations) * 100
        : 0;

    return {
      ...this.validationMetrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.validationMetrics = {
      totalValidations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageValidationTime: 0,
    };
  }

  /**
   * Set cached validation result
   */
  private setCachedResult(key: string, result: ValidationResult): void {
    this.validationCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Update average validation time
   */
  private updateAverageTime(duration: number): void {
    const total = this.validationMetrics.totalValidations;
    const currentAvg = this.validationMetrics.averageValidationTime;
    this.validationMetrics.averageValidationTime =
      (currentAvg * (total - 1) + duration) / total;
  }
}

// Singleton instance
export const validationService = new ValidationService();
