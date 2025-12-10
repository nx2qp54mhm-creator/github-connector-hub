import { CreditCard } from "@/types/coverage";
import { CheckCircle2 } from "lucide-react";

interface RentalCardComparisonProps {
  cards: CreditCard[];
  categoryTitle?: string;
  categorySubtitle?: string;
}

export function RentalCardComparison({ cards, categoryTitle, categorySubtitle }: RentalCardComparisonProps) {
  // Only show first 2 cards for comparison
  const displayCards = cards.slice(0, 2);

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
            {cards.slice(0, 2).map(c => c.name).join(', ')}
          </div>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Best Coverage Type
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 leading-tight">
            {displayCards.some(c => c.rentalCoverageType === 'primary') ? 'Primary' : 'Secondary'}
          </div>
          <div className="text-xs text-muted-foreground">
            {displayCards.find(c => c.rentalCoverageType === 'primary')?.name || displayCards[0]?.name}
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

      {/* Card Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayCards.map((card) => (
          <CardComparisonDetail key={card.id} card={card} />
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Educational only. Always confirm details with your card issuer before renting.
      </p>
    </div>
  );
}

function CardComparisonDetail({ card }: { card: CreditCard }) {
  const isPrimary = card.rentalCoverageType === 'primary';
  const exclusions = card.rentalExclusions;

  return (
    <article className="bg-card border border-border rounded-lg">
      {/* Card Header */}
      <div className="p-4 border-b border-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Rental Car Insurance
        </div>
        <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
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
      <div className="p-4 space-y-4">
        {/* Coverage Limit - Fixed Height */}
        <div className="min-h-[140px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Coverage Limit
          </div>
          <div className="text-3xl font-bold text-foreground leading-none">
            ${card.rentalCoverageLimit?.toLocaleString() || '50,000'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {isPrimary ? 'Per rental incident' : 'After personal insurance'}
          </div>

          {!isPrimary && (
            <div className="bg-covered-warning-bg border-l-4 border-covered-warning rounded px-3 py-3 mt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                Secondary Coverage Notice
              </div>
              <div className="text-sm text-gray-800 leading-relaxed">
                You must file with your personal auto insurance first. This card covers remaining expenses after your insurance pays. May affect your insurance rates.
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* What's Covered - Fixed Height */}
        <div className="min-h-[200px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-covered-success" />
            What's Covered
          </div>
          <ul className="space-y-1.5">
            {exclusions?.what_is_covered?.map((item, index) => (
              <li
                key={index}
                className="text-sm text-foreground py-1 pl-6 relative leading-relaxed"
              >
                <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                {item}
              </li>
            )) || (
              <li className="text-sm text-muted-foreground">Coverage details not available</li>
            )}
          </ul>
        </div>

        <div className="h-px bg-border" />

        {/* Key Requirements - Fixed Height */}
        <div className="min-h-[160px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Key Requirements
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 bg-muted/50 rounded">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Max Duration
              </div>
              <div className="text-sm font-medium text-foreground">
                {card.rentalMaxDays || 30} days
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Deductible
              </div>
              <div className="text-sm font-medium text-foreground">
                {isPrimary ? '$0' : 'Your policy'}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Exotic Vehicles
              </div>
              <div className="text-sm font-medium text-foreground">
                {card.rentalExoticCovered ? 'Covered' : 'Not covered'}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Report Within
              </div>
              <div className="text-sm font-medium text-foreground">
                {card.rentalReportDays || 30} days
              </div>
            </div>
          </div>
        </div>

        {/* Not Covered - Fixed Height */}
        <div className="bg-covered-warning-bg border-l-4 border-covered-warning rounded px-3 py-3 min-h-[180px]">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
            Not Covered
          </div>
          <ul className="space-y-1.5">
            {exclusions?.what_is_not_covered?.map((item, index) => (
              <li
                key={index}
                className="text-sm text-gray-800 py-1 pl-6 relative leading-relaxed"
              >
                <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-gray-900 rounded-full" />
                {item}
              </li>
            )) || (
              <li className="text-sm text-gray-800">Exclusions not available</li>
            )}
          </ul>
        </div>

        <div className="h-px bg-border" />

        {/* Vehicle Exclusions - Fixed Height */}
        {exclusions?.vehicle_exclusions && exclusions.vehicle_exclusions.length > 0 && (
          <>
            <div className="min-h-[140px]">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Excluded Vehicles
              </div>
              <ul className="space-y-1.5">
                {exclusions.vehicle_exclusions.slice(0, 5).map((vehicle, index) => (
                  <li
                    key={index}
                    className="text-sm text-foreground py-1 pl-6 relative leading-relaxed"
                  >
                    <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                    {vehicle}
                  </li>
                ))}
              </ul>
            </div>
            <div className="h-px bg-border" />
          </>
        )}

        {/* Country Exclusions / How to Activate - Fixed Height */}
        <div className="min-h-[120px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {exclusions?.country_exclusions && exclusions.country_exclusions.length > 0
              ? 'Country Exclusions'
              : 'How to Activate'}
          </div>
          <ul className="space-y-1.5">
            {exclusions?.country_exclusions && exclusions.country_exclusions.length > 0 ? (
              exclusions.country_exclusions.map((country, index) => (
                <li
                  key={index}
                  className="text-sm text-foreground py-1 pl-6 relative leading-relaxed"
                >
                  <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  {country} — Not covered
                </li>
              ))
            ) : (
              <>
                <li className="text-sm text-foreground py-1 pl-6 relative leading-relaxed">
                  <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  Pay for entire rental with this card
                </li>
                <li className="text-sm text-foreground py-1 pl-6 relative leading-relaxed">
                  <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  Decline the rental company's CDW/LDW
                </li>
                <li className="text-sm text-foreground py-1 pl-6 relative leading-relaxed">
                  <span className="absolute left-0 top-[0.65rem] w-1.5 h-1.5 bg-foreground rounded-full" />
                  You must be the primary renter
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}
