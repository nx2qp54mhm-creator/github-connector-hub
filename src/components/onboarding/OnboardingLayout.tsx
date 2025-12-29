import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps?: number;
  showProgress?: boolean;
  onExit: () => void;
  children: React.ReactNode;
}

export function OnboardingLayout({
  currentStep,
  totalSteps = 3,
  showProgress = true,
  onExit,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with exit button and progress */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex-1">
          {showProgress && currentStep > 0 && currentStep <= totalSteps && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      i < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Exit onboarding"
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
