import { useState, useEffect } from 'react';

/**
 * Hook to check if component is mounted (client-side only)
 * Prevents hydration mismatches by ensuring client-only code runs after mount
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
