/**
 * Ethiopian-Specific Validators
 * Validators for Ethiopian phone numbers, ID numbers, currency, etc.
 */

import { z } from "zod";

/**
 * Ethiopian phone number validator
 * Supports formats: +251XXXXXXXXX or 0XXXXXXXXX
 */
export const ethiopianPhoneValidator = z
  .string()
  .regex(/^(\+251|0)[0-9]{9}$/, {
    message: "Invalid Ethiopian phone number format. Use +251XXXXXXXXX or 0XXXXXXXXX",
  })
  .refine(
    (phone) => {
      // Remove country code and leading zero for validation
      const digits = phone.replace(/^\+251|^0/, "");
      return digits.length === 9 && /^[0-9]{9}$/.test(digits);
    },
    {
      message: "Phone number must have exactly 9 digits after country code",
    }
  );

/**
 * Ethiopian ID number validator (10 digits)
 */
export const ethiopianIdValidator = z
  .string()
  .regex(/^[0-9]{10}$/, {
    message: "Ethiopian ID must be exactly 10 digits",
  })
  .refine(
    (id) => {
      // Basic checksum validation (simplified)
      // In production, implement full ID validation algorithm
      return id.length === 10 && /^[0-9]{10}$/.test(id);
    },
    {
      message: "Invalid Ethiopian ID number format",
    }
  );

/**
 * ETB (Ethiopian Birr) currency formatter
 */
export function formatETB(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00 ETB";
  
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Parse ETB currency string to number
 */
export function parseETB(currencyString: string): number {
  // Remove ETB, commas, and spaces
  const cleaned = currencyString
    .replace(/ETB/gi, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate ETB currency format
 */
export const etbCurrencyValidator = z
  .union([
    z.number().positive("Amount must be positive"),
    z.string().refine(
      (val) => {
        const parsed = parseETB(val);
        return !isNaN(parsed) && parsed > 0;
      },
      {
        message: "Invalid ETB currency format",
      }
    ),
  ])
  .transform((val) => (typeof val === "string" ? parseETB(val) : val));

/**
 * Ethiopian region validator
 */
export const ethiopianRegionValidator = z.enum([
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "SNNP",
  "Tigray",
  "Other",
], {
  errorMap: () => ({
    message: "Invalid Ethiopian region",
  }),
});

/**
 * Ethiopian business sector validator
 */
export const ethiopianBusinessSectorValidator = z.enum([
  "Agriculture",
  "Manufacturing",
  "Services",
  "Technology",
  "Finance",
  "Retail",
  "Construction",
  "Transportation",
  "Healthcare",
  "Education",
  "Tourism",
  "Energy",
  "Other",
], {
  errorMap: () => ({
    message: "Invalid business sector",
  }),
});

/**
 * Validate date range (for Ethiopian calendar compatibility)
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string
): { valid: boolean; error?: string } {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    return { valid: false, error: "Invalid start date" };
  }

  if (isNaN(end.getTime())) {
    return { valid: false, error: "Invalid end date" };
  }

  if (start > end) {
    return { valid: false, error: "Start date must be before end date" };
  }

  // Check if range is within reasonable limits (e.g., not more than 10 years)
  const maxRangeDays = 365 * 10;
  const rangeDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (rangeDays > maxRangeDays) {
    return { valid: false, error: "Date range cannot exceed 10 years" };
  }

  return { valid: true };
}

/**
 * Validate Ethiopian address format
 */
export const ethiopianAddressValidator = z
  .string()
  .min(10, "Address must be at least 10 characters")
  .max(200, "Address cannot exceed 200 characters")
  .refine(
    (address) => {
      // Basic validation - check for common Ethiopian address components
      const lowerAddress = address.toLowerCase();
      const hasCity = /addis|dire|hawassa|bahir|mekelle|gondar|jimma|harar/i.test(lowerAddress);
      const hasStreet = /street|road|avenue|woreda|kebele/i.test(lowerAddress);
      
      // At least one component should be present
      return hasCity || hasStreet || address.length >= 20;
    },
    {
      message: "Address should include city or street information",
    }
  );

/**
 * Cross-field validation: Income vs Expenses
 */
export function validateIncomeExpenses(
  monthlyIncome: number,
  monthlyExpenses: number
): { valid: boolean; error?: string } {
  if (monthlyExpenses > monthlyIncome) {
    return {
      valid: false,
      error: "Monthly expenses cannot exceed monthly income",
    };
  }

  if (monthlyExpenses > monthlyIncome * 0.9) {
    return {
      valid: true,
      error: "Warning: Expenses are very high relative to income (over 90%)",
    };
  }

  return { valid: true };
}

/**
 * Cross-field validation: Loan amount vs Income (NBE 1/3 rule)
 */
export function validateLoanAffordability(
  loanAmount: number,
  monthlyIncome: number,
  loanTermMonths: number,
  existingDebt?: number
): { valid: boolean; error?: string; warning?: string } {
  if (loanTermMonths <= 0) {
    return { valid: false, error: "Loan term must be greater than 0" };
  }

  const monthlyPayment = loanAmount / loanTermMonths;
  const maxAffordablePayment = monthlyIncome * (1 / 3);
  const existingDebtPayment = existingDebt ? existingDebt * 0.1 : 0; // Estimate 10% of debt as monthly payment
  const totalMonthlyObligation = monthlyPayment + existingDebtPayment;

  if (totalMonthlyObligation > maxAffordablePayment) {
    return {
      valid: false,
      error: `Total monthly payment (${totalMonthlyObligation.toFixed(2)} ETB) exceeds 1/3 of monthly income (${maxAffordablePayment.toFixed(2)} ETB) - NBE compliance violation`,
    };
  }

  if (totalMonthlyObligation > maxAffordablePayment * 0.9) {
    return {
      valid: true,
      warning: "Monthly payment is close to the 1/3 salary limit. Consider reducing loan amount or extending term.",
    };
  }

  return { valid: true };
}

/**
 * Cross-field validation: Credit utilization
 */
export function validateCreditUtilization(
  totalDebt: number,
  creditUtilizationRatio: number,
  creditLimit?: number
): { valid: boolean; error?: string; warning?: string } {
  if (creditUtilizationRatio < 0 || creditUtilizationRatio > 100) {
    return {
      valid: false,
      error: "Credit utilization ratio must be between 0 and 100",
    };
  }

  // If credit limit is provided, validate consistency
  if (creditLimit && creditLimit > 0) {
    const calculatedRatio = (totalDebt / creditLimit) * 100;
    const difference = Math.abs(calculatedRatio - creditUtilizationRatio);

    if (difference > 5) {
      return {
        valid: false,
        error: `Credit utilization ratio (${creditUtilizationRatio}%) doesn't match calculated ratio (${calculatedRatio.toFixed(2)}%) based on debt and credit limit`,
      };
    }
  }

  if (creditUtilizationRatio > 80) {
    return {
      valid: true,
      warning: "High credit utilization ratio (>80%) may negatively impact credit score",
    };
  }

  return { valid: true };
}

/**
 * Business rule validation: Employment stability
 */
export function validateEmploymentStability(
  employmentStatus: string,
  yearsEmployed: number,
  monthlyIncome: number
): { valid: boolean; error?: string; warning?: string } {
  if (employmentStatus === "unemployed" && monthlyIncome > 0) {
    return {
      valid: false,
      error: "Cannot have monthly income if employment status is unemployed",
    };
  }

  if (employmentStatus === "employed" && yearsEmployed < 0) {
    return {
      valid: false,
      error: "Years employed must be non-negative for employed status",
    };
  }

  if (employmentStatus === "employed" && yearsEmployed < 0.5) {
    return {
      valid: true,
      warning: "Very short employment tenure (<6 months) may impact credit assessment",
    };
  }

  return { valid: true };
}

/**
 * Business rule validation: Age and employment
 */
export function validateAgeEmployment(
  age: number,
  employmentStatus: string,
  yearsEmployed: number
): { valid: boolean; error?: string } {
  if (age < 18) {
    return { valid: false, error: "Age must be at least 18 years" };
  }

  if (age > 100) {
    return { valid: false, error: "Age cannot exceed 100 years" };
  }

  // Validate employment years don't exceed reasonable limits
  if (yearsEmployed > age - 18) {
    return {
      valid: false,
      error: "Years employed cannot exceed age minus 18",
    };
  }

  // Validate retirement age
  if (employmentStatus === "retired" && age < 55) {
    return {
      valid: false,
      error: "Retirement status typically requires age 55 or older",
    };
  }

  return { valid: true };
}

