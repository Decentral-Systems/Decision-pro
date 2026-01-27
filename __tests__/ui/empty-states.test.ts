/**
 * UI Tests - Empty States
 * Tests empty state components and scenarios
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/common/EmptyState';

describe('Empty States Tests', () => {
  describe('No Data Scenarios', () => {
    it('should render empty state for no customers', () => {
      render(
        <EmptyState
          title="No customers found"
          message="Try adjusting your search or filters"
          actionLabel="Clear Filters"
        />
      );
      
      expect(screen.getByText('No customers found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });

    it('should render empty state for no dashboard data', () => {
      render(
        <EmptyState
          title="No dashboard data"
          message="Data will appear here once available"
        />
      );
      
      expect(screen.getByText('No dashboard data')).toBeInTheDocument();
    });

    it('should render empty state with action button', () => {
      const mockAction = jest.fn();
      render(
        <EmptyState
          title="No data"
          message="Click to refresh"
          actionLabel="Refresh"
          onAction={mockAction}
        />
      );
      
      const button = screen.getByText('Refresh');
      expect(button).toBeInTheDocument();
      
      button.click();
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('API Unavailable Scenarios', () => {
    it('should render error state when API is unavailable', () => {
      render(
        <EmptyState
          title="Service Unavailable"
          message="Unable to connect to the server. Please try again later."
          variant="error"
        />
      );
      
      expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please try again later.')).toBeInTheDocument();
    });

    it('should show retry button when API fails', () => {
      const mockRetry = jest.fn();
      render(
        <EmptyState
          title="Connection Error"
          message="Failed to load data"
          actionLabel="Retry"
          onAction={mockRetry}
          variant="error"
        />
      );
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      retryButton.click();
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Empty Search Results', () => {
    it('should render "No results" message for empty search', () => {
      render(
        <EmptyState
          title="No results found"
          message="Try a different search term"
        />
      );
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });

    it('should show clear search option', () => {
      const mockClear = jest.fn();
      render(
        <EmptyState
          title="No results"
          message="Clear your search to see all items"
          actionLabel="Clear Search"
          onAction={mockClear}
        />
      );
      
      const clearButton = screen.getByText('Clear Search');
      expect(clearButton).toBeInTheDocument();
    });
  });
});

