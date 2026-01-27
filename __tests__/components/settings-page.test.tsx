/**
 * Unit Tests for Settings Page
 * Tests role-based permissions, MFA confirmation, versioning, import/export
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '@/app/(dashboard)/settings/page';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/lib/auth/auth-context');
jest.mock('@/hooks/use-toast');
jest.mock('@/lib/api/hooks/useSettings');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseSettings = require('@/lib/api/hooks/useSettings').useSettings as jest.Mock;
const mockUseUpdateSettings = require('@/lib/api/hooks/useSettings').useUpdateSettings as jest.Mock;
const mockUseResetSettings = require('@/lib/api/hooks/useSettings').useResetSettings as jest.Mock;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
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

describe('Settings Page', () => {
  const mockToast = jest.fn();
  
  beforeEach(() => {
    mockUseToast.mockReturnValue({
      toast: mockToast,
    });
    
    mockUseSettings.mockReturnValue({
      data: {
        system: { auto_refresh_interval: 300, theme: 'system' },
        api: { api_timeout: 10000, cache_enabled: true },
        security: { session_timeout: 60, require_mfa: false },
        notifications: { notification_enabled: true },
        version: 'v1.0.0',
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    mockUseUpdateSettings.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
    
    mockUseResetSettings.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Role-based Permissions', () => {
    it('should show read-only badge for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'user', email: 'user@test.com', name: 'User', roles: ['read_only'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      expect(screen.getByText('Read Only')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeDisabled();
    });

    it('should allow editing for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      expect(screen.queryByText('Read Only')).not.toBeInTheDocument();
      expect(screen.getByText('Save Changes')).not.toBeDisabled();
    });
  });

  describe('MFA Toggle', () => {
    it('should show confirmation dialog when enabling MFA', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      const mfaSwitch = screen.getByLabelText(/require multi-factor authentication/i);
      fireEvent.click(mfaSwitch);

      await waitFor(() => {
        expect(screen.getByText(/enable multi-factor authentication/i)).toBeInTheDocument();
      });
    });
  });

  describe('Version Display', () => {
    it('should display current version badge', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });

  describe('Import/Export', () => {
    it('should show export button', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should open import dialog when import button is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/import settings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quiet Hours Validation', () => {
    it('should show validation error for overlapping quiet hours', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      // Enable quiet hours
      const quietHoursSwitch = screen.getByLabelText(/enable quiet hours/i);
      fireEvent.click(quietHoursSwitch);

      await waitFor(() => {
        const startInput = screen.getByLabelText(/start time/i);
        const endInput = screen.getByLabelText(/end time/i);
        
        fireEvent.change(startInput, { target: { value: '22:00' } });
        fireEvent.change(endInput, { target: { value: '22:30' } }); // Too close
        
        // Validation should trigger
        expect(screen.getByText(/too close together/i)).toBeInTheDocument();
      });
    });
  });

  describe('Test Notification Channels', () => {
    it('should show test buttons for notification channels', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', username: 'admin', email: 'admin@test.com', name: 'Admin', roles: ['admin'] },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<SettingsPage />);
      
      // Enable quiet hours to show test buttons
      const quietHoursSwitch = screen.getByLabelText(/enable quiet hours/i);
      fireEvent.click(quietHoursSwitch);

      await waitFor(() => {
        expect(screen.getByText(/test email/i)).toBeInTheDocument();
        expect(screen.getByText(/test sms/i)).toBeInTheDocument();
        expect(screen.getByText(/test push/i)).toBeInTheDocument();
      });
    });
  });
});



