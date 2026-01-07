// supabase/functions/smart-worker/index.ts
// Deploy with: npx supabase functions deploy smart-worker
//
// Processes user-uploaded insurance policy documents and extracts coverage data.
// Supports auto, home, and renters insurance policies.

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

interface AutoPolicyData {
  insuranceCompany?: string;
  policyNumber?: string;
  policyHolderName?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;

  // Collision coverage
  collisionCovered?: boolean;
  collisionDeductible?: number;

  // Comprehensive coverage
  comprehensiveCovered?: boolean;
  comprehensiveDeductible?: number;

  // Liability coverage
  bodilyInjuryPerPerson?: number;
  bodilyInjuryPerAccident?: number;
  propertyDamageLimit?: number;

  // Medical payments
  medicalPaymentsCovered?: boolean;
  medicalPaymentsLimit?: number;

  // Uninsured motorist
  uninsuredMotoristCovered?: boolean;
  uninsuredMotoristPerPerson?: number;
  uninsuredMotoristPerAccident?: number;

  // Rental reimbursement
  rentalReimbursementCovered?: boolean;
  rentalReimbursementDaily?: number;
  rentalReimbursementMax?: number;

  // Roadside assistance
  roadsideAssistanceCovered?: boolean;

  // Premium
  premiumAmount?: number;
  premiumFrequency?: string; // monthly, semi-annual, annual

  // Confidence score
  confidence?: number;
}

interface HomePolicyData {
  insuranceCompany?: string;
  policyNumber?: string;
  policyHolderName?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;

  // Dwelling coverage
  dwellingCoverage?: number;

  // Personal property
  personalPropertyCoverage?: number;

  // Liability
  liabilityCoverage?: number;

  // Deductibles
  deductible?: number;

  // Additional coverages
  floodCovered?: boolean;
  earthquakeCovered?: boolean;

  // Premium
  premiumAmount?: number;
  premiumFrequency?: string;

  confidence?: number;
}

interface RentersPolicyData {
  insuranceCompany?: string;
  policyNumber?: string;
  policyHolderName?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;

  // Personal property
  personalPropertyCoverage?: number;

  // Liability
  liabilityCoverage?: number;

  // Medical payments
  medicalPaymentsLimit?: number;

  // Deductible
  deductible?: number;

  // Premium
  premiumAmount?: number;
  premiumFrequency?: string;

  confidence?: number;
}

interface ExtractionResult {
  policyType: "auto" | "home" | "renters";
  data: AutoPolicyData | HomePolicyData | RentersPolicyData;
}

interface RequestBody {
  document_id: string;
}

// ============================================
// EXTRACTION PROMPTS
// ============================================

const AUTO_POLICY_PROMPT = `You are an expert at extracting structured data from auto insurance policy documents.

Your task is to carefully read the provided insurance document and extract all relevant policy information into a structured JSON format.

## Output Format
You must respond with a JSON object containing:

{
  "policyType": "auto",
  "data": {
    "insuranceCompany": "string - Name of insurance company",
    "policyNumber": "string - Policy number",
    "policyHolderName": "string - Name of insured person",
    "coverageStartDate": "YYYY-MM-DD - Policy effective date",
    "coverageEndDate": "YYYY-MM-DD - Policy expiration date",

    "collisionCovered": "boolean - Whether collision is covered",
    "collisionDeductible": "number - Deductible amount in USD",

    "comprehensiveCovered": "boolean - Whether comprehensive is covered",
    "comprehensiveDeductible": "number - Deductible amount in USD",

    "bodilyInjuryPerPerson": "number - Bodily injury limit per person in USD",
    "bodilyInjuryPerAccident": "number - Bodily injury limit per accident in USD",
    "propertyDamageLimit": "number - Property damage limit in USD",

    "medicalPaymentsCovered": "boolean - Whether medical payments covered",
    "medicalPaymentsLimit": "number - Medical payments limit in USD",

    "uninsuredMotoristCovered": "boolean - Whether uninsured motorist covered",
    "uninsuredMotoristPerPerson": "number - UM limit per person in USD",
    "uninsuredMotoristPerAccident": "number - UM limit per accident in USD",

    "rentalReimbursementCovered": "boolean - Whether rental reimbursement covered",
    "rentalReimbursementDaily": "number - Daily rental limit in USD",
    "rentalReimbursementMax": "number - Maximum rental reimbursement in USD",

    "roadsideAssistanceCovered": "boolean - Whether roadside assistance included",

    "premiumAmount": "number - Premium amount in USD",
    "premiumFrequency": "string - monthly, semi-annual, or annual",

    "confidence": "number between 0 and 1 - Overall extraction confidence"
  }
}

## Important Rules
1. Only include fields where information is found in the document
2. Use null for fields where information is not available
3. Convert all monetary amounts to USD numbers (no currency symbols)
4. Use ISO date format (YYYY-MM-DD) for dates
5. Be conservative with confidence scores - if unsure, score lower
6. Confidence scoring:
   - 1.0: All information explicitly stated
   - 0.8-0.9: Most information clear, some details inferred
   - 0.6-0.8: Information present but some ambiguity
   - 0.4-0.6: Partially complete information
   - 0.0-0.4: Very little information found

Respond ONLY with the JSON object, no additional text.`;

const HOME_POLICY_PROMPT = `You are an expert at extracting structured data from home insurance policy documents.

Extract all relevant policy information into this JSON format:

{
  "policyType": "home",
  "data": {
    "insuranceCompany": "string",
    "policyNumber": "string",
    "policyHolderName": "string",
    "coverageStartDate": "YYYY-MM-DD",
    "coverageEndDate": "YYYY-MM-DD",
    "dwellingCoverage": "number - Dwelling coverage limit in USD",
    "personalPropertyCoverage": "number - Personal property limit in USD",
    "liabilityCoverage": "number - Liability limit in USD",
    "deductible": "number - Standard deductible in USD",
    "floodCovered": "boolean",
    "earthquakeCovered": "boolean",
    "premiumAmount": "number",
    "premiumFrequency": "string - monthly, semi-annual, or annual",
    "confidence": "number between 0 and 1"
  }
}

Use null for unavailable fields. Respond only with JSON.`;

const RENTERS_POLICY_PROMPT = `You are an expert at extracting structured data from renters insurance policy documents.

Extract all relevant policy information into this JSON format:

{
  "policyType": "renters",
  "data": {
    "insuranceCompany": "string",
    "policyNumber": "string",
    "policyHolderName": "string",
    "coverageStartDate": "YYYY-MM-DD",
    "coverageEndDate": "YYYY-MM-DD",
    "personalPropertyCoverage": "number - Personal property limit in USD",
    "liabilityCoverage": "number - Liability limit in USD",
    "medicalPaymentsLimit": "number - Medical payments limit in USD",
    "deductible": "number - Deductible in USD",
    "premiumAmount": "number",
    "premiumFrequency": "string - monthly, semi-annual, or annual",
    "confidence": "number between 0 and 1"
  }
}

Use null for unavailable fields. Respond only with JSON.`;

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function getPromptForPolicyType(policyType: string): string {
  switch (policyType) {
    case "auto":
      return AUTO_POLICY_PROMPT;
    case "home":
      return HOME_POLICY_PROMPT;
    case "renters":
      return RENTERS_POLICY_PROMPT;
    default:
      return AUTO_POLICY_PROMPT; // Default to auto
  }
}

// ============================================
// EXTRACTION PROCESSOR
// ============================================

async function processExtraction(documentId: string, document: Record<string, unknown>) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    console.log(`[Background] Starting extraction for document: ${documentId}`);

    const policyType = document.policy_type as string || "auto";
    const userId = document.user_id as string;

    // Update status to processing
    await supabase
      .from("policy_documents")
      .update({ processing_status: "processing" })
      .eq("id", documentId);

    // Download document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("insurance-documents")
      .download(document.file_path as string);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || "Unknown error"}`);
    }

    // Convert to base64 for Claude API
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeType = document.mime_type as string || "application/pdf";

    console.log(`[Background] Document converted, size: ${arrayBuffer.byteLength} bytes, type: ${mimeType}`);

    // Determine document type for Claude API
    let documentType: "document" | "image" = "document";
    let mediaType = mimeType;

    if (mimeType.startsWith("image/")) {
      documentType = "image";
      // Claude expects specific image formats
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)) {
        mediaType = "image/jpeg"; // Default for unsupported image types
      }
    } else {
      mediaType = "application/pdf";
    }

    // Call Claude API
    const prompt = getPromptForPolicyType(policyType);
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: prompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: documentType,
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: `Please extract all ${policyType} insurance policy information from this document.`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[Background] Claude API error:", claudeResponse.status, errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0]?.text || "{}";

    console.log("[Background] Claude response received, parsing...");

    // Parse extraction result
    let extractionResult: ExtractionResult;
    try {
      let jsonText = responseText;
      // Strip markdown code blocks if present
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      extractionResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[Background] Failed to parse Claude response:", responseText.substring(0, 500));
      throw new Error("Failed to parse extraction result - invalid JSON");
    }

    // Store extracted data based on policy type
    if (policyType === "auto") {
      const autoData = extractionResult.data as AutoPolicyData;

      await supabase
        .from("auto_policies")
        .insert({
          user_id: userId,
          document_id: documentId,
          insurance_company: autoData.insuranceCompany || null,
          policy_number: autoData.policyNumber || null,
          policy_holder_name: autoData.policyHolderName || null,
          coverage_start_date: autoData.coverageStartDate || null,
          coverage_end_date: autoData.coverageEndDate || null,
          collision_covered: autoData.collisionCovered ?? null,
          collision_deductible: autoData.collisionDeductible ?? null,
          comprehensive_covered: autoData.comprehensiveCovered ?? null,
          comprehensive_deductible: autoData.comprehensiveDeductible ?? null,
          bodily_injury_per_person: autoData.bodilyInjuryPerPerson ?? null,
          bodily_injury_per_accident: autoData.bodilyInjuryPerAccident ?? null,
          property_damage_limit: autoData.propertyDamageLimit ?? null,
          medical_payments_covered: autoData.medicalPaymentsCovered ?? null,
          medical_payments_limit: autoData.medicalPaymentsLimit ?? null,
          uninsured_motorist_covered: autoData.uninsuredMotoristCovered ?? null,
          uninsured_motorist_per_person: autoData.uninsuredMotoristPerPerson ?? null,
          uninsured_motorist_per_accident: autoData.uninsuredMotoristPerAccident ?? null,
          rental_reimbursement_covered: autoData.rentalReimbursementCovered ?? null,
          rental_reimbursement_daily: autoData.rentalReimbursementDaily ?? null,
          rental_reimbursement_max: autoData.rentalReimbursementMax ?? null,
          roadside_assistance_covered: autoData.roadsideAssistanceCovered ?? null,
          premium_amount: autoData.premiumAmount ?? null,
          premium_frequency: autoData.premiumFrequency || null,
          raw_extracted_data: extractionResult,
        });
    }
    // Note: Home and renters policies would need their own tables created
    // For now, we'll just store the raw data in policy_documents

    // Update document status to completed
    await supabase
      .from("policy_documents")
      .update({
        processing_status: "completed",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    console.log(`[Background] Extraction completed for document ${documentId}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`[Background] Extraction failed for document ${documentId}:`, errorMessage);

    // Update document status to failed
    await supabase
      .from("policy_documents")
      .update({
        processing_status: "failed",
        error_message: errorMessage.substring(0, 500),
      })
      .eq("id", documentId);
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
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

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const body: RequestBody = await req.json();
    const { document_id } = body;

    if (!document_id) {
      throw new Error("document_id is required");
    }

    console.log(`Received extraction request for document: ${document_id}`);

    // Get document info from database
    const { data: document, error: docError } = await supabase
      .from("policy_documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || "Unknown error"}`);
    }

    // Check if already processing
    if (document.processing_status === "processing") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Document is already being processed",
          documentId: document_id,
          status: "processing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process in background using EdgeRuntime.waitUntil
    // @ts-expect-error - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-expect-error - EdgeRuntime.waitUntil is a Supabase Edge Function API
      EdgeRuntime.waitUntil(processExtraction(document_id, document));
      console.log(`Background extraction started for document: ${document_id}`);
    } else {
      // Fallback: process inline
      console.log(`EdgeRuntime.waitUntil not available, processing inline for document: ${document_id}`);
      await processExtraction(document_id, document);
    }

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: "Extraction started - processing in background",
        documentId: document_id,
        status: "processing",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in smart-worker:", errorMessage);

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
