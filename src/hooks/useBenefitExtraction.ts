import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExtractionResult {
  cardName: string;
  issuer: string;
  annualFee?: number;
  benefitsExtracted: number;
  confidence: {
    overall: number;
    [key: string]: number | undefined;
  };
}

interface ExtractionState {
  isExtracting: boolean;
  error: string | null;
  result: ExtractionResult | null;
}

interface ExtractedBenefit {
  id: string;
  document_id: string;
  card_id: string;
  benefit_type: string;
  extracted_data: Record<string, unknown>;
  confidence_score: number;
  source_excerpt: string | null;
  requires_review: boolean;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useBenefitExtraction() {
  const [state, setState] = useState<ExtractionState>({
    isExtracting: false,
    error: null,
    result: null,
  });

  const startExtraction = useCallback(async (documentId: string) => {
    setState({ isExtracting: true, error: null, result: null });

    try {
      const { data, error } = await supabase.functions.invoke("extract-benefits", {
        body: { documentId },
      });

      if (error) {
        throw new Error(error.message || "Extraction failed");
      }

      if (!data.success) {
        throw new Error(data.error || "Extraction failed");
      }

      setState({
        isExtracting: false,
        error: null,
        result: data.extraction,
      });

      return data.extraction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setState({
        isExtracting: false,
        error: errorMessage,
        result: null,
      });
      throw err;
    }
  }, []);

  const getExtractedBenefits = useCallback(async (documentId: string): Promise<ExtractedBenefit[]> => {
    const { data, error } = await supabase
      .from("extracted_benefits")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }, []);

  const approveBenefit = useCallback(async (benefitId: string, userId: string) => {
    const { error } = await supabase
      .from("extracted_benefits")
      .update({
        review_status: "approved",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", benefitId);

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const rejectBenefit = useCallback(async (benefitId: string, userId: string) => {
    const { error } = await supabase
      .from("extracted_benefits")
      .update({
        review_status: "rejected",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", benefitId);

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const updateBenefitData = useCallback(async (benefitId: string, newData: Record<string, unknown>) => {
    const { error } = await supabase
      .from("extracted_benefits")
      .update({
        extracted_data: newData,
      })
      .eq("id", benefitId);

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  return {
    ...state,
    startExtraction,
    getExtractedBenefits,
    approveBenefit,
    rejectBenefit,
    updateBenefitData,
  };
}
