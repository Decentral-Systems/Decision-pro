/**
 * CSV Validation Utilities
 * Validates CSV files for batch credit scoring
 */

export interface CSVValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  headers: string[];
  preview: string[][];
}

/**
 * Validate CSV file structure and content
 */
export async function validateCSVFile(file: File): Promise<CSVValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Read file content
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      valid: false,
      errors: ['CSV file is empty'],
      warnings: [],
      rowCount: 0,
      headers: [],
      preview: [],
    };
  }

  // Parse CSV (simple parser - handles quoted values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rowCount = lines.length - 1; // Exclude header

  // Validate headers
  const requiredFields = ['customer_id'];
  const missingRequired = requiredFields.filter(field => !headers.includes(field));
  if (missingRequired.length > 0) {
    errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
  }

  // Check for common credit scoring fields
  const commonFields = [
    'monthly_income',
    'loan_amount',
    'employment_years',
    'age',
    'phone_number',
  ];
  const missingCommon = commonFields.filter(field => !headers.includes(field));
  if (missingCommon.length > 0) {
    warnings.push(`Recommended columns not found: ${missingCommon.join(', ')}`);
  }

  // Validate row count
  if (rowCount === 0) {
    errors.push('No data rows found (only header row)');
  } else if (rowCount > 10000) {
    warnings.push(`Large batch detected (${rowCount} rows). Processing may take several minutes.`);
  }

  // Preview first few rows (max 5)
  const preview: string[][] = [];
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length !== headers.length) {
      errors.push(`Row ${i} has ${row.length} columns but header has ${headers.length} columns`);
    }
    preview.push(row);
  }

  // Check all rows have consistent column count
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length !== headers.length && !errors.some(e => e.includes(`Row ${i}`))) {
      errors.push(`Row ${i + 1} has inconsistent column count`);
      if (errors.length > 10) break; // Limit error count
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rowCount,
    headers,
    preview: [headers, ...preview],
  };
}

/**
 * Parse CSV file into structured data
 */
export async function parseCSVFile(file: File): Promise<Record<string, any>[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return [];
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}




