/**
 * CSV Parser Utility
 * Proper CSV parsing with validation using PapaParse or fallback
 */

export interface CSVParseResult {
  data: Record<string, any>[];
  errors: CSVParseError[];
  meta: {
    fields: string[];
    rowCount: number;
  };
}

export interface CSVParseError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

/**
 * Parse CSV file with proper handling of quoted fields, commas, etc.
 */
export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseCSVText(text);
        resolve(result);
      } catch (error: any) {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV text with proper handling
 */
function parseCSVText(text: string): CSVParseResult {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return {
      data: [],
      errors: [],
      meta: { fields: [], rowCount: 0 },
    };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const fields = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  const data: Record<string, any>[] = [];
  const errors: CSVParseError[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const values = parseCSVLine(line);
      if (values.length !== headers.length) {
        errors.push({
          row: i + 1,
          message: `Column count mismatch: expected ${headers.length}, got ${values.length}`,
        });
        continue;
      }

      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        const fieldName = fields[index];
        const value = values[index]?.trim() || '';
        row[fieldName] = value;
      });

      data.push(row);
    } catch (error: any) {
      errors.push({
        row: i + 1,
        message: `Failed to parse row: ${error.message}`,
      });
    }
  }

  return {
    data,
    errors,
    meta: {
      fields,
      rowCount: data.length,
    },
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

