import { useState, useMemo } from "react";
import { Check, CreditCard, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { cardDatabase, getCardById } from "@/data/cardDatabase";
import { OnboardingLayout } from "./OnboardingLayout";
import { cn } from "@/lib/utils";

// Map internal issuer keys to display names
const issuerDisplayNames: Record<string, string> = {
  chase: "Chase",
  amex: "American Express",
};

export function CardSelectionStep() {
  const { advanceStep, skipStep, exitOnboarding, currentStep } = useOnboarding();
  const { selectedCards, toggleCard } = useCoverageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIssuer, setExpandedIssuer] = useState<string | null>(null);
  const [justSelected, setJustSelected] = useState<string | null>(null);

  // Get all issuers with their cards
  const issuerData = useMemo(() => {
    return Object.entries(cardDatabase).map(([issuerKey, cards]) => ({
      key: issuerKey,
      name: issuerDisplayNames[issuerKey] || issuerKey,
      cards: cards.map((card) => ({ ...card, issuerKey })),
    }));
  }, []);

  // Filter issuers and cards based on search query
  const filteredIssuers = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();

    return issuerData
      .map((issuer) => {
        // Check if issuer name matches
        const issuerMatches = issuer.name.toLowerCase().includes(query);

        // Filter cards that match
        const matchingCards = issuer.cards.filter((card) =>
          card.name.toLowerCase().includes(query)
        );

        // Include issuer if name matches (show all cards) or has matching cards
        if (issuerMatches) {
          return { ...issuer, matchingCards: issuer.cards };
        } else if (matchingCards.length > 0) {
          return { ...issuer, matchingCards };
        }
        return null;
      })
      .filter((issuer): issuer is NonNullable<typeof issuer> => issuer !== null);
  }, [issuerData, searchQuery]);

  const handleCardSelect = (cardId: string) => {
    toggleCard(cardId);
    setJustSelected(cardId);
  };

  const toggleIssuer = (issuerKey: string) => {
    setExpandedIssuer(expandedIssuer === issuerKey ? null : issuerKey);
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
            Find your credit card
          </h2>
          <p className="text-sm text-muted-foreground">
            Search by bank name or card name
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Try 'Chase' or 'Sapphire'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-base"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-3">
          {!searchQuery.trim() ? (
            <div className="text-center py-8 space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">
                Start typing to find your card
              </p>
            </div>
          ) : filteredIssuers.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">
                No cards found for "{searchQuery}"
              </p>
              <button
                onClick={skipStep}
                className="text-sm text-primary hover:underline"
              >
                Skip for now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredIssuers.map((issuer) => {
                const isExpanded = expandedIssuer === issuer.key;
                const cardCount = issuer.matchingCards.length;

                return (
                  <div key={issuer.key} className="border border-border rounded-lg overflow-hidden">
                    {/* Issuer header */}
                    <button
                      onClick={() => toggleIssuer(issuer.key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{issuer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cardCount} card{cardCount !== 1 ? "s" : ""} available
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Expanded card list */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30">
                        {issuer.matchingCards.map((card) => {
                          const isSelected = selectedCards.includes(card.id);
                          return (
                            <button
                              key={card.id}
                              onClick={() => handleCardSelect(card.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 pl-6 text-left transition-all border-b border-border last:border-b-0",
                                isSelected
                                  ? "bg-primary/10"
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{card.name}</p>
                              </div>
                              {isSelected && (
                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Skip link */}
        {searchQuery.trim() && filteredIssuers.length > 0 && (
          <div className="text-center">
            <button
              onClick={skipStep}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Don't see your card? Skip for now
            </button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}
