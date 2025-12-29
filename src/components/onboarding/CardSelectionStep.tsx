import { useState, useMemo } from "react";
import { Check, CreditCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { cardDatabase, getCardById } from "@/data/cardDatabase";
import { OnboardingLayout } from "./OnboardingLayout";
import { cn } from "@/lib/utils";

export function CardSelectionStep() {
  const { advanceStep, skipStep, exitOnboarding, currentStep } = useOnboarding();
  const { selectedCards, toggleCard } = useCoverageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [justSelected, setJustSelected] = useState<string | null>(null);

  // Flatten all cards from the database
  const allCards = useMemo(() => {
    return Object.entries(cardDatabase).flatMap(([issuer, cards]) =>
      cards.map((card) => ({ ...card, issuer }))
    );
  }, []);

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return allCards;
    const query = searchQuery.toLowerCase();
    return allCards.filter(
      (card) =>
        card.name.toLowerCase().includes(query) ||
        card.issuer.toLowerCase().includes(query)
    );
  }, [allCards, searchQuery]);

  const handleCardSelect = (cardId: string) => {
    toggleCard(cardId);
    setJustSelected(cardId);
  };

  const selectedCard = justSelected ? getCardById(justSelected) : null;
  const isCardSelected = justSelected && selectedCards.includes(justSelected);

  // Show success state after selection
  if (isCardSelected && selectedCard) {
    return (
      <OnboardingLayout currentStep={currentStep} onExit={exitOnboarding}>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Check className="w-5 h-5" />
              <span className="font-medium">{selectedCard.name} added</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <p className="text-center font-medium text-foreground">
              Great choice! Here's what you're covered for:
            </p>

            <div className="space-y-3">
              {selectedCard.rental && (
                <div className="flex items-start gap-3">
                  <span className="text-lg">🚗</span>
                  <div>
                    <p className="font-medium text-sm">Rental Car Insurance</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCard.rental.coverageType} coverage up to $
                      {selectedCard.rental.maxCoverage?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {selectedCard.purchaseProtection && (
                <div className="flex items-start gap-3">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="font-medium text-sm">Purchase Protection</p>
                    <p className="text-xs text-muted-foreground">
                      Up to ${selectedCard.purchaseProtection.max_per_claim?.toLocaleString()} per claim
                    </p>
                  </div>
                </div>
              )}

              {selectedCard.tripProtection && (
                <div className="flex items-start gap-3">
                  <span className="text-lg">✈️</span>
                  <div>
                    <p className="font-medium text-sm">Trip Protection</p>
                    <p className="text-xs text-muted-foreground">
                      Cancellation and interruption coverage
                    </p>
                  </div>
                </div>
              )}

              {selectedCard.extendedWarranty && (
                <div className="flex items-start gap-3">
                  <span className="text-lg">🔧</span>
                  <div>
                    <p className="font-medium text-sm">Extended Warranty</p>
                    <p className="text-xs text-muted-foreground">
                      +{selectedCard.extendedWarranty.extension_years} year(s) on eligible purchases
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setJustSelected(null)} className="flex-1">
              Add Another Card
            </Button>
            <Button onClick={advanceStep} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep={currentStep} onExit={exitOnboarding}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Step 1 of 3: Add a Credit Card
          </p>
          <h2 className="text-2xl font-semibold font-serif text-foreground">
            Which credit card do you use most for travel and big purchases?
          </h2>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Card list */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filteredCards.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No cards found matching "{searchQuery}"
            </p>
          ) : (
            filteredCards.map((card) => {
              const isSelected = selectedCards.includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(card.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <CreditCard className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{card.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {card.issuer}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            onClick={skipStep}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Don't see your card? Skip for now
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
