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

// Cell phone protection details
export interface CellPhoneProtectionForAPI {
  max_per_claim?: number;
  max_claims_per_year?: number;
  deductible?: number;
  coverage_details?: string[];
  requirements?: string[];
  exclusions?: string[];
}

// Roadside assistance details
export interface RoadsideAssistanceForAPI {
  provider?: string;
  towing_miles?: number;
  services?: string[];
  coverage_details?: string[];
  limitations?: string[];
}

// Emergency assistance details
export interface EmergencyAssistanceForAPI {
  evacuation_coverage?: number;
  medical_coverage?: number;
  services?: string[];
  coverage_details?: string[];
  exclusions?: string[];
}

// Return protection details
export interface ReturnProtectionForAPI {
  max_per_item?: number;
  max_per_year?: number;
  return_window_days?: number;
  coverage_details?: string[];
  exclusions?: string[];
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
  // Travel benefits
  trip_protection?: TripProtectionForAPI;
  baggage_protection?: BaggageProtectionForAPI;
  travel_perks?: TravelPerksForAPI;
  emergency_assistance?: EmergencyAssistanceForAPI;
  // Purchase benefits
  purchase_protection?: PurchaseProtectionForAPI;
  extended_warranty?: ExtendedWarrantyForAPI;
  return_protection?: ReturnProtectionForAPI;
  // Other benefits
  cell_phone_protection?: CellPhoneProtectionForAPI;
  roadside_assistance?: RoadsideAssistanceForAPI;
}

export interface PolicyLimits {
  liability?: number;
  collision?: number;
  comprehensive?: number;
  medical_payments?: number;
  uninsured_motorist?: number;
  [key: string]: number | undefined;
}

// Auto insurance coverage for API
export interface AutoInsuranceCoverageForAPI {
  policy_number?: string;
  insurer?: string;
  bodily_injury_per_person?: number;
  bodily_injury_per_accident?: number;
  property_damage?: number;
  collision_deductible?: number;
  comprehensive_deductible?: number;
  uninsured_motorist?: number;
  underinsured_motorist?: number;
  medical_payments?: number;
  personal_injury_protection?: number;
  rental_reimbursement_daily?: number;
  rental_reimbursement_max?: number;
  roadside_assistance?: boolean;
  roadside_details?: string[];
  gap_coverage?: boolean;
  covered_vehicles?: string[];
  covered_drivers?: string[];
  exclusions?: string[];
}

// Home insurance coverage for API
export interface HomeInsuranceCoverageForAPI {
  policy_number?: string;
  insurer?: string;
  policy_type?: string;
  dwelling_coverage?: number;
  other_structures?: number;
  personal_property?: number;
  loss_of_use?: number;
  personal_liability?: number;
  medical_payments?: number;
  standard_deductible?: number;
  wind_hail_deductible?: number;
  hurricane_deductible?: number;
  scheduled_items?: { item: string; value: number }[];
  water_backup?: number;
  identity_theft?: boolean;
  equipment_breakdown?: boolean;
  exclusions?: string[];
  flood_coverage?: boolean;
  earthquake_coverage?: boolean;
}

// Renters insurance coverage for API
export interface RentersInsuranceCoverageForAPI {
  policy_number?: string;
  insurer?: string;
  personal_property?: number;
  loss_of_use?: number;
  personal_liability?: number;
  medical_payments?: number;
  deductible?: number;
  replacement_cost?: boolean;
  scheduled_items?: { item: string; value: number }[];
  identity_theft?: boolean;
  exclusions?: string[];
}

export interface CoveragePolicyForAPI {
  policy_name: string;
  policy_type: string;
  coverage_details?: string;
  deductible?: number;
  limits?: PolicyLimits;
  // Structured coverage data
  auto_coverage?: AutoInsuranceCoverageForAPI;
  home_coverage?: HomeInsuranceCoverageForAPI;
  renters_coverage?: RentersInsuranceCoverageForAPI;
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
