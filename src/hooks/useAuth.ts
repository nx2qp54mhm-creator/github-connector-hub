import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useCoverageStore } from "./useCoverageStore";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const clearCoverageStore = useCoverageStore((state) => state.clearStore);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Clear all cached data when user signs out
        if (event === "SIGNED_OUT") {
          clearCoverageStore();
          queryClient.clear();
          localStorage.removeItem("covered-storage");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [clearCoverageStore, queryClient]);

  const signOut = async () => {
    // Clear all user data before signing out
    clearCoverageStore();
    queryClient.clear();
    localStorage.removeItem("covered-storage");
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
