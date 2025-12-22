import { CreditCard, CategoryGroup, CategoryDefinition, CommonPlan, TripProtection, BaggageProtection, PurchaseProtection, ExtendedWarranty, TravelPerks } from "@/types/coverage";

// Common Chase trip protection benefits
const chaseTripProtectionPremium: TripProtection = {
  cancellation_coverage: 10000,
  interruption_coverage: 10000,
  delay_coverage: 500,
  delay_threshold_hours: 6,
  covered_reasons: [
    "Sickness, injury, or death of you, a traveling companion, or family member",
    "Severe weather that prevents travel",
    "Terrorism or hijacking",
    "Jury duty or court subpoena",
    "Job loss or transfer",
    "Traffic accident en route to departure",
  ],
  exclusions: [
    "Pre-existing medical conditions (unless premium waiver applies)",
    "Change of plans or fear of traveling",
    "Financial default of travel supplier (unless specific conditions met)",
    "Government travel warnings issued before booking",
  ],
};

const chaseTripProtectionStandard: TripProtection = {
  cancellation_coverage: 5000,
  interruption_coverage: 5000,
  delay_coverage: 500,
  delay_threshold_hours: 12,
  covered_reasons: [
    "Sickness, injury, or death of you, a traveling companion, or family member",
    "Severe weather that prevents travel",
    "Jury duty or court subpoena",
  ],
  exclusions: [
    "Pre-existing medical conditions",
    "Change of plans or fear of traveling",
    "Financial default of travel supplier",
  ],
};

// Common Chase baggage protection
const chaseBaggageProtectionPremium: BaggageProtection = {
  delay_coverage: 100,
  delay_threshold_hours: 6,
  lost_baggage_coverage: 3000,
  coverage_details: [
    "Covers essential purchases if bags are delayed 6+ hours",
    "Reimbursement for lost, damaged, or stolen checked baggage",
    "Coverage for personal items in baggage",
  ],
  exclusions: [
    "Cash, currency, or travelers checks",
    "Contact lenses, eyeglasses, or hearing aids",
    "Documents, tickets, or securities",
    "Perishable items",
  ],
};

const chaseBaggageProtectionStandard: BaggageProtection = {
  delay_coverage: 100,
  delay_threshold_hours: 6,
  lost_baggage_coverage: 1500,
  coverage_details: [
    "Covers essential purchases if bags are delayed 6+ hours",
    "Reimbursement for lost or damaged checked baggage",
  ],
  exclusions: [
    "Cash, currency, or travelers checks",
    "Contact lenses or eyeglasses",
    "Documents or securities",
  ],
};

// Chase purchase protection
const chasePurchaseProtectionPremium: PurchaseProtection = {
  max_per_claim: 10000,
  max_per_year: 50000,
  coverage_period_days: 120,
  what_is_covered: [
    "Theft of eligible items purchased with your card",
    "Damage to eligible items purchased with your card",
    "Items given as gifts",
  ],
  what_is_not_covered: [
    "Motorized vehicles, aircraft, or watercraft",
    "Cash, travelers checks, or tickets",
    "Items left unattended in vehicles",
    "Used or pre-owned items",
    "Real estate or services",
  ],
};

const chasePurchaseProtectionStandard: PurchaseProtection = {
  max_per_claim: 500,
  max_per_year: 50000,
  coverage_period_days: 120,
  what_is_covered: [
    "Theft of eligible items purchased with your card",
    "Damage to eligible items purchased with your card",
  ],
  what_is_not_covered: [
    "Motorized vehicles",
    "Cash or travelers checks",
    "Items left unattended",
    "Used or pre-owned items",
  ],
};

// Chase extended warranty
const chaseExtendedWarranty: ExtendedWarranty = {
  extension_years: 1,
  max_original_warranty_years: 3,
  max_per_claim: 10000,
  coverage_details: [
    "Extends US manufacturer warranty by one additional year",
    "Covers mechanical and electrical failures",
    "Original warranty must be 3 years or less",
  ],
  exclusions: [
    "Commercial or business use items",
    "Motorized vehicles",
    "Items without a valid US warranty",
    "Computer software",
    "Consumable items",
  ],
};

// Chase Sapphire Reserve travel perks
const sapphireReservePerks: TravelPerks = {
  lounge_access: [
    "Priority Pass Select (unlimited visits)",
    "Chase Sapphire Lounges",
    "Plaza Premium Lounges",
  ],
  travel_credits: [
    { amount: 300, description: "Annual travel credit (automatic reimbursement)" },
  ],
  other_perks: [
    "Global Entry or TSA PreCheck fee credit ($100 every 4 years)",
    "Primary rental car insurance",
    "Trip delay reimbursement up to $500 per ticket",
    "1:1 point transfer to airline and hotel partners",
    "50% more value on travel through Chase Ultimate Rewards",
    "Complimentary DoorDash DashPass",
    "Lyft Pink membership",
  ],
};

// Amex trip protection
const amexTripProtectionPremium: TripProtection = {
  cancellation_coverage: 10000,
  interruption_coverage: 10000,
  delay_coverage: 500,
  delay_threshold_hours: 6,
  covered_reasons: [
    "Sickness, injury, or death of you, a traveling companion, or immediate family member",
    "Severe weather causing complete cessation of travel services",
    "Strike causing complete cessation of travel services",
    "Hijacking, quarantine, or natural disaster",
  ],
  exclusions: [
    "Pre-existing conditions (within 60-180 days before trip)",
    "Mental or nervous disorders (unless hospitalized)",
    "Normal pregnancy (after 35th week)",
    "War or acts of war",
    "Changes in plans or financial circumstances",
  ],
};

const amexTripProtectionStandard: TripProtection = {
  cancellation_coverage: 5000,
  interruption_coverage: 5000,
  delay_coverage: 300,
  delay_threshold_hours: 6,
  covered_reasons: [
    "Sickness, injury, or death of you or traveling companion",
    "Severe weather that prevents travel",
    "Strike causing cessation of services",
  ],
  exclusions: [
    "Pre-existing conditions",
    "Changes in plans",
    "Failure to provide required documentation",
  ],
};

// Amex baggage protection
const amexBaggageProtectionPremium: BaggageProtection = {
  delay_coverage: 500,
  delay_threshold_hours: 6,
  lost_baggage_coverage: 3000,
  coverage_details: [
    "Coverage for reasonable, necessary, and essential items",
    "Checked and carry-on baggage included",
    "Coverage for entire immediate family traveling with you",
  ],
  exclusions: [
    "Animals",
    "Automobiles or automobile parts",
    "Bicycles, boats, or motors",
    "Cash, bullion, or currency",
    "Contact or corneal lenses",
    "Documents, securities, or tickets",
  ],
};

const amexBaggageProtectionStandard: BaggageProtection = {
  delay_coverage: 300,
  delay_threshold_hours: 6,
  lost_baggage_coverage: 1500,
  coverage_details: [
    "Coverage for reasonable, necessary, and essential items",
    "Checked baggage included",
  ],
  exclusions: [
    "Animals",
    "Cash or currency",
    "Contact lenses",
    "Documents or securities",
  ],
};

// Amex purchase protection
const amexPurchaseProtectionPremium: PurchaseProtection = {
  max_per_claim: 10000,
  max_per_year: 50000,
  coverage_period_days: 120,
  what_is_covered: [
    "Accidental damage to eligible items",
    "Theft of eligible items",
    "Items purchased as gifts for others",
  ],
  what_is_not_covered: [
    "Automobiles, motorboats, aircraft, or other motorized vehicles",
    "Cash, travelers checks, or tickets",
    "Items purchased for resale",
    "Consumables (perfume, cosmetics)",
    "Live plants or animals",
    "Items damaged through normal wear and tear",
  ],
};

const amexPurchaseProtectionStandard: PurchaseProtection = {
  max_per_claim: 1000,
  max_per_year: 50000,
  coverage_period_days: 90,
  what_is_covered: [
    "Accidental damage to eligible items",
    "Theft of eligible items",
  ],
  what_is_not_covered: [
    "Motorized vehicles",
    "Cash or travelers checks",
    "Items purchased for resale",
    "Consumables",
  ],
};

// Amex extended warranty
const amexExtendedWarranty: ExtendedWarranty = {
  extension_years: 2,
  max_original_warranty_years: 5,
  max_per_claim: 10000,
  coverage_details: [
    "Extends US manufacturer warranty by up to 2 additional years",
    "Covers items with original warranty of 5 years or less",
    "Coverage up to the original purchase price",
  ],
  exclusions: [
    "Motorized vehicles",
    "Items used for professional or commercial purposes",
    "Computer software",
    "Medical equipment",
    "Items without a valid US warranty",
  ],
};

// Amex Platinum travel perks
const amexPlatinumPerks: TravelPerks = {
  lounge_access: [
    "Centurion Lounges",
    "Delta Sky Clubs (when flying Delta)",
    "Priority Pass Select",
    "Plaza Premium Lounges",
    "Escape Lounges",
    "Airspace Lounges",
  ],
  travel_credits: [
    { amount: 200, description: "Airline fee credit (annual, select airline)" },
    { amount: 200, description: "Hotel credit (FHR and THC bookings)" },
    { amount: 200, description: "Uber credit ($15/month + $20 December)" },
  ],
  other_perks: [
    "Global Entry or TSA PreCheck fee credit ($100 every 4 years)",
    "Clear Plus credit ($189/year)",
    "Fine Hotels + Resorts and The Hotel Collection benefits",
    "Car rental elite status (Avis, Hertz, National)",
    "Marriott Bonvoy Gold Elite status",
    "Hilton Honors Gold status",
    "$240 Digital Entertainment Credit ($20/month)",
    "Walmart+ membership ($12.95/month value)",
    "Equinox credit ($25/month)",
    "SAKS credit ($50 semi-annually)",
  ],
};

// Amex Gold travel perks
const amexGoldPerks: TravelPerks = {
  lounge_access: [],
  travel_credits: [
    { amount: 120, description: "Uber credit ($10/month)" },
    { amount: 120, description: "Dining credit ($10/month at select restaurants)" },
  ],
  other_perks: [
    "4X points at restaurants worldwide",
    "4X points at US supermarkets (up to $25,000/year)",
    "3X points on flights booked directly with airlines",
    "Baggage insurance plan",
    "Trip cancellation/interruption insurance",
  ],
};

// Amex Delta Reserve perks
const amexDeltaReservePerks: TravelPerks = {
  lounge_access: [
    "Delta Sky Clubs (unlimited access)",
    "Centurion Lounges (when flying Delta same day)",
  ],
  travel_credits: [
    { amount: 0, description: "Companion Certificate (First Class or higher)" },
  ],
  other_perks: [
    "Delta Sky Club Executive Membership",
    "Global Entry or TSA PreCheck fee credit",
    "First checked bag free on Delta flights",
    "Priority boarding on Delta flights",
    "20% back on Delta in-flight purchases",
    "Status Boost (earn MQMs faster)",
    "Same-day confirmed flight changes",
  ],
};

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
      tripProtection: chaseTripProtectionPremium,
      baggageProtection: chaseBaggageProtectionPremium,
      purchaseProtection: chasePurchaseProtectionPremium,
      travelPerks: sapphireReservePerks,
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
      tripProtection: chaseTripProtectionStandard,
      baggageProtection: chaseBaggageProtectionStandard,
      purchaseProtection: chasePurchaseProtectionStandard,
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
      purchaseProtection: chasePurchaseProtectionStandard,
      extendedWarranty: chaseExtendedWarranty,
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
      purchaseProtection: chasePurchaseProtectionStandard,
      extendedWarranty: chaseExtendedWarranty,
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
      tripProtection: chaseTripProtectionStandard,
      purchaseProtection: chasePurchaseProtectionPremium,
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
      tripProtection: amexTripProtectionPremium,
      baggageProtection: amexBaggageProtectionPremium,
      purchaseProtection: amexPurchaseProtectionPremium,
      travelPerks: amexPlatinumPerks,
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
      tripProtection: amexTripProtectionStandard,
      baggageProtection: amexBaggageProtectionStandard,
      purchaseProtection: amexPurchaseProtectionStandard,
      travelPerks: amexGoldPerks,
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
      tripProtection: amexTripProtectionStandard,
      baggageProtection: amexBaggageProtectionStandard,
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
      tripProtection: amexTripProtectionPremium,
      purchaseProtection: amexPurchaseProtectionPremium,
      travelPerks: amexPlatinumPerks,
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
      tripProtection: amexTripProtectionPremium,
      baggageProtection: amexBaggageProtectionPremium,
      travelPerks: amexDeltaReservePerks,
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
      tripProtection: amexTripProtectionStandard,
      baggageProtection: amexBaggageProtectionStandard,
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
  {
    id: "applecare",
    name: "AppleCare+",
    categories: ["purchase-warranty"],
    description: "Extended warranty and accidental damage protection for Apple devices",
    coverage_details: [
      "Extends hardware coverage to 2 or 3 years from original purchase",
      "Accidental damage protection (up to 2 incidents per year)",
      "Battery service coverage if capacity drops below 80%",
      "24/7 priority access to Apple experts",
      "Express replacement service",
      "Coverage for Apple accessories (AirPods, Apple Pencil, etc.)",
    ],
    exclusions: [
      "Cosmetic damage (scratches, dents, broken plastic)",
      "Damage caused by unauthorized modifications",
      "Theft or loss (unless AppleCare+ with Theft and Loss)",
      "Damage caused by operating outside permitted conditions",
      "Consumable parts (batteries unless defective)",
    ],
  },
  {
    id: "amazon-protect",
    name: "Amazon Protection",
    categories: ["purchase-warranty"],
    description: "Extended warranty plans for products purchased on Amazon",
    coverage_details: [
      "Extends manufacturer warranty by 1-4 years depending on plan",
      "Covers mechanical and electrical failures",
      "No deductibles on claims",
      "Accidental damage from handling (on select plans)",
      "Power surge protection",
      "Free shipping for repairs",
    ],
    exclusions: [
      "Pre-existing conditions or defects",
      "Cosmetic damage that doesn't affect functionality",
      "Consumable parts (filters, bulbs, batteries)",
      "Commercial or rental use",
      "Intentional damage or misuse",
      "Software issues or data loss",
    ],
  },
  {
    id: "cell-carrier",
    name: "Carrier Insurance",
    categories: ["purchase-protection"],
    description: "Mobile device protection through your wireless carrier",
    coverage_details: [
      "Coverage for accidental damage (cracked screens, liquid damage)",
      "Theft and loss protection",
      "Mechanical or electrical breakdown after warranty",
      "Same-day or next-day device replacement (in many areas)",
      "Unlimited screen repair claims (on some plans)",
    ],
    exclusions: [
      "Cosmetic damage that doesn't affect function",
      "Devices not on your wireless account",
      "Damage from unauthorized repair attempts",
      "Intentional damage",
      "Devices over certain age limits",
      "Claims without required documentation",
    ],
  },
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
