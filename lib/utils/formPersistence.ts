/**
 * Form Data Persistence Utilities
 * Saves and restores form data from local storage
 */

const STORAGE_PREFIX = "credit_scoring_form_";
const STORAGE_VERSION = "1.0";

export interface FormPersistenceOptions {
  formId?: string;
  debounceMs?: number;
  maxAge?: number; // Maximum age in milliseconds before clearing
}

/**
 * Save form data to local storage
 */
export function saveFormData<T extends Record<string, any>>(
  data: T,
  options: FormPersistenceOptions = {}
): void {
  try {
    const { formId = "default", maxAge = 24 * 60 * 60 * 1000 } = options; // Default 24 hours
    const key = `${STORAGE_PREFIX}${formId}`;
    
    const storageData = {
      version: STORAGE_VERSION,
      data,
      timestamp: Date.now(),
      maxAge,
    };

    localStorage.setItem(key, JSON.stringify(storageData));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.warn("Failed to save form data to local storage:", error);
  }
}

/**
 * Load form data from local storage
 */
export function loadFormData<T extends Record<string, any>>(
  formId: string = "default"
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const key = `${STORAGE_PREFIX}${formId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const storageData = JSON.parse(stored);

    // Check version compatibility
    if (storageData.version !== STORAGE_VERSION) {
      clearFormData(formId);
      return null;
    }

    // Check if data is expired
    const age = Date.now() - storageData.timestamp;
    if (age > (storageData.maxAge || 24 * 60 * 60 * 1000)) {
      clearFormData(formId);
      return null;
    }

    return storageData.data as T;
  } catch (error) {
    console.warn("Failed to load form data from local storage:", error);
    return null;
  }
}

/**
 * Clear form data from local storage
 */
export function clearFormData(formId: string = "default"): void {
  try {
    const key = `${STORAGE_PREFIX}${formId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to clear form data from local storage:", error);
  }
}

/**
 * Clear all form data (for cleanup)
 */
export function clearAllFormData(): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to clear all form data:", error);
  }
}

/**
 * React hook for form persistence
 */
import { useEffect, useCallback, useRef } from "react";
import { debounce } from "./debouncedValidation";

export function useFormPersistence<T extends Record<string, any>>(
  formData: T,
  options: FormPersistenceOptions = {}
) {
  const { formId = "default", debounceMs = 500 } = options;
  const isInitialLoad = useRef(true);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: T) => {
      saveFormData(data, { formId, ...options });
    }, debounceMs),
    [formId, debounceMs]
  );

  // Save form data on change
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    debouncedSave(formData);
  }, [formData, debouncedSave]);

  // Load form data on mount
  const loadData = useCallback(() => {
    return loadFormData<T>(formId);
  }, [formId]);

  // Clear form data
  const clearData = useCallback(() => {
    clearFormData(formId);
  }, [formId]);

  return {
    loadData,
    clearData,
    saveData: (data: T) => saveFormData(data, { formId, ...options }),
  };
}
