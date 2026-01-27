"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

/**
 * Session Timeout Warning Component
 * 
 * Shows a modal warning when the user's session is about to expire
 * Features:
 * - Countdown timer showing time remaining
 * - "Extend Session" button to refresh the session
 * - "Logout" button to end session immediately
 * - Auto-closes when session is extended
 * 
 * Triggers 5 minutes before session expiry (configured in auth-context)
 */
export function SessionTimeoutWarning() {
  const { showTimeoutWarning, timeoutRemaining, extendSession, logout } = useAuth();
  const [isExtending, setIsExtending] = useState(false);
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine urgency level based on time remaining
  const getUrgencyLevel = (seconds: number): 'warning' | 'critical' => {
    return seconds <= 60 ? 'critical' : 'warning';
  };

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await extendSession();
      // Dialog will auto-close when showTimeoutWarning becomes false
    } catch (error) {
      console.error('[SessionTimeout] Failed to extend session:', error);
      // Let user know extension failed - they may need to re-login
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // CRITICAL: Don't render Dialog at all if warning shouldn't be shown
  // This prevents any overlay from being created in the DOM
  if (!showTimeoutWarning || !timeoutRemaining || timeoutRemaining <= 0) {
    return null;
  }

  const urgencyLevel = getUrgencyLevel(timeoutRemaining);
  const formattedTime = formatTimeRemaining(timeoutRemaining);

  // Only render Dialog when actually needed
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className={cn(
          "sm:max-w-md",
          urgencyLevel === 'critical' && "border-destructive"
        )}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              urgencyLevel === 'critical' ? "text-destructive" : "text-warning"
            )} />
            <DialogTitle>
              {urgencyLevel === 'critical' ? 'Session Expiring Soon!' : 'Session Timeout Warning'}
            </DialogTitle>
          </div>
          <DialogDescription>
            Your session is about to expire due to inactivity. You will be automatically logged out in:
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <Alert className={cn(
            "border-2",
            urgencyLevel === 'critical' ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"
          )}>
            <Clock className={cn(
              "h-5 w-5",
              urgencyLevel === 'critical' ? "text-destructive" : "text-warning"
            )} />
            <AlertDescription className="flex items-center justify-between">
              <span className="font-medium">Time remaining:</span>
              <span className={cn(
                "text-2xl font-bold tabular-nums",
                urgencyLevel === 'critical' ? "text-destructive" : "text-warning"
              )}>
                {formattedTime}
              </span>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground mt-4">
            Click "Extend Session" to continue working, or "Logout" to end your session now.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            Logout
          </Button>
          <Button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            {isExtending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Extend Session
              </>
            )}
          </Button>
        </DialogFooter>

        {urgencyLevel === 'critical' && (
          <div className="text-xs text-center text-muted-foreground mt-2">
            <p className="text-destructive font-medium">
              ⚠️ Less than 1 minute remaining!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Session Timeout Banner Component
 * 
 * Alternative lightweight banner version (for use in header/footer)
 * Can be used alongside or instead of the modal version
 */
export function SessionTimeoutBanner() {
  const { showTimeoutWarning, timeoutRemaining, extendSession } = useAuth();
  const [isExtending, setIsExtending] = useState(false);
  
  if (!showTimeoutWarning) return null;

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await extendSession();
    } catch (error) {
      console.error('[SessionTimeout] Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const urgencyLevel = timeoutRemaining <= 60 ? 'critical' : 'warning';

  return (
    <Alert className={cn(
      "fixed bottom-4 right-4 w-96 shadow-lg z-50",
      urgencyLevel === 'critical' ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"
    )}>
      <AlertTriangle className={cn(
        "h-4 w-4",
        urgencyLevel === 'critical' ? "text-destructive" : "text-warning"
      )} />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">Session expiring in {formatTimeRemaining(timeoutRemaining)}</p>
          <p className="text-xs text-muted-foreground mt-1">Click to extend your session</p>
        </div>
        <Button
          size="sm"
          onClick={handleExtendSession}
          disabled={isExtending}
          className="ml-2"
        >
          {isExtending ? 'Extending...' : 'Extend'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
