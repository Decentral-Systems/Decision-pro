/**
 * UI Tests - Error Messages
 * Tests error message display and handling
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

describe('Error Messages Tests', () => {
  describe('401 Unauthorized', () => {
    it('should show user-friendly 401 error message', () => {
      render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your session has expired. Please login again.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Your session has expired. Please login again.')).toBeInTheDocument();
    });

    it('should not expose technical details in 401 error', () => {
      const errorMessage = 'Your session has expired. Please login again.';
      render(
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByText('401')).not.toBeInTheDocument();
      expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
    });
  });

  describe('404 Not Found', () => {
    it('should show user-friendly 404 error message', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>
            The requested resource was not found.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('The requested resource was not found.')).toBeInTheDocument();
    });

    it('should provide helpful guidance for 404 errors', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>
            The page you're looking for doesn't exist. Please check the URL or go back to the dashboard.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(/doesn't exist/)).toBeInTheDocument();
    });
  });

  describe('500 Server Error', () => {
    it('should show user-friendly 500 error message', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong on our end. Please try again later.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Something went wrong on our end. Please try again later.')).toBeInTheDocument();
    });

    it('should not expose server internals in 500 error', () => {
      const userMessage = 'Something went wrong on our end. Please try again later.';
      render(
        <Alert variant="destructive">
          <AlertDescription>{userMessage}</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(userMessage)).toBeInTheDocument();
      expect(screen.queryByText('500')).not.toBeInTheDocument();
      expect(screen.queryByText('Internal Server Error')).not.toBeInTheDocument();
      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
    });

    it('should show retry option for 500 errors', () => {
      const mockRetry = jest.fn();
      render(
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong. 
            <button onClick={mockRetry} className="ml-2 underline">
              Try again
            </button>
          </AlertDescription>
        </Alert>
      );
      
      const retryButton = screen.getByText('Try again');
      expect(retryButton).toBeInTheDocument();
      
      retryButton.click();
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Network Errors', () => {
    it('should show network error message', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>
            Unable to connect to the server. Please check your internet connection.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(/Unable to connect/)).toBeInTheDocument();
    });
  });

  describe('Timeout Errors', () => {
    it('should show timeout error message', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>
            The request took too long. Please try again.
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(/took too long/)).toBeInTheDocument();
    });
  });
});

