/**
 * Unit Tests for Validation Utilities
 */

import { z } from 'zod';
import { ethiopianPhoneSchema, ethiopianIdSchema } from '@/lib/utils/validation';

describe('Ethiopian Phone Validation', () => {
  it('should validate correct phone number with +251 prefix', () => {
    const result = ethiopianPhoneSchema.safeParse('+251912345678');
    expect(result.success).toBe(true);
  });

  it('should validate correct phone number with 0 prefix', () => {
    const result = ethiopianPhoneSchema.safeParse('0912345678');
    expect(result.success).toBe(true);
  });

  it('should reject phone number with wrong prefix', () => {
    const result = ethiopianPhoneSchema.safeParse('+1234567890');
    expect(result.success).toBe(false);
  });

  it('should reject phone number with wrong length', () => {
    const result = ethiopianPhoneSchema.safeParse('+25112345');
    expect(result.success).toBe(false);
  });

  it('should reject phone number with letters', () => {
    const result = ethiopianPhoneSchema.safeParse('+25191234567a');
    expect(result.success).toBe(false);
  });
});

describe('Ethiopian ID Validation', () => {
  it('should validate correct 10-digit ID number', () => {
    const result = ethiopianIdSchema.safeParse('1234567890');
    expect(result.success).toBe(true);
  });

  it('should reject ID number with wrong length', () => {
    const result = ethiopianIdSchema.safeParse('123456789');
    expect(result.success).toBe(false);
  });

  it('should reject ID number with letters', () => {
    const result = ethiopianIdSchema.safeParse('123456789a');
    expect(result.success).toBe(false);
  });

  it('should reject empty ID number', () => {
    const result = ethiopianIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});




