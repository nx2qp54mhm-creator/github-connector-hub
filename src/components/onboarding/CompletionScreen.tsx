import { CheckCircle, LayoutDashboard, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingLayout } from "./OnboardingLayout";

export function CompletionScreen() {
  const { completeOnboarding, exitOnboarding } = useOnboarding();

  return (
    <OnboardingLayout currentStep={4} showProgress={false} onExit={exitOnboarding}>
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold font-serif text-foreground">
            You're all set!
          </h1>
          <p className="text-muted-foreground">
            Your coverage is now organized and searchable.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-6 text-left space-y-4">
          <p className="font-medium text-foreground text-center">
            Here's what you can do:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <LayoutDashboard className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">View all your coverage</p>
                <p className="text-xs text-muted-foreground">
                  See everything in one organized dashboard
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Ask questions anytime</p>
                <p className="text-xs text-muted-foreground">
                  Get instant answers about your coverage
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Add more cards and policies</p>
                <p className="text-xs text-muted-foreground">
                  Keep your coverage library up to date
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={completeOnboarding} size="lg" className="w-full">
          Go to Dashboard
        </Button>
      </div>
    </OnboardingLayout>
  );
}
