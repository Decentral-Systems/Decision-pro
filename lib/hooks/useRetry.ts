/**
 * React Hooks for Retry Operations
 * Provides stateful retry logic for components
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { withRetryResult, RetryOptions } from "@/lib/utils/retry";
import { ErrorHandler } from "@/lib/utils/error-handler";

export interface UseRetryState<T> {
  data: T | null;
  error: unknown | null;
  isLoading: boolean;
  isRetrying: boolean;
  attempts: number;
  lastAttemptTime: Date | null;
}

export interface UseRetryActions<T> {
  execute: () => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
  cancel: () => void;
}

export interface UseRetryOptions extends RetryOptions {
  /** Auto-execute on mount */
  autoExecute?: boolean;
  /** Show toast notifications on error */
  showToast?: boolean;
  /** Callback on success */
  onSuccess?: (data: any) => void;
  /** Callback on error */
  onError?: (error: unknown) => void;
}

/**
 * Hook for executing async operations with retry logic
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, execute, retry } = useRetry(
 *   () => apiClient.fetchData(id),
 *   { maxAttempts: 3, showToast: true }
 * );
 * 
 * return (
 *   <div>
 *     {isLoading && <Spinner />}
 *     {error && <ErrorMessage error={error} onRetry={retry} />}
 *     {data && <DataDisplay data={data} />}
 *   </div>
 * );
 * ```
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryState<T> & UseRetryActions<T> {
  const {
    autoExecute = false,
    showToast = true,
    onSuccess,
    onError,
    ...retryOptions
  } = options;

  const [state, setState] = useState<UseRetryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isRetrying: false,
    attempts: 0,
    lastAttemptTime: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel any previous operation
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      isLoading: true,
      isRetrying: false,
      error: null,
      attempts: 0,
    }));

    const result = await withRetryResult(fn, {
      ...retryOptions,
      abortSignal: abortControllerRef.current.signal,
      onRetry: (error, attempt, delay) => {
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isRetrying: true,
            attempts: attempt,
            lastAttemptTime: new Date(),
          }));
        }
        retryOptions.onRetry?.(error, attempt, delay);
      },
    });

    if (!isMountedRef.current) return null;

    if (result.success) {
      setState({
        data: result.data ?? null,
        error: null,
        isLoading: false,
        isRetrying: false,
        attempts: result.attempts,
        lastAttemptTime: new Date(),
      });
      onSuccess?.(result.data);
      return result.data ?? null;
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error,
        isLoading: false,
        isRetrying: false,
        attempts: result.attempts,
        lastAttemptTime: new Date(),
      }));
      
      if (showToast) {
        ErrorHandler.showError(result.error, {
          showRetry: ErrorHandler.isRetryable(result.error),
        });
      }
      
      onError?.(result.error);
      return null;
    }
  }, [fn, retryOptions, showToast, onSuccess, onError]);

  const retry = useCallback(async (): Promise<T | null> => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
    return execute();
  }, [execute]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRetrying: false,
      attempts: 0,
      lastAttemptTime: null,
    });
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    if (isMountedRef.current) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
      }));
    }
  }, []);

  // Auto-execute on mount if requested
  useEffect(() => {
    if (autoExecute) {
      execute();
    }
  }, [autoExecute]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel,
  };
}

/**
 * Hook for mutations with retry logic
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useRetryMutation(
 *   (data: FormData) => apiClient.submitForm(data),
 *   {
 *     onSuccess: () => toast.success("Form submitted!"),
 *     onError: (error) => console.error(error),
 *   }
 * );
 * 
 * const handleSubmit = async (data: FormData) => {
 *   await mutate(data);
 * };
 * ```
 */
export function useRetryMutation<TData, TArgs>(
  fn: (args: TArgs) => Promise<TData>,
  options: UseRetryOptions = {}
): {
  mutate: (args: TArgs) => Promise<TData | null>;
  data: TData | null;
  error: unknown | null;
  isLoading: boolean;
  isRetrying: boolean;
  attempts: number;
  reset: () => void;
} {
  const {
    showToast = true,
    onSuccess,
    onError,
    ...retryOptions
  } = options;

  const [state, setState] = useState<{
    data: TData | null;
    error: unknown | null;
    isLoading: boolean;
    isRetrying: boolean;
    attempts: number;
  }>({
    data: null,
    error: null,
    isLoading: false,
    isRetrying: false,
    attempts: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const mutate = useCallback(
    async (args: TArgs): Promise<TData | null> => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isRetrying: false,
        error: null,
        attempts: 0,
      }));

      const result = await withRetryResult(() => fn(args), {
        ...retryOptions,
        abortSignal: abortControllerRef.current.signal,
        onRetry: (error, attempt, delay) => {
          if (isMountedRef.current) {
            setState((prev) => ({
              ...prev,
              isRetrying: true,
              attempts: attempt,
            }));
          }
          retryOptions.onRetry?.(error, attempt, delay);
        },
      });

      if (!isMountedRef.current) return null;

      if (result.success) {
        setState({
          data: result.data ?? null,
          error: null,
          isLoading: false,
          isRetrying: false,
          attempts: result.attempts,
        });
        onSuccess?.(result.data);
        return result.data ?? null;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error,
          isLoading: false,
          isRetrying: false,
          attempts: result.attempts,
        }));
        
        if (showToast) {
          ErrorHandler.showError(result.error, {
            showRetry: ErrorHandler.isRetryable(result.error),
          });
        }
        
        onError?.(result.error);
        return null;
      }
    },
    [fn, retryOptions, showToast, onSuccess, onError]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRetrying: false,
      attempts: 0,
    });
  }, []);

  return {
    mutate,
    ...state,
    reset,
  };
}

/**
 * Hook for polling with retry logic
 * 
 * @example
 * ```tsx
 * const { data, isLoading, stop, start } = useRetryPolling(
 *   () => apiClient.fetchStatus(id),
 *   {
 *     interval: 5000,
 *     maxAttempts: 3,
 *     stopCondition: (data) => data.status === "complete",
 *   }
 * );
 * ```
 */
export function useRetryPolling<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions & {
    interval?: number;
    stopCondition?: (data: T) => boolean;
    maxPolls?: number;
  } = {}
): {
  data: T | null;
  error: unknown | null;
  isLoading: boolean;
  isPolling: boolean;
  pollCount: number;
  start: () => void;
  stop: () => void;
} {
  const {
    interval = 5000,
    stopCondition,
    maxPolls = Infinity,
    ...retryOptions
  } = options;

  const [state, setState] = useState<{
    data: T | null;
    error: unknown | null;
    isLoading: boolean;
    isPolling: boolean;
    pollCount: number;
  }>({
    data: null,
    error: null,
    isLoading: false,
    isPolling: false,
    pollCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const poll = useCallback(async () => {
    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      isLoading: true,
    }));

    const result = await withRetryResult(fn, {
      ...retryOptions,
      abortSignal: abortControllerRef.current.signal,
    });

    if (!isMountedRef.current) return;

    if (result.success) {
      const newPollCount = state.pollCount + 1;
      setState((prev) => ({
        ...prev,
        data: result.data ?? null,
        error: null,
        isLoading: false,
        pollCount: newPollCount,
      }));

      // Check stop condition
      if (
        (stopCondition && result.data && stopCondition(result.data)) ||
        newPollCount >= maxPolls
      ) {
        stop();
      }
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error,
        isLoading: false,
      }));
    }
  }, [fn, retryOptions, state.pollCount, stopCondition, maxPolls]);

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState((prev) => ({
      ...prev,
      isPolling: true,
      pollCount: 0,
    }));

    // Initial poll
    poll();

    // Start interval
    intervalRef.current = setInterval(poll, interval);
  }, [poll, interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isPolling: false,
      isLoading: false,
    }));
  }, []);

  return {
    ...state,
    start,
    stop,
  };
}






