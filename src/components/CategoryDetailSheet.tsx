import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CategoryDefinition } from "@/types/coverage";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { useAutoPolicy } from "@/hooks/useAutoPolicy";
import { AutoPolicyDetails } from "@/components/AutoPolicyDetails";

interface CategoryDetailSheetProps {
  category: CategoryDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCoverage: () => void;
}

export function CategoryDetailSheet({
  category,
  open,
  onOpenChange,
  onAddCoverage
}: CategoryDetailSheetProps) {
  const getCoverageStatus = useCoverageStore((state) => state.getCoverageStatus);
  const getSourcesForCategory = useCoverageStore((state) => state.getSourcesForCategory);
  const { autoPolicy } = useAutoPolicy();

  if (!category) return null;

  const isAutoInsurance = category.id === "foundational-auto";
  const status = isAutoInsurance && autoPolicy ? "covered" : getCoverageStatus(category.id);
  const { cards, policies, plans } = getSourcesForCategory(category.id);
  const sourceCount = cards.length + policies.length + plans.length;
  const hasAutoPolicy = isAutoInsurance && autoPolicy;

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

        <div className="py-6 space-y-6">
          {/* Auto Insurance Policy Details */}
          {hasAutoPolicy && (
            <AutoPolicyDetails policy={autoPolicy} />
          )}

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

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={() => {
              onOpenChange(false);
              setTimeout(onAddCoverage, 300);
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {hasAutoPolicy ? "Update policy" : "Add coverage"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
