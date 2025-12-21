// src/components/ChatDock.tsx

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, MessageCircle, Info, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { getCardById } from "@/data/cardDatabase";
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
    content: "Hi! I can help you understand your coverage. Try asking about rental cars, trip protection, or what's covered."
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
  const totalItems = useCoverageStore(state => state.getTotalItems());

  // Memoize formatted cards to prevent recalculation on every render
  const formattedCards = useMemo((): CoverageCardForAPI[] => {
    return selectedCards.map(cardId => {
      const card = getCardById(cardId);
      if (!card) return null;

      // Use the correct field names from cardDatabase
      const rental = card.rental;
      const exclusions = card.rentalExclusions;
      return {
        card_name: card.fullName || card.name,
        issuer: card.issuer,
        coverage_type: rental?.coverageType,
        max_coverage_amount: rental?.maxCoverage,
        max_rental_days: rental?.maxDays,
        what_is_covered: exclusions?.what_is_covered,
        what_is_not_covered: exclusions?.what_is_not_covered,
        country_exclusions: exclusions?.country_exclusions,
        country_notes: exclusions?.country_notes
      };
    }).filter((card): card is NonNullable<typeof card> => card !== null) as CoverageCardForAPI[];
  }, [selectedCards]);

  // Memoize formatted policies to prevent recalculation on every render
  const formattedPolicies = useMemo((): CoveragePolicyForAPI[] => {
    return uploadedPolicies.map(policy => ({
      policy_name: policy.name,
      policy_type: policy.type,
    }));
  }, [uploadedPolicies]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSend = async () => {
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
    } catch (err) {
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
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