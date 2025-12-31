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
  source_excerpts: string[] | null;
  requires_review: boolean;
  is_approved: boolean | null;
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
        is_approved: true,
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
        is_approved: false,
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

  const deleteDocument = useCallback(async (documentId: string) => {
    // First get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from("benefit_guide_documents")
      .select("file_path")
      .eq("id", documentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`);
    }

    // Delete associated extracted benefits
    const { error: benefitsError } = await supabase
      .from("extracted_benefits")
      .delete()
      .eq("document_id", documentId);

    if (benefitsError) {
      console.error("Failed to delete benefits:", benefitsError);
      // Continue anyway - document deletion is more important
    }

    // Delete the file from storage
    if (document?.file_path) {
      const { error: storageError } = await supabase.storage
        .from("benefit-guides")
        .remove([document.file_path]);

      if (storageError) {
        console.error("Failed to delete file from storage:", storageError);
        // Continue anyway - database cleanup is more important
      }
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from("benefit_guide_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`);
    }

    // Log the deletion
    await supabase
      .from("admin_audit_log")
      .insert({
        action: "delete",
        entity_type: "document",
        entity_id: documentId,
        new_data: { file_path: document?.file_path },
        change_summary: "Document deleted",
      });
  }, []);

  return {
    ...state,
    startExtraction,
    getExtractedBenefits,
    approveBenefit,
    rejectBenefit,
    updateBenefitData,
    deleteDocument,
  };
}
