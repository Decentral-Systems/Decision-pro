/**
 * Unit Tests for Admin Audit Logs Page
 * Tests correlation-ID search, sorting, pagination, export, saved filters
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditLogsPage from '@/app/(dashboard)/admin/audit-logs/page';
import { useAuditLogs } from '@/lib/api/hooks/useAuditLogs';
import { useAuth } from '@/lib/auth/auth-context';

jest.mock('@/lib/api/hooks/useAuditLogs');
jest.mock('@/lib/auth/auth-context');

const mockUseAuditLogs = useAuditLogs as jest.MockedFunction<typeof useAuditLogs>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Admin Audit Logs Page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'admin-user',
        username: 'admin',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['admin'],
      },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    mockUseAuditLogs.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            timestamp: '2024-01-01T00:00:00Z',
            user_id: 'user1',
            username: 'testuser',
            action: 'credit_score_viewed',
            resource_type: 'credit_score',
            resource_id: 'score123',
            status: 'success',
            ip_address: '192.168.1.1',
            details: { correlation_id: 'corr_123456' },
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Correlation-ID Search', () => {
    it('should have correlation-ID filter input', () => {
      renderWithProviders(<AuditLogsPage />);
      
      const filtersButton = screen.getByText(/filters/i);
      fireEvent.click(filtersButton);

      expect(screen.getByPlaceholderText(/search by correlation id/i)).toBeInTheDocument();
    });
  });

  describe('Sortable Columns', () => {
    it('should have sortable column headers', () => {
      renderWithProviders(<AuditLogsPage />);
      
      expect(screen.getByText(/timestamp/i)).toBeInTheDocument();
      expect(screen.getByText(/action/i)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls when data exists', () => {
      renderWithProviders(<AuditLogsPage />);
      
      // Pagination should be rendered by the table component
      expect(screen.getByText(/total.*log entry/i)).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should have export buttons', () => {
      renderWithProviders(<AuditLogsPage />);
      
      expect(screen.getByText(/export csv/i)).toBeInTheDocument();
      expect(screen.getByText(/export pdf/i)).toBeInTheDocument();
    });
  });

  describe('Saved Filters', () => {
    it('should allow saving current filters', async () => {
      renderWithProviders(<AuditLogsPage />);
      
      const filtersButton = screen.getByText(/filters/i);
      fireEvent.click(filtersButton);

      // Set a filter
      const correlationInput = screen.getByPlaceholderText(/search by correlation id/i);
      fireEvent.change(correlationInput, { target: { value: 'corr_123' } });

      // Save filter
      const saveButton = screen.getByText(/save filter/i);
      fireEvent.click(saveButton);

      // Mock prompt
      window.prompt = jest.fn().mockReturnValue('My Filter');

      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalled();
      });
    });
  });

  describe('Spike Alerts', () => {
    it('should detect and display spike alerts', async () => {
      // Mock high activity data
      mockUseAuditLogs.mockReturnValue({
        data: {
          items: Array(150).fill({
            timestamp: new Date().toISOString(),
            user_id: 'user1',
            action: 'test_action',
            status: 'success',
          }),
          total: 150,
          page: 1,
          page_size: 20,
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<AuditLogsPage />);

      await waitFor(() => {
        // Spike alert should be detected
        expect(screen.queryByText(/high activity detected/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});



