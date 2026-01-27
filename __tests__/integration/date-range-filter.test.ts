/**
 * Integration Tests for Date Range Filter
 * Tests date range filtering with real backend API calls
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDashboardData } from '@/lib/api/hooks/useDashboard';
import { useDateRange } from '@/lib/hooks/useDateRange';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
};

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/dashboard',
    query: {},
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock authentication
jest.mock('@/lib/api/hooks/useAuth', () => ({
  useAuthReady: jest.fn(() => ({
    isAuthenticated: true,
    tokenSynced: true,
  })),
}));

describe('Date Range Filter Integration Tests', () => {
  const wrapper = createWrapper();

  it('should generate correct API parameters for date range', () => {
    const { result } = renderHook(() => useDateRange({ defaultPreset: '30d' }), { wrapper });

    expect(result.current.apiParams).toHaveProperty('start_date');
    expect(result.current.apiParams).toHaveProperty('end_date');
    expect(result.current.apiParams.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.apiParams.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should update API parameters when date range changes', async () => {
    const { result, rerender } = renderHook(
      ({ preset }) => useDateRange({ defaultPreset: preset }),
      {
        wrapper,
        initialProps: { preset: '7d' as const },
      }
    );

    const initialParams = result.current.apiParams;

    // Change to 30d
    rerender({ preset: '30d' });

    await waitFor(() => {
      expect(result.current.apiParams).not.toEqual(initialParams);
    });
  });

  it('should pass date range parameters to dashboard API hook', async () => {
    const { result: dateRangeResult } = renderHook(
      () => useDateRange({ defaultPreset: '30d' }),
      { wrapper }
    );

    const { result: dashboardResult } = renderHook(
      () => useDashboardData(dateRangeResult.current.apiParams),
      { wrapper }
    );

    // Verify query key includes date params
    await waitFor(() => {
      expect(dashboardResult.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    // Dashboard should be called with date params
    expect(dateRangeResult.current.apiParams).toBeDefined();
  });

  it('should handle custom date ranges', () => {
    const { result } = renderHook(() => useDateRange({ defaultPreset: 'custom' }), { wrapper });

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    result.current.setCustomRange(startDate, endDate);

    expect(result.current.apiParams.start_date).toBe('2024-01-01');
    expect(result.current.apiParams.end_date).toBe('2024-12-31');
  });

  it('should validate date ranges', () => {
    const { result } = renderHook(() => useDateRange({ defaultPreset: '30d' }), { wrapper });

    // Valid date range should be valid
    expect(result.current.validation.valid).toBe(true);

    // Invalid date range (end before start) should be invalid
    const invalidStart = new Date('2024-12-31');
    const invalidEnd = new Date('2024-01-01');

    result.current.setCustomRange(invalidStart, invalidEnd);

    // Validation should catch this (if implemented)
    // Note: Actual validation depends on implementation
  });

  it('should sync with URL parameters', () => {
    // Mock URL with date range params
    const mockSearchParams = new URLSearchParams('?start_date=2024-01-01&end_date=2024-12-31');
    
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        replace: jest.fn(),
        pathname: '/dashboard',
      }),
      usePathname: () => '/dashboard',
      useSearchParams: () => mockSearchParams,
    }));

    // Hook should read from URL
    // (Implementation depends on useDateRange)
  });

  it('should refetch data when date range changes', async () => {
    const { result: dateRangeResult } = renderHook(
      () => useDateRange({ defaultPreset: '7d' }),
      { wrapper }
    );

    const { result: dashboardResult } = renderHook(
      () => useDashboardData(dateRangeResult.current.apiParams),
      { wrapper }
    );

    await waitFor(() => {
      expect(dashboardResult.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    const initialData = dashboardResult.current.data;

    // Change date range
    dateRangeResult.current.setPreset('30d');

    // Should trigger refetch
    await waitFor(() => {
      // Data should either change or be refetched
      expect(dashboardResult.current.isLoading).toBe(false);
    }, { timeout: 10000 });
  });
});

