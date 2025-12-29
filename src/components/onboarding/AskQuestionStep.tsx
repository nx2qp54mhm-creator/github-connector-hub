import { useState, useMemo } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { getCardById, commonPlans } from "@/data/cardDatabase";
import { askCoverageAssistant, CoverageCardForAPI, CoveragePolicyForAPI, ChatMessage } from "@/services/coverageAssistant";
import { OnboardingLayout } from "./OnboardingLayout";

const EXAMPLE_QUESTIONS = [
  "Do I need rental car insurance?",
  "Am I covered if I total my car?",
  "What's my deductible?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AskQuestionStep() {
  const { advanceStep, skipStep, exitOnboarding, currentStep } = useOnboarding();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  // Get coverage data
  const selectedCards = useCoverageStore((state) => state.selectedCards);
  const uploadedPolicies = useCoverageStore((state) => state.uploadedPolicies);
  const addedPlans = useCoverageStore((state) => state.addedPlans);
  const { autoPolicy } = useAutoPolicy();

  // Format cards for API
  const formattedCards = useMemo((): CoverageCardForAPI[] => {
    return selectedCards
      .map((cardId) => {
        const card = getCardById(cardId);
        if (!card) return null;
        return {
          card_name: card.fullName || card.name,
          issuer: card.issuer,
          annual_fee: card.annualFee,
          categories: card.categories,
          coverage_type: card.rental?.coverageType,
          max_coverage_amount: card.rental?.maxCoverage,
          max_rental_days: card.rental?.maxDays,
        };
      })
      .filter((card): card is NonNullable<typeof card> => card !== null) as CoverageCardForAPI[];
  }, [selectedCards]);

  // Format policies for API
  const formattedPolicies = useMemo((): CoveragePolicyForAPI[] => {
    const policies: CoveragePolicyForAPI[] = uploadedPolicies.map((policy) => ({
      policy_name: policy.name,
      policy_type: policy.type,
      auto_coverage: policy.type === "auto" && autoPolicy ? {
        policy_number: autoPolicy.policy_number ?? undefined,
        insurer: autoPolicy.insurance_company ?? undefined,
        collision_covered: autoPolicy.collision_covered ?? undefined,
        collision_deductible: autoPolicy.collision_deductible ?? undefined,
        comprehensive_covered: autoPolicy.comprehensive_covered ?? undefined,
        comprehensive_deductible: autoPolicy.comprehensive_deductible ?? undefined,
      } : undefined,
    }));

    addedPlans.forEach((addedPlan) => {
      const planDetails = commonPlans.find((p) => p.id === addedPlan.id);
      if (planDetails) {
        policies.push({
          policy_name: planDetails.name,
          policy_type: "protection_plan",
        });
      }
    });

    return policies;
  }, [uploadedPolicies, addedPlans, autoPolicy]);

  const totalCoverage = selectedCards.length + uploadedPolicies.length + addedPlans.length;

  const handleSend = async (question?: string) => {
    const text = (question || input).trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setHasAsked(true);

    try {
      // Check if user has any coverage
      if (totalCoverage === 0) {
        const noDataMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I don't have any coverage data to analyze yet. Once you add some credit cards or insurance policies, I'll be able to answer specific questions about your coverage.",
        };
        setMessages((prev) => [...prev, noDataMessage]);
      } else {
        // Build conversation history
        const historyForApi: ChatMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await askCoverageAssistant(
          text,
          formattedCards,
          formattedPolicies,
          historyForApi
        );

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.success && result.response
            ? result.response
            : result.error || "Sorry, I encountered an error. Please try again.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't connect. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <OnboardingLayout currentStep={currentStep} onExit={exitOnboarding}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Step 3 of 3: Ask Your First Question
          </p>
          <h2 className="text-2xl font-semibold font-serif text-foreground">
            Now that we know your coverage, try asking a question:
          </h2>
        </div>

        {/* Example questions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLE_QUESTIONS.map((question) => (
              <button
                key={question}
                onClick={() => handleSend(question)}
                disabled={isLoading}
                className="px-4 py-2 rounded-full border border-border text-sm hover:bg-accent transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] px-4 py-3 rounded-xl text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-background border border-border rounded-bl-sm"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm bg-background border border-border rounded-bl-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your coverage..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Continue/Skip buttons */}
        <div className="flex gap-3">
          {hasAsked ? (
            <Button onClick={advanceStep} className="flex-1">
              Done
            </Button>
          ) : (
            <button
              onClick={skipStep}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
