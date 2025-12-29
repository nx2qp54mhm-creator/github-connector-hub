import { useParams, Navigate } from "react-router-dom";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { CardSelectionStep } from "@/components/onboarding/CardSelectionStep";
import { PolicyUploadStep } from "@/components/onboarding/PolicyUploadStep";
import { AskQuestionStep } from "@/components/onboarding/AskQuestionStep";
import { CompletionScreen } from "@/components/onboarding/CompletionScreen";

export default function Onboarding() {
  const { step } = useParams<{ step?: string }>();

  // Default to welcome if no step specified
  const currentStep = step || "welcome";

  switch (currentStep) {
    case "welcome":
      return <WelcomeScreen />;
    case "step-1":
      return <CardSelectionStep />;
    case "step-2":
      return <PolicyUploadStep />;
    case "step-3":
      return <AskQuestionStep />;
    case "complete":
      return <CompletionScreen />;
    default:
      return <Navigate to="/onboarding/welcome" replace />;
  }
}
