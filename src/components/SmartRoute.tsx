import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Landing from "@/pages/Landing";
import Index from "@/pages/Index";

export function SmartRoute() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Unauthenticated: show landing page
  if (!user) {
    return <Landing />;
  }

  // Authenticated: check profile loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check onboarding status for authenticated users
  if (profile && !profile.onboarding_completed && user.email_confirmed_at) {
    const step = profile.onboarding_step ?? 0;
    const stepRoutes = [
      "/onboarding/welcome",
      "/onboarding/step-1",
      "/onboarding/step-2",
      "/onboarding/step-3",
      "/onboarding/complete",
    ];
    return <Navigate to={stepRoutes[step] || "/onboarding/welcome"} replace />;
  }

  // Authenticated user with completed onboarding: show dashboard
  return <Index />;
}
