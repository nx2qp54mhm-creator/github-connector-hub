import { X, CreditCard, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { getCardById } from "@/data/cardDatabase";

export function CoverageLibrary() {
  const {
    selectedCards,
    uploadedPolicies,
    addedPlans,
    lastUpdated,
    removeCard,
    removePolicy,
    removePlan,
  } = useCoverageStore();

  const cards = selectedCards.map(id => getCardById(id)).filter(Boolean);
  const isEmpty = selectedCards.length === 0 && uploadedPolicies.length === 0 && addedPlans.length === 0;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card className="border border-border shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Coverage Library
          </h3>
          <span className="text-xs text-muted-foreground">
            {selectedCards.length + uploadedPolicies.length + addedPlans.length} items
          </span>
        </div>
      </div>

      <ScrollArea className="max-h-56">
        <div className="p-3 space-y-4">
          {/* Credit Cards */}
          {cards.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide px-1">
                Credit Cards
              </p>
              {cards.map((card) => card && (
                <div
                  key={card.id}
                  className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate">{card.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {card.issuer}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeCard(card.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Policies */}
          {uploadedPolicies.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide px-1">
                Insurance Policies
              </p>
              {uploadedPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate">{policy.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">
                      {policy.type}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePolicy(policy.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plans */}
          {addedPlans.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide px-1">
                Other Plans
              </p>
              {addedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate">{plan.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePlan(plan.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {isEmpty && (
            <p className="text-sm text-muted-foreground italic px-1 py-2">
              No coverage added yet
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated ? formatDate(lastUpdated) : "Never"}
        </p>
      </div>
    </Card>
  );
}
