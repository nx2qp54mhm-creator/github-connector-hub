import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: ReturnType<typeof useAuth>["user"];
  profile: ReturnType<typeof useProfile>["profile"];
}

/**
 * Hook for checking admin authentication status.
 * Combines auth state with profile data to determine admin access.
 *
 * Usage:
 * ```tsx
 * const { isAdmin, isLoading } = useAdminAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!isAdmin) return <Navigate to="/" />;
 * ```
 */
export function useAdminAuth(): AdminAuthState {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const isLoading = authLoading || profileLoading;
  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && profile?.is_admin === true;

  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    user,
    profile,
  };
}

/**
 * Helper function to check admin status via Supabase RPC.
 * Can be used for server-side checks or when profile isn't loaded.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { supabase } = await import("@/integrations/supabase/client");

  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return data === true;
}
