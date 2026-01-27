/**
 * Customer ID Utility Functions
 * Provides utilities for generating and validating customer IDs
 */

/**
 * Generate a unique customer ID
 * Format: CUST_YYYYMMDD_XXX
 * 
 * @returns A unique customer ID string
 * 
 * @example
 * generateCustomerId() // Returns "CUST_20260109_427"
 */
export function generateCustomerId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CUST_${dateStr}_${random}`;
}

/**
 * Validate customer ID format
 * Allows alphanumeric characters with underscores and hyphens
 * Length must be between 5 and 50 characters
 * 
 * @param customerId - The customer ID to validate
 * @returns True if valid, false otherwise
 * 
 * @example
 * validateCustomerIdFormat("CUST_001") // Returns true
 * validateCustomerIdFormat("AB") // Returns false (too short)
 * validateCustomerIdFormat("CUST@123") // Returns false (invalid character)
 */
export function validateCustomerIdFormat(customerId: string): boolean {
  // Allow alphanumeric with underscores/hyphens, 5-50 chars
  const pattern = /^[A-Za-z0-9_-]{5,50}$/;
  return pattern.test(customerId);
}

/**
 * Format customer ID for display
 * Ensures consistent formatting across the application
 * 
 * @param customerId - The customer ID to format
 * @returns Formatted customer ID (trimmed and uppercase)
 */
export function formatCustomerId(customerId: string): string {
  return customerId.trim().toUpperCase();
}
