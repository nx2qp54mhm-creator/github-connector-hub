import { useState, useCallback } from "react";
import { Plus, CheckCircle2, XCircle, Trash2, RefreshCw, Loader2, AlertTriangle, Car, Globe, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CategoryDefinition, CreditCard } from "@/types/coverage";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { RentalCardComparison } from "@/components/RentalCardComparison";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { AutoPolicyDetails } from "@/components/AutoPolicyDetails";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentPolling } from "@/hooks/useDocumentPolling";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CategoryDetailSheetProps {
  category: CategoryDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCoverage: () => void;
}

interface CardExclusionsSectionProps {
  card: CreditCard;
}

function CardExclusionsSection({ card }: CardExclusionsSectionProps): React.ReactElement {
  const exclusions = card.rentalExclusions;

  if (!exclusions) {
    return (
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <h4 className="font-semibold text-foreground mb-2">{card.fullName}</h4>
        <p className="text-sm text-muted-foreground">No exclusion data available for this card.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      <h4 className="font-semibold text-foreground text-base">{card.fullName}</h4>

      {/* Situations Not Covered */}
      {exclusions.what_is_not_covered.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger" />
            Situations Not Covered
          </h5>
          <ul className="space-y-1.5 pl-6">
            {exclusions.what_is_not_covered.map((item, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground relative before:content-['•'] before:absolute before:-left-4 before:text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Excluded Vehicles */}
      {exclusions.vehicle_exclusions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Car className="w-4 h-4 text-danger" />
            Excluded Vehicles
          </h5>
          <ul className="space-y-1.5 pl-6">
            {exclusions.vehicle_exclusions.map((item, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground relative before:content-['•'] before:absolute before:-left-4 before:text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Countries Not Covered */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-danger" />
          Countries Not Covered
        </h5>
        {exclusions.country_exclusions.length > 0 ? (
          <ul className="space-y-1.5 pl-6">
            {exclusions.country_exclusions.map((item, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground relative before:content-['•'] before:absolute before:-left-4 before:text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground pl-6">No country exclusions — coverage is worldwide</p>
        )}
        {exclusions.country_notes && (
          <p className="text-xs text-muted-foreground italic pl-6 mt-1">Note: {exclusions.country_notes}</p>
        )}
      </div>
    </div>
  );
}

export function CategoryDetailSheet({ category, open, onOpenChange, onAddCoverage }: CategoryDetailSheetProps) {
  const getCoverageStatus = useCoverageStore((state) => state.getCoverageStatus);
  const getSourcesForCategory = useCoverageStore((state) => state.getSourcesForCategory);
  const removePolicy = useCoverageStore((state) => state.removePolicy);
  const { autoPolicy, refetch: refetchAutoPolicy } = useAutoPolicy();
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Polling hook for re-analysis
  const handleReanalyzeComplete = useCallback(async () => {
    await refetchAutoPolicy();
    setIsReanalyzing(false);
    toast.success("Policy re-analyzed successfully");
  }, [refetchAutoPolicy]);

  const handleReanalyzeFailed = useCallback((error: string) => {
    setIsReanalyzing(false);
    toast.error("Re-analysis failed", { description: error });
  }, []);

  const handleReanalyzeTimeout = useCallback(() => {
    setIsReanalyzing(false);
    toast.error("Re-analysis timeout", { description: "Please try again later." });
  }, []);

  const { isPolling, startPolling } = useDocumentPolling({
    onComplete: handleReanalyzeComplete,
    onFailed: handleReanalyzeFailed,
    onTimeout: handleReanalyzeTimeout,
  });

  const handleReanalyze = async () => {
    if (!autoPolicy || !user || !autoPolicy.document_id) return;

    setShowReanalyzeDialog(false);
    setIsReanalyzing(true);

    try {
      // Step 1: Delete existing auto_policies record (keeps the document)
      const { error: deleteError } = await supabase
        .from("auto_policies")
        .delete()
        .eq("id", autoPolicy.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(`Failed to clear old data: ${deleteError.message}`);
      }

      // Step 2: Reset policy_documents status to pending
      const { error: updateError } = await supabase
        .from("policy_documents")
        .update({ processing_status: "pending", error_message: null })
        .eq("id", autoPolicy.document_id)
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error(`Failed to reset status: ${updateError.message}`);
      }

      // Step 3: Invoke smart-worker to re-process
      const { error: invokeError } = await supabase.functions.invoke("smart-worker", {
        body: { document_id: autoPolicy.document_id },
      });

      if (invokeError) {
        throw new Error(`Failed to start re-analysis: ${invokeError.message}`);
      }

      // Step 4: Start polling for completion
      toast.info("Re-analyzing your policy...");
      startPolling(autoPolicy.document_id);
    } catch (error) {
      console.error("Re-analyze error:", error);
      setIsReanalyzing(false);
      toast.error(error instanceof Error ? error.message : "Failed to re-analyze policy");
    }
  };

  if (!category) return null;

  const isAutoInsurance = category.id === "foundational-auto";
  const isRentalCategory = category.id === "travel-rental";
  const status = isAutoInsurance && autoPolicy ? "covered" : getCoverageStatus(category.id);
  const { cards, policies, plans } = getSourcesForCategory(category.id);
  const sourceCount = cards.length + policies.length + plans.length;
  const hasAutoPolicy = isAutoInsurance && autoPolicy;
  
  // Filter cards with rental exclusions for the Exclusions tab
  const cardsWithExclusions = cards.filter(card => card && card.rentalExclusions);

  const OverviewContent = (): React.ReactElement => (
    <div className="space-y-6">
      {/* Coverage Sources (for non-auto or when no auto policy) */}
      {!hasAutoPolicy && sourceCount > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Your Coverage Sources</h4>
          <div className="flex flex-wrap gap-2">
            {cards.map(
              (card) =>
                card && (
                  <span
                    key={card.id}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-primary/20"
                  >
                    💳 {card.name}
                  </span>
                ),
            )}
            {policies.map((policy) => (
              <span
                key={policy.id}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-primary/20"
              >
                📄 {policy.name}
              </span>
            ))}
            {plans.map((plan) => (
              <span
                key={plan.id}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-primary/20"
              >
                ✨ {plan.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for non-auto categories */}
      {!hasAutoPolicy && sourceCount === 0 && (
        <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-border">
          <p className="text-sm text-muted-foreground text-center">
            {category.emptyMessage || "No coverage sources added yet."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 mx-auto flex gap-2"
            onClick={() => {
              onOpenChange(false);
              setTimeout(onAddCoverage, 300);
            }}
          >
            <Plus className="w-4 h-4" />
            Add coverage
          </Button>
        </div>
      )}

      {/* What's Covered */}
      {category.whatsCovered && category.whatsCovered.length > 0 && !hasAutoPolicy && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            What this typically covers
          </h4>
          <ul className="space-y-2">
            {category.whatsCovered.map((item, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-primary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What's Not Covered */}
      {category.whatsNotCovered && category.whatsNotCovered.length > 0 && !hasAutoPolicy && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger" />
            What's usually not covered
          </h4>
          <ul className="space-y-2">
            {category.whatsNotCovered.map((item, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rental-specific details */}
      {category.id === "travel-rental" && cards.length > 0 && (
        <div className="p-4 rounded-xl bg-accent/50 border border-primary/10">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">Coverage Details</h4>
          <div className="space-y-2">
            {cards.map(
              (card) =>
                card && (
                  <div key={card.id} className="text-sm">
                    <span className="font-medium">{card.name}:</span>{" "}
                    <span className="text-muted-foreground">
                      {card.rental?.coverageType === "primary" ? "Primary" : "Secondary"} coverage
                      {card.rental?.maxCoverage && ` up to $${card.rental.maxCoverage.toLocaleString()}`}
                      {card.rental?.maxDays && ` for ${card.rental.maxDays} days`}
                    </span>
                  </div>
                ),
            )}
          </div>
        </div>
      )}
    </div>
  );


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-7xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <CategoryIcon categoryId={category.id} className="w-6 h-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">{category.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">{category.subtitle}</p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </SheetHeader>

        <div className="py-6">
          {/* Auto Insurance Policy Details */}
          {hasAutoPolicy && <AutoPolicyDetails policy={autoPolicy} onPolicyUpdated={refetchAutoPolicy} />}

          {/* Non-auto content with optional tabs */}
          {/* Non-auto content */}
          {!hasAutoPolicy &&
            (isRentalCategory && cards.length > 0 ? (
              <RentalCardComparison cards={cards} categoryTitle={category.title} categorySubtitle={category.subtitle} />
            ) : (
              <OverviewContent />
            ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border">
          {hasAutoPolicy ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReanalyzeDialog(true)}
                  disabled={isDeleting || isReanalyzing || isPolling}
                  className="flex-1"
                >
                  {isReanalyzing || isPolling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-analyze
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    setTimeout(onAddCoverage, 300);
                  }}
                  disabled={isDeleting || isReanalyzing || isPolling}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Replace policy
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting || isReanalyzing || isPolling}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete policy
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false);
                setTimeout(onAddCoverage, 300);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add coverage
            </Button>
          )}
        </div>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete policy?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this policy? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!autoPolicy || !user) return;

                setIsDeleting(true);
                try {
                  // Step 1: Get the document info first to get the file path
                  let filePath: string | null = null;
                  if (autoPolicy.document_id) {
                    const { data: docData, error: docFetchError } = await supabase
                      .from("policy_documents")
                      .select("file_path")
                      .eq("id", autoPolicy.document_id)
                      .eq("user_id", user.id) // Verify user owns this document
                      .maybeSingle();

                    if (docFetchError) {
                      console.error("Error fetching document:", docFetchError);
                    }
                    filePath = docData?.file_path ?? null;
                  }

                  // Step 2: Delete from auto_policies table FIRST
                  // Add user_id check to prevent unauthorized deletion
                  const { error: policyError } = await supabase
                    .from("auto_policies")
                    .delete()
                    .eq("id", autoPolicy.id)
                    .eq("user_id", user.id);

                  if (policyError) {
                    throw new Error(`Failed to delete policy: ${policyError.message}`);
                  }

                  // Step 3: Delete from policy_documents table SECOND
                  if (autoPolicy.document_id) {
                    const { error: docError } = await supabase
                      .from("policy_documents")
                      .delete()
                      .eq("id", autoPolicy.document_id)
                      .eq("user_id", user.id); // Verify user owns this document

                    if (docError) {
                      console.error("Error deleting document record:", docError);
                    }
                  }

                  // Step 4: Delete the file from storage LAST
                  if (filePath) {
                    const { error: storageError } = await supabase.storage
                      .from("insurance-documents")
                      .remove([filePath]);

                    if (storageError) {
                      console.error("Error deleting file from storage:", storageError);
                    }
                  }

                  // Remove from Zustand store (Coverage Library)
                  if (autoPolicy.document_id) {
                    removePolicy(autoPolicy.document_id);
                  }

                  // Refetch to update local state
                  await refetchAutoPolicy();

                  // Close dialogs after state is updated
                  setShowDeleteDialog(false);
                  onOpenChange(false);

                  toast.success("Policy deleted");
                } catch (error: unknown) {
                  console.error("Error deleting policy:", error);
                  toast.error(error instanceof Error ? error.message : "Failed to delete policy");
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Re-analyze Confirmation Dialog */}
      <AlertDialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-analyze policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-process your policy document with AI to extract coverage details.
              Use this if the original extraction missed information or contains errors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReanalyze}>
              Re-analyze
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}