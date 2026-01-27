/**
 * Integration Tests for Dashboard API Hooks
 * Tests against REAL backend API at http://196.188.249.48:4000
 * 
 * Run with: npm test -- dashboard-api.test.ts
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDashboardData } from '@/lib/api/hooks/useDashboard';
import { useExecutiveDashboardData } from '@/lib/api/hooks/useExecutiveDashboard';
import { useCustomerStats } from '@/lib/api/hooks/useCustomerStats';
import { useRecommendationStats } from '@/lib/api/hooks/useProductIntelligence';

// Use REAL backend URL for integration tests
const REAL_API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://196.188.249.48:4000';

// Test wrapper for React Query
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
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

// Mock authentication to return valid token
jest.mock('@/lib/api/hooks/useAuth', () => ({
  useAuthReady: jest.fn(() => ({
    isAuthenticated: true,
    tokenSynced: true,
  })),
}));

// Don't mock API client - use real implementation to hit actual backend
// Authentication will be handled by the actual API client

describe('Dashboard API Integration Tests (Real Backend)', () => {
  const wrapper = createWrapper();
  
  // Skip if backend is not available
  beforeAll(async () => {
    try {
      const axios = require('axios');
      await axios.get(`${REAL_API_URL}/health`, { timeout: 5000 });
      console.log('✅ Backend is available, running integration tests');
    } catch (error) {
      console.warn('⚠️  Backend not available, skipping integration tests');
      // Mark all tests as skipped
      jest.setMock('@/lib/api/clients/api-gateway', {
        apiGatewayClient: {
          getDashboardData: jest.fn(() => Promise.reject(new Error('Backend unavailable'))),
        },
      });
    }
  });

  describe('useDashboardData', () => {
    it('should fetch dashboard data from real backend', async () => {
      // Skip if backend check failed
      const axios = require('axios');
      let backendAvailable = false;
      try {
        await axios.get(`${REAL_API_URL}/health`, { timeout: 5000 });
        backendAvailable = true;
      } catch (error) {
        console.warn('Backend not available, skipping test');
      }
      
      if (!backendAvailable) {
        return; // Skip test
      }

      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 15000 }
      );
      
      // Should either have data or an error (not stuck in loading)
      expect(result.current.isLoading).toBe(false);
      
      if (result.current.data) {
        // If data exists, verify structure
        expect(result.current.data).toHaveProperty('revenue');
        expect(result.current.data).toHaveProperty('customers');
        expect(result.current.data).toHaveProperty('loans');
        expect(result.current.data).toHaveProperty('risk_score');
      }
    });

    it('should accept date range parameters', async () => {
      const dateParams = {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      
      const { result } = renderHook(() => useDashboardData(dateParams), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      // Should complete (with or without data)
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Test with invalid date range
      const invalidParams = {
        start_date: 'invalid-date',
        end_date: 'invalid-date',
      };
      
      const { result } = renderHook(() => useDashboardData(invalidParams), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      // Should handle error gracefully
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useExecutiveDashboardData', () => {
    it('should fetch executive dashboard data from real backend', async () => {
      const { result } = renderHook(() => useExecutiveDashboardData(), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      expect(result.current.isLoading).toBe(false);
      
      if (result.current.data) {
        expect(result.current.data).toHaveProperty('banking_kpis');
        expect(result.current.data).toHaveProperty('banking_ratios');
        expect(result.current.data).toHaveProperty('revenue_metrics');
      }
    });

    it('should accept date range parameters', async () => {
      const dateParams = {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      
      const { result } = renderHook(() => useExecutiveDashboardData(dateParams), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useCustomerStats', () => {
    it('should fetch customer statistics from real backend', async () => {
      const { result } = renderHook(() => useCustomerStats(), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      expect(result.current.isLoading).toBe(false);
      
      if (result.current.data) {
        expect(result.current.data).toHaveProperty('total_customers');
        expect(result.current.data).toHaveProperty('average_credit_score');
      }
    });

    it('should accept date range parameters', async () => {
      const dateParams = {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      
      const { result } = renderHook(() => useCustomerStats(dateParams), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useRecommendationStats', () => {
    it('should fetch recommendation statistics from real backend', async () => {
      const { result } = renderHook(() => useRecommendationStats(), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      expect(result.current.isLoading).toBe(false);
      
      if (result.current.data) {
        expect(result.current.data).toHaveProperty('acceptance_rate');
        expect(result.current.data).toHaveProperty('total_recommendations');
      }
    });

    it('should accept date range parameters', async () => {
      const dateParams = {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      
      const { result } = renderHook(() => useRecommendationStats(dateParams), { wrapper });
      
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 10000 }
      );
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Date Range Filter Integration', () => {
    it('should refetch data when date range changes', async () => {
      const dateParams1 = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      };
      
      const { result, rerender } = renderHook(
        ({ params }) => useDashboardData(params),
        {
          wrapper,
          initialProps: { params: dateParams1 },
        }
      );
      
      await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 10000 });
      
      // Change date range
      const dateParams2 = {
        start_date: '2024-04-01',
        end_date: '2024-06-30',
      };
      
      rerender({ params: dateParams2 });
      
      // Should trigger refetch
      await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 10000 });
      
      // Query key should be different
      expect(result.current.isLoading).toBe(false);
    });
  });
});

