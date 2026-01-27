/**
 * Unit Tests for System Status Page
 * Tests metrics charts, dependency graph, auto-refresh, SLA indicators
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SystemStatusPage from '@/app/(dashboard)/system-status/page';
import { useSystemStatus } from '@/lib/api/hooks/useSystemStatus';

jest.mock('@/lib/api/hooks/useSystemStatus');

const mockUseSystemStatus = useSystemStatus as jest.MockedFunction<typeof useSystemStatus>;

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

describe('System Status Page', () => {
  beforeEach(() => {
    mockUseSystemStatus.mockReturnValue({
      data: {
        status: 'healthy',
        services: {
          api_gateway: { status: 'healthy', latency: 45 },
          credit_scoring: { status: 'healthy', latency: 120 },
        },
        dependencies: {
          postgresql: { status: 'healthy', latency: 10 },
          redis: { status: 'healthy', latency: 5 },
        },
        metrics: {
          uptime_percentage: 99.95,
          latency_p95: 150,
          error_rate: 0.05,
          uptime_history: [
            { timestamp: '2024-01-01T00:00:00Z', value: 99.9 },
            { timestamp: '2024-01-01T01:00:00Z', value: 99.95 },
          ],
          latency_history: [
            { timestamp: '2024-01-01T00:00:00Z', p95: 140 },
            { timestamp: '2024-01-01T01:00:00Z', p95: 150 },
          ],
          error_rate_history: [
            { timestamp: '2024-01-01T00:00:00Z', value: 0.1 },
            { timestamp: '2024-01-01T01:00:00Z', value: 0.05 },
          ],
        },
        incidents: [],
        synthetic_checks: [
          { name: 'API Health Check', passed: true, response_time: 45 },
          { name: 'Database Connection', passed: true, response_time: 10 },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SLA Metrics Display', () => {
    it('should display SLA metrics cards', () => {
      renderWithProviders(<SystemStatusPage />);
      
      expect(screen.getByText(/uptime sla/i)).toBeInTheDocument();
      expect(screen.getByText(/latency p95/i)).toBeInTheDocument();
      expect(screen.getByText(/error rate/i)).toBeInTheDocument();
    });

    it('should show SLA status indicators', () => {
      renderWithProviders(<SystemStatusPage />);
      
      // Should show checkmarks for met SLAs
      const checkmarks = screen.getAllByRole('img', { hidden: true });
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-refresh Toggle', () => {
    it('should show auto-refresh toggle', () => {
      renderWithProviders(<SystemStatusPage />);
      
      expect(screen.getByLabelText(/auto-refresh/i)).toBeInTheDocument();
    });

    it('should enable auto-refresh when toggled', async () => {
      renderWithProviders(<SystemStatusPage />);
      
      const toggle = screen.getByLabelText(/auto-refresh/i);
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle).toBeChecked();
      });
    });
  });

  describe('Incident Banner', () => {
    it('should show incident banner when incidents exist', () => {
      mockUseSystemStatus.mockReturnValue({
        data: {
          status: 'degraded',
          incidents: [
            {
              title: 'Service Degradation',
              description: 'High latency detected',
              started_at: '2024-01-01T00:00:00Z',
            },
          ],
          services: {},
          dependencies: {},
          metrics: {},
          synthetic_checks: [],
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<SystemStatusPage />);
      
      expect(screen.getByText(/active incidents/i)).toBeInTheDocument();
      expect(screen.getByText(/service degradation/i)).toBeInTheDocument();
    });
  });

  describe('Synthetic Checks', () => {
    it('should display synthetic check results', () => {
      renderWithProviders(<SystemStatusPage />);
      
      expect(screen.getByText(/synthetic checks/i)).toBeInTheDocument();
      expect(screen.getByText(/api health check/i)).toBeInTheDocument();
      expect(screen.getByText(/database connection/i)).toBeInTheDocument();
    });
  });

  describe('Dependency Graph', () => {
    it('should display dependencies with status badges', () => {
      renderWithProviders(<SystemStatusPage />);
      
      expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
      expect(screen.getByText(/postgresql/i)).toBeInTheDocument();
      expect(screen.getByText(/redis/i)).toBeInTheDocument();
    });
  });
});



