import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useCoverageStore } from "./useCoverageStore";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  const clearCoverageStore = useCoverageStore((state) => state.clearStore);
  const validateAndClearIfNeeded = useCoverageStore((state) => state.validateAndClearIfNeeded);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null;
        const previousUserId = previousUserIdRef.current;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle logout
        if (event === "SIGNED_OUT") {
          clearCoverageStore();
          queryClient.clear();
          localStorage.removeItem("covered-storage");
          previousUserIdRef.current = null;
          return;
        }

        // Handle sign in or user change
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // If user changed, clear React Query cache
          if (newUserId && previousUserId && newUserId !== previousUserId) {
            queryClient.clear();
          }

          // Validate store data belongs to current user
          validateAndClearIfNeeded(newUserId);
          previousUserIdRef.current = newUserId;
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);

      // Validate store data on initial load
      validateAndClearIfNeeded(userId);
      previousUserIdRef.current = userId;

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [clearCoverageStore, validateAndClearIfNeeded, queryClient]);

  const signOut = async () => {
    // Clear all user data before signing out
    clearCoverageStore();
    queryClient.clear();
    localStorage.removeItem("covered-storage");
    previousUserIdRef.current = null;
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
