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

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Check if user has any coverage
    if (totalItems === 0) {
      setTimeout(() => {
        const response: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "Add some cards or
