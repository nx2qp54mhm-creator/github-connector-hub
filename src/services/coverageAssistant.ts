// src/services/coverageAssistant.ts

import { supabase } from "@/integrations/supabase/client";

// Types for the API

// Trip protection coverage details
export interface TripProtectionForAPI {
  cancellation_coverage?: number;
  interruption_coverage?: number;
  delay_coverage?: number;
  delay_threshold_hours?: number;
  covered_reasons?: string[];
  exclusions?: string[];
}

// Baggage protection coverage details
export interface BaggageProtectionForAPI {
  delay_coverage?: number;
  delay_threshold_hours?: number;
  lost_baggage_coverage?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

// Purchase protection coverage details
export interface PurchaseProtectionForAPI {
  max_per_claim?: number;
  max_per_year?: number;
  coverage_period_days?: number;
  what_is_covered?: string[];
  what_is_not_covered?: string[];
}

// Extended warranty coverage details
export interface ExtendedWarrantyForAPI {
  extension_years?: number;
  max_original_warranty_years?: number;
  max_per_claim?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

// Travel perks details
export interface TravelPerksForAPI {
  lounge_access?: string[];
  travel_credits?: { amount: number; description: string }[];
  other_perks?: string[];
}

export interface CoverageCardForAPI {
  card_name: string;
  issuer: string;
  annual_fee?: number;
  categories?: string[];
  // Rental car coverage
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
  // Additional benefit types
  trip_protection?: TripProtectionForAPI;
  baggage_protection?: BaggageProtectionForAPI;
  purchase_protection?: PurchaseProtectionForAPI;
  extended_warranty?: ExtendedWarrantyForAPI;
  travel_perks?: TravelPerksForAPI;
}

export interface PolicyLimits {
  liability?: number;
  collision?: number;
  comprehensive?: number;
  medical_payments?: number;
  uninsured_motorist?: number;
  [key: string]: number | undefined;
}

export interface CoveragePolicyForAPI {
  policy_name: string;
  policy_type: string;
  coverage_details?: string;
  deductible?: number;
  limits?: PolicyLimits;
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
  } catch (err: unknown) {
    console.error("Error calling coverage assistant:", err);
    return {
      success: false,
      error: "Network error — please check your connection and try again",
    };
  }
}
