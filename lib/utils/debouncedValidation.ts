/**
 * Debounced Validation Utilities
 * Provides debounced validation for real-time form feedback
 */

import { useEffect, useState } from "react";

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number = 100): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced validation
 */
export function useDebouncedValidation<T>(
  value: T,
  validator: (value: T) => { valid: boolean; error?: string },
  delay: number = 100
): { valid: boolean; error?: string; isValidating: boolean } {
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string }>({
    valid: true,
  });
  const [isValidating, setIsValidating] = useState(false);
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (debouncedValue !== undefined && debouncedValue !== null && debouncedValue !== "") {
      setIsValidating(true);
      const result = validator(debouncedValue);
      setValidationResult(result);
      setIsValidating(false);
    } else {
      setValidationResult({ valid: true });
      setIsValidating(false);
    }
  }, [debouncedValue, validator]);

  return { ...validationResult, isValidating };
}

/**
 * Debounce function for callbacks
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook for field-level validation with debouncing
 */
export function useFieldValidation<T>(
  value: T,
  validator: (value: T) => { valid: boolean; error?: string },
  options: { debounceMs?: number; validateOnMount?: boolean } = {}
) {
  const { debounceMs = 100, validateOnMount = false } = options;
  const [hasBlurred, setHasBlurred] = useState(false);
  const debouncedValue = useDebounce(value, debounceMs);
  const validation = useDebouncedValidation(debouncedValue, validator, 0);

  // Only show validation after user has interacted with field
  const shouldShowValidation = hasBlurred || validateOnMount;
  const showError = shouldShowValidation && !validation.valid && !validation.isValidating;

  return {
    ...validation,
    showError,
    onBlur: () => setHasBlurred(true),
    onFocus: () => setHasBlurred(false),
  };
}
