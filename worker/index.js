/**
 * Benefit Extraction Worker
 *
 * A standalone background worker for processing PDF benefit guides with Claude AI.
 * Can be deployed to Railway, Render, Fly.io, or any Node.js host.
 *
 * No timeout limits - processes PDFs of any size.
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WORKER_SECRET = process.env.WORKER_SECRET; // For authenticating requests

const PORT = process.env.PORT || 3001;

// Initialize clients lazily to prevent startup crashes
let anthropic = null;
let supabase = null;

function getAnthropicClient() {
  if (!anthropic && ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
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

function calculateOverallConfidence(confidence) {
  const scores = Object.values(confidence).filter(v => typeof v === 'number');
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ============================================
// EXTRACTION ENDPOINT
// ============================================

app.post('/extract', async (req, res) => {
  const startTime = Date.now();

  // Authenticate request
  const authHeader = req.headers.authorization;
  if (WORKER_SECRET && authHeader !== `Bearer ${WORKER_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required' });
  }

  console.log(`[Worker] Starting extraction for document: ${documentId}`);

  // Return immediately - processing continues async
  res.json({
    success: true,
    message: 'Extraction started',
    documentId
  });

  // Process in background
  processExtraction(documentId, startTime).catch(err => {
    console.error(`[Worker] Extraction failed for ${documentId}:`, err.message);
  });
});

async function processExtraction(documentId, startTime) {
  const supabaseClient = getSupabaseClient();
  const anthropicClient = getAnthropicClient();

  if (!supabaseClient) {
    console.error('[Worker] Supabase not configured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  if (!anthropicClient) {
    console.error('[Worker] Anthropic not configured - missing ANTHROPIC_API_KEY');
    return;
  }

  try {
    // Get document info from database
    const { data: document, error: docError } = await supabaseClient
      .from('benefit_guide_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
    }

    // Update status to processing
    await supabaseClient
      .from('benefit_guide_documents')
      .update({
        processing_status: 'processing',
        error_message: null
      })
      .eq('id', documentId);

    console.log(`[Worker] Downloading PDF: ${document.file_path}`);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('benefit-guides')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    console.log(`[Worker] PDF downloaded, size: ${arrayBuffer.byteLength} bytes. Calling Claude API...`);

    // Call Claude API with PDF
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Please extract all credit card benefit information from this benefits guide document. The card is "${document.card_name || 'Unknown'}" from "${document.issuer || 'Unknown'}".`,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0]?.text || '{}';
    console.log(`[Worker] Claude response received. Tokens: ${response.usage?.input_tokens} in, ${response.usage?.output_tokens} out`);

    // Parse the extraction result
    let extractionResult;
    try {
      extractionResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Worker] Failed to parse Claude response:', responseText.substring(0, 500));
      throw new Error('Failed to parse extraction result - Claude returned invalid JSON');
    }

    // Calculate overall confidence if not provided
    if (!extractionResult.confidence?.overall) {
      extractionResult.confidence = extractionResult.confidence || { overall: 0 };
      extractionResult.confidence.overall = calculateOverallConfidence(extractionResult.confidence);
    }

    // Store extracted benefits in the database
    const benefitTypes = Object.keys(extractionResult.benefits || {});

    for (const benefitType of benefitTypes) {
      const benefitData = extractionResult.benefits[benefitType];
      if (!benefitData) continue;

      const confidence = extractionResult.confidence[benefitType] || 0.5;
      const sourceExcerpt = extractionResult.sourceExcerpts?.[benefitType] || null;

      await supabaseClient
        .from('extracted_benefits')
        .insert({
          document_id: documentId,
          card_id: document.card_id || 'new',
          benefit_type: benefitType,
          extracted_data: benefitData,
          confidence_score: confidence,
          source_excerpt: sourceExcerpt,
          requires_review: confidence < 0.8,
          review_status: 'pending',
        });
    }

    // Update document status to completed
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    await supabaseClient
      .from('benefit_guide_documents')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', documentId);

    // Log the extraction
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        action: 'extract_benefits',
        entity_type: 'benefit_guide_document',
        entity_id: documentId,
        details: {
          card_name: extractionResult.cardName,
          issuer: extractionResult.issuer,
          benefits_extracted: benefitTypes.length,
          overall_confidence: extractionResult.confidence.overall,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          duration_seconds: parseFloat(duration),
          processor: 'worker',
        },
        performed_by: document.uploaded_by,
      });

    console.log(`[Worker] Extraction completed for ${documentId}: ${benefitTypes.length} benefits in ${duration}s`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error(`[Worker] Extraction failed for ${documentId}:`, errorMessage);

    // Update document status to failed
    try {
      await supabaseClient
        .from('benefit_guide_documents')
        .update({
          processing_status: 'failed',
          error_message: errorMessage.substring(0, 500),
        })
        .eq('id', documentId);
    } catch (updateError) {
      console.error('[Worker] Failed to update document status:', updateError.message);
    }
  }
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    config: {
      anthropic: !!ANTHROPIC_API_KEY,
      supabase: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      workerSecret: !!WORKER_SECRET
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'Benefit Extraction Worker',
    status: 'running',
    endpoints: {
      'POST /extract': 'Start PDF extraction (body: { documentId })',
      'GET /health': 'Health check'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`[Worker] Benefit Extraction Worker running on port ${PORT}`);
  console.log(`[Worker] Environment: ${process.env.NODE_ENV || 'development'}`);

  if (!ANTHROPIC_API_KEY) {
    console.warn('[Worker] WARNING: ANTHROPIC_API_KEY not set');
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Worker] WARNING: Supabase credentials not set');
  }
});
