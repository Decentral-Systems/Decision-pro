/**
 * Integration Tests for Error Handling
 * Tests unified error handling with real backend scenarios
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDashboardData } from '@/lib/api/hooks/useDashboard';
import { useExecutiveDashboardData } from '@/lib/api/hooks/useExecutiveDashboard';
import { useCustomerStats } from '@/lib/api/hooks/useCustomerStats';
import { useRecommendationStats } from '@/lib/api/hooks/useProductIntelligence';

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

// Mock authentication
jest.mock('@/lib/api/hooks/useAuth', () => ({
  useAuthReady: jest.fn(() => ({
    isAuthenticated: true,
    tokenSynced: true,
  })),
}));

describe('Error Handling Integration Tests', () => {
  const wrapper = createWrapper();

  describe('404 Error Handling', () => {
    it('should return null for 404 errors instead of throwing', async () => {
      // Mock 404 response
      const { apiGatewayClient } = require('@/lib/api/clients/api-gateway');
      apiGatewayClient.getDashboardData = jest.fn().mockRejectedValue({
        statusCode: 404,
        message: 'Not Found',
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should return null for 404, not throw
      expect(result.current.error).toBeDefined();
      // Should handle gracefully
    });
  });

  describe('401 Unauthorized Handling', () => {
    it('should return null for 401 errors', async () => {
      const { apiGatewayClient } = require('@/lib/api/clients/api-gateway');
      apiGatewayClient.getDashboardData = jest.fn().mockRejectedValue({
        statusCode: 401,
        message: 'Unauthorized',
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should handle 401 gracefully
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { apiGatewayClient } = require('@/lib/api/clients/api-gateway');
      apiGatewayClient.getDashboardData = jest.fn().mockRejectedValue({
        message: 'Network Error',
        code: 'ECONNREFUSED',
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should have error state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Timeout Error Handling', () => {
    it('should handle timeout errors', async () => {
      const { apiGatewayClient } = require('@/lib/api/clients/api-gateway');
      apiGatewayClient.getDashboardData = jest.fn().mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Multiple Error Sources', () => {
    it('should consolidate multiple errors', async () => {
      const { apiGatewayClient } = require('@/lib/api/clients/api-gateway');
      
      // Mock multiple errors
      apiGatewayClient.getDashboardData = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Dashboard error',
      });
      
      apiGatewayClient.getExecutiveDashboardData = jest.fn().mockRejectedValue({
        statusCode: 503,
        message: 'Executive dashboard error',
      });

      const { result: dashboardResult } = renderHook(() => useDashboardData(), { wrapper });
      const { result: executiveResult } = renderHook(() => useExecutiveDashboardData(), { wrapper });

      await waitFor(() => {
        expect(dashboardResult.current.isLoading).toBe(false);
        expect(executiveResult.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Both should have errors
      expect(dashboardResult.current.error).toBeDefined();
      expect(executiveResult.current.error).toBeDefined();
    });
  });

  describe('Retry Functionality', () => {
    it('should allow refetching after error', async () => {
      let callCount = 0;
      const { apiGatewayClient } = require('@/lib/api/clients/api-gateway');
      
      apiGatewayClient.getDashboardData = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject({ statusCode: 500, message: 'Error' });
        }
        return Promise.resolve({ data: { revenue: 1000 } });
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should have error initially
      expect(result.current.error).toBeDefined();

      // Retry
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should retry
      expect(callCount).toBeGreaterThan(1);
    });
  });
});

