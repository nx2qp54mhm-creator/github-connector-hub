import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import policyPocketLogo from "@/assets/policy-pocket-logo.jpeg";

type ConfirmationState = "verifying" | "success" | "error" | "pending";

export default function ConfirmEmail() {
  const [state, setState] = useState<ConfirmationState>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initializeForUser = useCoverageStore((state) => state.initializeForUser);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for token_hash and type in URL (Supabase PKCE flow)
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // Also check for hash fragments (older Supabase flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (tokenHash && type === "signup") {
        // Handle PKCE confirmation flow
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "signup",
        });

        if (error) {
          console.error("Email confirmation error:", error);
          setErrorMessage(error.message);
          setState("error");
        } else {
          // Initialize store for this new user (will load empty data for new user)
          if (data.user?.id) {
            initializeForUser(data.user.id);
          }

          setState("success");
          toast({
            title: "Email confirmed!",
            description: "Your account is now active. Redirecting to dashboard...",
          });
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      } else if (tokenHash && type === "email") {
        // Handle email change confirmation
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });

        if (error) {
          console.error("Email change confirmation error:", error);
          setErrorMessage(error.message);
          setState("error");
        } else {
          setState("success");
          toast({
            title: "Email updated!",
            description: "Your email address has been changed successfully.",
          });
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      } else if (accessToken && refreshToken) {
        // Handle implicit flow (older Supabase versions)
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Session setup error:", error);
          setErrorMessage(error.message);
          setState("error");
        } else {
          // Initialize store for this user
          if (data.user?.id) {
            initializeForUser(data.user.id);
          }

          setState("success");
          toast({
            title: "Email confirmed!",
            description: "Your account is now active. Redirecting to dashboard...",
          });
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      } else {
        // Check if user has a session and needs to confirm email
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || null);
          if (!session.user.email_confirmed_at) {
            setState("pending");
          } else {
            // Email already confirmed, redirect to dashboard
            navigate("/", { replace: true });
          }
        } else {
          // No tokens and no session - show pending state or redirect to auth
          setState("pending");
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams, toast, initializeForUser]);

  const handleResendConfirmation = async () => {
    if (!userEmail) {
      toast({
        title: "Email required",
        description: "Please sign up again to receive a confirmation email.",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: userEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
      },
    });

    if (error) {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent!",
        description: "Check your inbox for a new confirmation link.",
      });
    }
    setResendLoading(false);
  };

  const renderContent = () => {
    switch (state) {
      case "verifying":
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <CardTitle>Verifying your email...</CardTitle>
              <CardDescription>
                Please wait while we confirm your email address.
              </CardDescription>
            </CardHeader>
          </Card>
        );

      case "success":
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-700">Email Confirmed!</CardTitle>
              <CardDescription>
                Your email has been verified successfully. Redirecting you to the dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        );

      case "error":
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-700">Confirmation Failed</CardTitle>
              <CardDescription>
                {errorMessage || "The confirmation link is invalid or has expired."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleResendConfirmation}
                className="w-full"
                disabled={resendLoading}
              >
                {resendLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Resend Confirmation Email
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        );

      case "pending":
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                {userEmail
                  ? `We sent a confirmation link to ${userEmail}. Please check your inbox and spam folder.`
                  : "Please check your email for a confirmation link to activate your account."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userEmail && (
                <Button
                  onClick={handleResendConfirmation}
                  variant="outline"
                  className="w-full"
                  disabled={resendLoading}
                >
                  {resendLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Resend Confirmation Email
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src={policyPocketLogo}
            alt="Policy Pocket logo"
            className="h-12 w-12 object-contain"
          />
          <h1 className="font-display text-4xl font-bold text-foreground">Policy Pocket</h1>
        </div>
        <p className="text-muted-foreground">Your coverage intelligence system</p>
      </div>

      {renderContent()}
    </div>
  );
}
