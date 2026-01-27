/**
 * NBE (National Bank of Ethiopia) Compliance Validator
 * Implements regulatory compliance rules for loan applications
 */

export interface NBEComplianceResult {
  compliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: ComplianceRecommendations;
}

export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: "error" | "warning";
  max_allowed?: number;
  min_required?: number;
  proposed?: number;
}

export interface ComplianceWarning {
  rule: string;
  description: string;
  recommendation: string;
}

export interface ComplianceRecommendations {
  max_loan_amount?: number;
  max_loan_term?: number;
  suggested_interest_rate?: number;
  max_monthly_payment?: number;
}

export class NBEComplianceValidator {
  private readonly rules = {
    min_loan_amount: 1000, // 1,000 ETB minimum
    max_loan_amount: 5000000, // 5,000,000 ETB maximum
    max_loan_term_months: 60, // 60 months (5 years) maximum
    min_interest_rate: 0.12, // 12% minimum
    max_interest_rate: 0.25, // 25% maximum
    salary_rule_ratio: 1 / 3, // 1/3 of monthly income
    grace_period_days: 30, // 30 days grace period
    late_fee_percentage: 0.02, // 2% late fee
  };

  /**
   * Validate loan compliance against NBE regulations
   */
  validateLoanCompliance(
    loanAmount: number,
    monthlyIncome: number,
    loanTermMonths: number,
    monthlyPayment?: number,
    interestRate?: number
  ): NBEComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    const recommendations: ComplianceRecommendations = {};

    // 1. Loan amount limits
    if (loanAmount < this.rules.min_loan_amount) {
      violations.push({
        rule: "Minimum loan amount",
        description: `Loan amount (${loanAmount.toLocaleString()} ETB) is below the minimum threshold (${this.rules.min_loan_amount.toLocaleString()} ETB)`,
        severity: "error",
        min_required: this.rules.min_loan_amount,
        proposed: loanAmount,
      });
    }

    if (loanAmount > this.rules.max_loan_amount) {
      violations.push({
        rule: "Maximum loan amount",
        description: `Loan amount (${loanAmount.toLocaleString()} ETB) exceeds the maximum threshold (${this.rules.max_loan_amount.toLocaleString()} ETB)`,
        severity: "error",
        max_allowed: this.rules.max_loan_amount,
        proposed: loanAmount,
      });
    }

    // 2. Loan term limits
    if (loanTermMonths > this.rules.max_loan_term_months) {
      violations.push({
        rule: "Maximum loan term",
        description: `Loan term (${loanTermMonths} months) exceeds the maximum allowed (${this.rules.max_loan_term_months} months)`,
        severity: "error",
        max_allowed: this.rules.max_loan_term_months,
        proposed: loanTermMonths,
      });
      recommendations.max_loan_term = this.rules.max_loan_term_months;
    }

    // 3. 1/3 salary rule validation
    const maxAffordablePayment = monthlyIncome * this.rules.salary_rule_ratio;
    const proposedPayment = monthlyPayment || loanAmount / loanTermMonths;

    if (proposedPayment > maxAffordablePayment) {
      violations.push({
        rule: "1/3 salary rule",
        description: `Proposed monthly payment (${proposedPayment.toLocaleString()} ETB) exceeds 1/3 of monthly income (${maxAffordablePayment.toLocaleString()} ETB)`,
        severity: "error",
        max_allowed: maxAffordablePayment,
        proposed: proposedPayment,
      });
      recommendations.max_monthly_payment = maxAffordablePayment;
      recommendations.max_loan_amount = maxAffordablePayment * loanTermMonths;
    }

    // 4. Interest rate limits (if provided)
    if (interestRate !== undefined) {
      if (interestRate < this.rules.min_interest_rate) {
        violations.push({
          rule: "Minimum interest rate",
          description: `Interest rate (${(interestRate * 100).toFixed(2)}%) is below the minimum threshold (${(this.rules.min_interest_rate * 100).toFixed(2)}%)`,
          severity: "error",
          min_required: this.rules.min_interest_rate,
          proposed: interestRate,
        });
        recommendations.suggested_interest_rate = this.rules.min_interest_rate;
      }

      if (interestRate > this.rules.max_interest_rate) {
        violations.push({
          rule: "Maximum interest rate",
          description: `Interest rate (${(interestRate * 100).toFixed(2)}%) exceeds the maximum threshold (${(this.rules.max_interest_rate * 100).toFixed(2)}%)`,
          severity: "error",
          max_allowed: this.rules.max_interest_rate,
          proposed: interestRate,
        });
        recommendations.suggested_interest_rate = this.rules.max_interest_rate;
      }
    }

    // 5. Warnings for borderline cases
    if (proposedPayment > maxAffordablePayment * 0.9 && proposedPayment <= maxAffordablePayment) {
      warnings.push({
        rule: "1/3 salary rule",
        description: "Monthly payment is close to the 1/3 salary limit",
        recommendation: "Consider reducing the loan amount or extending the term to provide more buffer",
      });
    }

    if (loanTermMonths > 48) {
      warnings.push({
        rule: "Long loan term",
        description: "Loan term exceeds 4 years",
        recommendation: "Longer terms may increase default risk. Consider shorter terms if possible",
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Calculate compliant interest rate based on credit score and loan parameters
   */
  calculateCompliantInterestRate(
    creditScore: number,
    loanAmount: number,
    loanTermMonths: number,
    customerType: "individual" | "business" = "individual"
  ): number {
    // Base rate
    let rate = this.rules.min_interest_rate;

    // Risk adjustment based on credit score (300-850 scale)
    const scoreNormalized = (850 - creditScore) / 550; // 0 to 1 scale
    const riskAdjustment = scoreNormalized * (this.rules.max_interest_rate - this.rules.min_interest_rate) * 0.6;
    rate += riskAdjustment;

    // Loan amount adjustment
    if (loanAmount > 1000000) {
      // Large loans get slightly higher rate
      rate += 0.02;
    } else if (loanAmount < 50000) {
      // Small loans get slightly lower rate
      rate -= 0.01;
    }

    // Term adjustment
    if (loanTermMonths > 36) {
      // Longer terms get slightly higher rate
      rate += 0.01;
    }

    // Customer type adjustment
    if (customerType === "business") {
      rate += 0.01;
    }

    // Ensure within NBE limits
    rate = Math.max(rate, this.rules.min_interest_rate);
    rate = Math.min(rate, this.rules.max_interest_rate);

    return Math.round(rate * 10000) / 10000; // Round to 4 decimal places
  }

  /**
   * Calculate maximum affordable loan amount based on income
   */
  calculateMaxAffordableLoan(
    monthlyIncome: number,
    loanTermMonths: number,
    interestRate?: number
  ): number {
    const maxMonthlyPayment = monthlyIncome * this.rules.salary_rule_ratio;
    
    if (interestRate === undefined) {
      // Simple calculation without interest
      return maxMonthlyPayment * loanTermMonths;
    }

    // Calculate with interest using amortization formula
    const monthlyRate = interestRate / 12;
    const numPayments = loanTermMonths;
    
    // Present value of annuity formula
    const pvFactor = (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
    const maxLoanAmount = maxMonthlyPayment * pvFactor;

    // Ensure within NBE limits
    return Math.min(maxLoanAmount, this.rules.max_loan_amount);
  }

  /**
   * Calculate grace period days based on loan parameters
   */
  calculateGracePeriod(
    loanAmount: number,
    loanTermMonths: number,
    customerType: "individual" | "business" = "individual"
  ): number {
    // Base grace period
    let gracePeriod = this.rules.grace_period_days;

    // Adjust based on loan amount
    if (loanAmount > 1000000) {
      gracePeriod += 7; // Additional 7 days for large loans
    }

    // Adjust based on loan term
    if (loanTermMonths > 36) {
      gracePeriod += 7; // Additional 7 days for long-term loans
    }

    // Business loans get additional grace period
    if (customerType === "business") {
      gracePeriod += 7;
    }

    return gracePeriod;
  }

  /**
   * Calculate late fee based on overdue amount and days
   */
  calculateLateFee(
    overdueAmount: number,
    daysOverdue: number
  ): number {
    if (daysOverdue <= 0 || overdueAmount <= 0) {
      return 0;
    }

    // Base late fee percentage
    const baseLateFee = overdueAmount * this.rules.late_fee_percentage;

    // Additional fee for extended overdue periods
    if (daysOverdue > 30) {
      const additionalDays = daysOverdue - 30;
      const additionalFee = overdueAmount * 0.01 * Math.floor(additionalDays / 30); // 1% per additional month
      return baseLateFee + additionalFee;
    }

    return baseLateFee;
  }

  /**
   * Generate comprehensive compliance report
   */
  generateComplianceReport(
    loanAmount: number,
    monthlyIncome: number,
    loanTermMonths: number,
    interestRate?: number,
    monthlyPayment?: number,
    customerType: "individual" | "business" = "individual"
  ): {
    compliance: NBEComplianceResult;
    gracePeriod: number;
    lateFeeExample: number;
    maxAffordableLoan: number;
    recommendedInterestRate: number;
  } {
    const compliance = this.validateLoanCompliance(
      loanAmount,
      monthlyIncome,
      loanTermMonths,
      monthlyPayment,
      interestRate
    );

    const gracePeriod = this.calculateGracePeriod(loanAmount, loanTermMonths, customerType);
    const lateFeeExample = this.calculateLateFee(loanAmount / loanTermMonths, 35); // Example: 35 days overdue
    const maxAffordableLoan = this.calculateMaxAffordableLoan(
      monthlyIncome,
      loanTermMonths,
      interestRate
    );
    const recommendedInterestRate = interestRate || this.calculateCompliantInterestRate(
      700, // Default credit score
      loanAmount,
      loanTermMonths,
      customerType
    );

    return {
      compliance,
      gracePeriod,
      lateFeeExample,
      maxAffordableLoan,
      recommendedInterestRate,
    };
  }

  /**
   * Get NBE rules for display
   */
  getRules() {
    return { ...this.rules };
  }
}

// Singleton instance
export const nbeComplianceValidator = new NBEComplianceValidator();






