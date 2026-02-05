/**
 * Smart Defaults Calculator
 * Calculates default values for form fields based on:
 * 1. Customer 360 data (highest priority)
 * 2. User input from form
 * 3. Calculated values
 * 4. System-provided values
 * 5. Auto-fetched values
 * 6. Fallback defaults (last resort)
 */

import { getFieldMapping } from '@/lib/config/fieldMapping';

export interface SmartDefaultOptions {
  formData: Record<string, any>;
  customerData?: Record<string, any> | null;
  systemData?: Record<string, any>;
  autoFetchedData?: Record<string, any>;
}

/**
 * Calculate smart default for a single field
 */
export function calculateSmartDefault(
  fieldName: string,
  options: SmartDefaultOptions
): { value: any; source: string; warning?: string } {
  const mapping = getFieldMapping(fieldName);
  
  if (!mapping) {
    // No mapping found, return undefined
    return { value: undefined, source: 'none' };
  }

  const { formData, customerData, systemData, autoFetchedData } = options;

  // Priority 1: User input (if already in form data)
  if (formData[fieldName] !== undefined && formData[fieldName] !== null && formData[fieldName] !== '') {
    return { value: formData[fieldName], source: 'user_input' };
  }

  // Priority 2: Customer 360 data
  if (mapping.source === 'customer_360' && customerData) {
    const value = extractNestedValue(customerData, mapping.apiPath);
    if (value !== undefined && value !== null) {
      return { value, source: 'customer_360' };
    }
  }

  // Priority 3: Calculated values
  if (mapping.source === 'calculated' && mapping.calculation) {
    try {
      const value = mapping.calculation(formData, customerData);
      if (value !== undefined && value !== null) {
        return { value, source: 'calculated' };
      }
    } catch (error) {
      console.warn(`Calculation failed for ${fieldName}:`, error);
    }
  }

  // Priority 4: System-provided values
  if (mapping.source === 'system' && systemData) {
    const value = systemData[fieldName];
    if (value !== undefined && value !== null) {
      return { value, source: 'system' };
    }
    
    // Try calculation if available
    if (mapping.calculation) {
      try {
        const value = mapping.calculation(formData, customerData);
        if (value !== undefined && value !== null) {
          return { value, source: 'system_calculated' };
        }
      } catch (error) {
        console.warn(`System calculation failed for ${fieldName}:`, error);
      }
    }
  }

  // Priority 5: Auto-fetched values
  if (mapping.source === 'auto_fetched' && autoFetchedData) {
    const value = autoFetchedData[fieldName];
    if (value !== undefined && value !== null) {
      return { value, source: 'auto_fetched' };
    }
  }

  // Priority 6: Fallback default
  if (mapping.defaultValue !== undefined) {
    const warning = mapping.required 
      ? `Required field ${fieldName} using fallback default value`
      : undefined;
    return { value: mapping.defaultValue, source: 'fallback_default', warning };
  }

  // No value found
  return { value: undefined, source: 'none' };
}

/**
 * Calculate smart defaults for all fields
 */
export function calculateAllSmartDefaults(
  options: SmartDefaultOptions
): Record<string, { value: any; source: string; warning?: string }> {
  const results: Record<string, { value: any; source: string; warning?: string }> = {};
  
  // Get all unique form fields from mappings
  const allFields = new Set<string>();
  Object.keys(options.formData).forEach(field => allFields.add(field));
  
  // Calculate defaults for all mapped fields
  allFields.forEach(field => {
    results[field] = calculateSmartDefault(field, options);
  });

  return results;
}

/**
 * Extract nested value from object using path array
 */
function extractNestedValue(obj: any, path: string[]): any {
  if (!obj || !path || path.length === 0) return undefined;
  
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Get default values object (just values, no metadata)
 */
export function getSmartDefaults(
  options: SmartDefaultOptions
): Record<string, any> {
  const allDefaults = calculateAllSmartDefaults(options);
  const result: Record<string, any> = {};
  
  Object.entries(allDefaults).forEach(([field, { value, source }]) => {
    if (value !== undefined && source !== 'none') {
      result[field] = value;
    }
  });

  return result;
}

/**
 * Log fields using fallback defaults (for monitoring)
 */
export function logFallbackDefaults(
  options: SmartDefaultOptions
): Array<{ field: string; warning: string }> {
  const allDefaults = calculateAllSmartDefaults(options);
  const warnings: Array<{ field: string; warning: string }> = [];
  
  Object.entries(allDefaults).forEach(([field, { source, warning }]) => {
    if (source === 'fallback_default' && warning) {
      warnings.push({ field, warning });
    }
  });

  if (warnings.length > 0) {
    console.warn('Fields using fallback defaults:', warnings);
  }

  return warnings;
}

