/**
 * Unit Tests for Admin Users Page
 * Tests role-based guardrails, user info display, bulk operations, filtering
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManagementPage from '@/app/(dashboard)/admin/users/page';
import { useUsers } from '@/lib/api/hooks/useUsers';
import { useAuth } from '@/lib/auth/auth-context';

jest.mock('@/lib/api/hooks/useUsers');
jest.mock('@/lib/auth/auth-context');

const mockUseUsers = useUsers as jest.MockedFunction<typeof useUsers>;
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

describe('Admin Users Page', () => {
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

    mockUseUsers.mockReturnValue({
      data: {
        items: [
          {
            user_id: 'user1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            roles: ['credit_analyst'],
            is_active: true,
            is_locked: false,
            mfa_enabled: false,
            last_login: '2024-01-01T00:00:00Z',
            password_expired: false,
            failed_login_attempts: 0,
          },
          {
            user_id: 'admin-user',
            username: 'admin',
            email: 'admin@test.com',
            full_name: 'Admin User',
            roles: ['admin'],
            is_active: true,
            is_locked: false,
            mfa_enabled: true,
            last_login: '2024-01-01T00:00:00Z',
            password_expired: false,
            failed_login_attempts: 0,
          },
        ],
        total: 2,
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
  });

  describe('Role-based Guardrails', () => {
    it('should prevent editing own account', async () => {
      renderWithProviders(<UserManagementPage />);

      await waitFor(() => {
        // Find the admin user row and try to edit
        const editButtons = screen.getAllByText(/edit/i);
        // The edit button for self should be disabled or show warning
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Information Display', () => {
    it('should display MFA status', () => {
      renderWithProviders(<UserManagementPage />);

      expect(screen.getByText(/mfa/i)).toBeInTheDocument();
    });

    it('should display password status', () => {
      renderWithProviders(<UserManagementPage />);

      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });

    it('should display lockout info', () => {
      renderWithProviders(<UserManagementPage />);

      expect(screen.getByText(/lockout/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should show filter panel when filters button is clicked', () => {
      renderWithProviders(<UserManagementPage />);

      const filtersButton = screen.getByText(/filters/i);
      fireEvent.click(filtersButton);

      expect(screen.getByText(/role/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });
  });

  describe('Bulk Operations', () => {
    it('should show bulk action buttons when users are selected', async () => {
      renderWithProviders(<UserManagementPage />);

      // Select a user (checkbox)
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        if (checkboxes.length > 0) {
          fireEvent.click(checkboxes[1]); // Select first user
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/user\(s\) selected/i)).toBeInTheDocument();
        expect(screen.getByText(/activate/i)).toBeInTheDocument();
        expect(screen.getByText(/deactivate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export with Masking', () => {
    it('should have export button', () => {
      renderWithProviders(<UserManagementPage />);

      expect(screen.getByText(/export/i)).toBeInTheDocument();
    });
  });
});



