/**
 * Card Database - Backward Compatibility Layer
 *
 * This file now re-exports from the new unified coverage architecture.
 * All existing imports from this file will continue to work.
 *
 * NEW ARCHITECTURE:
 * - Credit card data is now in JSON files: src/data/coverage/sources/credit-cards/
 * - Benefit templates are shared: src/data/coverage/benefits/
 * - Use CoverageQueryEngine for advanced queries: src/data/coverage/queries/
 *
 * For new code, prefer importing directly from "@/data/coverage":
 * ```typescript
 * import {
 *   getAllCreditCards,
 *   getCreditCardById,
 *   CoverageQueryEngine,
 *   createQueryEngine,
 * } from "@/data/coverage";
 * ```
 *
 * @deprecated This file is maintained for backward compatibility.
 * New code should import from "@/data/coverage" instead.
 */

// Re-export everything from the new coverage module
export {
  // Card database (legacy structure)
  cardDatabase,
  getAllCards,
  getCardById,
  getCardsForCategory,
  // Common plans (legacy format)
  commonPlans,
} from "./coverage";

// Also export categoryGroups since it was in the original file
// This is static UI configuration, so we keep it here
import type { CategoryGroup } from "@/types/coverage";

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
      {
        id: "travel-emergency",
        title: "Emergency Assistance",
        subtitle: "Medical evacuation & travel support",
        whatsCovered: [
          "Emergency medical evacuation",
          "Medical referrals and assistance",
          "Lost document assistance",
        ],
        emptyMessage: "Emergency travel assistance coverage will appear here once you add cards.",
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
      {
        id: "purchase-return",
        title: "Return Protection",
        subtitle: "Return items when merchants won't accept",
        whatsCovered: [
          "Refund for eligible items within return window",
          "Coverage when merchant won't accept return",
        ],
        emptyMessage: "Return protection coverage will appear here once you add eligible cards.",
      },
    ],
  },
  {
    id: "phone-auto",
    title: "Phone & Auto",
    subtitle: "Device and roadside protection",
    categories: [
      {
        id: "phone-protection",
        title: "Cell Phone Protection",
        subtitle: "Coverage for theft and damage",
        whatsCovered: [
          "Theft of your cell phone",
          "Damage to your cell phone",
          "Coverage for phones on your wireless bill",
        ],
        emptyMessage: "Cell phone protection from your cards will appear here.",
      },
      {
        id: "roadside-assistance",
        title: "Roadside Assistance",
        subtitle: "Towing, flat tires, and lockouts",
        whatsCovered: [
          "Towing to nearest repair facility",
          "Flat tire service",
          "Battery jump start",
          "Lockout service",
        ],
        emptyMessage: "Roadside assistance coverage will appear here once you add cards.",
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
