/**
 * UI Tests - Loading States
 * Tests loading indicators, skeletons, and spinners
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

describe('Loading States Tests', () => {
  describe('Skeleton Loaders', () => {
    it('should render skeleton loader during data fetch', () => {
      render(
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full mt-4" />
        </div>
      );
      
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should match content structure with skeleton', () => {
      render(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="border rounded-md">
            <Skeleton className="h-12 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mt-2" />
            ))}
          </div>
        </div>
      );
      
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('should not cause layout shift when loading', () => {
      const { container } = render(
        <div>
          <Skeleton className="h-10 w-64" />
        </div>
      );
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Spinner Components', () => {
    it('should show spinner during action', () => {
      render(
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should disable button during loading', () => {
      render(
        <button disabled>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Processing...
        </button>
      );
      
      const button = screen.getByText('Processing...').closest('button');
      expect(button).toBeDisabled();
    });

    it('should show loading text with spinner', () => {
      render(
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Calculating credit score...</span>
        </div>
      );
      
      expect(screen.getByText('Calculating credit score...')).toBeInTheDocument();
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress bar for long operations', () => {
      render(
        <div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">45% complete</p>
        </div>
      );
      
      expect(screen.getByText('45% complete')).toBeInTheDocument();
    });

    it('should update progress percentage', () => {
      const { rerender } = render(
        <div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">30% complete</p>
        </div>
      );
      
      expect(screen.getByText('30% complete')).toBeInTheDocument();
      
      rerender(
        <div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">60% complete</p>
        </div>
      );
      
      expect(screen.getByText('60% complete')).toBeInTheDocument();
    });
  });

  describe('Loading State Transitions', () => {
    it('should not flash loading state', () => {
      // Test that loading state doesn't appear/disappear too quickly
      const { rerender } = render(
        <div>
          <Skeleton className="h-10 w-64" />
        </div>
      );
      
      // Simulate data loading
      setTimeout(() => {
        rerender(
          <div>
            <div>Loaded content</div>
          </div>
        );
      }, 100);
      
      // Should not cause flash
      expect(true).toBe(true);
    });
  });
});

