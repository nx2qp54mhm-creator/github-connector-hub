import { CreditCard, CategoryGroup, CategoryDefinition, CommonPlan } from "@/types/coverage";

const chaseExclusions = {
  what_is_covered: [
    "Collision damage to the rental vehicle",
    "Theft of the rental vehicle",
    "Loss-of-use charges from the rental company",
    "Reasonable towing charges to the nearest repair facility",
    "Valid administrative/surcharges from the rental company",
  ],
  what_is_not_covered: [
    "Liability for injuries to any person",
    "Liability for damage to other vehicles or property",
    "Personal belongings inside the vehicle",
    "Damage from off-road driving",
    "Damage while driving under the influence",
    "Damage from racing or speed contests",
    "Wear and tear, gradual deterioration, or mechanical breakdown",
    "Damage from acts of war or nuclear hazards",
    "Loss of personal items or cash",
  ],
  vehicle_exclusions: [
    "Antique vehicles (over 20 years old or not manufactured for 10+ years)",
    "Motorcycles, mopeds, motorbikes",
    "Trucks, pickups, or cargo vehicles",
    "Vans designed to carry more than 8 passengers",
    "Exotic or luxury vehicles (Ferrari, Lamborghini, Porsche, etc.)",
    "Recreational vehicles, campers, or trailers",
    "Off-road vehicles (ATVs, dune buggies, etc.)",
  ],
  country_exclusions: ["Israel", "Jamaica", "Republic of Ireland", "Northern Ireland"],
  country_notes: "Coverage applies in most countries but is excluded in these specific locations. Always verify with your card issuer before renting.",
};

const amexExclusions = {
  what_is_covered: [
    "Collision damage to the rental vehicle",
    "Theft of the rental vehicle",
    "Vandalism damage",
    "Valid loss-of-use charges",
    "Towing to the nearest qualified repair facility",
  ],
  what_is_not_covered: [
    "Liability for bodily injury or property damage to third parties",
    "Personal effects or belongings in the vehicle",
    "Expenses resulting from off-road operation",
    "Damage while vehicle is operated by an unauthorized driver",
    "Damage from driving while intoxicated",
    "Damage from participating in any racing activity",
    "Pre-existing damage to the rental vehicle",
    "Administrative, diminution of value, or loss-of-use charges (may have limits)",
    "Tire damage (unless caused by a covered accident)",
  ],
  vehicle_exclusions: [
    "Antique automobiles",
    "Motorcycles, mopeds, or motorbikes of any kind",
    "Any truck, including pickup trucks",
    "Full-size vans",
    "Exotic or expensive vehicles",
    "Limousines",
    "Off-road vehicles",
    "Vehicles with an MSRP over $100,000",
  ],
  country_exclusions: [] as string[],
  country_notes: "Coverage generally available worldwide where American Express is accepted, but always confirm with your card issuer.",
};

export const cardDatabase: Record<string, CreditCard[]> = {
  chase: [
    {
      id: "chase_sapphire_reserve",
      name: "Sapphire Reserve",
      fullName: "Chase Sapphire Reserve",
      issuer: "Chase",
      network: "Visa",
      annualFee: 795,
      categories: ["travel-rental", "travel-trip", "travel-baggage", "travel-perks", "purchase-protection"],
      rental: { coverageType: "primary", maxCoverage: 75000, maxDays: 31 },
      rentalExclusions: chaseExclusions,
    },
    {
      id: "chase_sapphire_preferred",
      name: "Sapphire Preferred",
      fullName: "Chase Sapphire Preferred",
      issuer: "Chase",
      network: "Visa",
      annualFee: 95,
      categories: ["travel-rental", "travel-trip", "travel-baggage", "purchase-protection"],
      rental: { coverageType: "primary", maxCoverage: 60000, maxDays: 31 },
      rentalExclusions: chaseExclusions,
    },
    {
      id: "chase_freedom_unlimited",
      name: "Freedom Unlimited",
      fullName: "Chase Freedom Unlimited",
      issuer: "Chase",
      network: "Visa",
      annualFee: 0,
      categories: ["travel-rental", "purchase-protection", "purchase-warranty"],
      rental: { coverageType: "secondary", maxCoverage: 50000, maxDays: 15 },
      rentalExclusions: chaseExclusions,
    },
    {
      id: "chase_freedom_flex",
      name: "Freedom Flex",
      fullName: "Chase Freedom Flex",
      issuer: "Chase",
      network: "Mastercard",
      annualFee: 0,
      categories: ["travel-rental", "purchase-protection", "purchase-warranty"],
      rental: { coverageType: "secondary", maxCoverage: 50000, maxDays: 15 },
      rentalExclusions: chaseExclusions,
    },
    {
      id: "chase_ink_preferred",
      name: "Ink Business Preferred",
      fullName: "Chase Ink Business Preferred",
      issuer: "Chase",
      network: "Visa",
      annualFee: 95,
      categories: ["travel-rental", "travel-trip", "purchase-protection"],
      rental: { coverageType: "primary", maxCoverage: 75000, maxDays: 31 },
      rentalExclusions: chaseExclusions,
    },
  ],
  amex: [
    {
      id: "amex_platinum",
      name: "Platinum Card",
      fullName: "American Express Platinum Card",
      issuer: "American Express",
      network: "American Express",
      annualFee: 695,
      categories: ["travel-rental", "travel-trip", "travel-baggage", "travel-perks", "purchase-protection"],
      rental: { coverageType: "secondary", maxCoverage: 75000, maxDays: 30 },
      rentalExclusions: amexExclusions,
    },
    {
      id: "amex_gold",
      name: "Gold Card",
      fullName: "American Express Gold Card",
      issuer: "American Express",
      network: "American Express",
      annualFee: 250,
      categories: ["travel-rental", "travel-trip", "travel-baggage", "purchase-protection"],
      rental: { coverageType: "secondary", maxCoverage: 50000, maxDays: 30 },
      rentalExclusions: amexExclusions,
    },
    {
      id: "amex_green",
      name: "Green Card",
      fullName: "American Express Green Card",
      issuer: "American Express",
      network: "American Express",
      annualFee: 150,
      categories: ["travel-rental", "travel-trip", "travel-baggage"],
      rental: { coverageType: "secondary", maxCoverage: 50000, maxDays: 30 },
      rentalExclusions: amexExclusions,
    },
    {
      id: "amex_business_platinum",
      name: "Business Platinum",
      fullName: "American Express Business Platinum",
      issuer: "American Express",
      network: "American Express",
      annualFee: 695,
      categories: ["travel-rental", "travel-trip", "travel-perks", "purchase-protection"],
      rental: { coverageType: "secondary", maxCoverage: 75000, maxDays: 42 },
      rentalExclusions: amexExclusions,
    },
    {
      id: "amex_delta_reserve",
      name: "Delta Reserve",
      fullName: "Delta SkyMiles Reserve",
      issuer: "American Express",
      network: "American Express",
      annualFee: 650,
      categories: ["travel-rental", "travel-trip", "travel-baggage", "travel-perks"],
      rental: { coverageType: "secondary", maxCoverage: 75000, maxDays: 30 },
      rentalExclusions: amexExclusions,
    },
    {
      id: "amex_delta_gold",
      name: "Delta Gold",
      fullName: "Delta SkyMiles Gold",
      issuer: "American Express",
      network: "American Express",
      annualFee: 150,
      categories: ["travel-rental", "travel-trip", "travel-baggage"],
      rental: { coverageType: "secondary", maxCoverage: 50000, maxDays: 30 },
      rentalExclusions: amexExclusions,
    },
  ],
};

export const categoryGroups: CategoryGroup[] = [
  {
    id: "travel",
    title: "Travel",
    subtitle: "Rental cars, trips, baggage, and perks",
    categories: [
      {
        id: "travel-rental",
        title: "Rental Car Coverage",
        subtitle: "Collision & theft protection",
        whatsCovered: [
          "Damage to the rental vehicle from collision or theft",
          "Loss-of-use and administrative fees from the rental company",
          "Reasonable towing to a nearby repair facility",
        ],
        whatsNotCovered: [
          "Liability for injuries or damage to other vehicles or property",
          "Off-road use, violating the rental agreement, or driving while impaired",
          "Some vehicle types (trucks, large vans, exotic cars)",
        ],
      },
      {
        id: "travel-trip",
        title: "Trip Protection",
        subtitle: "Cancellation & interruption coverage",
        whatsCovered: [
          "Trip cancellation due to covered reasons (illness, weather, etc.)",
          "Trip interruption reimbursement",
          "Trip delay expenses (meals, lodging)",
        ],
        emptyMessage: "Trip delay and cancellation coverage from your cards will appear here once added.",
      },
      {
        id: "travel-baggage",
        title: "Baggage Protection",
        subtitle: "Lost, delayed, or damaged bags",
        whatsCovered: [
          "Reimbursement for delayed baggage essentials",
          "Coverage for lost or damaged luggage",
          "Personal effects protection",
        ],
        emptyMessage: "Once your cards are added, this will show coverage for delayed, lost, or damaged bags.",
      },
      {
        id: "travel-perks",
        title: "Travel Perks",
        subtitle: "Lounge access, credits, and upgrades",
        whatsCovered: [
          "Airport lounge access through specific cards and networks",
          "Priority boarding, security lanes, and early check-in",
          "Travel credits and statement credits",
        ],
      },
    ],
  },
  {
    id: "purchases",
    title: "Purchases",
    subtitle: "Protection and extended warranty",
    categories: [
      {
        id: "purchase-protection",
        title: "Purchase Protection",
        subtitle: "Items damaged or stolen after purchase",
        whatsCovered: [
          "Damage or theft of eligible items within 90–120 days",
          "Coverage limits per claim and per account per year",
        ],
      },
      {
        id: "purchase-warranty",
        title: "Extended Warranty",
        subtitle: "Extra coverage beyond manufacturer warranty",
        whatsCovered: [
          "Extension of original manufacturer warranty (typically 1-2 years)",
          "Coverage for mechanical or electrical failures",
        ],
      },
    ],
  },
  {
    id: "foundational",
    title: "Home & Auto",
    subtitle: "Core insurance policies",
    categories: [
      {
        id: "foundational-auto",
        title: "Auto Insurance",
        subtitle: "Your personal auto policy",
        whatsCovered: [
          "Liability coverage for accidents you cause",
          "Collision coverage for your vehicle",
          "Comprehensive coverage (theft, weather, vandalism)",
        ],
        emptyMessage: "Upload your auto insurance policy to see your coverage details here.",
      },
      {
        id: "foundational-home",
        title: "Home/Renters Insurance",
        subtitle: "Property and liability protection",
        whatsCovered: [
          "Property damage coverage",
          "Personal liability protection",
          "Personal belongings coverage",
        ],
        emptyMessage: "Upload your home or renters insurance policy to see coverage details.",
      },
    ],
  },
];

export const commonPlans: CommonPlan[] = [
  { id: "applecare", name: "AppleCare+", categories: ["purchase-warranty"] },
  { id: "amazon-protect", name: "Amazon Protection", categories: ["purchase-warranty"] },
  { id: "cell-carrier", name: "Carrier Insurance", categories: ["purchase-protection"] },
];

export function getAllCards(): CreditCard[] {
  return [...cardDatabase.chase, ...cardDatabase.amex];
}

export function getCardById(id: string): CreditCard | undefined {
  return getAllCards().find(card => card.id === id);
}

export function getCardsForCategory(categoryId: CategoryId, selectedCardIds: string[]): CreditCard[] {
  return getAllCards()
    .filter(card => selectedCardIds.includes(card.id) && card.categories.includes(categoryId));
}
