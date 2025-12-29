import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useCoverageStore } from "./useCoverageStore";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const clearUserData = useCoverageStore((state) => state.clearUserData);
  const setUserId = useCoverageStore((state) => state.setUserId);
  const loadUserData = useCoverageStore((state) => state.loadUserData);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Set userId in coverage store and localStorage for user-scoped data
      if (session?.user) {
        localStorage.setItem('current_user_id', session.user.id);
        setUserId(session.user.id);
        // Load user's coverage data from localStorage
        loadUserData();
      } else {
        localStorage.removeItem('current_user_id');
        setUserId(null);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Handle user change
        if (session?.user) {
          localStorage.setItem('current_user_id', session.user.id);
          setUserId(session.user.id);
          // Load user's coverage data from localStorage
          loadUserData();
        } else {
          localStorage.removeItem('current_user_id');
          setUserId(null);
        }

        // Clear data on sign out
        if (event === 'SIGNED_OUT') {
          clearUserData();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [clearUserData, setUserId, loadUserData]);

  const signOut = async () => {
    // Clear user-specific data before signing out
    clearUserData();
    localStorage.removeItem('current_user_id');

    // Sign out from Supabase
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
