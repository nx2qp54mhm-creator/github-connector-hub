// supabase/functions/coverage-assistant/index.ts
// Deploy with: supabase functions deploy coverage-assistant

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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

  // Liability
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

  // Vehicle coverage
  if (auto.collision_deductible !== undefined || auto.comprehensive_deductible !== undefined) {
    sections.push("\n**Vehicle Coverage:**");
    if (auto.collision_deductible !== undefined) {
      sections.push(`- Collision Deductible: $${auto.collision_deductible}`);
    }
    if (auto.comprehensive_deductible !== undefined) {
      sections.push(`- Comprehensive Deductible: $${auto.comprehensive_deductible}`);
    }
  }

  // Additional coverages
  const additionalCoverages: string[] = [];
  if (auto.uninsured_motorist) {
    additionalCoverages.push(`Uninsured Motorist: $${auto.uninsured_motorist.toLocaleString()}`);
  }
  if (auto.underinsured_motorist) {
    additionalCoverages.push(`Underinsured Motorist: $${auto.underinsured_motorist.toLocaleString()}`);
  }
  if (auto.medical_payments) {
    additionalCoverages.push(`Medical Payments: $${auto.medical_payments.toLocaleString()}`);
  }
  if (auto.personal_injury_protection) {
    additionalCoverages.push(`PIP: $${auto.personal_injury_protection.toLocaleString()}`);
  }
  if (additionalCoverages.length > 0) {
    sections.push("\n**Additional Coverage:**");
    additionalCoverages.forEach(c => sections.push(`- ${c}`));
  }

  // Rental reimbursement
  if (auto.rental_reimbursement_daily || auto.rental_reimbursement_max) {
    sections.push("\n**Rental Reimbursement:**");
    if (auto.rental_reimbursement_daily) {
      sections.push(`- Daily Limit: $${auto.rental_reimbursement_daily}`);
    }
    if (auto.rental_reimbursement_max) {
      sections.push(`- Maximum: $${auto.rental_reimbursement_max}`);
    }
  }

  // Roadside assistance
  if (auto.roadside_assistance) {
    sections.push("\n**Roadside Assistance:** Yes");
    if (auto.roadside_details && auto.roadside_details.length > 0) {
      sections.push(`- Details: ${auto.roadside_details.join("; ")}`);
    }
  }

  // Gap coverage
  if (auto.gap_coverage) {
    sections.push("\n**Gap Coverage:** Yes");
  }

  // Covered vehicles
  if (auto.covered_vehicles && auto.covered_vehicles.length > 0) {
    sections.push(`\n**Covered Vehicles:** ${auto.covered_vehicles.join(", ")}`);
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
  if (home.policy_type) {
    sections.push(`Policy Type: ${home.policy_type}`);
  }

  // Dwelling coverage
  if (home.dwelling_coverage) {
    sections.push(`\n**Dwelling Coverage:** $${home.dwelling_coverage.toLocaleString()}`);
  }
  if (home.other_structures) {
    sections.push(`**Other Structures:** $${home.other_structures.toLocaleString()}`);
  }
  if (home.personal_property) {
    sections.push(`**Personal Property:** $${home.personal_property.toLocaleString()}`);
  }
  if (home.loss_of_use) {
    sections.push(`**Loss of Use:** $${home.loss_of_use.toLocaleString()}`);
  }

  // Liability
  if (home.personal_liability) {
    sections.push(`\n**Personal Liability:** $${home.personal_liability.toLocaleString()}`);
  }
  if (home.medical_payments) {
    sections.push(`**Medical Payments:** $${home.medical_payments.toLocaleString()}`);
  }

  // Deductibles
  const deductibles: string[] = [];
  if (home.standard_deductible) {
    deductibles.push(`Standard: $${home.standard_deductible}`);
  }
  if (home.wind_hail_deductible) {
    deductibles.push(`Wind/Hail: $${home.wind_hail_deductible}`);
  }
  if (home.hurricane_deductible) {
    deductibles.push(`Hurricane: $${home.hurricane_deductible}`);
  }
  if (deductibles.length > 0) {
    sections.push(`\n**Deductibles:** ${deductibles.join(", ")}`);
  }

  // Additional coverages
  const additional: string[] = [];
  if (home.water_backup) {
    additional.push(`Water Backup: $${home.water_backup.toLocaleString()}`);
  }
  if (home.identity_theft) {
    additional.push("Identity Theft Protection");
  }
  if (home.equipment_breakdown) {
    additional.push("Equipment Breakdown");
  }
  if (home.flood_coverage) {
    additional.push("Flood Coverage");
  }
  if (home.earthquake_coverage) {
    additional.push("Earthquake Coverage");
  }
  if (additional.length > 0) {
    sections.push(`\n**Additional Coverages:** ${additional.join("; ")}`);
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

  if (renters.personal_property) {
    sections.push(`\n**Personal Property:** $${renters.personal_property.toLocaleString()}`);
  }
  if (renters.loss_of_use) {
    sections.push(`**Loss of Use:** $${renters.loss_of_use.toLocaleString()}`);
  }
  if (renters.personal_liability) {
    sections.push(`**Personal Liability:** $${renters.personal_liability.toLocaleString()}`);
  }
  if (renters.medical_payments) {
    sections.push(`**Medical Payments:** $${renters.medical_payments.toLocaleString()}`);
  }
  if (renters.deductible) {
    sections.push(`**Deductible:** $${renters.deductible}`);
  }
  if (renters.replacement_cost) {
    sections.push(`**Replacement Cost Coverage:** Yes`);
  }
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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const body: RequestBody = await req.json();
    const { question, credit_cards, insurance_policies, conversation_history = [] } = body;

    if (!question || typeof question !== "string") {
      throw new Error("Question is required");
    }

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
