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
    min_loan_amount: 1000,
    max_loan_amount: 5000000,
    max_loan_term_months: 60,
    min_interest_rate: 0.12,
    max_interest_rate: 0.25,
    salary_rule_ratio: 1 / 3,
    grace_period_days: 30,
    late_fee_percentage: 0.02,
  };

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

    if (
      proposedPayment > maxAffordablePayment * 0.9 &&
      proposedPayment <= maxAffordablePayment
    ) {
      warnings.push({
        rule: "1/3 salary rule",
        description: "Monthly payment is close to the 1/3 salary limit",
        recommendation:
          "Consider reducing the loan amount or extending the term to provide more buffer",
      });
    }

    if (loanTermMonths > 48) {
      warnings.push({
        rule: "Long loan term",
        description: "Loan term exceeds 4 years",
        recommendation:
          "Longer terms may increase default risk. Consider shorter terms if possible",
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  calculateCompliantInterestRate(
    creditScore: number,
    loanAmount: number,
    loanTermMonths: number,
    customerType: "individual" | "business" = "individual"
  ): number {
    let rate = this.rules.min_interest_rate;
    const scoreNormalized = (850 - creditScore) / 550;
    const riskAdjustment =
      scoreNormalized *
      (this.rules.max_interest_rate - this.rules.min_interest_rate) *
      0.6;
    rate += riskAdjustment;

    if (loanAmount > 1000000) rate += 0.02;
    else if (loanAmount < 50000) rate -= 0.01;
    if (loanTermMonths > 36) rate += 0.01;
    if (customerType === "business") rate += 0.01;

    rate = Math.max(rate, this.rules.min_interest_rate);
    rate = Math.min(rate, this.rules.max_interest_rate);
    return Math.round(rate * 10000) / 10000;
  }

  calculateMaxAffordableLoan(
    monthlyIncome: number,
    loanTermMonths: number,
    interestRate?: number
  ): number {
    const maxMonthlyPayment = monthlyIncome * this.rules.salary_rule_ratio;
    if (interestRate === undefined) {
      return maxMonthlyPayment * loanTermMonths;
    }
    const monthlyRate = interestRate / 12;
    const pvFactor =
      (1 - Math.pow(1 + monthlyRate, -loanTermMonths)) / monthlyRate;
    return Math.min(maxMonthlyPayment * pvFactor, this.rules.max_loan_amount);
  }

  calculateGracePeriod(
    loanAmount: number,
    loanTermMonths: number,
    customerType: "individual" | "business" = "individual"
  ): number {
    let gracePeriod = this.rules.grace_period_days;
    if (loanAmount > 1000000) gracePeriod += 7;
    if (loanTermMonths > 36) gracePeriod += 7;
    if (customerType === "business") gracePeriod += 7;
    return gracePeriod;
  }

  calculateLateFee(overdueAmount: number, daysOverdue: number): number {
    if (daysOverdue <= 0 || overdueAmount <= 0) return 0;
    const baseLateFee = overdueAmount * this.rules.late_fee_percentage;
    if (daysOverdue > 30) {
      const additionalDays = daysOverdue - 30;
      const additionalFee =
        overdueAmount * 0.01 * Math.floor(additionalDays / 30);
      return baseLateFee + additionalFee;
    }
    return baseLateFee;
  }

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
    const gracePeriod = this.calculateGracePeriod(
      loanAmount,
      loanTermMonths,
      customerType
    );
    const lateFeeExample = this.calculateLateFee(
      loanAmount / loanTermMonths,
      35
    );
    const maxAffordableLoan = this.calculateMaxAffordableLoan(
      monthlyIncome,
      loanTermMonths,
      interestRate
    );
    const recommendedInterestRate =
      interestRate ??
      this.calculateCompliantInterestRate(
        700,
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

  getRules() {
    return { ...this.rules };
  }
}

export const nbeComplianceValidator = new NBEComplianceValidator();
