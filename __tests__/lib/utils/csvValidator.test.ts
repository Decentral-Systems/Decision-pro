/**
 * Unit Tests for CSV Validator
 */

import { validateCSVFile, parseCSVFile } from '@/lib/utils/csvValidator';

describe('validateCSVFile', () => {
  it('should validate a correct CSV file', async () => {
    const csvContent = 'customer_id,monthly_income,loan_amount\nCUST001,5000,10000\nCUST002,6000,15000';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const result = await validateCSVFile(file);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.rowCount).toBe(2);
    expect(result.headers).toContain('customer_id');
  });

  it('should detect missing required fields', async () => {
    const csvContent = 'name,email\nJohn,john@example.com';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const result = await validateCSVFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('customer_id'))).toBe(true);
  });

  it('should detect empty file', async () => {
    const file = new File([], 'empty.csv', { type: 'text/csv' });

    const result = await validateCSVFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('empty'))).toBe(true);
  });

  it('should detect inconsistent column counts', async () => {
    const csvContent = 'customer_id,monthly_income\nCUST001,5000,extra\nCUST002,6000';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const result = await validateCSVFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about large batch sizes', async () => {
    const headers = 'customer_id,monthly_income,loan_amount\n';
    const rows = Array.from({ length: 10001 }, (_, i) => `CUST${i},5000,10000`).join('\n');
    const csvContent = headers + rows;
    const file = new File([csvContent], 'large.csv', { type: 'text/csv' });

    const result = await validateCSVFile(file);

    expect(result.warnings.some(w => w.includes('Large batch'))).toBe(true);
  });
});

describe('parseCSVFile', () => {
  it('should parse a valid CSV file correctly', async () => {
    const csvContent = 'customer_id,monthly_income,loan_amount\nCUST001,5000,10000\nCUST002,6000,15000';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const result = await parseCSVFile(file);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      customer_id: 'CUST001',
      monthly_income: '5000',
      loan_amount: '10000',
    });
  });

  it('should handle quoted values with commas', async () => {
    const csvContent = 'customer_id,name\nCUST001,"John, Doe"';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const result = await parseCSVFile(file);

    expect(result[0].name).toBe('John, Doe');
  });

  it('should return empty array for empty file', async () => {
    const file = new File([''], 'empty.csv', { type: 'text/csv' });

    const result = await parseCSVFile(file);

    expect(result).toEqual([]);
  });
});




