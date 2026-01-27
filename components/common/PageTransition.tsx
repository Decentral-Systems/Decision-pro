"use client";

import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition Component
 * 
 * COMPLETELY DISABLED: No wrapper div, just returns children directly.
 * This ensures absolutely no interference with clicks or pointer events.
 * 
 * The previous implementation with opacity transitions and wrapper divs
 * was causing clicks to be blocked across the entire application.
 */
export function PageTransition({ children }: PageTransitionProps) {
  // Return children directly - no wrapper, no transitions, no interference
  return <>{children}</>;
}
