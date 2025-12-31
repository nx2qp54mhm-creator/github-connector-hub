import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBenefitExtraction } from "@/hooks/useBenefitExtraction";
import { BenefitEditor } from "@/components/admin/BenefitEditor";
import { ConfidenceBadge } from "@/components/admin/ConfidenceBadge";
import { JSONGenerator } from "@/components/admin/JSONGenerator";
import { toast } from "sonner";

interface DocumentInfo {
  id: string;
  issuer: string;
  card_id: string | null;
  card_name: string | null;
  file_name: string;
  processing_status: string;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
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

export default function AdminReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const documentId = searchParams.get("document");
  const { user } = useAuth();
  const { startExtraction, approveBenefit, rejectBenefit, updateBenefitData, deleteDocument } = useBenefitExtraction();

  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [benefits, setBenefits] = useState<ExtractedBenefit[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch document details and extracted benefits
  const fetchDocumentDetails = async (docId: string) => {
    const { data: docData, error: docError } = await supabase
      .from("benefit_guide_documents")
      .select("*")
      .eq("id", docId)
      .single();

    if (docError) {
      console.error("Error fetching document:", docError);
      return;
    }

    setDocument(docData);

    // Fetch extracted benefits if processing is complete
    if (docData.processing_status === "completed") {
      const { data: benefitsData, error: benefitsError } = await supabase
        .from("extracted_benefits")
        .select("*")
        .eq("document_id", docId)
        .order("created_at", { ascending: true });

      if (!benefitsError && benefitsData) {
        setBenefits(benefitsData);
      }
    }
  };

  // Fetch pending documents for review
  const fetchPendingDocuments = async () => {
    const { data, error } = await supabase
      .from("benefit_guide_documents")
      .select("*")
      .in("processing_status", ["pending", "processing", "completed"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setPendingDocuments(data);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (documentId) {
        await fetchDocumentDetails(documentId);
      }
      await fetchPendingDocuments();
      setIsLoading(false);
    };

    loadData();

    // Set up real-time subscription for document status changes
    const channel = supabase
      .channel("document-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "benefit_guide_documents",
          filter: documentId ? `id=eq.${documentId}` : undefined,
        },
        (payload) => {
          console.log("Document updated:", payload);
          if (documentId) {
            fetchDocumentDetails(documentId);
          }
          fetchPendingDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (documentId) {
      await fetchDocumentDetails(documentId);
    }
    await fetchPendingDocuments();
    setIsRefreshing(false);
  };

  const handleRetryExtraction = async () => {
    if (!documentId) return;
    setIsRetrying(true);
    try {
      await startExtraction(documentId);
      toast.success("Extraction restarted successfully");
      await fetchDocumentDetails(documentId);
    } catch (error) {
      toast.error("Failed to restart extraction", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleApprove = async (benefitId: string) => {
    if (!user) return;
    try {
      await approveBenefit(benefitId, user.id);
      setBenefits((prev) =>
        prev.map((b) => (b.id === benefitId ? { ...b, review_status: "approved" } : b))
      );
      toast.success("Benefit approved");
    } catch (error) {
      toast.error("Failed to approve benefit");
    }
  };

  const handleReject = async (benefitId: string) => {
    if (!user) return;
    try {
      await rejectBenefit(benefitId, user.id);
      setBenefits((prev) =>
        prev.map((b) => (b.id === benefitId ? { ...b, review_status: "rejected" } : b))
      );
      toast.success("Benefit rejected");
    } catch (error) {
      toast.error("Failed to reject benefit");
    }
  };

  const handleUpdate = async (benefitId: string, newData: Record<string, unknown>) => {
    try {
      await updateBenefitData(benefitId, newData);
      setBenefits((prev) =>
        prev.map((b) => (b.id === benefitId ? { ...b, extracted_data: newData } : b))
      );
      toast.success("Benefit data updated");
    } catch (error) {
      toast.error("Failed to update benefit");
    }
  };

  const handleApproveAll = async () => {
    if (!user) return;
    const pendingBenefits = benefits.filter((b) => b.review_status === "pending");
    for (const benefit of pendingBenefits) {
      await handleApprove(benefit.id);
    }
    toast.success(`Approved ${pendingBenefits.length} benefits`);
  };

  const handleDelete = async (docId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(docId);
    try {
      await deleteDocument(docId);
      toast.success("Document deleted successfully");

      // If we're viewing this document, go back to the list
      if (documentId === docId) {
        navigate("/admin/review");
      } else {
        // Refresh the list
        await fetchPendingDocuments();
      }
    } catch (error) {
      toast.error("Failed to delete document", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "processing":
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const pendingReviewCount = benefits.filter((b) => b.review_status === "pending").length;
  const overallConfidence =
    benefits.length > 0
      ? benefits.reduce((sum, b) => sum + (b.confidence_score || 0), 0) / benefits.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Extractions</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve AI-extracted benefit data
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {documentId && document ? (
        <>
          {/* Back link */}
          <Link
            to="/admin/review"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to all documents
          </Link>

          {/* Document info card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {document.card_name || "Unknown Card"}
                    {getStatusIcon(document.processing_status)}
                  </CardTitle>
                  <CardDescription>
                    {document.issuer} - {document.file_name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      document.processing_status === "completed"
                        ? "default"
                        : document.processing_status === "failed"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {document.processing_status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDelete(document.id, e)}
                    disabled={isDeleting === document.id}
                  >
                    {isDeleting === document.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {document.processing_status === "processing" && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                  <div>
                    <p className="font-medium">AI extraction in progress...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few minutes. The page will update automatically.
                    </p>
                  </div>
                </div>
              )}

              {document.processing_status === "failed" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Extraction failed</p>
                      <p className="text-sm text-muted-foreground">
                        {document.error_message || "Unknown error occurred"}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleRetryExtraction} disabled={isRetrying}>
                    {isRetrying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Extraction
                      </>
                    )}
                  </Button>
                </div>
              )}

              {document.processing_status === "completed" && benefits.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Benefits Extracted</p>
                    <p className="text-2xl font-semibold">{benefits.length}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-semibold">{pendingReviewCount}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Overall Confidence</p>
                    <div className="mt-1">
                      <ConfidenceBadge score={overallConfidence} size="lg" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted benefits */}
          {document.processing_status === "completed" && benefits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Extracted Benefits</h2>
                {pendingReviewCount > 0 && (
                  <Button onClick={handleApproveAll} className="bg-success hover:bg-success/90">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All ({pendingReviewCount})
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <BenefitEditor
                    key={benefit.id}
                    benefitId={benefit.id}
                    benefitType={benefit.benefit_type}
                    extractedData={benefit.extracted_data}
                    confidenceScore={benefit.confidence_score}
                    sourceExcerpt={benefit.source_excerpt}
                    reviewStatus={benefit.review_status}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>

              {/* JSON Generator - shows after benefits are approved */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Export Card Data</h2>
                <JSONGenerator document={document} benefits={benefits} />
              </div>
            </div>
          )}

          {document.processing_status === "completed" && benefits.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No benefits were extracted from this document.
                </p>
                <Button className="mt-4" onClick={handleRetryExtraction} disabled={isRetrying}>
                  Retry Extraction
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Document list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Documents</h2>

            {pendingDocuments.length > 0 ? (
              <div className="space-y-3">
                {pendingDocuments.map((doc) => (
                  <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/admin/review?document=${doc.id}`}
                          className="flex items-center gap-3 flex-1"
                        >
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-base">
                              {doc.card_name || "Unknown Card"}
                            </CardTitle>
                            <CardDescription>
                              {doc.issuer} - {doc.file_name}
                            </CardDescription>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.processing_status)}
                          <Badge
                            variant={
                              doc.processing_status === "completed"
                                ? "default"
                                : doc.processing_status === "failed"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {doc.processing_status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(doc.id, e)}
                            disabled={isDeleting === doc.id}
                          >
                            {isDeleting === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No pending extractions to review.</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Upload a benefits guide to get started.
                  </p>
                  <Link to="/admin/upload">
                    <Button className="mt-4">Upload Guide</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
