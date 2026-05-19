/**
 * useApiCall — Unified API Call Hook with Rate Limiting, Error Handling & Retry
 *
 * Combines the rate limiter, error classifier, and retry logic into a single
 * hook that can be used by any component that triggers API calls.
 *
 * Features:
 * - 2-second rate limiting (prevents accidental double-clicks)
 * - Automatic error classification with user-friendly messages
 * - Automatic retry for retryable errors (up to 2 retries)
 * - Loading / error / success state management
 * - AbortController support for cleanup
 *
 * @example
 * ```tsx
 * const { call, loading, error, retry } = useApiCall();
 *
 * const handleAnalyze = () => {
 *   call(() => analyzeDreamWithAI(dreamText), {
 *     onSuccess: (result) => setAnalysis(result),
 *     onError: (err) => toast(err.message),
 *   });
 * };
 *
 * <button onClick={handleAnalyze} disabled={loading}>
 *   {loading ? 'Analyzing...' : 'Analyze Dream'}
 * </button>
 * {error && <ErrorBanner error={error} onRetry={retry} />}
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import {
  classifyError,
  withRetry,
  type ApiError,
} from '../api/errorHandling';

// ── Types ────────────────────────────────────────────────────

export interface UseApiCallOptions<T> {
  /** Callback invoked on successful completion */
  onSuccess?: (result: T) => void;
  /** Callback invoked on final failure (after all retries) */
  onError?: (error: ApiError) => void;
  /** Callback invoked when a retry is about to happen */
  onRetry?: (attempt: number, error: ApiError, delayMs: number) => void;
}

export interface UseApiCallReturn {
  /**
   * Execute an API call with rate limiting, error handling, and retry.
   * @param fn - The async function to call (should throw on failure)
   * @param options - Success/error/retry callbacks
   */
  call: <T>(fn: () => Promise<T>, options?: UseApiCallOptions<T>) => Promise<T | null>;
  /** Whether an API call is currently in progress */
  loading: boolean;
  /** The current error, if any (clears on next call) */
  error: ApiError | null;
  /** Retry the last failed call (re-invokes with same arguments) */
  retry: () => Promise<void>;
  /** Clear the current error without retrying */
  clearError: () => void;
  /** Whether the user is rate-limited (called too soon) */
  isRateLimited: boolean;
  /** Seconds remaining until next allowed call (0 if not rate-limited) */
  rateLimitCountdown: number;
}

// ── Constants ────────────────────────────────────────────────

const RATE_LIMIT_INTERVAL_MS = 2000;
const MAX_RETRIES = 2;

// ── Hook ─────────────────────────────────────────────────────

export function useApiCall(): UseApiCallReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // Refs for retry support
  const lastFnRef = useRef<(() => Promise<unknown>) | null>(null);
  const lastOptionsRef = useRef<UseApiCallOptions<unknown> | null>(null);
  const lastCallIdRef = useRef(0);

  // Rate limiting state
  const lastCallTimeRef = useRef(0);
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Start the rate-limit countdown timer.
   */
  const startRateLimitCountdown = useCallback(() => {
    if (rateLimitTimerRef.current) {
      clearInterval(rateLimitTimerRef.current);
    }

    setRateLimitCountdown(Math.ceil(RATE_LIMIT_INTERVAL_MS / 1000));
    setIsRateLimited(true);

    rateLimitTimerRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          if (rateLimitTimerRef.current) {
            clearInterval(rateLimitTimerRef.current);
            rateLimitTimerRef.current = null;
          }
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Execute an API call with full error handling and retry.
   */
  const call = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: UseApiCallOptions<T>
    ): Promise<T | null> => {
      // Rate limit check
      const now = Date.now();
      const elapsed = now - lastCallTimeRef.current;

      if (elapsed < RATE_LIMIT_INTERVAL_MS) {
        const waitSec = Math.ceil((RATE_LIMIT_INTERVAL_MS - elapsed) / 1000);
        console.warn(`[useApiCall] Rate limited. Please wait ${waitSec}s.`);
        const rateLimitError = classifyError(
          new Error(`Please wait ${waitSec} seconds before trying again.`)
        );
        // Override to be non-retryable and info severity
        rateLimitError.retryable = false;
        rateLimitError.code = 'API_RATE_LIMITED';
        setError(rateLimitError);
        options?.onError?.(rateLimitError as ApiError);
        return null;
      }

      // Record call time and start rate limit
      lastCallTimeRef.current = Date.now();
      startRateLimitCountdown();

      // Store for retry
      lastFnRef.current = fn as () => Promise<unknown>;
      lastOptionsRef.current = options as UseApiCallOptions<unknown> | null;
      lastCallIdRef.current += 1;
      const thisCallId = lastCallIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const result = await withRetry(
          fn,
          MAX_RETRIES,
          (attempt, err, delayMs) => {
            console.log(`[useApiCall] Retry ${attempt}/${MAX_RETRIES} after ${delayMs}ms: ${err.message}`);
            options?.onRetry?.(attempt, err, delayMs);
          }
        );

        // Check if this call is still the current one (not superseded)
        if (thisCallId !== lastCallIdRef.current) {
          return null;
        }

        setLoading(false);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        // Check if this call is still the current one
        if (thisCallId !== lastCallIdRef.current) {
          return null;
        }

        const apiError = classifyError(err);
        console.error('[useApiCall] API call failed:', apiError);
        setError(apiError);
        setLoading(false);
        options?.onError?.(apiError);
        return null;
      }
    },
    [startRateLimitCountdown]
  );

  /**
   * Retry the last failed call.
   */
  const retry = useCallback(async () => {
    if (lastFnRef.current) {
      const fn = lastFnRef.current;
      const options = lastOptionsRef.current;
      lastFnRef.current = null;
      lastOptionsRef.current = null;
      await call(fn as () => Promise<unknown>, options as UseApiCallOptions<unknown>);
    }
  }, [call]);

  /**
   * Clear the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    call,
    loading,
    error,
    retry,
    clearError,
    isRateLimited,
    rateLimitCountdown,
  };
}

export default useApiCall;
