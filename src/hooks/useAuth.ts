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

  const initializeForUser = useCoverageStore((state) => state.initializeForUser);
  const clearCoverageStore = useCoverageStore((state) => state.clearStore);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null;
        const previousUserId = previousUserIdRef.current;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle logout - clear in-memory state but preserve localStorage data
        if (event === "SIGNED_OUT") {
          // Don't delete user's localStorage data - just clear in-memory state
          clearCoverageStore();
          queryClient.clear();
          previousUserIdRef.current = null;
          return;
        }

        // Handle sign in or user change - load user's data from localStorage
        if (newUserId && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED" || event === "INITIAL_SESSION")) {
          // If user changed, clear React Query cache
          if (previousUserId && newUserId !== previousUserId) {
            queryClient.clear();
          }

          // Initialize store with this user's data from localStorage
          initializeForUser(newUserId);
          previousUserIdRef.current = newUserId;
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);

      // Initialize store for the current user
      if (userId) {
        initializeForUser(userId);
        previousUserIdRef.current = userId;
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initializeForUser, clearCoverageStore, queryClient]);

  const signOut = async () => {
    // Clear in-memory state (but localStorage data persists for next login)
    clearCoverageStore();
    queryClient.clear();
    previousUserIdRef.current = null;
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
