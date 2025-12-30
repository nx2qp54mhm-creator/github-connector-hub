// supabase/functions/extract-benefits/index.ts
// Deploy with: supabase functions deploy extract-benefits

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ExtractedBenefitData {
  rental?: {
    coverageType: "primary" | "secondary";
    maxCoverage: number;
    maxRentalDays: number;
    whatsCovered: string[];
    whatsNotCovered: string[];
    vehicleExclusions: string[];
    countryExclusions: string[];
  };
  tripProtection?: {
    cancellationCoverage: number;
    interruptionCoverage: number;
    delayCoverage: number;
    delayThresholdHours: number;
    coveredReasons: string[];
    exclusions: string[];
  };
  baggageProtection?: {
    delayCoverage: number;
    delayThresholdHours: number;
    lostBaggageCoverage: number;
    coverageDetails: string[];
    exclusions: string[];
  };
  purchaseProtection?: {
    maxPerClaim: number;
    maxPerYear: number;
    coveragePeriodDays: number;
    whatsCovered: string[];
    whatsNotCovered: string[];
  };
  extendedWarranty?: {
    extensionYears: number;
    maxOriginalWarrantyYears: number;
    maxPerClaim: number;
    coverageDetails: string[];
    exclusions: string[];
  };
  cellPhoneProtection?: {
    maxPerClaim: number;
    maxClaimsPerYear: number;
    deductible: number;
    coverageDetails: string[];
    requirements: string[];
    exclusions: string[];
  };
  roadsideAssistance?: {
    provider: string;
    towingMiles: number;
    services: string[];
    coverageDetails: string[];
    limitations: string[];
  };
  emergencyAssistance?: {
    evacuationCoverage: number;
    medicalCoverage: number;
    services: string[];
    coverageDetails: string[];
    exclusions: string[];
  };
  returnProtection?: {
    maxPerItem: number;
    maxPerYear: number;
    returnWindowDays: number;
    coverageDetails: string[];
    exclusions: string[];
  };
  travelPerks?: {
    loungeAccess: string[];
    travelCredits: { amount: number; description: string }[];
    otherPerks: string[];
  };
}

interface ExtractionConfidence {
  overall: number;
  rental?: number;
  tripProtection?: number;
  baggageProtection?: number;
  purchaseProtection?: number;
  extendedWarranty?: number;
  cellPhoneProtection?: number;
  roadsideAssistance?: number;
  emergencyAssistance?: number;
  returnProtection?: number;
  travelPerks?: number;
}

interface ExtractionResult {
  cardName: string;
  issuer: string;
  annualFee?: number;
  benefits: ExtractedBenefitData;
  confidence: ExtractionConfidence;
  sourceExcerpts: Record<string, string>;
}

interface RequestBody {
  documentId: string;
}

// ============================================
// EXTRACTION PROMPT
// ============================================

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured credit card benefit data from benefits guides and policy documents.

Your task is to carefully read the provided PDF document and extract all credit card benefit information into a structured JSON format.

## Output Format
You must respond with a JSON object containing the following structure:

{
  "cardName": "string - The name of the credit card",
  "issuer": "string - The card issuer (e.g., Chase, American Express, Citi)",
  "annualFee": "number or null - The annual fee if mentioned",
  "benefits": {
    "rental": {
      "coverageType": "primary or secondary",
      "maxCoverage": "number - Maximum coverage amount in USD",
      "maxRentalDays": "number - Maximum rental days covered",
      "whatsCovered": ["array of strings describing what's covered"],
      "whatsNotCovered": ["array of strings describing exclusions"],
      "vehicleExclusions": ["types of vehicles not covered"],
      "countryExclusions": ["countries where coverage doesn't apply"]
    },
    "tripProtection": {
      "cancellationCoverage": "number - Max cancellation coverage in USD",
      "interruptionCoverage": "number - Max interruption coverage in USD",
      "delayCoverage": "number - Max delay coverage in USD",
      "delayThresholdHours": "number - Hours delay before coverage kicks in",
      "coveredReasons": ["reasons that qualify for coverage"],
      "exclusions": ["what's not covered"]
    },
    "baggageProtection": {
      "delayCoverage": "number - Max delay coverage in USD",
      "delayThresholdHours": "number - Hours delay threshold",
      "lostBaggageCoverage": "number - Max lost baggage coverage in USD",
      "coverageDetails": ["coverage details"],
      "exclusions": ["exclusions"]
    },
    "purchaseProtection": {
      "maxPerClaim": "number - Max per claim in USD",
      "maxPerYear": "number - Max per year in USD",
      "coveragePeriodDays": "number - Days from purchase",
      "whatsCovered": ["what's covered"],
      "whatsNotCovered": ["what's not covered"]
    },
    "extendedWarranty": {
      "extensionYears": "number - Additional years of coverage",
      "maxOriginalWarrantyYears": "number - Max original warranty length eligible",
      "maxPerClaim": "number - Max per claim in USD",
      "coverageDetails": ["coverage details"],
      "exclusions": ["exclusions"]
    },
    "cellPhoneProtection": {
      "maxPerClaim": "number - Max per claim in USD",
      "maxClaimsPerYear": "number - Max claims per year",
      "deductible": "number - Deductible in USD",
      "coverageDetails": ["coverage details"],
      "requirements": ["requirements to qualify"],
      "exclusions": ["exclusions"]
    },
    "roadsideAssistance": {
      "provider": "string - Service provider name",
      "towingMiles": "number - Miles of free towing",
      "services": ["services included"],
      "coverageDetails": ["coverage details"],
      "limitations": ["limitations"]
    },
    "emergencyAssistance": {
      "evacuationCoverage": "number - Max evacuation coverage in USD",
      "medicalCoverage": "number - Max medical coverage in USD",
      "services": ["services included"],
      "coverageDetails": ["coverage details"],
      "exclusions": ["exclusions"]
    },
    "returnProtection": {
      "maxPerItem": "number - Max per item in USD",
      "maxPerYear": "number - Max per year in USD",
      "returnWindowDays": "number - Days to return",
      "coverageDetails": ["coverage details"],
      "exclusions": ["exclusions"]
    },
    "travelPerks": {
      "loungeAccess": ["lounge access benefits"],
      "travelCredits": [{"amount": "number", "description": "string"}],
      "otherPerks": ["other travel perks"]
    }
  },
  "confidence": {
    "overall": "number between 0 and 1",
    "rental": "number between 0 and 1",
    "tripProtection": "number between 0 and 1",
    ... (confidence for each benefit type extracted)
  },
  "sourceExcerpts": {
    "rental": "relevant text excerpt from document",
    "tripProtection": "relevant text excerpt from document",
    ... (source text for each benefit)
  }
}

## Confidence Scoring Guidelines
- 1.0: Explicitly stated with specific amounts/details
- 0.8-0.9: Clearly stated but some details inferred
- 0.6-0.8: Information present but somewhat ambiguous
- 0.4-0.6: Partially mentioned, significant inference required
- 0.0-0.4: Not found or very uncertain

## Important Rules
1. Only include benefit types that are actually mentioned in the document
2. Use null for fields where information is not available
3. Convert all monetary amounts to USD numbers (no currency symbols)
4. Extract exact wording for exclusions and coverage details
5. Include sourceExcerpts to show where you found each benefit
6. Be conservative with confidence scores - if unsure, score lower
7. If the document doesn't appear to be a credit card benefits guide, set overall confidence to 0.1 and explain in cardName field

Respond ONLY with the JSON object, no additional text.`;

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateOverallConfidence(confidence: Partial<ExtractionConfidence>): number {
  const scores = Object.values(confidence).filter(v => typeof v === "number") as number[];
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// Convert ArrayBuffer to base64 in chunks to avoid stack overflow for large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 8192;
  let binary = "";

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
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
    // Validate environment
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const body: RequestBody = await req.json();
    const { documentId } = body;

    if (!documentId) {
      throw new Error("documentId is required");
    }

    console.log(`Processing document: ${documentId}`);

    // Get document info from database
    const { data: document, error: docError } = await supabase
      .from("benefit_guide_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || "Unknown error"}`);
    }

    // Update status to processing
    await supabase
      .from("benefit_guide_documents")
      .update({ processing_status: "processing" })
      .eq("id", documentId);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("benefit-guides")
      .download(document.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("benefit_guide_documents")
        .update({
          processing_status: "failed",
          error_message: `Failed to download file: ${downloadError?.message || "Unknown error"}`
        })
        .eq("id", documentId);
      throw new Error(`Failed to download file: ${downloadError?.message || "Unknown error"}`);
    }

    // Convert PDF to base64 for Claude API
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    console.log(`PDF downloaded and converted, size: ${arrayBuffer.byteLength} bytes, base64 length: ${base64.length}`);

    // Call Claude API with PDF document
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              },
              {
                type: "text",
                text: `Please extract all credit card benefit information from this benefits guide document. The card is "${document.card_name || "Unknown"}" from "${document.issuer || "Unknown"}".`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);

      // Parse error for more details
      let errorMessage = `Claude API error: ${claudeResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `Claude API error: ${errorJson.error?.type || claudeResponse.status} - ${errorJson.error?.message || errorText.substring(0, 200)}`;
      } catch {
        errorMessage = `Claude API error: ${claudeResponse.status} - ${errorText.substring(0, 200)}`;
      }

      await supabase
        .from("benefit_guide_documents")
        .update({
          processing_status: "failed",
          error_message: errorMessage
        })
        .eq("id", documentId);

      throw new Error(errorMessage);
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0]?.text || "{}";

    console.log("Claude response received, parsing...");

    // Parse the extraction result
    let extractionResult: ExtractionResult;
    try {
      extractionResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", responseText);
      await supabase
        .from("benefit_guide_documents")
        .update({
          processing_status: "failed",
          error_message: "Failed to parse extraction result"
        })
        .eq("id", documentId);
      throw new Error("Failed to parse extraction result");
    }

    // Calculate overall confidence if not provided
    if (!extractionResult.confidence.overall) {
      extractionResult.confidence.overall = calculateOverallConfidence(extractionResult.confidence);
    }

    // Store extracted benefits in the database
    const benefitTypes = Object.keys(extractionResult.benefits) as Array<keyof ExtractedBenefitData>;

    for (const benefitType of benefitTypes) {
      const benefitData = extractionResult.benefits[benefitType];
      if (!benefitData) continue;

      const confidence = extractionResult.confidence[benefitType] || 0.5;
      const sourceExcerpt = extractionResult.sourceExcerpts?.[benefitType] || null;

      await supabase
        .from("extracted_benefits")
        .insert({
          document_id: documentId,
          card_id: document.card_id || "new",
          benefit_type: benefitType,
          extracted_data: benefitData,
          confidence_score: confidence,
          source_excerpt: sourceExcerpt,
          requires_review: confidence < 0.8,
          review_status: "pending",
        });
    }

    // Update document status to completed
    await supabase
      .from("benefit_guide_documents")
      .update({
        processing_status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Log the extraction
    await supabase
      .from("admin_audit_log")
      .insert({
        action: "extract_benefits",
        entity_type: "benefit_guide_document",
        entity_id: documentId,
        details: {
          card_name: extractionResult.cardName,
          issuer: extractionResult.issuer,
          benefits_extracted: benefitTypes.length,
          overall_confidence: extractionResult.confidence.overall,
        },
        performed_by: document.uploaded_by,
      });

    console.log(`Extraction completed for document ${documentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        extraction: {
          cardName: extractionResult.cardName,
          issuer: extractionResult.issuer,
          annualFee: extractionResult.annualFee,
          benefitsExtracted: benefitTypes.length,
          confidence: extractionResult.confidence,
        },
        usage: {
          input_tokens: claudeData.usage?.input_tokens || 0,
          output_tokens: claudeData.usage?.output_tokens || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in extract-benefits:", errorMessage, error);

    // Try to update document status to failed if we have the documentId
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.documentId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("benefit_guide_documents")
          .update({
            processing_status: "failed",
            error_message: errorMessage.substring(0, 500)
          })
          .eq("id", body.documentId);
      }
    } catch (updateError) {
      console.error("Failed to update document status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
