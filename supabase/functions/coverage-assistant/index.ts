// supabase/functions/coverage-assistant/index.ts
// Deploy with: supabase functions deploy coverage-assistant

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface TripProtection {
  cancellation_coverage?: number;
  interruption_coverage?: number;
  delay_coverage?: number;
  delay_threshold_hours?: number;
  covered_reasons?: string[];
  exclusions?: string[];
}

interface BaggageProtection {
  delay_coverage?: number;
  delay_threshold_hours?: number;
  lost_baggage_coverage?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

interface PurchaseProtection {
  max_per_claim?: number;
  max_per_year?: number;
  coverage_period_days?: number;
  what_is_covered?: string[];
  what_is_not_covered?: string[];
}

interface ExtendedWarranty {
  extension_years?: number;
  max_original_warranty_years?: number;
  max_per_claim?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

interface TravelPerks {
  lounge_access?: string[];
  travel_credits?: { amount: number; description: string }[];
  other_perks?: string[];
}

interface CellPhoneProtection {
  max_per_claim?: number;
  max_claims_per_year?: number;
  deductible?: number;
  coverage_details?: string[];
  requirements?: string[];
  exclusions?: string[];
}

interface RoadsideAssistance {
  provider?: string;
  towing_miles?: number;
  services?: string[];
  coverage_details?: string[];
  limitations?: string[];
}

interface EmergencyAssistance {
  evacuation_coverage?: number;
  medical_coverage?: number;
  services?: string[];
  coverage_details?: string[];
  exclusions?: string[];
}

interface ReturnProtection {
  max_per_item?: number;
  max_per_year?: number;
  return_window_days?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

interface AutoInsuranceCoverage {
  policy_number?: string;
  insurer?: string;
  // Liability coverage
  bodily_injury_per_person?: number;
  bodily_injury_per_accident?: number;
  property_damage?: number;
  // Vehicle coverage
  collision_covered?: boolean;
  collision_deductible?: number;
  comprehensive_covered?: boolean;
  comprehensive_deductible?: number;
  // Uninsured motorist
  uninsured_motorist_covered?: boolean;
  uninsured_motorist_per_person?: number;
  uninsured_motorist_per_accident?: number;
  uninsured_motorist?: number; // Legacy field
  underinsured_motorist?: number;
  // Medical payments
  medical_payments_covered?: boolean;
  medical_payments?: number;
  personal_injury_protection?: number;
  // Rental reimbursement
  rental_reimbursement_covered?: boolean;
  rental_reimbursement_daily?: number;
  rental_reimbursement_max?: number;
  // Roadside & gap
  roadside_assistance?: boolean;
  roadside_details?: string[];
  gap_coverage?: boolean;
  covered_vehicles?: string[];
  covered_drivers?: string[];
  exclusions?: string[];
}

interface HomeInsuranceCoverage {
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

interface RentersInsuranceCoverage {
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

interface CreditCard {
  card_name: string;
  issuer: string;
  annual_fee?: number;
  categories?: string[];
  // Rental coverage
  coverage_type?: string;
  max_coverage_amount?: number;
  max_rental_days?: number;
  what_is_covered?: string[];
  what_is_not_covered?: string[];
  vehicle_exclusions?: string[];
  country_exclusions?: string[];
  country_notes?: string;
  // Benefits
  trip_protection?: TripProtection;
  baggage_protection?: BaggageProtection;
  purchase_protection?: PurchaseProtection;
  extended_warranty?: ExtendedWarranty;
  travel_perks?: TravelPerks;
  cell_phone_protection?: CellPhoneProtection;
  roadside_assistance?: RoadsideAssistance;
  emergency_assistance?: EmergencyAssistance;
  return_protection?: ReturnProtection;
}

interface InsurancePolicy {
  policy_name: string;
  policy_type: string;
  coverage_details?: string;
  deductible?: number;
  limits?: Record<string, number>;
  auto_coverage?: AutoInsuranceCoverage;
  home_coverage?: HomeInsuranceCoverage;
  renters_coverage?: RentersInsuranceCoverage;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  question: string;
  credit_cards: CreditCard[];
  insurance_policies: InsurancePolicy[];
  conversation_history?: ChatMessage[];
}

// ============================================
// INPUT VALIDATION
// ============================================

function validateRequest(body: RequestBody): { valid: boolean; error?: string } {
  // Validate question
  if (!body.question || typeof body.question !== "string") {
    return { valid: false, error: "Question is required and must be a string" };
  }
  if (body.question.length > 2000) {
    return { valid: false, error: "Question too long (max 2000 characters)" };
  }
  if (body.question.trim().length === 0) {
    return { valid: false, error: "Question cannot be empty" };
  }

  // Validate credit_cards
  if (body.credit_cards !== undefined && body.credit_cards !== null) {
    if (!Array.isArray(body.credit_cards)) {
      return { valid: false, error: "credit_cards must be an array" };
    }
    if (body.credit_cards.length > 25) {
      return { valid: false, error: "Too many credit cards (max 25)" };
    }
  }

  // Validate insurance_policies
  if (body.insurance_policies !== undefined && body.insurance_policies !== null) {
    if (!Array.isArray(body.insurance_policies)) {
      return { valid: false, error: "insurance_policies must be an array" };
    }
    if (body.insurance_policies.length > 15) {
      return { valid: false, error: "Too many insurance policies (max 15)" };
    }
  }

  // Validate conversation_history
  if (body.conversation_history !== undefined && body.conversation_history !== null) {
    if (!Array.isArray(body.conversation_history)) {
      return { valid: false, error: "conversation_history must be an array" };
    }
    if (body.conversation_history.length > 30) {
      return { valid: false, error: "Conversation history too long (max 30 messages)" };
    }
    
    // Validate total message size in conversation history
    const totalHistorySize = body.conversation_history.reduce((sum, msg) => 
      sum + (msg.content?.length || 0), 0
    );
    if (totalHistorySize > 100000) {
      return { valid: false, error: "Conversation history content too large" };
    }

    // Validate each message structure
    for (const msg of body.conversation_history) {
      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return { valid: false, error: "Invalid message role in conversation history" };
      }
      if (typeof msg.content !== "string") {
        return { valid: false, error: "Message content must be a string" };
      }
    }
  }

  return { valid: true };
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

function formatCreditCardInfo(cards: CreditCard[]): string {
  if (!cards || cards.length === 0) {
    return "No credit cards added to the coverage library.";
  }

  return cards.map(card => {
    const sections: string[] = [];

    // Card header
    sections.push(`## ${card.card_name} (${card.issuer})`);
    if (card.annual_fee !== undefined) {
      sections.push(`Annual Fee: $${card.annual_fee}`);
    }
    if (card.categories && card.categories.length > 0) {
      sections.push(`Coverage Categories: ${card.categories.join(", ")}`);
    }

    // Rental Car Coverage
    if (card.coverage_type || card.max_coverage_amount) {
      sections.push("\n### Rental Car Coverage");
      if (card.coverage_type) {
        sections.push(`- Coverage Type: ${card.coverage_type.toUpperCase()} (${card.coverage_type === "primary" ? "pays first before personal auto insurance" : "pays after personal auto insurance"})`);
      }
      if (card.max_coverage_amount) {
        sections.push(`- Maximum Coverage: $${card.max_coverage_amount.toLocaleString()}`);
      }
      if (card.max_rental_days) {
        sections.push(`- Maximum Rental Period: ${card.max_rental_days} days`);
      }
      if (card.what_is_covered && card.what_is_covered.length > 0) {
        sections.push(`- What's Covered: ${card.what_is_covered.join("; ")}`);
      }
      if (card.what_is_not_covered && card.what_is_not_covered.length > 0) {
        sections.push(`- What's NOT Covered: ${card.what_is_not_covered.join("; ")}`);
      }
      if (card.vehicle_exclusions && card.vehicle_exclusions.length > 0) {
        sections.push(`- Vehicle Exclusions: ${card.vehicle_exclusions.join("; ")}`);
      }
      if (card.country_exclusions && card.country_exclusions.length > 0) {
        sections.push(`- Country Exclusions: ${card.country_exclusions.join(", ")}`);
      }
      if (card.country_notes) {
        sections.push(`- Country Notes: ${card.country_notes}`);
      }
    }

    // Trip Protection
    if (card.trip_protection) {
      const tp = card.trip_protection;
      sections.push("\n### Trip Protection");
      if (tp.cancellation_coverage) {
        sections.push(`- Trip Cancellation Coverage: Up to $${tp.cancellation_coverage.toLocaleString()}`);
      }
      if (tp.interruption_coverage) {
        sections.push(`- Trip Interruption Coverage: Up to $${tp.interruption_coverage.toLocaleString()}`);
      }
      if (tp.delay_coverage) {
        sections.push(`- Trip Delay Coverage: Up to $${tp.delay_coverage} per ticket`);
      }
      if (tp.delay_threshold_hours) {
        sections.push(`- Delay Threshold: ${tp.delay_threshold_hours} hours before coverage kicks in`);
      }
      if (tp.covered_reasons && tp.covered_reasons.length > 0) {
        sections.push(`- Covered Reasons for Cancellation/Interruption: ${tp.covered_reasons.join("; ")}`);
      }
      if (tp.exclusions && tp.exclusions.length > 0) {
        sections.push(`- Trip Protection Exclusions: ${tp.exclusions.join("; ")}`);
      }
    }

    // Baggage Protection
    if (card.baggage_protection) {
      const bp = card.baggage_protection;
      sections.push("\n### Baggage Protection");
      if (bp.lost_baggage_coverage) {
        sections.push(`- Lost Baggage Coverage: Up to $${bp.lost_baggage_coverage.toLocaleString()}`);
      }
      if (bp.delay_coverage) {
        sections.push(`- Baggage Delay Coverage: Up to $${bp.delay_coverage} for essentials`);
      }
      if (bp.delay_threshold_hours) {
        sections.push(`- Delay Threshold: ${bp.delay_threshold_hours} hours`);
      }
      if (bp.coverage_details && bp.coverage_details.length > 0) {
        sections.push(`- Coverage Details: ${bp.coverage_details.join("; ")}`);
      }
      if (bp.exclusions && bp.exclusions.length > 0) {
        sections.push(`- Baggage Exclusions: ${bp.exclusions.join("; ")}`);
      }
    }

    // Purchase Protection
    if (card.purchase_protection) {
      const pp = card.purchase_protection;
      sections.push("\n### Purchase Protection");
      if (pp.max_per_claim) {
        sections.push(`- Maximum Per Claim: $${pp.max_per_claim.toLocaleString()}`);
      }
      if (pp.max_per_year) {
        sections.push(`- Maximum Per Year: $${pp.max_per_year.toLocaleString()}`);
      }
      if (pp.coverage_period_days) {
        sections.push(`- Coverage Period: ${pp.coverage_period_days} days from purchase`);
      }
      if (pp.what_is_covered && pp.what_is_covered.length > 0) {
        sections.push(`- What's Covered: ${pp.what_is_covered.join("; ")}`);
      }
      if (pp.what_is_not_covered && pp.what_is_not_covered.length > 0) {
        sections.push(`- What's NOT Covered: ${pp.what_is_not_covered.join("; ")}`);
      }
    }

    // Extended Warranty
    if (card.extended_warranty) {
      const ew = card.extended_warranty;
      sections.push("\n### Extended Warranty");
      if (ew.extension_years) {
        sections.push(`- Warranty Extension: ${ew.extension_years} additional year(s)`);
      }
      if (ew.max_original_warranty_years) {
        sections.push(`- Eligible Original Warranty: Up to ${ew.max_original_warranty_years} years`);
      }
      if (ew.max_per_claim) {
        sections.push(`- Maximum Per Claim: $${ew.max_per_claim.toLocaleString()}`);
      }
      if (ew.coverage_details && ew.coverage_details.length > 0) {
        sections.push(`- Coverage Details: ${ew.coverage_details.join("; ")}`);
      }
      if (ew.exclusions && ew.exclusions.length > 0) {
        sections.push(`- Warranty Exclusions: ${ew.exclusions.join("; ")}`);
      }
    }

    // Travel Perks
    if (card.travel_perks) {
      const perks = card.travel_perks;
      sections.push("\n### Travel Perks");
      if (perks.lounge_access && perks.lounge_access.length > 0) {
        sections.push(`- Lounge Access: ${perks.lounge_access.join("; ")}`);
      }
      if (perks.travel_credits && perks.travel_credits.length > 0) {
        const credits = perks.travel_credits
          .map(c => c.amount > 0 ? `$${c.amount} ${c.description}` : c.description)
          .join("; ");
        sections.push(`- Travel Credits: ${credits}`);
      }
      if (perks.other_perks && perks.other_perks.length > 0) {
        sections.push(`- Other Perks: ${perks.other_perks.join("; ")}`);
      }
    }

    // Cell Phone Protection
    if (card.cell_phone_protection) {
      const cpp = card.cell_phone_protection;
      sections.push("\n### Cell Phone Protection");
      if (cpp.max_per_claim) {
        sections.push(`- Maximum Per Claim: $${cpp.max_per_claim.toLocaleString()}`);
      }
      if (cpp.max_claims_per_year) {
        sections.push(`- Maximum Claims Per Year: ${cpp.max_claims_per_year}`);
      }
      if (cpp.deductible) {
        sections.push(`- Deductible: $${cpp.deductible}`);
      }
      if (cpp.coverage_details && cpp.coverage_details.length > 0) {
        sections.push(`- Coverage Details: ${cpp.coverage_details.join("; ")}`);
      }
      if (cpp.requirements && cpp.requirements.length > 0) {
        sections.push(`- Requirements: ${cpp.requirements.join("; ")}`);
      }
      if (cpp.exclusions && cpp.exclusions.length > 0) {
        sections.push(`- Exclusions: ${cpp.exclusions.join("; ")}`);
      }
    }

    // Roadside Assistance
    if (card.roadside_assistance) {
      const ra = card.roadside_assistance;
      sections.push("\n### Roadside Assistance");
      if (ra.provider) {
        sections.push(`- Provider: ${ra.provider}`);
      }
      if (ra.towing_miles) {
        sections.push(`- Towing: Up to ${ra.towing_miles} miles`);
      }
      if (ra.services && ra.services.length > 0) {
        sections.push(`- Services Included: ${ra.services.join("; ")}`);
      }
      if (ra.coverage_details && ra.coverage_details.length > 0) {
        sections.push(`- Coverage Details: ${ra.coverage_details.join("; ")}`);
      }
      if (ra.limitations && ra.limitations.length > 0) {
        sections.push(`- Limitations: ${ra.limitations.join("; ")}`);
      }
    }

    // Emergency Assistance
    if (card.emergency_assistance) {
      const ea = card.emergency_assistance;
      sections.push("\n### Emergency/Travel Assistance");
      if (ea.evacuation_coverage) {
        sections.push(`- Medical Evacuation Coverage: Up to $${ea.evacuation_coverage.toLocaleString()}`);
      }
      if (ea.medical_coverage) {
        sections.push(`- Emergency Medical Coverage: Up to $${ea.medical_coverage.toLocaleString()}`);
      }
      if (ea.services && ea.services.length > 0) {
        sections.push(`- Services: ${ea.services.join("; ")}`);
      }
      if (ea.coverage_details && ea.coverage_details.length > 0) {
        sections.push(`- Coverage Details: ${ea.coverage_details.join("; ")}`);
      }
      if (ea.exclusions && ea.exclusions.length > 0) {
        sections.push(`- Exclusions: ${ea.exclusions.join("; ")}`);
      }
    }

    // Return Protection
    if (card.return_protection) {
      const rp = card.return_protection;
      sections.push("\n### Return Protection");
      if (rp.max_per_item) {
        sections.push(`- Maximum Per Item: $${rp.max_per_item.toLocaleString()}`);
      }
      if (rp.max_per_year) {
        sections.push(`- Maximum Per Year: $${rp.max_per_year.toLocaleString()}`);
      }
      if (rp.return_window_days) {
        sections.push(`- Return Window: ${rp.return_window_days} days`);
      }
      if (rp.coverage_details && rp.coverage_details.length > 0) {
        sections.push(`- Coverage Details: ${rp.coverage_details.join("; ")}`);
      }
      if (rp.exclusions && rp.exclusions.length > 0) {
        sections.push(`- Exclusions: ${rp.exclusions.join("; ")}`);
      }
    }

    return sections.join("\n");
  }).join("\n\n---\n\n");
}

function formatAutoInsurance(auto: AutoInsuranceCoverage): string {
  const sections: string[] = [];

  if (auto.insurer) {
    sections.push(`Insurer: ${auto.insurer}`);
  }
  if (auto.policy_number) {
    sections.push(`Policy Number: ${auto.policy_number}`);
  }

  // Collision coverage - show status whether covered or not
  if (auto.collision_covered !== undefined) {
    if (auto.collision_covered && auto.collision_deductible !== undefined) {
      sections.push(`\n**Collision:** $${auto.collision_deductible} deductible`);
    } else if (!auto.collision_covered) {
      sections.push("\n**Collision:** Not covered");
    }
  } else if (auto.collision_deductible !== undefined) {
    sections.push(`\n**Collision:** $${auto.collision_deductible} deductible`);
  }

  // Comprehensive coverage - show status whether covered or not
  if (auto.comprehensive_covered !== undefined) {
    if (auto.comprehensive_covered && auto.comprehensive_deductible !== undefined) {
      sections.push(`**Comprehensive:** $${auto.comprehensive_deductible} deductible`);
    } else if (!auto.comprehensive_covered) {
      sections.push("**Comprehensive:** Not covered");
    }
  } else if (auto.comprehensive_deductible !== undefined) {
    sections.push(`**Comprehensive:** $${auto.comprehensive_deductible} deductible`);
  }

  // Liability coverage
  if (auto.bodily_injury_per_person || auto.bodily_injury_per_accident || auto.property_damage) {
    sections.push("\n**Liability Coverage:**");
    if (auto.bodily_injury_per_person) {
      sections.push(`- Bodily Injury (per person): $${auto.bodily_injury_per_person.toLocaleString()}`);
    }
    if (auto.bodily_injury_per_accident) {
      sections.push(`- Bodily Injury (per accident): $${auto.bodily_injury_per_accident.toLocaleString()}`);
    }
    if (auto.property_damage) {
      sections.push(`- Property Damage: $${auto.property_damage.toLocaleString()}`);
    }
  }

  // Uninsured/Underinsured motorist
  if (auto.uninsured_motorist_covered !== undefined) {
    if (auto.uninsured_motorist_covered) {
      sections.push("\n**Uninsured/Underinsured Motorist:** Covered");
      if (auto.uninsured_motorist_per_person) {
        sections.push(`- Per Person: $${auto.uninsured_motorist_per_person.toLocaleString()}`);
      }
      if (auto.uninsured_motorist_per_accident) {
        sections.push(`- Per Accident: $${auto.uninsured_motorist_per_accident.toLocaleString()}`);
      }
    } else {
      sections.push("\n**Uninsured/Underinsured Motorist:** Not covered");
    }
  } else if (auto.uninsured_motorist || auto.underinsured_motorist) {
    sections.push("\n**Uninsured/Underinsured Motorist:**");
    if (auto.uninsured_motorist) {
      sections.push(`- Uninsured Motorist: $${auto.uninsured_motorist.toLocaleString()}`);
    }
    if (auto.underinsured_motorist) {
      sections.push(`- Underinsured Motorist: $${auto.underinsured_motorist.toLocaleString()}`);
    }
  }

  // Medical payments
  if (auto.medical_payments_covered !== undefined) {
    if (auto.medical_payments_covered) {
      sections.push(`\n**Medical Payments:** $${auto.medical_payments?.toLocaleString() || "Covered"}`);
    } else {
      sections.push("\n**Medical Payments:** Not covered");
    }
  } else if (auto.medical_payments) {
    sections.push(`\n**Medical Payments:** $${auto.medical_payments.toLocaleString()}`);
  }

  if (auto.personal_injury_protection) {
    sections.push(`**Personal Injury Protection (PIP):** $${auto.personal_injury_protection.toLocaleString()}`);
  }

  // Rental reimbursement
  if (auto.rental_reimbursement_covered !== undefined) {
    if (auto.rental_reimbursement_covered) {
      sections.push("\n**Rental Reimbursement:** Covered");
      if (auto.rental_reimbursement_daily) {
        sections.push(`- Daily Limit: $${auto.rental_reimbursement_daily}`);
      }
      if (auto.rental_reimbursement_max) {
        sections.push(`- Maximum: $${auto.rental_reimbursement_max}`);
      }
    } else {
      sections.push("\n**Rental Reimbursement:** Not covered");
    }
  }

  // Roadside assistance
  if (auto.roadside_assistance !== undefined) {
    if (auto.roadside_assistance) {
      sections.push("\n**Roadside Assistance:** Included");
      if (auto.roadside_details && auto.roadside_details.length > 0) {
        sections.push(`- Services: ${auto.roadside_details.join("; ")}`);
      }
    } else {
      sections.push("\n**Roadside Assistance:** Not included");
    }
  }

  // Gap coverage
  if (auto.gap_coverage !== undefined) {
    sections.push(`\n**Gap Coverage:** ${auto.gap_coverage ? "Yes" : "No"}`);
  }

  // Covered vehicles and drivers
  if (auto.covered_vehicles && auto.covered_vehicles.length > 0) {
    sections.push(`\n**Covered Vehicles:** ${auto.covered_vehicles.join("; ")}`);
  }
  if (auto.covered_drivers && auto.covered_drivers.length > 0) {
    sections.push(`**Covered Drivers:** ${auto.covered_drivers.join("; ")}`);
  }

  // Exclusions
  if (auto.exclusions && auto.exclusions.length > 0) {
    sections.push(`\n**Exclusions:** ${auto.exclusions.join("; ")}`);
  }

  return sections.join("\n");
}

function formatHomeInsurance(home: HomeInsuranceCoverage): string {
  const sections: string[] = [];

  if (home.insurer) {
    sections.push(`Insurer: ${home.insurer}`);
  }
  if (home.policy_number) {
    sections.push(`Policy Number: ${home.policy_number}`);
  }
  if (home.policy_type) {
    sections.push(`Policy Type: ${home.policy_type}`);
  }

  // Coverage amounts
  sections.push("\n**Coverage Amounts:**");
  if (home.dwelling_coverage) {
    sections.push(`- Dwelling (Coverage A): $${home.dwelling_coverage.toLocaleString()}`);
  }
  if (home.other_structures) {
    sections.push(`- Other Structures (Coverage B): $${home.other_structures.toLocaleString()}`);
  }
  if (home.personal_property) {
    sections.push(`- Personal Property (Coverage C): $${home.personal_property.toLocaleString()}`);
  }
  if (home.loss_of_use) {
    sections.push(`- Loss of Use (Coverage D): $${home.loss_of_use.toLocaleString()}`);
  }
  if (home.personal_liability) {
    sections.push(`- Personal Liability (Coverage E): $${home.personal_liability.toLocaleString()}`);
  }
  if (home.medical_payments) {
    sections.push(`- Medical Payments (Coverage F): $${home.medical_payments.toLocaleString()}`);
  }

  // Deductibles
  sections.push("\n**Deductibles:**");
  if (home.standard_deductible) {
    sections.push(`- Standard: $${home.standard_deductible.toLocaleString()}`);
  }
  if (home.wind_hail_deductible) {
    sections.push(`- Wind/Hail: $${home.wind_hail_deductible.toLocaleString()}`);
  }
  if (home.hurricane_deductible) {
    sections.push(`- Hurricane: $${home.hurricane_deductible.toLocaleString()}`);
  }

  // Additional coverages
  const additionalCoverages: string[] = [];
  if (home.water_backup) {
    additionalCoverages.push(`Water Backup ($${home.water_backup.toLocaleString()})`);
  }
  if (home.identity_theft) {
    additionalCoverages.push("Identity Theft Protection");
  }
  if (home.equipment_breakdown) {
    additionalCoverages.push("Equipment Breakdown");
  }
  if (home.flood_coverage) {
    additionalCoverages.push("Flood Coverage");
  }
  if (home.earthquake_coverage) {
    additionalCoverages.push("Earthquake Coverage");
  }
  if (additionalCoverages.length > 0) {
    sections.push(`\n**Additional Coverages:** ${additionalCoverages.join("; ")}`);
  }

  // Scheduled items
  if (home.scheduled_items && home.scheduled_items.length > 0) {
    const items = home.scheduled_items.map(i => `${i.item}: $${i.value.toLocaleString()}`).join("; ");
    sections.push(`\n**Scheduled Items:** ${items}`);
  }

  // Exclusions
  if (home.exclusions && home.exclusions.length > 0) {
    sections.push(`\n**Exclusions:** ${home.exclusions.join("; ")}`);
  }

  return sections.join("\n");
}

function formatRentersInsurance(renters: RentersInsuranceCoverage): string {
  const sections: string[] = [];

  if (renters.insurer) {
    sections.push(`Insurer: ${renters.insurer}`);
  }
  if (renters.policy_number) {
    sections.push(`Policy Number: ${renters.policy_number}`);
  }

  // Coverage amounts
  sections.push("\n**Coverage Amounts:**");
  if (renters.personal_property) {
    sections.push(`- Personal Property: $${renters.personal_property.toLocaleString()}`);
  }
  if (renters.loss_of_use) {
    sections.push(`- Loss of Use: $${renters.loss_of_use.toLocaleString()}`);
  }
  if (renters.personal_liability) {
    sections.push(`- Personal Liability: $${renters.personal_liability.toLocaleString()}`);
  }
  if (renters.medical_payments) {
    sections.push(`- Medical Payments: $${renters.medical_payments.toLocaleString()}`);
  }

  // Deductible
  if (renters.deductible) {
    sections.push(`\n**Deductible:** $${renters.deductible.toLocaleString()}`);
  }

  // Replacement cost
  if (renters.replacement_cost !== undefined) {
    sections.push(`**Replacement Cost Coverage:** ${renters.replacement_cost ? "Yes" : "No (Actual Cash Value)"}`);
  }

  // Identity theft
  if (renters.identity_theft) {
    sections.push(`**Identity Theft Protection:** Yes`);
  }

  if (renters.scheduled_items && renters.scheduled_items.length > 0) {
    const items = renters.scheduled_items.map(i => `${i.item}: $${i.value.toLocaleString()}`).join("; ");
    sections.push(`\n**Scheduled Items:** ${items}`);
  }

  if (renters.exclusions && renters.exclusions.length > 0) {
    sections.push(`\n**Exclusions:** ${renters.exclusions.join("; ")}`);
  }

  return sections.join("\n");
}

function formatPolicyInfo(policies: InsurancePolicy[]): string {
  if (!policies || policies.length === 0) {
    return "No insurance policies or protection plans added.";
  }

  return policies.map(policy => {
    const sections: string[] = [];
    sections.push(`## ${policy.policy_name}`);
    sections.push(`Type: ${policy.policy_type}`);

    // Structured auto insurance data
    if (policy.auto_coverage) {
      sections.push("\n### Auto Insurance Details");
      sections.push(formatAutoInsurance(policy.auto_coverage));
    }

    // Structured home insurance data
    if (policy.home_coverage) {
      sections.push("\n### Home Insurance Details");
      sections.push(formatHomeInsurance(policy.home_coverage));
    }

    // Structured renters insurance data
    if (policy.renters_coverage) {
      sections.push("\n### Renters Insurance Details");
      sections.push(formatRentersInsurance(policy.renters_coverage));
    }

    // Generic coverage details (for protection plans and other policies)
    if (policy.coverage_details) {
      sections.push(`\nCoverage Details: ${policy.coverage_details}`);
    }
    if (policy.deductible !== undefined) {
      sections.push(`Deductible: $${policy.deductible}`);
    }
    if (policy.limits) {
      const limitStr = Object.entries(policy.limits)
        .map(([key, value]) => `${key}: $${value.toLocaleString()}`)
        .join(", ");
      sections.push(`Limits: ${limitStr}`);
    }

    return sections.join("\n");
  }).join("\n\n");
}

function buildSystemPrompt(cards: CreditCard[], policies: InsurancePolicy[]): string {
  const cardInfo = formatCreditCardInfo(cards);
  const policyInfo = formatPolicyInfo(policies);

  return `You are a helpful coverage assistant that helps users understand their insurance and credit card benefits. You have detailed knowledge about the user's specific coverage from their credit cards and insurance policies.

## Your Capabilities
You can answer questions about ALL of the following coverage types:

**Credit Card Benefits:**
- **Rental Car Coverage**: Primary vs secondary coverage, limits, exclusions, vehicle types, country restrictions
- **Trip Protection**: Trip cancellation, interruption, and delay coverage, covered reasons, exclusions
- **Baggage Protection**: Lost, delayed, and damaged baggage coverage, reimbursement limits
- **Purchase Protection**: Coverage for theft and damage to purchased items, time limits, exclusions
- **Extended Warranty**: Additional warranty coverage beyond manufacturer warranty
- **Travel Perks**: Airport lounge access, travel credits, elite status, and other benefits
- **Cell Phone Protection**: Coverage for phone theft/damage when paying phone bill with card
- **Roadside Assistance**: Towing, flat tire, jump start, lockout services
- **Emergency Assistance**: Medical evacuation, travel emergency services
- **Return Protection**: Refunds when merchants won't accept returns

**Insurance Policies:**
- **Auto Insurance**: Liability coverage, collision, comprehensive, uninsured motorist, rental reimbursement, roadside assistance
- **Home Insurance**: Dwelling coverage, personal property, liability, additional living expenses
- **Renters Insurance**: Personal property, liability, loss of use coverage
- **Protection Plans**: AppleCare+, Amazon Protection, carrier insurance, etc.

## User's Credit Card Coverage
${cardInfo}

## User's Insurance Policies & Protection Plans
${policyInfo}

## Response Guidelines
1. **Be specific**: Reference the user's actual cards and policies with their specific coverage limits
2. **Be accurate**: Only state coverage details that are explicitly listed above
3. **Be helpful**: If asked about something not covered, explain why and suggest alternatives if applicable
4. **Be concise**: Keep responses focused and easy to understand
5. **Compare when relevant**: If the user has multiple sources of similar coverage, compare them
6. **Identify the best option**: When multiple cards/policies offer similar coverage, recommend which to use
7. **Clarify coverage type**: For rental cars, always clarify if coverage is primary or secondary
8. **Mention exclusions**: When relevant, mention what's NOT covered to set proper expectations
9. **Cross-reference**: When a question involves multiple coverage types (e.g., "roadside assistance" could come from credit cards OR auto insurance), check all sources
10. **Use formatting**: Use **bold** for emphasis on important terms and limits

## Important Notes
- If asked about coverage the user doesn't have, politely explain they don't have that coverage
- If a question is outside the scope of coverage (e.g., general travel advice), redirect to coverage-related assistance
- Always be clear about which card or policy provides specific coverage
- When comparing cards, highlight the most relevant differences for the user's question
- For questions like "Does my credit card or insurance cover X?", check BOTH sources and compare`;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated request from user: ${user.id}`);

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const body: RequestBody = await req.json();
    
    // Validate input
    const validation = validateRequest(body);
    if (!validation.valid) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { question, credit_cards, insurance_policies, conversation_history = [] } = body;

    const systemPrompt = buildSystemPrompt(credit_cards || [], insurance_policies || []);

    // Build messages array for Claude
    const messages = [
      ...conversation_history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: question,
      },
    ];

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.content[0]?.text || "I'm sorry, I couldn't generate a response.";

    console.log(`Successfully processed request for user: ${user.id}, tokens used: ${data.usage?.input_tokens || 0} in, ${data.usage?.output_tokens || 0} out`);

    return new Response(
      JSON.stringify({
        success: true,
        response: assistantMessage,
        usage: {
          input_tokens: data.usage?.input_tokens || 0,
          output_tokens: data.usage?.output_tokens || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in coverage-assistant:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
