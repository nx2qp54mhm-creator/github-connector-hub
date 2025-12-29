import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingLayout } from "./OnboardingLayout";

export function WelcomeScreen() {
  const { advanceStep, exitOnboarding } = useOnboarding();

  return (
    <OnboardingLayout currentStep={0} showProgress={false} onExit={exitOnboarding}>
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold font-serif text-foreground">
            Welcome to Policy Pocket
          </h1>
          <p className="text-lg text-muted-foreground">
            Your coverage OS – understand what you're actually covered for across
            credit cards, insurance policies, and more.
          </p>
        </div>

        <p className="text-muted-foreground">
          Let's get you set up in under 2 minutes.
        </p>

        <Button onClick={advanceStep} size="lg" className="mt-4">
          Get Started
        </Button>
      </div>
    </OnboardingLayout>
  );
}
