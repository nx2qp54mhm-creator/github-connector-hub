// src/components/ChatDock.tsx

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, MessageCircle, Info, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { getCardById, commonPlans } from "@/data/cardDatabase";
import { askCoverageAssistant, CoverageCardForAPI, CoveragePolicyForAPI, ChatMessage } from "@/services/coverageAssistant";
import { cn } from "@/lib/utils";
import { useRateLimiter } from "@/hooks/useRateLimiter";

// Rate limit: 10 requests per minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Max messages to keep in memory (prevents unbounded growth)
const MAX_MESSAGES = 50;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Helper to limit message history to prevent memory leaks
function limitMessages(messages: Message[]): Message[] {
  if (messages.length <= MAX_MESSAGES) return messages;
  // Keep welcome message if it exists, plus the last (MAX_MESSAGES - 1) messages
  const welcomeMsg = messages.find(m => m.id === "welcome");
  const recentMessages = messages.slice(-MAX_MESSAGES + (welcomeMsg ? 1 : 0));
  return welcomeMsg && !recentMessages.find(m => m.id === "welcome")
    ? [welcomeMsg, ...recentMessages]
    : recentMessages;
}

// Simple markdown renderer for bold text and line breaks
function renderMarkdown(text: string): React.ReactNode {
  // Split by double asterisks for bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    // Check if this part is bold (wrapped in **)
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    // Handle line breaks
    return part.split("\n").map((line, lineIndex, arr) => <span key={`${index}-${lineIndex}`}>
        {line}
        {lineIndex < arr.length - 1 && <br />}
      </span>);
  });
}
export function ChatDock() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hi! I can help you understand all your coverage benefits. Ask me about rental cars, trip cancellation, baggage protection, purchase protection, extended warranties, travel perks, lounge access, or any of your added policies and plans."
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Rate limiting for chat requests
  const { isLimited, remainingRequests, tryRequest } = useRateLimiter({
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  // Get data from the coverage store
  const selectedCards = useCoverageStore(state => state.selectedCards);
  const uploadedPolicies = useCoverageStore(state => state.uploadedPolicies);
  const addedPlans = useCoverageStore(state => state.addedPlans);
  const totalItems = useCoverageStore(state => state.getTotalItems());

  // Memoize formatted cards to prevent recalculation on every render
  const formattedCards = useMemo((): CoverageCardForAPI[] => {
    return selectedCards.map(cardId => {
      const card = getCardById(cardId);
      if (!card) return null;

      // Extract all benefit data from the card
      const rental = card.rental;
      const exclusions = card.rentalExclusions;
      const trip = card.tripProtection;
      const baggage = card.baggageProtection;
      const purchase = card.purchaseProtection;
      const warranty = card.extendedWarranty;
      const perks = card.travelPerks;

      return {
        card_name: card.fullName || card.name,
        issuer: card.issuer,
        annual_fee: card.annualFee,
        categories: card.categories,
        // Rental car coverage
        coverage_type: rental?.coverageType,
        max_coverage_amount: rental?.maxCoverage,
        max_rental_days: rental?.maxDays,
        what_is_covered: exclusions?.what_is_covered,
        what_is_not_covered: exclusions?.what_is_not_covered,
        vehicle_exclusions: exclusions?.vehicle_exclusions,
        country_exclusions: exclusions?.country_exclusions,
        country_notes: exclusions?.country_notes,
        // Trip protection
        trip_protection: trip ? {
          cancellation_coverage: trip.cancellation_coverage,
          interruption_coverage: trip.interruption_coverage,
          delay_coverage: trip.delay_coverage,
          delay_threshold_hours: trip.delay_threshold_hours,
          covered_reasons: trip.covered_reasons,
          exclusions: trip.exclusions,
        } : undefined,
        // Baggage protection
        baggage_protection: baggage ? {
          delay_coverage: baggage.delay_coverage,
          delay_threshold_hours: baggage.delay_threshold_hours,
          lost_baggage_coverage: baggage.lost_baggage_coverage,
          coverage_details: baggage.coverage_details,
          exclusions: baggage.exclusions,
        } : undefined,
        // Purchase protection
        purchase_protection: purchase ? {
          max_per_claim: purchase.max_per_claim,
          max_per_year: purchase.max_per_year,
          coverage_period_days: purchase.coverage_period_days,
          what_is_covered: purchase.what_is_covered,
          what_is_not_covered: purchase.what_is_not_covered,
        } : undefined,
        // Extended warranty
        extended_warranty: warranty ? {
          extension_years: warranty.extension_years,
          max_original_warranty_years: warranty.max_original_warranty_years,
          max_per_claim: warranty.max_per_claim,
          coverage_details: warranty.coverage_details,
          exclusions: warranty.exclusions,
        } : undefined,
        // Travel perks
        travel_perks: perks ? {
          lounge_access: perks.lounge_access,
          travel_credits: perks.travel_credits,
          other_perks: perks.other_perks,
        } : undefined,
      };
    }).filter((card): card is NonNullable<typeof card> => card !== null) as CoverageCardForAPI[];
  }, [selectedCards]);

  // Memoize formatted policies to prevent recalculation on every render
  const formattedPolicies = useMemo((): CoveragePolicyForAPI[] => {
    // Include uploaded policies
    const policies: CoveragePolicyForAPI[] = uploadedPolicies.map(policy => ({
      policy_name: policy.name,
      policy_type: policy.type,
    }));

    // Include added common plans with their details
    addedPlans.forEach(addedPlan => {
      const planDetails = commonPlans.find(p => p.id === addedPlan.id);
      if (planDetails) {
        policies.push({
          policy_name: planDetails.name,
          policy_type: "protection_plan",
          coverage_details: [
            planDetails.description || "",
            ...(planDetails.coverage_details || []),
          ].filter(Boolean).join(". "),
        });
      }
    });

    return policies;
  }, [uploadedPolicies, addedPlans]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSend = async (): Promise<void> => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Check rate limit before proceeding
    if (!tryRequest()) {
      const rateLimitMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "You're sending messages too quickly. Please wait a moment before trying again."
      };
      setMessages(prev => limitMessages([...prev, rateLimitMessage]));
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };
    setMessages(prev => limitMessages([...prev, userMessage]));
    setInput("");

    // Check if user has any coverage
    if (totalItems === 0) {
      setTimeout(() => {
        const response: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Add some cards or policies to your Coverage Library first, and I'll be able to answer questions about your specific coverage."
        };
        setMessages(prev => limitMessages([...prev, response]));
      }, 300);
      return;
    }

    // Build conversation history (exclude welcome message)
    const historyForApi: ChatMessage[] = messages.filter(m => m.id !== "welcome").map(m => ({
      role: m.role,
      content: m.content
    }));
    setIsLoading(true);
    try {
      const result = await askCoverageAssistant(text, formattedCards, formattedPolicies, historyForApi);
      if (result.success && result.response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.response
        };
        setMessages(prev => limitMessages([...prev, assistantMessage]));
      } else {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.error || "Sorry, I encountered an error. Please try again."
        };
        setMessages(prev => limitMessages([...prev, errorMessage]));
      }
    } catch (err: unknown) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't connect. Please check your connection and try again."
      };
      setMessages(prev => limitMessages([...prev, errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return <Card className="border border-border shadow-soft overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2 text-xl font-sans">
          <MessageCircle className="w-4 h-4 text-primary" />
          Chat with your Coverage    
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions about your coverage
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-[200px] max-h-[350px] overflow-y-auto">
        <div className="p-4 space-y-3">
          {messages.map(message => <div key={message.id} className={cn("max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed", message.role === "user" ? "ml-auto bg-secondary text-secondary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm border border-border")}>
              {message.role === "assistant" ? renderMarkdown(message.content) : message.content}
            </div>)}

          {/* Loading indicator */}
          {isLoading && <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm bg-muted text-foreground rounded-bl-sm border border-border">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>}
        </div>
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your coverage..." disabled={isLoading} className="flex-1 text-sm rounded-full" />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="rounded-full flex-shrink-0">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          AI-powered by Claude
        </p>
      </div>
    </Card>;
}