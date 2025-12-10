import { CreditCard } from "@/types/coverage";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface RentalCardComparisonProps {
  cards: CreditCard[];
  categoryTitle?: string;
  categorySubtitle?: string;
}

// Hook to synchronize heights of elements with matching data-sync-id attributes
function useSyncHeights(containerRef: React.RefObject<HTMLDivElement>, deps: any[]) {
  useEffect(() => {
    if (!containerRef.current) return;

    const syncGroups = new Map<string, HTMLElement[]>();

    // Find all elements with data-sync-id and group them
    const elements = containerRef.current.querySelectorAll<HTMLElement>('[data-sync-id]');
    elements.forEach((el) => {
      const syncId = el.getAttribute('data-sync-id');
      if (syncId) {
        if (!syncGroups.has(syncId)) {
          syncGroups.set(syncId, []);
        }
        syncGroups.get(syncId)!.push(el);
      }
    });

    // Reset heights first to get natural heights
    syncGroups.forEach((group) => {
      group.forEach((el) => {
        el.style.minHeight = 'auto';
      });
    });

    // Force reflow
    void containerRef.current.offsetHeight;

    // Set all elements in each group to the max height of that group
    syncGroups.forEach((group) => {
      const maxHeight = Math.max(...group.map((el) => el.scrollHeight));
      group.forEach((el) => {
        el.style.minHeight = `${maxHeight}px`;
      });
    });
  }, deps);
}

export function RentalCardComparison({ cards, categoryTitle, categorySubtitle }: RentalCardComparisonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Show up to 4 cards for comparison
  const displayCards = cards.slice(0, 4);

  // Sync heights whenever cards change
  useSyncHeights(containerRef, [displayCards]);

  if (displayCards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">
            No credit cards with rental coverage found.
          </p>
        </div>
      </div>
    );
  }

  // Determine grid columns based on card count
  const getGridClass = () => {
    switch (displayCards.length) {
      case 1:
        return "grid-cols-1 max-w-xl mx-auto";
      case 2:
        return "grid-cols-1 lg:grid-cols-2";
      case 3:
        return "grid-cols-1 lg:grid-cols-3";
      case 4:
      default:
        return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
    }
  };

  // Check if any card has primary coverage using the correct field path
  const hasPrimaryCoverage = displayCards.some(c => c.rental?.coverageType === 'primary');
  const primaryCard = displayCards.find(c => c.rental?.coverageType === 'primary');

  return (
    <div className="space-y-6">
      {/* Stats Cards - Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Cards Providing Coverage
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 leading-tight">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </div>
          <div className="text-xs text-muted-foreground">
            {cards.slice(0, 3).map(c => c.name).join(', ')}{cards.length > 3 ? ` +${cards.length - 3} more` : ''}
          </div>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Best Coverage Type
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 leading-tight">
            {hasPrimaryCoverage ? 'Primary' : 'Secondary'}
          </div>
          <div className="text-xs text-muted-foreground">
            {primaryCard?.name || displayCards[0]?.name}
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-covered-warning-bg border-l-4 border-covered-warning rounded px-4 py-4">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
          Important
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">
          Credit cards only cover vehicle damage (Protect the Car). They do NOT cover liability for injuring others. Check your auto insurance for liability coverage.
        </p>
      </div>

      {/* Card Comparison Grid - Now supports up to 4 cards with synced heights */}
      <div ref={containerRef} className={`grid ${getGridClass()} gap-4 items-start`}>
        {displayCards.map((card, index) => (
          <CardComparisonDetail key={card.id} card={card} index={index} compact={displayCards.length > 2} />
        ))}
      </div>

      {/* Show note if more cards available */}
      {cards.length > 4 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing 4 of {cards.length} cards with rental coverage.
        </p>
      )}

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Educational only. Always confirm details with your card issuer before renting.
      </p>
    </div>
  );
}

interface CardComparisonDetailProps {
  card: CreditCard;
  index: number;
  compact?: boolean;
}

function CardComparisonDetail({ card, index, compact = false }: CardComparisonDetailProps) {
  // Use the nested rental object for coverage data (the actual data structure)
  const isPrimary = card.rental?.coverageType === 'primary';
  const coverageLimit = card.rental?.maxCoverage || 50000;
  const maxDays = card.rental?.maxDays || 30;
  const exclusions = card.rentalExclusions;

  return (
    <article className="bg-card border border-border rounded-lg flex flex-col">
      {/* Card Header */}
      <div data-sync-id="header" className="p-4 border-b border-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Rental Car Insurance
        </div>
        <h3 className={`font-bold text-foreground mb-3 leading-tight ${compact ? 'text-base' : 'text-lg'}`}>
          {card.fullName}
        </h3>
        <span
          className={`inline-block px-3 py-1.5 rounded text-xs font-semibold ${
            isPrimary
              ? 'bg-covered-success text-white'
              : 'bg-covered-warning-bg text-gray-900 border border-[#FFBB33]'
          }`}
        >
          {isPrimary ? 'Primary Coverage' : 'Secondary Coverage'}
        </span>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4 flex-1 flex flex-col">
        {/* Coverage Limit */}
        <div data-sync-id="coverage-limit">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Coverage Limit
          </div>
          <div className={`font-bold text-foreground leading-none ${compact ? 'text-2xl' : 'text-3xl'}`}>
            ${coverageLimit.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {isPrimary ? 'Per rental incident' : 'After personal insurance'}
          </div>

          {!isPrimary && (
            <div className="bg-covered-warning-bg border-l-4 border-covered-warning rounded px-3 py-2 mt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                Secondary Coverage
              </div>
              <div className={`text-gray-800 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                File with your personal auto insurance first. This covers remaining expenses.
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* What's Covered */}
        <div data-sync-id="whats-covered">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-covered-success" />
            What's Covered
          </div>
          <ul className="space-y-1.5">
            {exclusions?.what_is_covered?.map((item, idx) => (
              <li
                key={idx}
                className={`text-foreground py-1 pl-5 relative leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}
              >
                <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                {item}
              </li>
            )) || (
              <li className="text-sm text-muted-foreground">Coverage details not available</li>
            )}
          </ul>
        </div>

        <div className="h-px bg-border" />

        {/* Key Requirements */}
        <div data-sync-id="key-requirements">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Key Requirements
          </div>
          <div className={`grid gap-2 mt-3 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Max Duration
              </div>
              <div className="text-sm font-medium text-foreground">
                {maxDays} days
              </div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Deductible
              </div>
              <div className="text-sm font-medium text-foreground">
                {isPrimary ? '$0' : 'Your policy'}
              </div>
            </div>
            {!compact && (
              <>
                <div className="p-2 bg-muted/50 rounded">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Exotic Vehicles
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    Not covered
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Report Within
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    30 days
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Not Covered */}
        <div data-sync-id="not-covered" className="bg-covered-warning-bg border-l-4 border-covered-warning rounded px-3 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
            Not Covered
          </div>
          <ul className="space-y-1">
            {(compact ? exclusions?.what_is_not_covered?.slice(0, 4) : exclusions?.what_is_not_covered)?.map((item, idx) => (
              <li
                key={idx}
                className={`text-gray-800 py-0.5 pl-5 relative leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}
              >
                <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-gray-900 rounded-full" />
                {item}
              </li>
            )) || (
              <li className="text-sm text-gray-800">Exclusions not available</li>
            )}
            {compact && exclusions?.what_is_not_covered && exclusions.what_is_not_covered.length > 4 && (
              <li className="text-xs text-gray-600 pl-5">
                +{exclusions.what_is_not_covered.length - 4} more exclusions
              </li>
            )}
          </ul>
        </div>

        {/* Vehicle Exclusions - Only show in non-compact mode */}
        {!compact && exclusions?.vehicle_exclusions && exclusions.vehicle_exclusions.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <div data-sync-id="vehicle-exclusions">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Excluded Vehicles
              </div>
              <ul className="space-y-1.5">
                {exclusions.vehicle_exclusions.slice(0, 5).map((vehicle, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-foreground py-1 pl-5 relative leading-relaxed"
                  >
                    <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                    {vehicle}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Country Exclusions / How to Activate */}
        <div className="h-px bg-border" />
        <div data-sync-id="country-or-activate">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {exclusions?.country_exclusions && exclusions.country_exclusions.length > 0
              ? 'Country Exclusions'
              : 'How to Activate'}
          </div>
          <ul className="space-y-1">
            {exclusions?.country_exclusions && exclusions.country_exclusions.length > 0 ? (
              exclusions.country_exclusions.map((country, idx) => (
                <li
                  key={idx}
                  className={`text-foreground py-0.5 pl-5 relative leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}
                >
                  <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  {country} — Not covered
                </li>
              ))
            ) : (
              <>
                <li className={`text-foreground py-0.5 pl-5 relative leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                  <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  Pay for entire rental with this card
                </li>
                <li className={`text-foreground py-0.5 pl-5 relative leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                  <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  Decline the rental company's CDW/LDW
                </li>
                {!compact && (
                  <li className="text-sm text-foreground py-0.5 pl-5 relative leading-relaxed">
                    <span className="absolute left-0 top-[0.5rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                    You must be the primary renter
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}
