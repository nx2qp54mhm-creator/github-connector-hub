// supabase/functions/coverage-assistant/index.ts
// Deploy with: supabase functions deploy coverage-assistant

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Additional benefits
  trip_protection?: TripProtection;
  baggage_protection?: BaggageProtection;
  purchase_protection?: PurchaseProtection;
  extended_warranty?: ExtendedWarranty;
  travel_perks?: TravelPerks;
}

interface InsurancePolicy {
  policy_name: string;
  policy_type: string;
  coverage_details?: string;
  deductible?: number;
  limits?: Record<string, number>;
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

    return sections.join("\n");
  }).join("\n\n---\n\n");
}

function formatPolicyInfo(policies: InsurancePolicy[]): string {
  if (!policies || policies.length === 0) {
    return "No insurance policies or protection plans added.";
  }

  return policies.map(policy => {
    const sections: string[] = [];
    sections.push(`## ${policy.policy_name}`);
    sections.push(`Type: ${policy.policy_type}`);

    if (policy.coverage_details) {
      sections.push(`Coverage Details: ${policy.coverage_details}`);
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
- **Rental Car Coverage**: Primary vs secondary coverage, limits, exclusions, vehicle types, country restrictions
- **Trip Protection**: Trip cancellation, interruption, and delay coverage, covered reasons, exclusions
- **Baggage Protection**: Lost, delayed, and damaged baggage coverage, reimbursement limits
- **Purchase Protection**: Coverage for theft and damage to purchased items, time limits, exclusions
- **Extended Warranty**: Additional warranty coverage beyond manufacturer warranty
- **Travel Perks**: Airport lounge access, travel credits, elite status, and other benefits
- **Insurance Policies**: Auto, home, renters insurance details
- **Protection Plans**: AppleCare+, Amazon Protection, carrier insurance, etc.

## User's Credit Card Coverage
${cardInfo}

## User's Insurance Policies & Protection Plans
${policyInfo}

## Response Guidelines
1. **Be specific**: Reference the user's actual cards and their specific coverage limits
2. **Be accurate**: Only state coverage details that are explicitly listed above
3. **Be helpful**: If asked about something not covered, explain why and suggest alternatives if applicable
4. **Be concise**: Keep responses focused and easy to understand
5. **Compare when relevant**: If the user has multiple cards with similar benefits, compare them
6. **Clarify coverage type**: For rental cars, always clarify if coverage is primary or secondary
7. **Mention exclusions**: When relevant, mention what's NOT covered to set proper expectations
8. **Use formatting**: Use **bold** for emphasis on important terms and limits

## Important Notes
- If asked about coverage the user doesn't have, politely explain they don't have that coverage
- If a question is outside the scope of coverage (e.g., general travel advice), redirect to coverage-related assistance
- Always be clear about which card or policy provides specific coverage
- When comparing cards, highlight the most relevant differences for the user's question`;
}

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
        model: "claude-3-5-sonnet-20241022",
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
