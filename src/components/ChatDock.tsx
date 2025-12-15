// src/components/ChatDock.tsx

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Info, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { getCardById } from "@/data/cardDatabase";
import {
  askCoverageAssistant,
  CoverageCardForAPI,
  CoveragePolicyForAPI,
  ChatMessage,
} from "@/services/coverageAssistant";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatDock() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you understand your coverage. Try asking about rental cars, trip protection, or what's covered.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get data from the coverage store
  const selectedCards = useCoverageStore((state) => state.selectedCards);
  const uploadedPolicies = useCoverageStore((state) => state.uploadedPolicies);
  const totalItems = useCoverageStore((state) => state.getTotalItems());

  // Transform cards into API format
  const getFormattedCards = (): CoverageCardForAPI[] => {
    return selectedCards
      .map((cardId) => {
        const card = getCardById(cardId);
        if (!card) return null;

        const rental = card.rental_car_coverage || {};

        return {
          card_name: card.name,
          issuer: card.issuer,
          coverage_type: rental.coverage_type,
          max_coverage_amount: rental.max_coverage_amount,
          what_is_covered: rental.what_is_covered,
          what_is_not_covered: rental.what_is_not_covered,
          vehicle_exclusions: rental.vehicle_exclusions,
          exotic_vehicle_coverage: rental.exotic_vehicle_coverage,
          country_exclusions: rental.country_exclusions,
          activation_requirements: rental.activation_requirements,
        };
      })
      .filter((card): card is CoverageCardForAPI => card !== null);
  };

  // Transform policies into API format
  const getFormattedPolicies = (): CoveragePolicyForAPI[] => {
    return uploadedPolicies.map((policy) => ({
      policy_name: policy.name,
      policy_type: policy.type,
      coverage_details: policy.parsedData?.summary || undefined,
      deductible: policy.parsedData?.deductible || undefined,
      limits: policy.parsedData?.limits || undefined,
    }));
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    console.log("1. handleSend triggered with:", text);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Check if user has any coverage
    console.log("2. totalItems:", totalItems);

    if (totalItems === 0) {
      console.log("3. No items - showing empty state message");
      setTimeout(() => {
        const response: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "Add some cards or policies to your Coverage Library first, and I'll be able to answer questions about your specific coverage.",
        };
        setMessages((prev) => [...prev, response]);
      }, 300);
      return;
    }

    // Build conversation history (exclude welcome message)
    const historyForApi: ChatMessage[] = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const cards = getFormattedCards();
    const policies = getFormattedPolicies();

    console.log("4. About to call API with:", {
      question: text,
      cards,
      policies,
      historyLength: historyForApi.length,
    });

    setIsLoading(true);

    try {
      console.log("5. Calling askCoverageAssistant...");
      const result = await askCoverageAssistant(text, cards, policies, historyForApi);
      console.log("6. Got result:", result);

      if (result.success && result.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.error || "Sorry, I encountered an error. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error("7. Caught error:", err);
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't connect. Please check your connection and try again.",
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
    <Card className="border border-border shadow-soft overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2 text-xl font-sans">
          <MessageCircle className="w-4 h-4 text-primary" />
          Coverage Assistant
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Ask questions about your coverage</p>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-[180px] max-h-[240px] overflow-y-auto">
        <div className="p-3 space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                message.role === "user"
                  ? "ml-auto bg-secondary text-secondary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm border border-border",
              )}
            >
              {message.content}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm bg-muted text-foreground rounded-bl-sm border border-border">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your coverage..."
            disabled={isLoading}
            className="flex-1 text-sm rounded-full"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full flex-shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          AI-powered by Claude
        </p>
      </div>
    </Card>
  );
}
