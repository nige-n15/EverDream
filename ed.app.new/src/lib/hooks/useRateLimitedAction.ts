/**
 * useDebouncedCallback & useRateLimitedAction — Custom React Hooks
 *
 * Debounces a callback function by a specified delay.
 * Useful for rate-limiting API calls from UI buttons.
 *
 * @example
 * ```tsx
 * const handleAnalyze = useDebouncedCallback(async (text: string) => {
 *   const result = await analyzeDream(text);
 *   setAnalysis(result);
 * }, 2000);
 *
 * <button onClick={() => handleAnalyze(dreamText)}>Analyze Dream</button>
 * ```
 *
 * @example
 * ```tsx
 * const { execute, isLoading, error, retry, canRetry } = useRateLimitedAction(
 *   async (text) => analyzeDream(text),
 *   { maxCalls: 5, windowMs: 30000 }
 * );
 * ```
 */
import { useCallback, useRef, useEffect, useState } from 'react';

// ── useDebouncedCallback ──────────────────────────────────────

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 2000
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// ── useRateLimitedAction ──────────────────────────────────────

export interface RateLimitOptions {
  maxCalls?: number;
  windowMs?: number;
}

export interface RateLimitedActionState {
  isLoading: boolean;
  error: string | null;
  canRetry: boolean;
  callCount: number;
}

export function useRateLimitedAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: RateLimitOptions = {}
) {
  const { maxCalls = 5, windowMs = 30000 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);
  const [callCount, setCallCount] = useState(0);

  const callTimestamps = useRef<number[]>([]);
  const lastArgs = useRef<Parameters<T> | null>(null);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      const now = Date.now();

      // Clean old timestamps
      callTimestamps.current = callTimestamps.current.filter(
        (t) => now - t < windowMs
      );

      // Check rate limit
      if (callTimestamps.current.length >= maxCalls) {
        const waitTime = Math.ceil(
          (windowMs - (now - callTimestamps.current[0])) / 1000
        );
        setError(`Rate limit exceeded. Please wait ${waitTime}s before trying again.`);
        setCanRetry(true);
        return null;
      }

      // Record this call
      callTimestamps.current.push(now);
      setCallCount(callTimestamps.current.length);
      lastArgs.current = args;

      setIsLoading(true);
      setError(null);
      setCanRetry(false);

      try {
        const result = await action(...args);
        setIsLoading(false);
        setCanRetry(false);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        setIsLoading(false);
        setCanRetry(true);
        return null;
      }
    },
    [action, maxCalls, windowMs]
  );

  const retry = useCallback(() => {
    if (lastArgs.current && canRetry) {
      execute(...lastArgs.current);
    }
  }, [canRetry, execute]);

  return { execute, isLoading, error, retry, canRetry, callCount };
}
