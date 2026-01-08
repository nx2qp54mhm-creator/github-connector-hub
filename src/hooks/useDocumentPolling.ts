import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseDocumentPollingOptions {
  onComplete: () => void;
  onFailed: (error: string) => void;
  onTimeout: () => void;
  maxAttempts?: number;
  intervalMs?: number;
}

interface UseDocumentPollingResult {
  isPolling: boolean;
  startPolling: (documentId: string) => void;
  stopPolling: () => void;
}

export function useDocumentPolling({
  onComplete,
  onFailed,
  onTimeout,
  maxAttempts = 30,
  intervalMs = 1000,
}: UseDocumentPollingOptions): UseDocumentPollingResult {
  const [isPolling, setIsPolling] = useState(false);
  const attemptsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const documentIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    attemptsRef.current = 0;
    documentIdRef.current = null;
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    const docId = documentIdRef.current;
    if (!docId || !isMountedRef.current) {
      stopPolling();
      return;
    }

    attemptsRef.current++;

    if (attemptsRef.current > maxAttempts) {
      stopPolling();
      onTimeout();
      return;
    }

    try {
      const { data: statusCheck, error } = await supabase
        .from("policy_documents")
        .select("processing_status, error_message")
        .eq("id", docId)
        .single();

      if (error) {
        console.error("Polling error:", error);
        // Continue polling on error
      } else if (statusCheck?.processing_status === "completed") {
        stopPolling();
        onComplete();
        return;
      } else if (statusCheck?.processing_status === "failed") {
        stopPolling();
        onFailed(statusCheck.error_message || "Processing failed");
        return;
      }

      // Schedule next poll
      if (isMountedRef.current) {
        timeoutRef.current = setTimeout(poll, intervalMs);
      }
    } catch (err) {
      console.error("Polling exception:", err);
      // Continue polling on exception
      if (isMountedRef.current) {
        timeoutRef.current = setTimeout(poll, intervalMs);
      }
    }
  }, [maxAttempts, intervalMs, onComplete, onFailed, onTimeout, stopPolling]);

  const startPolling = useCallback((documentId: string) => {
    if (!documentId) return;

    documentIdRef.current = documentId;
    attemptsRef.current = 0;
    setIsPolling(true);
    poll();
  }, [poll]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    startPolling,
    stopPolling,
  };
}
