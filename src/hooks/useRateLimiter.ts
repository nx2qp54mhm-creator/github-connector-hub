/**
 * @fileoverview Client-side rate limiting hooks for preventing API abuse and controlling request frequency.
 *
 * This module provides two key hooks:
 * - `useRateLimiter`: Implements a sliding window rate limiting algorithm
 * - `useDebounce`: Delays function execution until after a specified time has passed
 *
 * @module hooks/useRateLimiter
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Configuration options for the rate limiter.
 *
 * @interface RateLimiterOptions
 * @property {number} maxRequests - Maximum number of requests allowed within the time window.
 *   Example: 10 means "10 requests per windowMs"
 * @property {number} windowMs - Time window in milliseconds for the rate limit.
 *   This creates a sliding window that tracks requests within this duration.
 *   Example: 60000 means "per minute"
 * @property {number} [cooldownMs=0] - Optional cooldown period in milliseconds after hitting the rate limit.
 *   When the limit is exceeded, no requests are allowed until both:
 *   1. The oldest request in the window has expired (windowMs has passed), AND
 *   2. The cooldown period has elapsed
 *   Example: If cooldownMs=5000, users must wait an extra 5 seconds after the window expires.
 *   Default: 0 (no additional cooldown)
 */
interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  cooldownMs?: number;
}

/**
 * Current state of the rate limiter.
 *
 * @interface RateLimiterState
 * @property {boolean} isLimited - True if the rate limit has been exceeded and requests are currently blocked.
 *   Use this to disable UI elements or show warning messages.
 * @property {number} remainingRequests - Number of requests remaining in the current window.
 *   This counts down from maxRequests to 0. When it reaches 0, isLimited becomes true.
 * @property {number | null} resetTime - Timestamp (in milliseconds since epoch) when the rate limit will reset.
 *   - null when not rate limited
 *   - When rate limited, this is: oldestRequestTimestamp + windowMs + cooldownMs
 *   Use this to display countdown timers to users (e.g., "Try again in 45 seconds")
 */
interface RateLimiterState {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: number | null;
}

/**
 * A React hook that implements client-side rate limiting using a sliding window algorithm.
 *
 * ## Algorithm Overview
 *
 * The hook uses a **sliding window** approach:
 * 1. Maintains an array of timestamps for recent requests
 * 2. Before each check, removes timestamps older than the window duration
 * 3. Compares remaining timestamps against the maximum allowed
 * 4. If limit exceeded, calculates when the oldest request will expire (plus cooldown)
 *
 * This is more accurate than fixed windows because it prevents burst traffic at window boundaries.
 * For example, with a 60-second window and 10 requests max:
 * - Fixed window: User could make 10 requests at 0:59 and 10 more at 1:00 (20 in 1 second)
 * - Sliding window: User can only make 10 requests in any 60-second period
 *
 * ## Memory Management
 *
 * The hook automatically cleans up old timestamps to prevent memory leaks.
 * - Timestamps older than `windowMs` are removed before each check
 * - The array size is bounded by `maxRequests` under normal usage
 * - Worst case: If `recordRequest()` is called without `checkLimit()`, the array grows unbounded
 *   (This is considered misuse - always call `checkLimit()` first or use `tryRequest()`)
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: Manual Control (check, then record)
 * ```typescript
 * const rateLimiter = useRateLimiter({ maxRequests: 10, windowMs: 60000 });
 *
 * async function handleSubmit() {
 *   if (!rateLimiter.checkLimit()) {
 *     toast.error(`Rate limited. Try again in ${getSecondsUntil(rateLimiter.resetTime)}s`);
 *     return;
 *   }
 *
 *   try {
 *     await apiCall();
 *     rateLimiter.recordRequest(); // Only record on success
 *   } catch (error) {
 *     // Don't record failed requests
 *   }
 * }
 * ```
 *
 * ### Pattern 2: Atomic Check-and-Record
 * ```typescript
 * const rateLimiter = useRateLimiter({ maxRequests: 5, windowMs: 30000 });
 *
 * async function handleSubmit() {
 *   if (!rateLimiter.tryRequest()) {
 *     toast.error("Too many requests. Please wait.");
 *     return;
 *   }
 *
 *   await apiCall(); // Request is always recorded, even if it fails
 * }
 * ```
 *
 * ### Pattern 3: UI Feedback
 * ```typescript
 * const rateLimiter = useRateLimiter({ maxRequests: 10, windowMs: 60000 });
 *
 * return (
 *   <div>
 *     <Button
 *       disabled={rateLimiter.isLimited}
 *       onClick={handleClick}
 *     >
 *       Submit ({rateLimiter.remainingRequests} remaining)
 *     </Button>
 *     {rateLimiter.isLimited && (
 *       <p>Rate limited. Resets at {new Date(rateLimiter.resetTime!).toLocaleTimeString()}</p>
 *     )}
 *   </div>
 * );
 * ```
 *
 * ## When to Use Each Method
 *
 * - **`checkLimit()`**: Use when you want to check first, then conditionally record.
 *   Good for recording only successful requests.
 *
 * - **`tryRequest()`**: Use when you want atomic check-and-record behavior.
 *   Good for always counting attempts, regardless of success.
 *
 * - **`reset()`**: Use for manual override (e.g., admin action, testing, user upgrades).
 *   Clears all history and resets to initial state.
 *
 * @param {RateLimiterOptions} options - Configuration for the rate limiter
 * @returns {Object} Rate limiter state and control methods
 * @returns {boolean} return.isLimited - Whether requests are currently blocked
 * @returns {number} return.remainingRequests - Number of requests remaining in window
 * @returns {number | null} return.resetTime - Timestamp when limit will reset (null if not limited)
 * @returns {() => boolean} return.tryRequest - Atomically checks limit and records request if allowed
 * @returns {() => boolean} return.checkLimit - Checks if a request would be allowed (doesn't record)
 * @returns {() => void} return.reset - Manually resets the rate limiter to initial state
 *
 * @example
 * // Basic usage: 10 requests per minute
 * const rateLimiter = useRateLimiter({
 *   maxRequests: 10,
 *   windowMs: 60000,
 * });
 *
 * @example
 * // With cooldown: 5 requests per 30 seconds, plus 10 second penalty
 * const rateLimiter = useRateLimiter({
 *   maxRequests: 5,
 *   windowMs: 30000,
 *   cooldownMs: 10000,
 * });
 */
export function useRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs, cooldownMs = 0 } = options;

  /**
   * Array of timestamps (milliseconds since epoch) for recent requests.
   * Stored in a ref to persist across renders without causing re-renders.
   * Automatically cleaned of old entries before each check.
   * @private
   */
  const requestTimestamps = useRef<number[]>([]);

  const [state, setState] = useState<RateLimiterState>({
    isLimited: false,
    remainingRequests: maxRequests,
    resetTime: null,
  });

  /**
   * Removes request timestamps that fall outside the current time window.
   * This implements the "sliding" part of the sliding window algorithm.
   *
   * Time Complexity: O(n) where n = requestTimestamps.length
   * Space Complexity: O(n) due to filter creating new array
   *
   * @private
   * @returns {void}
   *
   * @example
   * // If windowMs = 60000 (1 minute) and current time is 12:00:45
   * // Keeps only timestamps >= 11:59:45
   * // Timestamps from 11:59:44 and earlier are removed
   */
  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    const cutoff = now - windowMs;
    requestTimestamps.current = requestTimestamps.current.filter(ts => ts > cutoff);
  }, [windowMs]);

  /**
   * Checks if a new request would be allowed under the current rate limit.
   * Does NOT record the request - use recordRequest() separately or use tryRequest() instead.
   *
   * This method:
   * 1. Cleans old timestamps outside the window
   * 2. Counts remaining timestamps
   * 3. Compares count against maxRequests
   * 4. Updates state with isLimited flag and resetTime
   *
   * @returns {boolean} true if request is allowed, false if rate limited
   *
   * @example
   * if (checkLimit()) {
   *   await makeApiCall();
   *   recordRequest(); // Separate recording step
   * }
   */
  const checkLimit = useCallback((): boolean => {
    cleanOldRequests();
    const currentCount = requestTimestamps.current.length;
    const remaining = Math.max(0, maxRequests - currentCount);

    // Rate limit exceeded
    if (currentCount >= maxRequests) {
      const oldestRequest = requestTimestamps.current[0];
      // Reset time = when oldest request expires + optional cooldown
      const resetTime = oldestRequest + windowMs + cooldownMs;

      setState({
        isLimited: true,
        remainingRequests: 0,
        resetTime,
      });
      return false;
    }

    // Within limit
    setState({
      isLimited: false,
      remainingRequests: remaining,
      resetTime: null,
    });
    return true;
  }, [cleanOldRequests, maxRequests, windowMs, cooldownMs]);

  /**
   * Records a request by adding the current timestamp to the history.
   * Should typically be called AFTER a successful request, not before.
   *
   * WARNING: Calling this without checkLimit() first can lead to unbounded array growth.
   * Consider using tryRequest() for atomic check-and-record behavior.
   *
   * This method:
   * 1. Adds current timestamp to the array
   * 2. Cleans old timestamps
   * 3. Updates remainingRequests count
   *
   * @returns {void}
   *
   * @example
   * // CORRECT: Check first, record after success
   * if (checkLimit()) {
   *   await apiCall();
   *   recordRequest();
   * }
   *
   * @example
   * // INCORRECT: Recording without checking
   * recordRequest(); // Could exceed maxRequests, array grows unbounded
   */
  const recordRequest = useCallback(() => {
    requestTimestamps.current.push(Date.now());
    cleanOldRequests();

    const remaining = Math.max(0, maxRequests - requestTimestamps.current.length);
    setState(prev => ({
      ...prev,
      remainingRequests: remaining,
    }));
  }, [cleanOldRequests, maxRequests]);

  /**
   * Atomically checks the rate limit and records the request if allowed.
   * This is a convenience method that combines checkLimit() and recordRequest().
   *
   * Use this when you want to count all attempts, regardless of whether the
   * subsequent operation succeeds or fails.
   *
   * @returns {boolean} true if request was allowed and recorded, false if rate limited
   *
   * @example
   * // Simple case: always count attempts
   * if (!tryRequest()) {
   *   showError("Too many attempts");
   *   return;
   * }
   * await makeApiCall();
   *
   * @example
   * // Alternative: only count successful requests (use checkLimit + recordRequest)
   * if (!checkLimit()) {
   *   return;
   * }
   * try {
   *   await makeApiCall();
   *   recordRequest(); // Only record if successful
   * } catch (error) {
   *   // Failed request not counted
   * }
   */
  const tryRequest = useCallback((): boolean => {
    if (!checkLimit()) {
      return false;
    }
    recordRequest();
    return true;
  }, [checkLimit, recordRequest]);

  /**
   * Manually resets the rate limiter to its initial state.
   * Clears all request history and removes any rate limiting.
   *
   * Use cases:
   * - Testing/development: Reset between test cases
   * - User upgrades: Clear limits when user gets higher tier
   * - Admin override: Allow privileged users to bypass their own limits
   * - Error recovery: Reset after resolving issues
   *
   * @returns {void}
   *
   * @example
   * // Reset button for development
   * <button onClick={rateLimiter.reset}>Reset Rate Limit</button>
   *
   * @example
   * // Clear on user upgrade
   * useEffect(() => {
   *   if (user.tier === 'premium') {
   *     rateLimiter.reset();
   *   }
   * }, [user.tier]);
   */
  const reset = useCallback(() => {
    requestTimestamps.current = [];
    setState({
      isLimited: false,
      remainingRequests: maxRequests,
      resetTime: null,
    });
  }, [maxRequests]);

  return {
    ...state,
    tryRequest,
    checkLimit,
    reset,
  };
}

/**
 * A React hook that delays function execution until after a specified delay has passed
 * since the last invocation. Also known as "debouncing".
 *
 * ## How Debouncing Works
 *
 * When you call the debounced function:
 * 1. Any pending execution is cancelled
 * 2. A new timer is started for the delay duration
 * 3. If called again before the timer expires, repeat from step 1
 * 4. When the timer finally expires, the function executes
 *
 * This is useful for:
 * - **Search inputs**: Wait for user to stop typing before searching
 * - **Resize handlers**: Wait for user to finish resizing before recalculating layout
 * - **Auto-save**: Wait for user to stop editing before saving
 * - **API calls**: Prevent rapid successive calls during user interaction
 *
 * ## Comparison: Debounce vs. Throttle vs. Rate Limit
 *
 * - **Debounce** (this hook): Delays execution until user stops acting
 *   - "Execute once, N milliseconds after the last attempt"
 *   - Good for: Search bars, form validation, auto-save
 *
 * - **Throttle**: Executes at most once per interval, even if called multiple times
 *   - "Execute at most once every N milliseconds"
 *   - Good for: Scroll handlers, mouse move tracking
 *
 * - **Rate Limit** (useRateLimiter): Allows N executions per time window
 *   - "Execute up to N times per window"
 *   - Good for: API call limits, preventing abuse
 *
 * ## Memory & Cleanup
 *
 * The hook properly cleans up the timeout when:
 * - The component unmounts (React's useCallback cleanup)
 * - A new call is made (cancels previous timer)
 *
 * However, **the timer persists across renders** via useRef, so:
 * - Changing `delay` won't cancel existing timers (they use the old delay)
 * - Changing `callback` won't affect pending executions (they use the old callback)
 *
 * @template T - The type of the function being debounced
 * @param {T} callback - The function to debounce. Should be memoized with useCallback
 *   to prevent creating new debounced functions on each render.
 * @param {number} delay - Delay in milliseconds to wait before executing.
 *   Common values: 300ms (search), 500ms (auto-save), 1000ms (expensive operations)
 * @returns {Object} Debounced function and pending state
 * @returns {T} return.debouncedFn - The debounced version of the callback.
 *   Has the same signature as the original function.
 * @returns {boolean} return.isPending - True if a debounced call is waiting to execute.
 *   Use this to show loading indicators or disable UI during the delay.
 *
 * @example
 * // Search input: Wait 300ms after user stops typing
 * function SearchBar() {
 *   const [query, setQuery] = useState('');
 *
 *   const performSearch = useCallback((searchQuery: string) => {
 *     fetch(`/api/search?q=${searchQuery}`)
 *       .then(res => res.json())
 *       .then(setResults);
 *   }, []);
 *
 *   const { debouncedFn: debouncedSearch, isPending } = useDebounce(
 *     performSearch,
 *     300
 *   );
 *
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => {
 *           setQuery(e.target.value);
 *           debouncedSearch(e.target.value);
 *         }}
 *       />
 *       {isPending && <Spinner />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Auto-save: Save 1 second after user stops editing
 * function Editor() {
 *   const [content, setContent] = useState('');
 *
 *   const saveContent = useCallback(async (text: string) => {
 *     await fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify({ content: text }),
 *     });
 *   }, []);
 *
 *   const { debouncedFn: debouncedSave, isPending } = useDebounce(
 *     saveContent,
 *     1000
 *   );
 *
 *   return (
 *     <div>
 *       <textarea
 *         value={content}
 *         onChange={(e) => {
 *           setContent(e.target.value);
 *           debouncedSave(e.target.value);
 *         }}
 *       />
 *       {isPending && <span>Saving...</span>}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Window resize: Recalculate layout after resize finishes
 * function ResponsiveGrid() {
 *   const recalculateLayout = useCallback(() => {
 *     // Expensive layout calculations
 *     const width = window.innerWidth;
 *     const columns = Math.floor(width / 200);
 *     setGridColumns(columns);
 *   }, []);
 *
 *   const { debouncedFn: debouncedRecalc } = useDebounce(
 *     recalculateLayout,
 *     250
 *   );
 *
 *   useEffect(() => {
 *     window.addEventListener('resize', debouncedRecalc);
 *     return () => window.removeEventListener('resize', debouncedRecalc);
 *   }, [debouncedRecalc]);
 *
 *   // ...
 * }
 */
export function useDebounce<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): { debouncedFn: T; isPending: boolean } {
  /**
   * Stores the timeout ID for the pending execution.
   * Using useRef keeps the same timeout reference across renders.
   * @private
   */
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPending, setIsPending] = useState(false);

  /**
   * The debounced function wrapper.
   * Cancels any pending execution and starts a new delay timer.
   *
   * @private
   */
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      // Cancel any pending execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsPending(true);

      // Start new delay timer
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        setIsPending(false);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return { debouncedFn, isPending };
}
