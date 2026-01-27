/**
 * Batch CSV Validation Utility
 * Validates CSV data for credit scoring batch processing
 */

import { CSVParseResult, CSVParseError } from './csvParser';
import { ethiopianPhoneSchema, ethiopianIdSchema } from './validation';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRows: number;
  invalidRows: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// Required fields for credit scoring
const REQUIRED_FIELDS = ['customer_id'];
const OPTIONAL_FIELDS = [
  'loan_amount',
  'loan_term_months',
  'monthly_income',
  'monthly_expenses',
  'savings_balance',
  'checking_balance',
  'total_debt',
  'credit_utilization_ratio',
  'credit_history_length',
  'number_of_credit_accounts',
  'payment_history_score',
  'number_of_late_payments',
  'number_of_defaults',
  'employment_status',
  'years_employed',
  'age',
  'phone_number',
  'id_number',
  'region',
  'urban_rural',
];

/**
 * Validate parsed CSV data
 */
export function validateBatchCSV(parseResult: CSVParseResult): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let validRows = 0;
  let invalidRows = 0;

  // Check for required fields in header
  const missingRequiredFields = REQUIRED_FIELDS.filter(
    field => !parseResult.meta.fields.includes(field)
  );

  if (missingRequiredFields.length > 0) {
    errors.push({
      row: 0,
      field: 'header',
      message: `Missing required columns: ${missingRequiredFields.join(', ')}`,
    });
  }

  // Validate each row
  parseResult.data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because header is row 1, and index is 0-based
    const rowErrors: ValidationError[] = [];
    const rowWarnings: ValidationWarning[] = [];

    // Validate required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        rowErrors.push({
          row: rowNumber,
          field,
          message: `Required field '${field}' is missing or empty`,
          value: row[field],
        });
      }
    });

    // Validate customer_id format
    if (row.customer_id) {
      const customerId = String(row.customer_id).trim();
      if (customerId.length < 1 || customerId.length > 50) {
        rowErrors.push({
          row: rowNumber,
          field: 'customer_id',
          message: 'Customer ID must be between 1 and 50 characters',
          value: customerId,
        });
      }
    }

    // Validate phone number format (if provided)
    if (row.phone_number) {
      const phone = String(row.phone_number).trim();
      try {
        ethiopianPhoneSchema.parse(phone);
      } catch {
        rowErrors.push({
          row: rowNumber,
          field: 'phone_number',
          message: 'Invalid Ethiopian phone number format. Expected: +251XXXXXXXXX or 0XXXXXXXXX',
          value: phone,
        });
      }
    }

    // Validate ID number format (if provided)
    if (row.id_number) {
      const idNumber = String(row.id_number).trim();
      try {
        ethiopianIdSchema.parse(idNumber);
      } catch {
        rowErrors.push({
          row: rowNumber,
          field: 'id_number',
          message: 'Invalid Ethiopian ID number format. Expected: 10 digits',
          value: idNumber,
        });
      }
    }

    // Validate numeric fields
    const numericFields = [
      'loan_amount', 'loan_term_months', 'monthly_income', 'monthly_expenses',
      'savings_balance', 'checking_balance', 'total_debt', 'credit_utilization_ratio',
      'credit_history_length', 'number_of_credit_accounts', 'payment_history_score',
      'number_of_late_payments', 'number_of_defaults', 'years_employed', 'age',
    ];

    numericFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        const value = String(row[field]).trim();
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          rowErrors.push({
            row: rowNumber,
            field,
            message: `Field '${field}' must be a valid number`,
            value: row[field],
          });
        } else {
          // Validate ranges
          if (field === 'loan_amount' && (numValue < 1000 || numValue > 5000000)) {
            rowWarnings.push({
              row: rowNumber,
              field,
              message: `Loan amount ${numValue} is outside NBE limits (1,000 - 5,000,000 ETB)`,
              value: numValue,
            });
          }
          if (field === 'loan_term_months' && (numValue < 1 || numValue > 60)) {
            rowErrors.push({
              row: rowNumber,
              field,
              message: `Loan term ${numValue} is outside NBE limits (1 - 60 months)`,
              value: numValue,
            });
          }
          if (field === 'credit_utilization_ratio' && (numValue < 0 || numValue > 100)) {
            rowErrors.push({
              row: rowNumber,
              field,
              message: `Credit utilization ratio must be between 0 and 100`,
              value: numValue,
            });
          }
          if (field === 'payment_history_score' && (numValue < 0 || numValue > 100)) {
            rowErrors.push({
              row: rowNumber,
              field,
              message: `Payment history score must be between 0 and 100`,
              value: numValue,
            });
          }
          if (field === 'age' && (numValue < 18 || numValue > 100)) {
            rowErrors.push({
              row: rowNumber,
              field,
              message: `Age must be between 18 and 100`,
              value: numValue,
            });
          }
        }
      }
    });

    // Validate enum fields
    if (row.employment_status) {
      const validStatuses = ['employed', 'self_employed', 'unemployed', 'retired'];
      if (!validStatuses.includes(String(row.employment_status).toLowerCase())) {
        rowErrors.push({
          row: rowNumber,
          field: 'employment_status',
          message: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}`,
          value: row.employment_status,
        });
      }
    }

    if (row.urban_rural) {
      const validTypes = ['urban', 'rural'];
      if (!validTypes.includes(String(row.urban_rural).toLowerCase())) {
        rowErrors.push({
          row: rowNumber,
          field: 'urban_rural',
          message: `Invalid location type. Must be one of: ${validTypes.join(', ')}`,
          value: row.urban_rural,
        });
      }
    }

    // Validate 1/3 salary rule if both loan_amount and monthly_income are provided
    if (row.loan_amount && row.monthly_income && row.loan_term_months) {
      const loanAmount = parseFloat(String(row.loan_amount));
      const monthlyIncome = parseFloat(String(row.monthly_income));
      const loanTerm = parseFloat(String(row.loan_term_months));

      if (!isNaN(loanAmount) && !isNaN(monthlyIncome) && !isNaN(loanTerm) && loanTerm > 0) {
        const maxAffordablePayment = monthlyIncome * (1 / 3);
        const proposedPayment = loanAmount / loanTerm;

        if (proposedPayment > maxAffordablePayment) {
          rowErrors.push({
            row: rowNumber,
            field: 'loan_amount',
            message: `Loan payment (${proposedPayment.toFixed(2)} ETB) exceeds 1/3 of monthly income (${maxAffordablePayment.toFixed(2)} ETB) - NBE compliance violation`,
            value: loanAmount,
          });
        }
      }
    }

    if (rowErrors.length === 0) {
      validRows++;
    } else {
      invalidRows++;
      errors.push(...rowErrors);
    }

    warnings.push(...rowWarnings);
  });

  // Add parse errors
  parseResult.errors.forEach(error => {
    errors.push({
      row: error.row,
      field: error.field || 'unknown',
      message: error.message,
      value: error.value,
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validRows,
    invalidRows,
  };
}

/**
 * Get validation summary message
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts: string[] = [];
  
  parts.push(`Total rows: ${result.validRows + result.invalidRows}`);
  parts.push(`Valid: ${result.validRows}`);
  parts.push(`Invalid: ${result.invalidRows}`);
  
  if (result.errors.length > 0) {
    parts.push(`Errors: ${result.errors.length}`);
  }
  
  if (result.warnings.length > 0) {
    parts.push(`Warnings: ${result.warnings.length}`);
  }

  return parts.join(' | ');
}

