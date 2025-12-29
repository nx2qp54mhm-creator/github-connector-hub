import { useNavigate } from "react-router-dom";
import { useProfile } from "./useProfile";

export function useOnboarding() {
  const { profile, loading, updateProfile, refetch } = useProfile();
  const navigate = useNavigate();

  const currentStep = profile?.onboarding_step ?? 0;
  const isCompleted = profile?.onboarding_completed ?? false;
  const isLoading = loading;

  const advanceStep = async () => {
    const nextStep = currentStep + 1;
    await updateProfile({ onboarding_step: nextStep });
    await refetch();

    const routes = [
      "/onboarding/step-1",
      "/onboarding/step-2",
      "/onboarding/step-3",
      "/onboarding/complete",
    ];
    navigate(routes[nextStep - 1] || "/onboarding/complete");
  };

  const skipStep = async () => {
    await advanceStep();
  };

  const goToStep = (step: number) => {
    const routes = [
      "/onboarding/welcome",
      "/onboarding/step-1",
      "/onboarding/step-2",
      "/onboarding/step-3",
      "/onboarding/complete",
    ];
    navigate(routes[step] || "/onboarding/welcome");
  };

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_completed: true, onboarding_step: 4 });
    navigate("/");
  };

  const exitOnboarding = () => {
    navigate("/");
  };

  return {
    currentStep,
    isCompleted,
    isLoading,
    advanceStep,
    skipStep,
    goToStep,
    completeOnboarding,
    exitOnboarding,
  };
}
