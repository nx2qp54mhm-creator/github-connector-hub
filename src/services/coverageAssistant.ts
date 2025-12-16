// src/services/coverageAssistant.ts

import { supabase } from "@/integrations/supabase/client";

// Types for the API
export interface CoverageCardForAPI {
  card_name: string;
  issuer: string;
  coverage_type?: string;
  max_coverage_amount?: number;
  max_rental_days?: number;
  what_is_covered?: string[];
  what_is_not_covered?: string[];
  vehicle_exclusions?: string[];
  exotic_vehicle_coverage?: boolean;
  country_exclusions?: string[];
  country_notes?: string;
  activation_requirements?: string[];
}

export interface CoveragePolicyForAPI {
  policy_name: string;
  policy_type: string;
  coverage_details?: string;
  deductible?: number;
  limits?: Record<string, any>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function askCoverageAssistant(
  question: string,
  creditCards: CoverageCardForAPI[],
  insurancePolicies: CoveragePolicyForAPI[],
  conversationHistory: ChatMessage[] = []
): Promise<AssistantResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("coverage-assistant", {
      body: {
        question,
        credit_cards: creditCards,
        insurance_policies: insurancePolicies,
        conversation_history: conversationHistory,
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        error: error.message || "Failed to get response from assistant",
      };
    }

    return data as AssistantResponse;
  } catch (err: any) {
    console.error("Error calling coverage assistant:", err);
    return {
      success: false,
      error: "Network error — please check your connection and try again",
    };
  }
}
