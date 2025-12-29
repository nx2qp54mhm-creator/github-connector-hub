import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface PrivateRouteProps {
  children: React.ReactNode;
  skipOnboardingRedirect?: boolean;
}

export function PrivateRoute({ children, skipOnboardingRedirect = false }: PrivateRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for profile to load before checking onboarding
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user needs to complete onboarding
  // Only redirect if:
  // 1. Not already on an onboarding page (skipOnboardingRedirect)
  // 2. Profile exists and onboarding is not completed
  // 3. User's email is verified
  if (
    !skipOnboardingRedirect &&
    profile &&
    !profile.onboarding_completed &&
    user.email_confirmed_at
  ) {
    // Determine which onboarding step to resume at
    const step = profile.onboarding_step ?? 0;
    const stepRoutes = [
      "/onboarding/welcome",
      "/onboarding/step-1",
      "/onboarding/step-2",
      "/onboarding/step-3",
      "/onboarding/complete",
    ];
    const targetRoute = stepRoutes[step] || "/onboarding/welcome";
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
}
