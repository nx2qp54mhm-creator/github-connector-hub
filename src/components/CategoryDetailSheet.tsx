import { useState } from "react";
import { Plus, CheckCircle2, XCircle, Trash2, RefreshCw, Loader2, AlertTriangle, Car, Globe } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CategoryDefinition, CreditCard } from "@/types/coverage";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { AutoPolicyDetails } from "@/components/AutoPolicyDetails";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

function CardExclusionsSection({ card }: { card: CreditCard }) {
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
          <p className="text-sm text-muted-foreground pl-6">
            No country exclusions — coverage is worldwide
          </p>
        )}
        {exclusions.country_notes && (
          <p className="text-xs text-muted-foreground italic pl-6 mt-1">
            Note: {exclusions.country_notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function CategoryDetailSheet({
  category,
  open,
  onOpenChange,
  onAddCoverage
}: CategoryDetailSheetProps) {
  const getCoverageStatus = useCoverageStore((state) => state.getCoverageStatus);
  const getSourcesForCategory = useCoverageStore((state) => state.getSourcesForCategory);
  const removePolicy = useCoverageStore((state) => state.removePolicy);
  const { autoPolicy, refetch: refetchAutoPolicy } = useAutoPolicy();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!category) return null;

  const isAutoInsurance = category.id === "foundational-auto";
  const isRentalCategory = category.id === "travel-rental";
  const status = isAutoInsurance && autoPolicy ? "covered" : getCoverageStatus(category.id);
  const { cards, policies, plans } = getSourcesForCategory(category.id);
  const sourceCount = cards.length + policies.length + plans.length;
  const hasAutoPolicy = isAutoInsurance && autoPolicy;
  
  // Filter cards with rental exclusions for the Exclusions tab
  const cardsWithExclusions = cards.filter(card => card && card.rentalExclusions);

  const showTabs = isRentalCategory && cards.length > 0;

  const OverviewContent = () => (
    <div className="space-y-6">
      {/* Coverage Sources (for non-auto or when no auto policy) */}
      {!hasAutoPolicy && sourceCount > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Your Coverage Sources
          </h4>
          <div className="flex flex-wrap gap-2">
            {cards.map((card) => card && (
              <span
                key={card.id}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-primary/20"
              >
                💳 {card.name}
              </span>
            ))}
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
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            Coverage Details
          </h4>
          <div className="space-y-2">
            {cards.map((card) => card && (
              <div key={card.id} className="text-sm">
                <span className="font-medium">{card.name}:</span>{" "}
                <span className="text-muted-foreground">
                  {card.rental?.coverageType === "primary" ? "Primary" : "Secondary"} coverage
                  {card.rental?.maxCoverage && ` up to $${card.rental.maxCoverage.toLocaleString()}`}
                  {card.rental?.maxDays && ` for ${card.rental.maxDays} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ExclusionsContent = () => (
    <div className="space-y-4">
      {/* Important Notice */}
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <div className="flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Credit cards only cover vehicle damage (Protect the Car). They do NOT cover liability for injuring others. Check your auto insurance for liability coverage.
            </p>
          </div>
        </div>
      </div>

      {/* Card-specific exclusions */}
      {cardsWithExclusions.length > 0 ? (
        <div className="space-y-4">
          {cardsWithExclusions.map((card) => card && (
            <CardExclusionsSection key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">
            No exclusion data available. Add credit cards to see their specific exclusions.
          </p>
        </div>
      )}

      {/* Footer disclaimer */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Educational only. Always confirm details with your card issuer.
      </p>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <CategoryIcon categoryId={category.id} className="w-6 h-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">
                  {category.title}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {category.subtitle}
                </p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </SheetHeader>

        <div className="py-6">
          {/* Auto Insurance Policy Details */}
          {hasAutoPolicy && (
            <AutoPolicyDetails policy={autoPolicy} />
          )}

          {/* Non-auto content with optional tabs */}
          {!hasAutoPolicy && (
            showTabs ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-0">
                  <OverviewContent />
                </TabsContent>
                <TabsContent value="exclusions" className="mt-0">
                  <ExclusionsContent />
                </TabsContent>
              </Tabs>
            ) : (
              <OverviewContent />
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border">
          {hasAutoPolicy ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete policy
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(onAddCoverage, 300);
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Replace policy
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
                if (!autoPolicy) return;
                
                setIsDeleting(true);
                try {
                  // Step 1: Get the document info first to get the file path
                  let filePath: string | null = null;
                  if (autoPolicy.document_id) {
                    const { data: docData, error: docFetchError } = await supabase
                      .from('policy_documents')
                      .select('file_path')
                      .eq('id', autoPolicy.document_id)
                      .maybeSingle();
                    
                    if (docFetchError) {
                      console.error('Error fetching document:', docFetchError);
                    }
                    filePath = docData?.file_path ?? null;
                  }

                  // Step 2: Delete from auto_policies table FIRST
                  const { error: policyError } = await supabase
                    .from('auto_policies')
                    .delete()
                    .eq('id', autoPolicy.id);

                  if (policyError) {
                    throw new Error(`Failed to delete policy: ${policyError.message}`);
                  }

                  // Step 3: Delete from policy_documents table SECOND
                  if (autoPolicy.document_id) {
                    const { error: docError } = await supabase
                      .from('policy_documents')
                      .delete()
                      .eq('id', autoPolicy.document_id);

                    if (docError) {
                      console.error('Error deleting document record:', docError);
                    }
                  }

                  // Step 4: Delete the file from storage LAST
                  if (filePath) {
                    const { error: storageError } = await supabase
                      .storage
                      .from('insurance-documents')
                      .remove([filePath]);

                    if (storageError) {
                      console.error('Error deleting file from storage:', storageError);
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
                  
                  toast.success('Policy deleted');
                } catch (error) {
                  console.error('Error deleting policy:', error);
                  toast.error(error instanceof Error ? error.message : 'Failed to delete policy');
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
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}