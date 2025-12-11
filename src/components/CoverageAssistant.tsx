// src/components/CoverageAssistant.tsx

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import {
  askCoverageAssistant,
  CoverageCard,
  CoveragePolicy,
  ChatMessage,
} from "@/services/coverageAssistant";

// Internal message type with additional UI metadata
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CoverageAssistantProps {
  creditCards: CoverageCard[];
  insurancePolicies: CoveragePolicy[];
}

export function CoverageAssistant({
  creditCards,
  insurancePolicies,
}: CoverageAssistantProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you understand your coverage. Try asking about rental cars, trip protection, or what's covered.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const question = inputValue.trim();
    if (!question || isLoading) return;

    // Clear input and any previous error
    setInputValue("");
    setError(null);

    // Add user's message to the chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Build conversation history for context (exclude the welcome message)
    const historyForApi: ChatMessage[] = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    setIsLoading(true);

    try {
      const result = await askCoverageAssistant(
        question,
        creditCards,
        insurancePolicies,
        historyForApi
      );

      if (result.success && result.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle suggested question clicks
  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  // Check if user has any coverage data
  const hasCoverage = creditCards.length > 0 || insurancePolicies.length > 0;

  return (
    <div className="flex flex-col bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Coverage Assistant</h3>
            <p className="text-xs text-stone-500">
              Ask questions about your coverage
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === "user"
                  ? "bg-emerald-700 text-white rounded-br-md"
                  : "bg-stone-100 text-stone-800 rounded-bl-md"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                <span className="text-sm text-stone-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show only if no conversation yet) */}
      {messages.length === 1 && hasCoverage && (
        <div className="px-4 pb-2">
          <p className="text-xs text-stone-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "What rental car coverage do I have?",
              "Am I covered for trip cancellation?",
              "Compare my cards' benefits",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestedQuestion(suggestion)}
                className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No coverage warning */}
      {!hasCoverage && (
        <div className="px-4 pb-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            Add credit cards or insurance policies to your Coverage Library to
            get personalized answers.
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your coverage..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-stone-300 rounded-full text-sm 
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                       disabled:bg-stone-50 disabled:text-stone-400 
                       placeholder:text-stone-400"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-emerald-700 text-white rounded-full 
                       flex items-center justify-center 
                       hover:bg-emerald-800 
                       disabled:bg-stone-300 disabled:cursor-not-allowed 
                       transition-colors"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2 text-center">
          ⓘ Coverage details are for informational purposes only. Always verify
          with your card issuer or insurance provider.
        </p>
      </form>
    </div>
  );
}
