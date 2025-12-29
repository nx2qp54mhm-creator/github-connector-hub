import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, CreditCard, Car, Home, Plane, Smartphone, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import policyPocketLogo from "@/assets/policy-pocket-logo.jpeg";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const features = [
  {
    icon: Shield,
    title: "Unified Coverage View",
    description: "See all your insurance policies, credit card benefits, and protection plans in one organized dashboard."
  },
  {
    icon: CreditCard,
    title: "Hidden Benefits Discovery",
    description: "Uncover valuable protections you already have through your credit cards—travel insurance, purchase protection, and more."
  },
  {
    icon: Smartphone,
    title: "Smart Coverage Analysis",
    description: "Get AI-powered insights about gaps in your coverage and recommendations to optimize your protection."
  }
];

const coverageTypes = [
  { icon: Plane, label: "Travel Protection" },
  { icon: CreditCard, label: "Purchase Coverage" },
  { icon: Car, label: "Auto Insurance" },
  { icon: Home, label: "Home/Renters" },
  { icon: Smartphone, label: "Device Protection" },
];

const benefits = [
  "Track all your insurance policies in one place",
  "Discover credit card benefits you never knew you had",
  "Never miss a claim opportunity again",
  "Compare coverage across multiple sources",
  "Get personalized coverage recommendations"
];

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
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
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
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to complete your registration.",
      });
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
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src={policyPocketLogo} 
                alt="Policy Pocket logo" 
                className="h-10 w-10 object-contain rounded-lg"
              />
              <span className="font-display text-xl font-bold text-foreground">Policy Pocket</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  All Your Coverage,{" "}
                  <span className="text-primary">One Pocket</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                  Stop juggling insurance policies and missing hidden credit card benefits. 
                  Policy Pocket brings everything together so you always know what you're protected against.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {coverageTypes.map((type) => (
                  <div 
                    key={type.label}
                    className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground"
                  >
                    <type.icon className="h-4 w-4 text-primary" />
                    {type.label}
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                className="shadow-primary-glow"
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <Card className="relative shadow-elegant border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Coverage Dashboard</p>
                      <p className="text-sm text-muted-foreground">Your protection at a glance</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Travel Insurance", status: "Active", source: "Chase Sapphire" },
                    { label: "Auto Insurance", status: "Expires Soon", source: "GEICO" },
                    { label: "Cell Phone Protection", status: "Active", source: "Visa Signature" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.source}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === "Active" 
                          ? "bg-success-light text-success-foreground" 
                          : "bg-warning-light text-warning-foreground"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Coverage Intelligence System
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Policy Pocket helps you understand, organize, and maximize all the protection you already have.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Stop Leaving Money on the Table
              </h2>
              <p className="text-lg text-muted-foreground">
                Most people have valuable coverage they never use because they simply don't know about it. 
                Policy Pocket changes that.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-success-light flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-success-foreground" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-elegant">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Did you know?</p>
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2">$500+</p>
                <p className="text-muted-foreground">
                  Average value of unused credit card benefits per year
                </p>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-center text-sm text-muted-foreground">
                  From rental car insurance to purchase protection, most cardholders never claim benefits they're entitled to.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img 
                  src={policyPocketLogo} 
                  alt="Policy Pocket logo" 
                  className="h-12 w-12 object-contain rounded-lg"
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Get Started with Policy Pocket
              </h2>
              <p className="text-muted-foreground">
                Free to use. Set up in minutes.
              </p>
            </div>

            <Card className="shadow-elegant border-border/50">
              <Tabs defaultValue="signup">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Tabs>
            </Card>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={policyPocketLogo} 
                alt="Policy Pocket logo" 
                className="h-8 w-8 object-contain rounded-lg"
              />
              <span className="text-sm text-muted-foreground">© 2024 Policy Pocket. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
