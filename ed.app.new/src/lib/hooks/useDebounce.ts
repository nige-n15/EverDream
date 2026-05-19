/**
 * useDebounce — Custom React Hook
 *
 * Debounces a value or callback by a specified delay.
 * Used for rate-limiting API call buttons (2-second debounce).
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This only fires 500ms after the user stops typing
 *   fetchResults(debouncedTerm);
 * }, [debouncedTerm]);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value. Returns the debounced value after the delay.
 *
 * @param value — The value to debounce
 * @param delay — Debounce delay in milliseconds (default: 2000ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 2000): T {
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
 * Debounce a callback function. Returns a debounced version of the callback.
 *
 * @param callback — The function to debounce
 * @param delay — Debounce delay in milliseconds (default: 2000ms)
 * @returns The debounced callback, plus a cancel function
 *
 * @example
 * ```tsx
 * const handleAnalyze = useDebouncedCallback(async (text: string) => {
 *   const result = await analyzeDreamWithAI(text);
 *   setAnalysis(result);
 * }, 2000);
 *
 * <button onClick={() => handleAnalyze(dreamText)}>Analyze Dream</button>
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 2000
): [(...args: Parameters<T>) => void, () => void] {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
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

  const debouncedFn = useCallback(
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

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [debouncedFn, cancel];
}

/**
 * Rate limiter hook — prevents a function from being called more than
 * once per specified interval. Useful for API call buttons.
 *
 * @param interval — Minimum interval between calls in ms (default: 2000)
 * @returns A function that wraps any async function with rate limiting
 *
 * @example
 * ```tsx
 * const rateLimitedCall = useRateLimiter(2000);
 *
 * const handleClick = () => {
 *   rateLimitedCall(async () => {
 *     const result = await analyzeDreamWithAI(text);
 *     setAnalysis(result);
 *   });
 * };
 * ```
 */
export function useRateLimiter(interval: number = 2000) {
  const lastCallRef = useRef<number>(0);
  const [isThrottled, setIsThrottled] = useState(false);

  const call = useCallback(
    async (fn: () => Promise<void>) => {
      const now = Date.now();
      const elapsed = now - lastCallRef.current;

      if (elapsed < interval) {
        const waitTime = Math.ceil((interval - elapsed) / 1000);
        console.warn(`[RateLimiter] Please wait ${waitTime}s before trying again`);
        setIsThrottled(true);
        return;
      }

      lastCallRef.current = now;
      setIsThrottled(false);

      try {
        await fn();
      } finally {
        // Keep throttled state for visual feedback
        setTimeout(() => setIsThrottled(false), interval);
      }
    },
    [interval]
  );

  return { call, isThrottled };
}
