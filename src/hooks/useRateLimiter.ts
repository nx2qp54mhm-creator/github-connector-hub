// src/hooks/useRateLimiter.ts
// Client-side rate limiter to prevent API abuse

import { useState, useCallback, useRef } from 'react';

interface RateLimiterOptions {
  maxRequests: number;      // Maximum requests allowed in the time window
  windowMs: number;         // Time window in milliseconds
  cooldownMs?: number;      // Cooldown after hitting limit (optional)
}

interface RateLimiterState {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: number | null;
}

export function useRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs, cooldownMs = 0 } = options;
  
  const requestTimestamps = useRef<number[]>([]);
  const [state, setState] = useState<RateLimiterState>({
    isLimited: false,
    remainingRequests: maxRequests,
    resetTime: null,
  });

  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    const cutoff = now - windowMs;
    requestTimestamps.current = requestTimestamps.current.filter(ts => ts > cutoff);
  }, [windowMs]);

  const checkLimit = useCallback((): boolean => {
    cleanOldRequests();
    const currentCount = requestTimestamps.current.length;
    const remaining = Math.max(0, maxRequests - currentCount);
    
    if (currentCount >= maxRequests) {
      const oldestRequest = requestTimestamps.current[0];
      const resetTime = oldestRequest + windowMs + cooldownMs;
      
      setState({
        isLimited: true,
        remainingRequests: 0,
        resetTime,
      });
      return false;
    }
    
    setState({
      isLimited: false,
      remainingRequests: remaining,
      resetTime: null,
    });
    return true;
  }, [cleanOldRequests, maxRequests, windowMs, cooldownMs]);

  const recordRequest = useCallback(() => {
    requestTimestamps.current.push(Date.now());
    cleanOldRequests();
    
    const remaining = Math.max(0, maxRequests - requestTimestamps.current.length);
    setState(prev => ({
      ...prev,
      remainingRequests: remaining,
    }));
  }, [cleanOldRequests, maxRequests]);

  const tryRequest = useCallback((): boolean => {
    if (!checkLimit()) {
      return false;
    }
    recordRequest();
    return true;
  }, [checkLimit, recordRequest]);

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

// Debounce hook for preventing rapid successive calls
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): { debouncedFn: T; isPending: boolean } {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, setIsPending] = useState(false);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setIsPending(true);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        setIsPending(false);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return { debouncedFn, isPending };
}
