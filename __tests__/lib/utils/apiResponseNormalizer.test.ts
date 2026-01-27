/**
 * Unit Tests for API Response Normalizer
 */

import { normalizeApiResponse } from '@/lib/utils/apiResponseNormalizer';

describe('normalizeApiResponse', () => {
  it('should return data directly when response is already the data', () => {
    const data = { id: '123', name: 'Test' };
    const result = normalizeApiResponse(data);
    expect(result).toEqual(data);
  });

  it('should extract data from { success: true, data: T } structure', () => {
    const response = {
      success: true,
      data: { id: '123', name: 'Test' },
    };
    const result = normalizeApiResponse(response);
    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('should extract data from { data: T } structure without success flag', () => {
    const response = {
      data: { id: '123', name: 'Test' },
    };
    const result = normalizeApiResponse(response);
    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('should return null for { success: false } responses', () => {
    const response = {
      success: false,
      error: 'Something went wrong',
    };
    const result = normalizeApiResponse(response);
    expect(result).toBeNull();
  });

  it('should return null for empty response', () => {
    const result = normalizeApiResponse(null);
    expect(result).toBeNull();
  });

  it('should return null for undefined response', () => {
    const result = normalizeApiResponse(undefined);
    expect(result).toBeNull();
  });

  it('should handle arrays', () => {
    const response = {
      success: true,
      data: [{ id: '1' }, { id: '2' }],
    };
    const result = normalizeApiResponse(response);
    expect(result).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('should handle nested structures', () => {
    const response = {
      success: true,
      data: {
        items: [{ id: '1' }],
        total: 1,
      },
    };
    const result = normalizeApiResponse(response);
    expect(result).toEqual({
      items: [{ id: '1' }],
      total: 1,
    });
  });
});




