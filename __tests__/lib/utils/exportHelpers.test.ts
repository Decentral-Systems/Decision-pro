/**
 * Unit Tests for Export Helpers
 */

import { exportToCSV, generateBatchResultsPDF } from '@/lib/utils/exportHelpers';

// Mock window methods
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();
const mockClick = jest.fn();
const mockCreateElement = jest.fn(() => ({
  click: mockClick,
  href: '',
  download: '',
}));

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  global.document.createElement = mockCreateElement as any;
  global.console.warn = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('exportToCSV', () => {
  it('should export data to CSV', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];
    
    exportToCSV(data, 'test');

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should handle values with commas', () => {
    const data = [
      { name: 'John, Doe', age: 30 },
    ];
    
    exportToCSV(data, 'test');

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should handle values with quotes', () => {
    const data = [
      { name: 'John "Johnny" Doe', age: 30 },
    ];
    
    exportToCSV(data, 'test');

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should handle empty data array', () => {
    exportToCSV([], 'test');

    expect(global.console.warn).toHaveBeenCalledWith('No data to export');
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
  });

  it('should use custom headers when provided', () => {
    const data = [
      { name: 'John', age: 30 },
    ];
    const headers = { name: 'Full Name', age: 'Age' };
    
    exportToCSV(data, 'test', headers);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});

describe('generateBatchResultsPDF', () => {
  it('should generate PDF HTML content', () => {
    const results = [
      {
        customer_id: 'CUST001',
        success: true,
        credit_score: 750,
        risk_category: 'low',
        approval_recommendation: 'approve',
      },
    ];
    const summary = {
      total: 1,
      successful: 1,
      failed: 0,
    };

    const html = generateBatchResultsPDF(results, summary);

    expect(html).toContain('Batch Credit Scoring Results');
    expect(html).toContain('CUST001');
    expect(html).toContain('Total: 1');
    expect(html).toContain('Successful: 1');
  });

  it('should limit results to 100 for PDF', () => {
    const results = Array.from({ length: 150 }, (_, i) => ({
      customer_id: `CUST${i}`,
      success: true,
      credit_score: 750,
      risk_category: 'low' as const,
      approval_recommendation: 'approve' as const,
    }));
    const summary = {
      total: 150,
      successful: 150,
      failed: 0,
    };

    const html = generateBatchResultsPDF(results, summary);

    expect(html).toContain('Showing first 100 results');
    expect(html).toContain('Total: 150');
  });
});




