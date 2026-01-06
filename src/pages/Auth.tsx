import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import policyPocketLogo from "@/assets/policy-pocket-logo.jpeg";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleForgotPassword = async (): Promise<void> => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    const emailResult = z.string().email().safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a password reset link.",
      });
    }
    setResetLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/", { replace: true });
        }
        setCheckingAuth(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      }
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateInput = (): boolean => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateInput()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateInput()) return;

    setLoading(true);
    const redirectUrl = `${window.location.origin}/confirm-email`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user && !data.user.email_confirmed_at) {
      // User created but needs to confirm email
      navigate("/confirm-email");
    } else if (data.session) {
      // User already confirmed (shouldn't happen on new signup, but handle it)
      navigate("/", { replace: true });
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to complete your registration.",
      });
      navigate("/confirm-email");
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              <img
                src={policyPocketLogo}
                alt="Policy Pocket logo"
                className="h-10 w-10 object-contain rounded-lg"
              />
              <span className="font-display text-xl font-bold text-foreground">Policy Pocket</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Auth Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome to Policy Pocket
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your coverage dashboard
            </p>
          </div>

          <Card className="shadow-elegant border-border/50">
            <Tabs defaultValue="signin">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="signin">
                  <CardTitle className="mb-2">Welcome back</CardTitle>
                  <CardDescription className="mb-6">
                    Sign in to access your coverage dashboard
                  </CardDescription>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || resetLoading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sign In
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm text-muted-foreground"
                      onClick={handleForgotPassword}
                      disabled={resetLoading || loading}
                    >
                      {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Forgot password?
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <CardTitle className="mb-2">Create your account</CardTitle>
                  <CardDescription className="mb-6">
                    Start organizing your coverage today
                  </CardDescription>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Free Account
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <p className="text-sm text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
