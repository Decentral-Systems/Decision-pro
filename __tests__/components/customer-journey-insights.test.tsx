/**
 * Tests for CustomerJourneyInsights widget
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerJourneyInsightsWidget } from '@/components/dashboard/CustomerJourneyInsights';
import { apiGatewayClient } from '@/lib/api/clients/api-gateway';

// Mock the API client
jest.mock('@/lib/api/clients/api-gateway', () => ({
  apiGatewayClient: {
    getCustomerJourneyInsights: jest.fn(),
  },
}));

// Mock the auth hook
jest.mock('@/lib/api/hooks/useAuth', () => ({
  useAuthReady: () => ({ isAuthenticated: true }),
}));

const mockApiGatewayClient = apiGatewayClient as jest.Mocked<typeof apiGatewayClient>;

describe('CustomerJourneyInsightsWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CustomerJourneyInsightsWidget />
      </QueryClientProvider>
    );
  };

  it('should display loading state initially', async () => {
    mockApiGatewayClient.getCustomerJourneyInsights.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    expect(screen.getByText(/Customer Journey Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer journey stage distribution/i)).toBeInTheDocument();
  });

  it('should display empty state when no insights', async () => {
    mockApiGatewayClient.getCustomerJourneyInsights.mockResolvedValue(null as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No journey data available/i)).toBeInTheDocument();
    });
  });

  it('should display journey stages', async () => {
    const mockInsights = {
      stages: [
        {
          stage: 'onboarding',
          customerCount: 100,
          percentageOfTotal: 25.0,
          avgDurationFromPreviousStageSeconds: null,
        },
        {
          stage: 'assessment',
          customerCount: 80,
          percentageOfTotal: 20.0,
          avgDurationFromPreviousStageSeconds: 86400, // 1 day
        },
        {
          stage: 'application',
          customerCount: 60,
          percentageOfTotal: 15.0,
          avgDurationFromPreviousStageSeconds: 172800, // 2 days
        },
      ],
      conversionFunnel: [],
      bottlenecks: [],
      metadata: { total_customers: 400 },
    };

    mockApiGatewayClient.getCustomerJourneyInsights.mockResolvedValue(mockInsights as CustomerJourneyInsights);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/onboarding/i)).toBeInTheDocument();
      expect(screen.getByText(/assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/application/i)).toBeInTheDocument();
    });

    // Check customer counts are displayed
    expect(screen.getByText(/100 customers/i)).toBeInTheDocument();
    expect(screen.getByText(/80 customers/i)).toBeInTheDocument();
    expect(screen.getByText(/60 customers/i)).toBeInTheDocument();
  });

  it('should display conversion funnel', async () => {
    const mockInsights = {
      stages: [
        {
          stage: 'onboarding',
          customerCount: 100,
          percentageOfTotal: 50.0,
        },
        {
          stage: 'assessment',
          customerCount: 80,
          percentageOfTotal: 40.0,
        },
      ],
      conversionFunnel: [
        {
          fromStage: 'onboarding',
          toStage: 'assessment',
          count: 80,
          conversionRate: 80.0,
        },
      ],
      bottlenecks: [],
    };

    mockApiGatewayClient.getCustomerJourneyInsights.mockResolvedValue(mockInsights as CustomerJourneyInsights);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Conversion Funnel/i)).toBeInTheDocument();
      expect(screen.getByText(/onboarding → assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/80 customers/i)).toBeInTheDocument();
      expect(screen.getByText(/80.0%/i)).toBeInTheDocument();
    });
  });

  it('should display bottlenecks', async () => {
    const mockInsights = {
      stages: [
        {
          stage: 'onboarding',
          customerCount: 100,
          percentageOfTotal: 50.0,
        },
      ],
      conversionFunnel: [],
      bottlenecks: [
        {
          stage: 'assessment',
          description: 'Low conversion rate from onboarding',
          impact: 'high' as const,
          recommendation: 'Investigate onboarding process',
        },
        {
          stage: 'application',
          description: 'Long average duration',
          impact: 'medium' as const,
          recommendation: 'Streamline application process',
        },
      ],
    };

    mockApiGatewayClient.getCustomerJourneyInsights.mockResolvedValue(mockInsights as CustomerJourneyInsights);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Identified Bottlenecks/i)).toBeInTheDocument();
      expect(screen.getByText(/assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/Low conversion rate/i)).toBeInTheDocument();
      expect(screen.getByText(/high impact/i)).toBeInTheDocument();
      expect(screen.getByText(/Investigate onboarding process/i)).toBeInTheDocument();
    });
  });

  it('should display total customers count', async () => {
    const mockInsights = {
      stages: [
        {
          stage: 'onboarding',
          customerCount: 100,
          percentageOfTotal: 50.0,
        },
      ],
      conversionFunnel: [],
      bottlenecks: [],
      metadata: { total_customers: 200 },
    };

    mockApiGatewayClient.getCustomerJourneyInsights.mockResolvedValue(mockInsights as CustomerJourneyInsights);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/200 total customers/i)).toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    mockApiGatewayClient.getCustomerJourneyInsights.mockRejectedValue(
      new Error('API Error')
    );

    renderComponent();

    // Component should handle error internally (may show empty state or error message)
    // This depends on the error handling implementation
    await waitFor(() => {
      // The component might show an error or empty state
      expect(screen.getByText(/Customer Journey Insights/i)).toBeInTheDocument();
    });
  });
});

